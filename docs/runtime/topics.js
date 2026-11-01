// topics.js — SENSITIVE-TOPIC tier: category blocklist over
// sentence spans, typed tokens ([medical], [account], [legal], [kid-detail]).
//
// Pure: no I/O, no env. Browser/Deno-portable.
//
// GRANULARITY: the whole containing SENTENCE is replaced by the typed token —
// a sensitive topic leaks through its context ("started 40mg last week"), so
// masking only the trigger word is theater. Sentence boundaries: . ! ? \n.
//
// GATING (the false-positive defense — e.g. a clinician uses "prescription"
// as work vocabulary, not as their own medical record):
//   - medical / legal categories require a PERSONAL marker in the same
//     sentence under the standard profile ("my", "I was", "[family]", …).
//     The strict profile drops that gate — any hit redacts. The identifiers
//     profile does not run this tier at all.
//   - account (finances) requires amount + institution/account-word
//     CO-OCCURRENCE in the sentence — that pairing IS the gate, all profiles.
//   - kid-detail requires kid context in the sentence ([kid] role token from
//     the name tier, "my daughter", "the kids", …) in every profile.
//
// ADD-ONLY maintenance: extend term lists, never delete (silent loosening).
// Categories are configurable: callers may pass their own list via
// opts.categories (same shape as DEFAULT_TOPIC_CATEGORIES).

// Personal-context markers. Role tokens appear here because the NAME tier
// runs BEFORE this tier — "Alex was diagnosed" is already "[family] was
// diagnosed" by the time this pass sees it.
const PERSONAL_MARKER =
  /\b(?:my|our|i was|i am|i'm|i've|i had|i have|i got|i need|she's|she was|she is|he's|he was|he is|wife|husband|mom|dad|mother|father|son|daughter|sister|brother)\b|\[(?:wife|husband|kid|family|name)\]/i;

const KID_CONTEXT =
  /\[kid\]|\b(?:my|our)\s+(?:son|daughter|kid|kids|child|children|boy|girl|toddler|baby)\b|\bthe kids\b/i;

const MONEY = /\$\s?\d[\d,]*(?:\.\d{1,2})?\b|\b\d[\d,]{2,}\s?(?:dollars|bucks|usd)\b/i;

const FINANCIAL_INSTITUTION =
  /\b(?:chase|fidelity|vanguard|schwab|wells fargo|bank of america|bofa|citibank|citi|robinhood|coinbase|etrade|e\*trade|ally|sofi|pnc|usaa|truist|amex|american express|discover|capital one|venmo|paypal|zelle|cash app|401k|403b|roth ira|ira|hsa|529|brokerage|mortgage|checking account|savings account|credit card|credit score|net worth|paycheck|salary|student loan)\b/i;

const MEDICAL_TERM =
  /\b(?:diagnos\w+|prescri(?:bed|ption|ptions)|medicat\w+|dosage|\d+\s?mg\b|surgery|surgeon|chemo\w*|radiation|biopsy|tumor|cancer|diabet\w+|adhd|autis\w+|depress\w+|anxiety|bipolar|therapy|therapist|psychiatr\w+|antidepressant|ssri|hospital(?:ized)?|er visit|emergency room|urgent care|icu|blood pressure|cholesterol|covid|pregnan\w+|miscarriage|fertility|ivf|vasectomy|std|sti|hiv|seizure|stroke|asthma|allerg\w+|insulin|rehab|addiction|sober|relapse|migraine|concussion|mri|ct scan|pathology|oncolog\w+|cardiolog\w+|dermatolog\w+|colonoscopy|chronic pain)\b/i;

const LEGAL_TERM =
  /\b(?:lawsuit|sue(?:d|ing)?|attorney|lawyer|litigation|settlement|custody|divorce|alimony|prenup|deposition|subpoena|arrest(?:ed)?|dui|dwi|misdemeanor|felony|probation|bankrupt\w+|foreclosure|eviction|restraining order|court (?:date|case|order)|hr complaint|wrongful termination|severance|nda dispute|child support)\b/i;

