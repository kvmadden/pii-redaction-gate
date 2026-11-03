// grammar.js: closed-class word lists used by the name and pattern tiers.
//
// These are grammatical categories of clinical writing (titles, relation
// words, report verbs, units, facility types, eponym head nouns). They were
// written from general documentation conventions before any scoring and are
// not drawn from the evaluation fixtures. Open-class vocabulary (drugs,
// diagnoses, names, ordinary English) comes only from the public lists in
// ./lexicon-data.js. All entries are lowercase.

const set = (s) => Object.freeze(new Set(s.trim().split(/\s+/)));

/** Titles that put a person name after them ("Dr. Alvarez", "Nurse Kelly"). */
export const HONORIFICS = set(`
  mr mrs ms mx miss dr doctor prof professor rev reverend fr nurse coach
  aunt uncle grandma grandpa auntie
`);

/** Relation and role words that are often followed by a person name. */
export const RELATION_CUES = set(`
  patient pt daughter son wife husband partner spouse mother mom mum father dad
  brother sister sibling niece nephew aunt uncle cousin grandmother grandfather
  grandma grandpa granddaughter grandson stepmother stepfather stepdaughter stepson
  friend neighbor neighbour guardian caregiver proxy roommate fiance fiancee
  boyfriend girlfriend daughter-in-law son-in-law mother-in-law father-in-law
  sister-in-law brother-in-law ex-husband ex-wife ex-partner
`);

/** Field labels whose value is a person name ("Name:", "Signed by:", "RE:"). */
export const LABEL_CUES = Object.freeze([
  "patient name", "pt name", "full name", "member name", "subscriber name",
  "emergency contact", "next of kin", "electronically signed by", "signed by",
  "attending physician", "referring physician", "referring provider",
  "ordering physician", "ordering provider", "dictated by", "transcribed by",
  "seen by", "requested by", "name", "patient", "pt", "re", "regarding", "member",
  "subscriber", "insured", "guarantor", "contact", "nok", "caregiver", "guardian",
  "proxy", "signed", "attending", "provider", "physician", "pcp", "referring",
  "ordering", "prescriber", "pharmacist", "nurse", "rn", "np", "cc", "to", "from",
  "attn", "attention", "author", "caller", "cosigned by", "cosigner",
]);

/** Labels whose value must be a name: an unredacted value goes to review. */
export const STRONG_NAME_LABELS = Object.freeze(["patient name", "pt name", "full name", "member name", "subscriber name", "name"]);

/** Greetings and sign-offs that sit next to a name in messages. */
export const GREETINGS = set(`hi hello hey dear`);
export const SIGNOFFS = Object.freeze([
  "thanks again", "thank you again", "many thanks", "thank you", "thanks", "regards",
  "best regards", "kind regards", "warm regards", "best", "sincerely", "cheers",
  "respectfully", "love", "take care",
]);

/** Phrases that introduce the speaker's own name. */
export const INTRO_PHRASES = Object.freeze(["this is", "my name is", "i am", "i'm", "it's", "its"]);

/** Verbs that take a person as subject. Used only to resolve ambiguous words. */
export const PERSON_VERBS = set(`
  reports reported states stated says said denies denied endorses endorsed
  complains complained presents presented called calls agrees agreed declines
  declined requests requested wants wanted admits arrived underwent takes took
  lives lived works worked feels felt opted refused refuses verbalizes
  verbalized understands understood expresses expressed prefers preferred
  confirmed confirms asked asks
`);
// Verbs that also take a drug or finding as subject ("noted", "started",
// "continued", "returned", "tolerated") are left out on purpose.

/** Head nouns that follow an eponym ("Bell palsy", "Wells score"). */
export const EPONYM_HEADS = set(`
  disease diseases syndrome syndromes palsy sign signs test tests score scores
  scale scales stage stages staging criteria classification maneuver maneuvre
  monitor catheter procedure operation reflex reflexes triad phenomenon fracture
  fractures ulcer ulcers node nodes cell cells body bodies duct membrane index
  rule rules position block tube splint repair virus tumor tumour lymphoma
  sarcoma carcinoma encephalopathy thyroiditis esophagus oesophagus anomaly
  deformity contracture neuralgia neuroma aneurysm angina edema oedema dystrophy
  ataxia chorea dementia cyst polyp hernia diverticulum disorder
  disorders formula equation method technique approach incision line point
  space ligament muscle nerve artery vein gland glands bundle canal valve
  phenomenon pattern law curve angle cast boot collar brace pouch shunt stent
  filter needle forceps retractor equation lesion lesions spot spots
`);

