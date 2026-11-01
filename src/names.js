// names.js — NAME tier: people-map role tokens + (strict only)
// unknown name-shaped token redaction.
//
// Pure: no I/O, no env. The people map is INJECTED (engine/index own loading
// from data/redaction-people.json) so this file stays browser/Deno-portable.
//
// Two passes:
//   1. KNOWN names (the people map): every mapped first name / alias becomes
//      its role token — e.g. "Alex" → "[family]", case-insensitive, possessive-
//      safe ("Alex's" → "[family]'s"). Use it for names you already know
//      (for example, the patient and contacts listed on a record header).
//   2. UNKNOWN name-shaped tokens (identifiers + strict profiles only):
//      honorific+Name, First Last pairs, and mid-sentence single capitalized
//      tokens not on the safe list → "[name]". This is a capitalization
//      heuristic, not named-entity recognition: it also eats capitalized
//      non-names (brand drug names, eponyms, section headers) and misses
//      lowercase names. Over-redaction is the accepted cost.
//
// Safe list: words that LOOK person-shaped but are known vocabulary (brand or
// product names, for example). Safe words pass through every profile.
//
// Tokens are lowercase /\[[a-z-]+\]/ so no tier re-matches them (idempotence).

// Common capitalized English words that the unknown-name pass must never eat.
// Compact by design — strict-profile over-redaction is acceptable; eating
// "Monday" is not.
const COMMON_CAPITALIZED = new Set([
  "Patient",
  "Pt",
  "Daughter",
  "Son",
  "Mother",
  "Father",
  "Wife",
  "Husband",
  "Brother",
  "Sister",
  "Partner",
  "Neighbor",
  "Continue",
  "Started",
  "Prescribed",
  "Increase",
  "Decrease",
  "Stop",
  "Start",
  "Chief",
  "Complaint",
  "History",
  "Present",
  "Illness",
  "Hospital",
  "Course",
  "Physical",
  "Exam",
  "Assessment",
  "Plan",
  "Sex",
  "Age",
  "Phone",
  "Cardiology",
  "Pulmonology",
  "Glucose",
  "Sodium",
  "Potassium",
  "Creatinine",
  "Metformin",
  "Sertraline",
  "Vancomycin",
  "Ozempic",
  "Eliquis",
  "Lexapro",
  "Tylenol",
  "Benadryl",
  "Zoloft",
  "Humira",
  "Zofran",
  "Keytruda",
  "Humalog",
  "Keflex",
  "Pfizer",
  "Xarelto",
  "Entresto",
  "Januvia",
  "Jardiance",
  "Crohn",
  "Graves",
  "Hashimoto",
  "Parkinson",
  "Bell",
  "Wilms",
  "Barrett",
  "Glasgow",
  "Coma",
  "Scale",
  "Pap",
  "Hepatitis",
  "Hypertension",
  "Rheumatoid",
  "Arthritis",
  "Allergies",
  "Vitals",
  "Labs",
  "Follow",
  "Signed",
  "Medical",
  "Record",
  "Member",
  "Insurance",
  "Device",
  "License",
  "Vehicle",
  "Portal",
  "Telephone",
  "Fax",
  "Email",
  "Home",
  "City",
  "ZIP",
  "Born",

  "I", "A", "An", "The", "This", "That", "These", "Those", "There", "Here",
  "It", "Its", "We", "You", "He", "She", "They", "Me", "Him", "Her", "Them",
  "My", "Mine", "Our", "Ours", "Your", "Yours", "His", "Hers", "Their", "Theirs",
  "If", "And", "But", "Or", "Nor", "So", "Yet", "For", "As", "At", "By", "In",
  "Of", "On", "To", "Up", "With", "From", "Into", "Over", "Under", "About",
  "After", "Before", "Between", "During", "Through", "While", "When", "Where",
  "What", "Which", "Who", "Whom", "Whose", "Why", "How", "Not", "No", "Yes",
  "Ok", "Okay", "Oh", "Hey", "Hi", "Hello", "Thanks", "Thank", "Please",
  "Today", "Tomorrow", "Yesterday", "Tonight", "Now", "Then", "Soon", "Later",
  "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday",
  "January", "February", "March", "April", "May", "June", "July", "August",
  "September", "October", "November", "December",
  "Spring", "Summer", "Fall", "Winter",
  "God", "Internet", "American", "English", "New", "Old", "Big", "Little",
  "Also", "Just", "Still", "Even", "Only", "Both", "Each", "Every", "All",
  "Some", "Any", "More", "Most", "Less", "Same", "Other", "Another",
  "First", "Second", "Third", "Last", "Next", "One", "Two", "Three",
  "Let", "Got", "Get", "Go", "Going", "Come", "Coming", "See", "Look",
  "Maybe", "Sure", "Right", "Left", "Well", "Good", "Great", "Nice", "Love",
  "Sorry", "Wait", "Stop", "Done", "Will", "Can", "Should", "Would", "Could",
  "Don", "Didn", "Won", "Isn", "Aren", "Wasn", // contraction stems after squash
]);