const KID_DETAIL_TERM =
  /\b(?:school|teacher|daycare|preschool|kindergarten|grade|classroom|pediatrician|bus stop|playground|babysitter|nanny|soccer practice|dance class|allowance)\b/i;

/**
 * Default category list. Each category:
 *   type         — token name ([type])
 *   test(sentence, { strict }) → boolean (redact this sentence?)
 */
export const DEFAULT_TOPIC_CATEGORIES = [
  {
    type: "medical",
    test: (s, { strict }) => MEDICAL_TERM.test(s) && (strict || PERSONAL_MARKER.test(s)),
  },
  {
    type: "account",
    // Amount + institution/account-word co-occurrence is the gate, every profile.
    test: (s) => MONEY.test(s) && FINANCIAL_INSTITUTION.test(s),
  },
  {
    type: "legal",
    test: (s, { strict }) => LEGAL_TERM.test(s) && (strict || PERSONAL_MARKER.test(s)),
  },
  {
    type: "kid-detail",
    // Kid context required in every profile — "school" alone is not a kid's detail.
    test: (s) => KID_DETAIL_TERM.test(s) && KID_CONTEXT.test(s),
  },
];

// Sentence boundary: runs of [.!?\n] followed by whitespace/end, not preceded
// by an honorific/common abbreviation or a lone capital initial.
const SENTENCE_BOUNDARY =
  /(?<!\b(?:Mr|Mrs|Ms|Mx|Dr|Prof|Rev|Sr|Jr|St|vs|etc|Inc|Ltd|No|approx))(?<!\b[A-Z])([.!?\n]+(?=\s|$)|\n+)/;

/**
 * Apply the SENSITIVE-TOPIC tier to one prose segment.
 *
 * @param {string} text
 * @param {object} [opts]
 * @param {boolean} [opts.strict=false]   strict profile: personal-marker gate off
 * @param {Array}   [opts.categories]     override DEFAULT_TOPIC_CATEGORIES
 * @returns {{ text: string, hits: Array<{tier:"topic", type:string, count:number}> }}
 */
export function applyTopics(text, { strict = false, categories = DEFAULT_TOPIC_CATEGORIES } = {}) {
  if (typeof text !== "string" || !text) return { text, hits: [] };
  const counts = new Map();

  // Split keeping delimiters: even pieces are sentence bodies, odd are runs
  // of [.!?\n]. Rebuild by simple join so non-redacted text is byte-stable.
  // Guards: a "." is a boundary only when followed by whitespace/end (decimals
  // and version numbers survive) and not preceded by an honorific/abbreviation
  // or a single capital ("Mrs. Tran", "U.S." stay inside their sentence — a
  // split there would leak the trailing half of a sensitive sentence).
  const pieces = text.split(SENTENCE_BOUNDARY);
  for (let i = 0; i < pieces.length; i += 2) {
    const sentence = pieces[i];
    if (!sentence || !sentence.trim()) continue;
    const trimmed = sentence.trim();
    // Already a redaction token (idempotence / re-pass) — leave it.
    if (/^\[[a-z-]+\]$/.test(trimmed)) continue;
    for (const cat of categories) {
      if (cat.test(sentence, { strict })) {
        counts.set(cat.type, (counts.get(cat.type) || 0) + 1);
        // Preserve leading whitespace so list/markdown structure survives.
        const lead = sentence.match(/^\s*/)[0];
        pieces[i] = `${lead}[${cat.type}]`;
        break; // first matching category wins for the sentence
      }
    }
  }

  const hits = [...counts.entries()].map(([type, count]) => ({ tier: "topic", type, count }));
  return { text: pieces.join(""), hits };
}

export default { applyTopics, DEFAULT_TOPIC_CATEGORIES };