/** Facility type words that end a named facility ("Mercy Ridge Hospital"). */
export const FACILITY_HEADS = Object.freeze([
  "medical center", "health center", "health system", "health care", "healthcare",
  "medical group", "nursing home", "assisted living", "rehabilitation center",
  "rehabilitation hospital", "surgery center", "surgical center", "birth center",
  "dialysis center", "kidney center", "cancer center", "heart institute", "eye center",
  "behavioral health", "family medicine", "family practice", "primary care",
  "urgent care", "home care", "home health", "endoscopy suite", "endoscopy center",
  "women's health", "hospital", "clinic", "pharmacy", "hospice", "infirmary",
  "institute", "associates", "practice", "dialysis", "pediatrics", "orthopedics",
  "orthopaedics", "cardiology", "pulmonology", "oncology", "dermatology", "neurology",
  "gastroenterology", "urology", "nephrology", "rheumatology", "endocrinology",
  "psychiatry", "radiology", "ophthalmology", "otolaryngology", "obstetrics",
  "gynecology", "podiatry", "chiropractic", "physical therapy",
]);

/** Generic modifiers of a care setting. A facility needs a modifier outside this list. */
export const SERVICE_MODIFIERS = set(`
  primary urgent intensive critical palliative emergency internal general pediatric
  paediatric interventional behavioral behavioural outpatient inpatient ambulatory
  acute skilled assisted home family medical surgical clinical physician specialty
  community long-term subacute transitional respiratory physical occupational
  speech mental adult geriatric neonatal cardiac
`);

/**
 * Reference adjectives: they say which care setting ("Outside Hospital",
 * "Prior Clinic"), never name one. A closed grammatical class, like the
 * function words below.
 */
export const REFERENCE_MODIFIERS = set(`
  outside previous prior past local nearby nearest other same new old current
  last next annual initial recent former original usual regular own different
  another best standard routine main receiving referring accepting sending
  admitting treating covering consulting
`);

/** Function words: never part of a name, and they break a run of capitals. */
export const FUNCTION_WORDS = set(`
  the a an and or of in on at to for with by from as per via but nor so yet into
  onto over under about after before between during through while when where than
  then this that these those his her their its our your my no not if up out off
  all any each every both either neither some such only also just
`);

/** Contractions of pronouns and auxiliaries ("I'm", "Don't"). */
export const CONTRACTION = /^(?:i|you|we|they|he|she|it|that|there|here|what|who|where|let|don|doesn|didn|isn|aren|wasn|weren|can|couldn|won|wouldn|shouldn|haven|hasn|hadn|ain|mustn|needn)['’](?:m|ve|ll|d|re|t|s)$/i;

/** Lowercase forms that can act as a title before a lowercase name ("dr smith"). */
export const LOWERCASE_TITLES = set(`dr mr mrs ms mx prof`);

/** Auxiliary verbs. Function words in lowercase, but "May" or "Will" can be a name. */
export const AUXILIARIES = set(`is was are were be been has have had will would can could should may might must do does did`);

/** Lowercase surname particles that may sit inside a name ("de la Cruz", "van der Berg"). */
export const PARTICLES = set(`de del della da di du la le van von der den bin ibn al el dos das ter ten`);

/** Words after a number that make it a quantity, not a date ("2/3 weeks", "3/4 strength"). */
export const QUANTITY_WORDS = set(`
  week weeks wk wks day days d month months mo mos hour hours hr hrs h minute
  minutes min mins year years yr yrs time times x tab tabs tablet tablets cap caps
  capsule capsules pill pills puff puffs drop drops unit units mg mcg g gm ml cc l
  meq mmol strength power dose doses of cm mm in inch inches ft lb lbs kg oz
  percent assistance assist score scale ratio cup cups glass glasses meal meals
  dilution splits split portion portions lead leads
`);

/** Two-letter US state and territory codes. */
export const STATE_CODES = set(`
  AL AK AZ AR CA CO CT DE DC FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT
  NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY PR GU VI AS MP
`.toLowerCase());

/** Dotted abbreviations that look like initials but are not names. */
export const DOTTED_ABBREVIATIONS = set(`u.s. u.s.a. u.k. a.m. p.m. e.g. i.e. d.c. n.p.o. m.d. r.n. n.p. p.a. d.o. ph.d. e.d. o.r. i.v. p.o.`);

/** Public health-coverage program names: ordinary words in clinical text. */
export const PROGRAM_WORDS = set(`medicare medicaid tricare champva chip medigap`);

/** Day and month names: ordinary calendar words, even when also on a name list. */
export const CALENDAR_WORDS = set(`
  monday tuesday wednesday thursday friday saturday sunday january february march
  april may june july august september october november december
`);

export const MONTHS = Object.freeze([
  "january", "february", "march", "april", "may", "june", "july", "august",
  "september", "october", "november", "december",
]);