function escapeRe(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Normalize an injected people map; tolerate missing/partial shapes. */
export function normalizePeopleMap(peopleMap) {
  const people = [];
  const safe = new Set();
  if (peopleMap && typeof peopleMap === "object") {
    for (const entry of Array.isArray(peopleMap.people) ? peopleMap.people : []) {
      if (!entry || typeof entry.name !== "string" || !entry.name.trim()) continue;
      const role = typeof entry.role === "string" && entry.role.trim()
        ? entry.role.trim().toLowerCase().replace(/[^a-z-]+/g, "-").replace(/^-+|-+$/g, "")
        : "name";
      const names = [entry.name, ...(Array.isArray(entry.aliases) ? entry.aliases : [])]
        .filter((n) => typeof n === "string" && n.trim());
      people.push({ names, role: role || "name" });
    }
    for (const s of Array.isArray(peopleMap.safe) ? peopleMap.safe : []) {
      if (typeof s === "string" && s.trim()) safe.add(s.trim());
    }
  }
  return { people, safe };
}

/** True when a capitalized token sits at a sentence start (string start or after terminal punctuation). */
function atSentenceStart(text, index) {
  let i = index - 1;
  while (i >= 0 && (text[i] === " " || text[i] === '"' || text[i] === "'" || text[i] === "(" || text[i] === "[" || text[i] === "“" || text[i] === "‘")) i--;
  if (i < 0) return true;
  const c = text[i];
  return c === "." || c === "!" || c === "?" || c === ":" || c === ";" || c === "\n" || c === "—" || c === "-" || c === "·" || c === "•" || c === ">" || c === ",";
  // Comma included deliberately: list-position capitals ("apps, Margin, and…")
  // are usually product nouns, not surnames. Deny-aggressive applies to PII,
  // not to eating vocabulary — single-token redaction stays conservative.
}

/**
 * Apply the NAME tier to one prose segment.
 *
 * @param {string} text
 * @param {object} opts
 * @param {{people:Array,safe:Set<string>}} opts.map   normalized people map (normalizePeopleMap)
 * @param {boolean} [opts.unknownNames=false]          strict-profile unknown-name pass
 * @returns {{ text: string, hits: Array<{tier:"name", type:string, count:number}> }}
 */
export function applyNames(text, { map, unknownNames = false } = {}) {
  if (typeof text !== "string" || !text) return { text, hits: [] };
  const { people, safe } = map || { people: [], safe: new Set() };
  const counts = new Map();
  const bump = (type) => counts.set(type, (counts.get(type) || 0) + 1);
  let out = text;

  // Pass 1 — known names → role tokens. Case-insensitive, word-bounded.
  for (const person of people) {
    for (const name of person.names) {
      const re = new RegExp(`\\b${escapeRe(name)}\\b`, "gi");
      out = out.replace(re, () => {
        bump(person.role);
        return `[${person.role}]`;
      });
    }
  }

  if (unknownNames) {
    const isSafe = (word) => safe.has(word) || COMMON_CAPITALIZED.has(word);

    // Facility-shaped phrases must be handled before vocabulary protection.
    out = out.replace(/\b(?:St\.\s+)?(?:[A-Z][a-z]+\s+){1,4}(?:Clinic|Hospital|Center|Care|Suite|Practice|Home|Cardiology|Pulmonology)\b/g, () => {
      bump('name')
      return '[name]'
    })

    // Pass 2a — honorific + Name ("Dr. Alvarez", "Mrs Tran").
    out = out.replace(/\b(Mr|Mrs|Ms|Mx|Dr|Prof|Rev|Coach|Aunt|Uncle|Grandma|Grandpa)\.?\s+([A-Z][a-z]{1,20}(?:[-'][A-Z][a-z]{1,20})?(?:\s+(?:[A-Z]\.\s+)?[A-Z][a-z]{1,20}(?:[-'][A-Z][a-z]{1,20})?){0,2})\b/g, (m, hon, nm) => {
      if (nm.split(/\s+/).every(isSafe)) return m;
      bump("name");
      return "[name]";
    });

    // Pass 2b — First Last (2–3 capitalized words). Skips when every word is
    // safe/common ("Thank You", a multi-word brand name on the safe list).
    out = out.replace(/\b[A-Z][a-z]{1,20}(?:[-'][A-Z][a-z]{1,20})?(?:\s+(?:[A-Z]\.\s+)?[A-Z][a-z]{1,20}(?:[-'][A-Z][a-z]{1,20})?){1,2}\b/g, (m) => {
      const words = m.split(/\s+/);
      if (words.some(isSafe)) {
        return words.map(word => {
          if (isSafe(word)) return word
          bump('name')
          return '[name]'
        }).join(' ')
      }
      bump("name");
      return "[name]";
    });

    out = out.replace(/\b((?:[Dd]aughter|[Ss]on|[Hh]usband|[Ww]ife|[Pp]artner|[Bb]rother|[Ss]ister|[Mm]other|[Ff]ather|[Pp]atient|[Pp]t)\s*[:,(]?\s+)([A-Z][a-z]{1,24})\b/g, (m, prefix, name) => {
      if (isSafe(name) || ['is','was','has','reports','called'].includes(name.toLowerCase())) return m
      bump('name')
      return prefix + '[name]'
    })

    // Pass 2c — mid-sentence single capitalized token. Sentence-start capitals
    // survive (ordinary prose); safe/common words survive.
    out = out.replace(/\b[A-Z][a-z]{2,20}\b/g, (m, index, whole) => {
      if (isSafe(m)) return m;
      if (atSentenceStart(whole, index)) return m;
      bump("name");
      return "[name]";
    });
  }

  const hits = [...counts.entries()].map(([type, count]) => ({ tier: "name", type, count }));
  return { text: out, hits };
}

export default { applyNames, normalizePeopleMap };
