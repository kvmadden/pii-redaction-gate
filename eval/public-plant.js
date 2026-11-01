#!/usr/bin/env node
// eval/public-plant.js. Set B planting generator.
//
// Places fictional identifiers into real public text the way a chart would carry them:
// header and footer lines, a named patient in the narrative, possessives, initials,
// surname-only mentions, relatives, and names broken across a line. Clinical facts and
// the timeline are left alone. Every edit and every planted span is recorded.
//
// Rules this file follows (docs/REAL-TEXT-EVAL.md, Set B):
// - One final serialization step, `serialize`, for every document, planted or not.
// - Structure (which edits, which format family, which labels) and values come from two
//   separate random streams, so the swap test can redraw every value and keep the structure.
// - Value pools are split in half by the seed, dev documents draw from one half and held-out
//   documents from the other, and each document gets its own slice, so no value repeats.
// - Format families belong to one split only. A family used in dev never appears in held out.
// - Some documents stay untouched and are mixed into the same run.
//
// This file is evaluation code. The gate under test (src/) must never import it, and a test
// greps the gate for its pools, reserved values and seed.
//
//   node eval/public-plant.js --write   writes data/public/planted.json

import { readFileSync, writeFileSync } from 'node:fs'

export const SEED = 60417233
export const SERIALIZER = 'NFC, LF line ends, runs of spaces or tabs collapsed, lines trimmed, one trailing newline'

const root = new URL('../', import.meta.url)
const MANIFEST = JSON.parse(readFileSync(new URL('data/public/manifest.json', root), 'utf8'))

/** The one final step every document goes through, planted or not. */
export function serialize(text) {
 return text.normalize('NFC').replace(/\r\n?/g, '\n').split('\n').map(line => line.replace(/[ \t]+/g, ' ').trim()).join('\n').replace(/\n+$/, '') + '\n'
}

// ---------- random streams ----------
function hash(str) {
 let h = 2166136261
 for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619) }
 return h >>> 0
}
function rng(seedText) {
 let a = hash(seedText)
 const next = () => {
  a = (a + 0x6d2b79f5) >>> 0
  let t = a
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
 }
 next.int = (lo, hi) => lo + Math.floor(next() * (hi - lo + 1))
 next.pick = list => list[Math.floor(next() * list.length)]
 next.shuffle = list => { const out = [...list]; for (let i = out.length - 1; i > 0; i--) { const j = Math.floor(next() * (i + 1));[out[i], out[j]] = [out[j], out[i]] } return out }
 next.weighted = pairs => { let r = next() * pairs.reduce((s, [, w]) => s + w, 0); for (const [v, w] of pairs) { if ((r -= w) < 0) return v } return pairs[pairs.length - 1][0] }
 return next
}

// ---------- value pools ----------
// Many origins, hyphens and apostrophes, and names that are also everyday words.
// Words the gate code already contains (for example Bell, Love, Lane, Summer, Winter, Tran,
// Terrace) were left out before the key was built, so the isolation grep stays meaningful.
export const GIVEN_F = ['Adaeze', 'Ngozi', 'Folake', 'Agnieszka', 'Mirela', 'Siobhan', 'Luana', 'Yui', 'Priyanka', 'Kavya', 'Leila', 'Amara', 'Thandiwe', 'Inês', 'Marisol', 'Svetlana', 'Ilse', 'Astrid', 'Mei', 'Thao', 'Nalani', 'Aroha', 'Rania', 'Zeynep', 'Oksana', 'Bríd', 'Fionnuala', 'Anneliese', 'Giulia', 'Benedetta', 'Xiomara', 'Esperanza', 'Graciela', 'Abena', 'Efua', 'Temitope', 'Samira', 'Nadia', 'Soraya', 'Parisa', 'Anahit', 'Nino', 'Aigerim', 'Saule', 'Pema', 'Sunita', 'Deepika', 'Lakshmi', 'Ji-yeon', 'Seo-yeon', 'Hiroko', 'Akiko', 'Linh', 'Winona', 'Marguerite', 'Solène', 'Gaëlle', 'Anouk', 'Femke', 'Sanne', 'Linnea', 'Elin', 'Ragnhild', 'Pilar', 'Itziar', 'Aitana', 'Milica', 'Jelena', 'Faith', 'Hope', 'Joy', 'Grace', 'Autumn', 'Ivy', 'Destiny', 'Precious', 'Deborah', 'Pauline', 'Beatrice', 'Rosalind', 'Loretta', 'Imogen', 'Philippa']
export const GIVEN_M = ['Chidi', 'Olumide', 'Tomasz', 'Dorin', 'Ciarán', 'Mateus', 'Haruto', 'Arjun', 'Farhan', 'Yusuf', 'Sipho', 'Rafael', 'Joaquín', 'Dmitri', 'Bogdan', 'Henrik', 'Minh', 'Keoni', 'Tane', 'Tariq', 'Emre', 'Nikolai', 'Eamon', 'Lorcan', 'Matthias', 'Lorenzo', 'Paolo', 'Teodoro', 'Kwame', 'Kofi', 'Babajide', 'Hamza', 'Karim', 'Dariush', 'Tigran', 'Levan', 'Nurlan', 'Bolat', 'Rakesh', 'Vikram', 'Gopal', 'Hyun-woo', 'Min-jun', 'Kenji', 'Takeshi', 'Quang', 'Bao', 'Chayton', 'Thibault', 'Joris', 'Oskar', 'Torbjørn', 'Iker', 'Dragan', 'Zoran', 'Hunter', 'Marcus', 'Harold', 'Gordon', 'Clifford', 'Wendell', 'Desmond', 'Rupert']
// Names used for either. Relatives draw from all three lists.
export const GIVEN_N = ['Tenzin', 'Dawa', 'Dakota', 'Sunny', 'Remy', 'Jules', 'Sasha', 'Noor', 'Ariel', 'Kiran', 'Rowan', 'Quinn']
export const GIVEN = [...GIVEN_F, ...GIVEN_M, ...GIVEN_N]
export const SURNAMES = ['Okafor', 'Adeyemi', 'Nwachukwu', 'Oyelaran', 'Wiśniewski', 'Kowalczyk', 'Kostova', 'Ionescu', 'Popescu', "O'Donnell", "O'Sullivan", "D'Arcy", 'Ní Bhriain', 'Mac Giolla', 'Fernandes', 'Albuquerque', 'Tanaka', 'Watanabe', 'Kobayashi', 'Raghunathan', 'Venkataraman', 'Chaudhry', 'Haddad', 'Khoury', 'Al-Masri', 'Al-Rashid', 'Abdi', 'Dlamini', 'Ndlovu', 'Mthembu', 'Oliveira-Santos', 'Garza-Villarreal', 'Ruiz-Tagle', 'Vázquez', 'Ochoa', 'Petrenko', 'Hrytsenko', 'Sokolova', 'Lindqvist', 'Bergström', 'Halvorsen', 'Nguyen-Lam', 'Pham', 'Trinh', 'Kahananui', 'Kealoha', 'Te Rangi', 'Ngata', 'Yilmaz', 'Demir', 'Öztürk', 'Moreau', 'Lefebvre', 'Fontaine-Roux', 'Van der Berg', 'de Vries', 'Janssens', 'Rossi', 'Bianchi', 'Esposito', 'Mensah', 'Asante', 'Boateng', 'Owusu', 'Balogun', 'Afolabi', 'Rahimi', 'Tehrani', 'Sarkissian', 'Hovhannisyan', 'Beridze', 'Kapanadze', 'Zhakupov', 'Nurlanovna', 'Sherpa', 'Lhamo', 'Iyer', 'Menon', 'Bhattacharya', 'Kulkarni', 'Park-Lee', 'Choi', 'Yoon', 'Shimizu', 'Fujimoto', 'Le-Hoang', 'Begay', 'Yazzie', 'Tsosie', 'Lachance', 'Beaulieu', 'Gauthier', 'Visser', 'Mulder', 'Bakker', 'Sandberg', 'Eklund', 'Haugland', 'Etxeberria', 'Goikoetxea', 'Arrieta', 'Petrović', 'Jovanović', 'Marković', 'Gold', 'Hunter', 'Price', 'Young', 'Strong', 'Bishop', 'Rich', 'Moon', 'Frost', 'Day', 'Wood', 'Cook', 'Grant', 'Mason', 'Hill', 'Stone', 'Marsh', 'Snow', 'Fox', 'Swan', 'King', 'Baker', 'Short', 'Black', 'Rivers', 'Brooks', 'Banks', 'Sharp', 'Battle', 'Blessing', 'Christmas', 'Holiday', 'Friend', 'Goodman', 'Truelove', 'Kindred', 'Merriweather', 'Ashworth', 'Pennington', 'Thackeray', 'Fairbairn', 'Whitlock', 'Haverford', 'Calloway', 'Prendergast', 'Abernathy', 'Lockridge', 'Featherstone', 'Okonkwo-Bello', 'Diallo', 'Traoré', 'Keïta', 'Coulibaly', 'Sissoko']
// Surnames that are also ordinary English words. A document that already contains one of
// them as a capitalized word gets it as the patient surname, making a matched hard negative.
export const EVERYDAY_SURNAMES = new Set(['Gold', 'Hunter', 'Price', 'Young', 'Strong', 'Bishop', 'Rich', 'Moon', 'Frost', 'Day', 'Wood', 'Cook', 'Grant', 'Mason', 'Hill', 'Stone', 'Marsh', 'Snow', 'Fox', 'Swan', 'King', 'Baker', 'Short', 'Black', 'Rivers', 'Brooks', 'Banks', 'Sharp', 'Battle', 'Blessing', 'Christmas', 'Holiday', 'Friend', 'Goodman', 'Truelove', 'Kindred'])
export const CITIES = ['Kettering', 'Chillicothe', 'Wapakoneta', 'Zanesville', 'Ypsilanti', 'Kalamazoo', 'Oshkosh', 'Sheboygan', 'Muncie', 'Kokomo', 'Valparaiso', 'Bettendorf', 'Ottumwa', 'Mankato', 'Bemidji', 'Hibbing', 'Joplin', 'Sedalia', 'Salina', 'Emporia', 'Enid', 'Muskogee', 'Texarkana', 'Nacogdoches', 'Lufkin', 'Abilene', 'Hobbs', 'Alamogordo', 'Prescott', 'Kingman', 'Elko', 'Pocatello', 'Twin Falls', 'Missoula', 'Bozeman', 'Laramie', 'Greeley', 'Pueblo', 'Durango', 'Eugene', 'Medford', 'Yakima', 'Wenatchee', 'Bellingham', 'Redding', 'Chico', 'Visalia', 'Merced', 'Dothan', 'Opelika', 'Hattiesburg', 'Tupelo', 'Natchitoches', 'Houma', 'Valdosta', 'Dalton', 'Spartanburg', 'Florence', 'Rocky Mount', 'Hickory', 'Lynchburg', 'Harrisonburg', 'Altoona', 'Scranton', 'Binghamton', 'Utica', 'Pittsfield', 'Keene', 'Rutland', 'Bangor', 'Lewiston', 'Danbury']
export const STREETS = ['Larkspur', 'Wexford', 'Tamarack', 'Juniper Hollow', 'Cobblestone', 'Fieldcrest', 'Old Mill', 'Sumac', 'Briarwood', 'Quarry', 'Hawthorn', 'Kingfisher', 'Sassafras', 'Chestnut Ridge', 'Foxglove', 'Pinecone', 'Meadowlark', 'Bluestem', 'Wren', 'Saddlebrook', 'Tanager', 'Cottonwood', 'Stillwater', 'Indigo', 'Harrowgate', 'Thistle', 'Copperfield', 'Glenhaven', 'Ridgecrest', 'Marigold', 'Alder', 'Bramble', 'Clover Hill', 'Dunmore', 'Elderberry', 'Fernwood', 'Gristmill', 'Heron', 'Ironwood', 'Jasper', 'Kestrel', 'Linden', 'Mulberry', 'Northgate', 'Orchard View', 'Primrose', 'Quail Run', 'Rosemont', 'Sycamore', 'Timberline', 'Upland', 'Vinewood', 'Willowbend', 'Yarrow', 'Zephyr', 'Amberly', 'Brookstone', 'Cedar Bluff', 'Driftwood', 'Evergreen Knoll']
const STREET_KINDS = ['Way', 'Court', 'Lane', 'Drive', 'Road', 'Avenue', 'Street', 'Place', 'Circle', 'Trail']
const SYLLABLES = ['vel', 'tra', 'no', 'mar', 'qui', 'zen', 'lo', 'pa', 'ri', 'sto', 'ka', 'fen', 'dor', 'wy', 'bel', 'cas', 'ti', 'ro', 'mun', 'har', 'vi', 'lux', 'ne', 'sa']
const TLDS = ['com', 'net', 'org', 'us', 'co']
const AREA_CODES = [216, 234, 330, 380, 419, 440, 513, 567, 614, 740, 937, 260, 317, 463, 574, 765, 812, 930, 231, 248, 269, 313, 517, 586, 616, 734, 810, 906, 947, 989, 262, 414, 534, 608, 715, 920, 319, 515, 563, 641, 712, 218, 320, 507, 612, 651, 763, 952, 314, 417, 573, 636, 660, 816, 316, 620, 785, 913, 405, 539, 580, 918]
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const MONTH_ABBR = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

// ---------- format families, each owned by one split ----------
export const FAMILIES = {
 dev: {
  NAME: ['name:first-last', 'name:title-surname', 'name:last-comma-first'],
  DATE: ['date:numeric-slash', 'date:day-month-abbr'],
  PHONE: ['phone:paren'],
  MRN: ['mrn:digits', 'mrn:alpha-prefix'],
  HEALTH_PLAN: ['plan:alpha-digits'],
  EMAIL: ['email:first.last'],
  ADDRESS: ['address:street-city'],
 },
 heldout: {
  NAME: ['name:first-initial-last', 'name:surname-only', 'name:initials', 'name:upper-last-comma-first'],
  DATE: ['date:dashed-short-year', 'date:month-ordinal'],
  PHONE: ['phone:dot-ext', 'phone:intl'],
  MRN: ['mrn:dashed', 'mrn:hash'],
  HEALTH_PLAN: ['plan:alnum-dash'],
  EMAIL: ['email:initial-digits'],
  ADDRESS: ['address:street-only'],
 },
}

const UK_STYLE_PUBLISHERS = new Set(['Wiley', 'BMC', 'Oxford University Press', 'Elsevier'])

// ---------- document reading ----------
function readDoc(doc) { return doc.text ?? readFileSync(new URL(doc.file, root), 'utf8') }

function styleOf(text, publisher) {
 const months = MONTHS.join('|')
 const dmy = new RegExp(`\\b\\d{1,2}(?:st|nd|rd|th)? (?:${months})\\b`).test(text)
 const mdy = new RegExp(`\\b(?:${months}) \\d{1,2},`).test(text)
 const order = dmy ? 'dmy' : mdy ? 'mdy' : UK_STYLE_PUBLISHERS.has(publisher) ? 'dmy' : 'mdy'
 const dash = text.includes('-') ? '-' : text.includes('‐') ? '‐' : '-'
 const apostrophe = text.includes('’') ? '’' : "'"
 const count = re => (text.match(re) || []).length
 const female = count(/\b(she|her|woman|female|girl|lady)\b/gi)
 const male = count(/\b(he|his|him|man|male|gentleman|boy)\b/gi)
 const ageMatch = text.match(/\b(\d{1,3})[-‐ ](year|month)[-‐ ]old\b/)
 const age = ageMatch ? (ageMatch[2] === 'month' ? 0 : Number(ageMatch[1])) : null
 const infant = ageMatch ? ageMatch[2] === 'month' : false
 // Latest dated event, so a planted report date never lands before the case timeline ends.
 let latest = null
 const consider = (y, m, d) => { const t = Date.UTC(y, m, d || 1); if (!latest || t > latest) latest = t }
 for (const m of text.matchAll(new RegExp(`\\b(\\d{1,2})(?:st|nd|rd|th)? (${months}) (\\d{4})`, 'g'))) consider(+m[3], MONTHS.indexOf(m[2]), +m[1])
 for (const m of text.matchAll(new RegExp(`\\b(${months}) (\\d{1,2}), (\\d{4})`, 'g'))) consider(+m[3], MONTHS.indexOf(m[1]), +m[2])
 for (const m of text.matchAll(new RegExp(`\\b(${months}) (\\d{4})`, 'g'))) consider(+m[2], MONTHS.indexOf(m[1]), 28)
 for (const m of text.matchAll(/\b(19|20)(\d{2})\b/g)) consider(+(m[1] + m[2]), 0, 1)
 const pregnant = /pregnan|gestation|trimester|prenatal/i.test(text)
 return { order, dash, apostrophe, gender: female > male ? 'f' : male > female ? 'm' : null, age, infant, pregnant, latest }
}

function sortedIds(split) { return MANIFEST.documents.filter(d => d.split === split).map(d => d.id).sort() }

/** Which documents stay untouched. Coverage policies never name patients, so CMS stays untouched. */
export function untouchedIds(seed = SEED) {
 const r = rng(`${seed}|untouched`)
 const out = new Set(MANIFEST.documents.filter(d => d.source !== 'PMC').map(d => d.id))
 const pmc = split => r.shuffle(MANIFEST.documents.filter(d => d.source === 'PMC' && d.split === split).map(d => d.id).sort())
 for (const id of pmc('dev').slice(0, 2)) out.add(id)
 for (const id of pmc('heldout').slice(0, 3)) out.add(id)
 return out
}

// Everyday words that already occur capitalized in some document are reserved for that document.
function reservedEveryday() {
 const owner = new Map()
 for (const doc of [...MANIFEST.documents].sort((a, b) => a.id.localeCompare(b.id))) {
  const text = readDoc(doc)
  for (const word of EVERYDAY_SURNAMES) if (!owner.has(word) && new RegExp(`\\b${word}\\b`).test(text)) owner.set(word, doc.id)
 }
 return owner
}

/** The slice of each pool a document may draw from. Disjoint across documents and splits. */
function poolSlice(pool, valueSeed, split, docId, exclude) {
 const shuffled = rng(`${valueSeed}|pool|${pool.length}|${pool[0]}`).shuffle(pool.filter(v => !exclude.has(v)))
 const half = Math.floor(shuffled.length / 2)
 const side = split === 'dev' ? shuffled.slice(0, half) : shuffled.slice(half)
 const ids = sortedIds(split)
 const size = Math.floor(side.length / ids.length)
 const k = ids.indexOf(docId)
 return side.slice(k * size, (k + 1) * size)
}

// ---------- value makers (value stream only) ----------
function makeValues(doc, split, valueSeed, avoid) {
 const v = rng(`${valueSeed}|${doc.id}|value`)
 const reserved = reservedEveryday()
 const blocked = new Set([...reserved.keys(), ...avoid])
 const slice = list => v.shuffle(poolSlice(list, valueSeed, split, doc.id, avoid))
 const given = { f: slice(GIVEN_F), m: slice(GIVEN_M), n: slice(GIVEN_N) }
 const surnames = v.shuffle(poolSlice(SURNAMES, valueSeed, split, doc.id, blocked))
 const cities = v.shuffle(poolSlice(CITIES, valueSeed, split, doc.id, avoid))
 const streets = v.shuffle(poolSlice(STREETS, valueSeed, split, doc.id, avoid))
 const ownWord = [...reserved].find(([word, id]) => id === doc.id && !avoid.has(word))
 let personCount = 0
 const digits = n => Array.from({ length: n }, () => v.int(0, 9)).join('')
 return {
  person(isPatient, gender) {
   // A patient's given name agrees with the pronouns the case report uses.
   const order = isPatient ? (gender ? [gender, 'n'] : ['n', 'f', 'm']) : [v.pick(['f', 'm']), 'n', 'f', 'm']
   const sex = order.find(k => given[k].length)
   const g = sex && given[sex].shift()
   let s = surnames.shift()
   if (isPatient && ownWord && personCount === 0) s = ownWord[0]
   personCount++
   if (!g || !s) throw new Error(`pool slice exhausted for ${doc.id}`)
   return { given: g, surname: s, middle: String.fromCharCode(65 + v.int(0, 25)), sex }
  },
  everydayMatch: () => Boolean(ownWord),
  phone(family) {
   const reservedNumber = v() < 0.15
   const area = v.pick(AREA_CODES)
   const exch = reservedNumber ? '555' : String(v.int(201, 989)).replace(/^(\d)11$/, '$121')
   const line = reservedNumber ? `01${digits(2)}` : digits(4)
   if (family === 'phone:paren') return `(${area}) ${exch}-${line}`
   if (family === 'phone:dot-ext') return `${area}.${exch}.${line} ext. ${v.int(2, 499)}`
   return `+1 ${area} ${exch} ${line}`
  },
  mrn(family) {
   if (family === 'mrn:digits') return digits(v.int(7, 9))
   if (family === 'mrn:alpha-prefix') return `${String.fromCharCode(65 + v.int(0, 25))}${String.fromCharCode(65 + v.int(0, 25))}-${digits(6)}`
   if (family === 'mrn:dashed') return `${digits(4)}-${digits(4)}-${v.int(0, 9)}`
   return `${String.fromCharCode(65 + v.int(0, 25))}${digits(4)}${String.fromCharCode(65 + v.int(0, 25))}`
  },
  plan(family) {
   const L = () => String.fromCharCode(65 + v.int(0, 25))
   if (family === 'plan:alpha-digits') return `${L()}${L()}${L()} ${digits(4)} ${digits(4)}`
   return `${L()}${digits(2)}-${digits(3)}-${digits(4)}`
  },
  email(person, family) {
   const ascii = s => s.normalize('NFD').replace(/[^A-Za-z]/g, '').toLowerCase()
   const domain = v() < 0.15 ? 'example.com' : `${Array.from({ length: v.int(2, 3) }, () => v.pick(SYLLABLES)).join('')}.${v.pick(TLDS)}`
   if (family === 'email:first.last') return `${ascii(person.given)}.${ascii(person.surname)}@${domain}`
   return `${ascii(person.given)[0]}${ascii(person.surname)}${v.int(10, 99)}@${domain}`
  },
  address(family) {
   const street = `${v.int(12, 9890)} ${streets.shift()} ${v.pick(STREET_KINDS)}`
   return family === 'address:street-city' ? `${street}, ${cities.shift()}` : street
  },
  date(kind, style) {
   const latest = style.latest ? new Date(style.latest) : new Date(Date.UTC(2026, 3, 1))
   let y, m, d
   if (kind === 'dob') {
    // With no stated age, keep the birth date plausible for the case (pregnancy narrows it).
    const age = style.age ?? (style.pregnant ? v.int(21, 38) : v.int(28, 72))
    const birth = new Date(Date.UTC(latest.getUTCFullYear() - age - (style.infant ? 0 : 1), latest.getUTCMonth(), latest.getUTCDate()))
    if (style.infant) birth.setUTCDate(birth.getUTCDate() - v.int(150, 175))
    else birth.setUTCDate(birth.getUTCDate() + v.int(1, 360))
    y = birth.getUTCFullYear(); m = birth.getUTCMonth(); d = birth.getUTCDate()
   } else {
    const t = new Date(latest.getTime() + v.int(3, 40) * 86400000)
    y = t.getUTCFullYear(); m = t.getUTCMonth(); d = t.getUTCDate()
   }
   return { y, m, d }
  },
 }
}

function formatDate({ y, m, d }, family, style) {
 const dd = String(d).padStart(2, '0'), mm = String(m + 1).padStart(2, '0')
 const ord = d % 10 === 1 && d !== 11 ? 'st' : d % 10 === 2 && d !== 12 ? 'nd' : d % 10 === 3 && d !== 13 ? 'rd' : 'th'
 const dmy = style.order === 'dmy'
 if (family === 'date:numeric-slash') return dmy ? `${dd}/${mm}/${y}` : `${mm}/${dd}/${y}`
 if (family === 'date:day-month-abbr') return dmy ? `${d} ${MONTH_ABBR[m]} ${y}` : `${MONTH_ABBR[m]} ${d}, ${y}`
 if (family === 'date:dashed-short-year') return dmy ? `${d}-${m + 1}-${String(y).slice(2)}` : `${m + 1}-${d}-${String(y).slice(2)}`
 return dmy ? `${d}${ord} ${MONTHS[m]} ${y}` : `${MONTHS[m]} ${d}${ord}, ${y}`
}

// Render a person in a name family. Returns pieces: strings are glue, objects are spans.
function renderName(p, family, style, title, challenge) {
 const fix = s => s.replace(/-/g, style.dash).replace(/'/g, style.apostrophe)
 const g = fix(p.given), s = fix(p.surname)
 const span = (value, own = family) => ({ value, type: 'NAME', family: own, challenge })
 switch (family) {
  case 'name:first-last': return [span(`${g} ${s}`)]
  case 'name:title-surname': return title ? [`${title} `, span(s)] : [span(`${g} ${s}`, 'name:first-last')]
  case 'name:last-comma-first': return [span(`${s}, ${g}`)]
  case 'name:upper-last-comma-first': return [span(`${s.toUpperCase()}, ${g}`)]
  case 'name:first-initial-last': return [span(`${g} ${p.middle}. ${s}`)]
  case 'name:surname-only': return [span(s)]
  case 'name:initials': return [span(`${g[0]}.${s[0].toUpperCase()}.`)]
 }
 throw new Error(`unknown name family ${family}`)
}

// ---------- planting ----------
/**
 * Plant one document. Returns the serialized document and its answer key entry.
 * @param {object} doc manifest entry, optionally with `text`
 * @param {number} seed structure seed
 * @param {{valueSeed?: number, avoid?: Set<string>}} [opts] swap test redraws values only
 */
export function plant(doc, seed = SEED, opts = {}) {
 const valueSeed = opts.valueSeed ?? seed
 const avoid = opts.avoid ?? new Set()
 const original = readDoc(doc)
 const base = { id: doc.id, split: doc.split }
 if (untouchedIds(seed).has(doc.id)) return { ...base, planted: false, text: serialize(original), edits: [], spans: [] }

 const r = rng(`${seed}|${doc.id}|structure`)
 const style = styleOf(original, doc.publisher)
 const values = makeValues(doc, doc.split, valueSeed, avoid)
 const fam = FAMILIES[doc.split]
 const title = style.infant || !style.gender ? null : style.gender === 'f' ? 'Ms.' : 'Mr.'
 const target = r.weighted([[1, 1], [2, 2], [3, 3], [4, 3], [5, 2], [6, 2]])
 const patient = values.person(true, style.gender)
 const everyday = values.everydayMatch()
 const tag = list => everyday ? [...list, 'common-word'] : list
 const bodyNameFamilies = fam.NAME.filter(f => !/comma/.test(f) && f !== 'name:initials')
 const edits = []
 let count = 0
 const taken = []
 // Edits never touch or abut each other, so two identifiers are never glued together.
 const free = (at, len) => taken.every(([a, b]) => at + len < a || at > b)
 const add = (at, len, pieces) => { edits.push({ at, len, pieces }); taken.push([at, at + len]); count += pieces.filter(p => typeof p !== 'string').length }

 // Narrative edits, tried in a document-specific order.
 const ops = r.shuffle(['appositive', 'subject', 'subject', 'initials'])
 for (const op of ops) {
  if (count >= target) break
  if (op === 'appositive') {
   const m = original.match(/\b[Aa]n? \d{1,3}[-‐ ](?:year|month)[-‐ ]old (?:[A-Za-z‐-]+ ){0,2}(?:woman|man|female|male|gentleman|infant|girl|boy)(?= [a-z])/)
   if (!m) continue
   const at = m.index + m[0].length
   if (!free(at, 0)) continue
   add(at, 0, [', ', ...renderName(patient, r.pick(bodyNameFamilies.filter(f => f !== 'name:surname-only')), style, title, tag(['narrative'])), ','])
  } else if (op === 'subject') {
   const hits = [...original.matchAll(/\b[Tt]he patient\b(?!s)/g)].filter(m => free(m.index, m[0].length))
   if (!hits.length) continue
   const m = r.pick(hits)
   const possessive = /^['’]s\b/.test(original.slice(m.index + m[0].length))
   const family = r.pick(bodyNameFamilies)
   add(m.index, m[0].length, renderName(patient, family, style, title, tag([possessive ? 'possessive' : 'narrative', ...(family === 'name:surname-only' || family === 'name:title-surname' ? ['surname-only'] : [])])))
  } else if (op === 'initials' && fam.NAME.includes('name:initials')) {
   const hits = [...original.matchAll(/\b[Tt]he patient\b(?![s'’])/g)].filter(m => free(m.index + m[0].length, 0))
   if (!hits.length) continue
   const m = r.pick(hits)
   add(m.index + m[0].length, 0, [' (', ...renderName(patient, 'name:initials', style, title, ['initials']), ')'])
  }
 }

 // Header line: chart fields above the narrative.
 if (count < target) {
  const want = Math.min(3, target - count)
  const fields = r.shuffle(['name', 'mrn', 'dob', 'plan', 'seen']).slice(0, Math.max(1, want))
  const sep = r.pick([' | ', ', ', ' / ', ' · '])
  const pieces = []
  for (const field of fields) {
   if (pieces.length) pieces.push(sep)
   if (field === 'name') {
    const family = r.pick(fam.NAME.filter(f => f !== 'name:initials'))
    pieces.push(`${r.pick(['Patient:', 'Name:', 'Pt:', 'Re:', 'Patient name:'])} `, ...renderName(patient, family, style, title, tag(['header'])))
   } else if (field === 'mrn') {
    const family = r.pick(fam.MRN)
    pieces.push(`${family === 'mrn:hash' ? r.pick(['Record #', 'Chart #', 'MR #']) : r.pick(['MRN', 'MRN:', 'Med rec no.', 'Record no.', 'Hospital no.'])}${family === 'mrn:hash' ? '' : ' '}`, { value: values.mrn(family), type: 'MRN', family, challenge: ['header'] })
   } else if (field === 'dob') {
    const family = r.pick(fam.DATE)
    pieces.push(`${r.pick(['DOB', 'DOB:', 'Born', 'Date of birth:', 'D.O.B.'])} `, { value: formatDate(values.date('dob', style), family, style), type: 'DATE', family, challenge: ['header', 'birth-date'] })
   } else if (field === 'plan') {
    const family = r.pick(fam.HEALTH_PLAN)
    pieces.push(`${r.pick(['Member ID', 'Plan ID:', 'Insurance ID', 'Policy no.', 'Subscriber ID:'])} `, { value: values.plan(family), type: 'HEALTH_PLAN', family, challenge: ['header'] })
   } else {
    const family = r.pick(fam.DATE)
    pieces.push(`${r.pick(['Seen', 'Report date:', 'Dictated', 'Note date:', 'Summary prepared'])} `, { value: formatDate(values.date('event', style), family, style), type: 'DATE', family, challenge: ['header'] })
   }
  }
  pieces.push('\n')
  add(0, 0, pieces)
 }

 // Footer lines: a relative, contact details, an address. One name may wrap across lines.
 for (const kind of r.shuffle(['relative', 'relative', 'phone', 'email', 'address']).slice(0, 3)) {
  if (count >= target) break
  const pieces = ['\n']
  if (kind === 'relative') {
   const rel = values.person(false)
   const relations = { f: style.infant ? ['mother', 'grandmother', 'aunt'] : ['daughter', 'sister', 'niece', 'mother', 'wife'], m: style.infant ? ['father', 'grandfather', 'uncle'] : ['son', 'brother', 'nephew', 'father', 'husband'], n: style.infant ? ['parent', 'guardian'] : ['spouse', 'partner', 'sibling', 'child'] }
   const relation = r.pick(relations[rel.sex])
   const family = r.pick(fam.NAME.filter(f => !['name:initials', 'name:title-surname', 'name:surname-only'].includes(f)))
   const wrap = r() < 0.4
   const label = r.pick(['Next of kin:', 'Emergency contact:', 'Contact:', 'Accompanied by', 'Family contact:'])
   const nameParts = renderName(rel, family, style, null, wrap ? ['footer', 'relative', 'line-break'] : ['footer', 'relative'])
   if (wrap) for (const part of nameParts) if (typeof part !== 'string') part.value = part.value.replace(/ (?=\S+$)/, '\n')
   pieces.push(`${label} `, ...nameParts, ` (${relation})`)
   if (count + 1 < target && r() < 0.6) {
    const family = r.pick(fam.PHONE)
    pieces.push(r.pick([', ', ' tel. ', ' at ', ', phone ']), { value: values.phone(family), type: 'PHONE', family, challenge: ['footer', 'relative'] })
   }
  } else if (kind === 'phone') {
   const family = r.pick(fam.PHONE)
   pieces.push(`${r.pick(['Callback:', 'Home phone', 'Mobile:', 'Best number', 'Pharmacy callback'])} `, { value: values.phone(family), type: 'PHONE', family, challenge: ['footer'] })
  } else if (kind === 'email') {
   const family = r.pick(fam.EMAIL)
   pieces.push(`${r.pick(['Portal email:', 'Email on file:', 'Reply to', 'Contact email'])} `, { value: values.email(patient, family), type: 'EMAIL', family, challenge: ['footer'] })
  } else {
   const family = r.pick(fam.ADDRESS)
   pieces.push(`${r.pick(['Address:', 'Home address', 'Lives at', 'Mailing address:'])} `, { value: values.address(family), type: 'ADDRESS', family, challenge: ['footer'] })
  }
  add(original.length - 1, 0, pieces)
 }

 // Apply edits in original order. The trailing newline of the original stays last.
 const ordered = edits.map((e, i) => ({ ...e, i })).sort((a, b) => a.at - b.at || a.len - b.len || a.i - b.i)
 let text = ''
 let cursor = 0
 const outEdits = []
 const spans = []
 for (const e of ordered) {
  text += original.slice(cursor, e.at)
  const start = text.length
  for (const piece of e.pieces) {
   if (typeof piece === 'string') { text += piece; continue }
   spans.push({ start: text.length, end: text.length + piece.value.length, value: piece.value, type: piece.type, family: piece.family, split: doc.split, challenge: piece.challenge, replaced: original.slice(e.at, e.at + e.len) })
   text += piece.value
  }
  outEdits.push({ start, end: text.length, originalStart: e.at, originalEnd: e.at + e.len, replaced: original.slice(e.at, e.at + e.len) })
  cursor = e.at + e.len
 }
 text += original.slice(cursor)
 const serialized = serialize(text)
 if (serialized !== text) throw new Error(`planted ${doc.id} changed under serialization, an edit left a spacing trace`)
 return { ...base, planted: true, text: serialized, edits: outEdits, spans }
}

/** Plant every manifest document. Throws if any planted value repeats across the corpus. */
export function plantCorpus(seed = SEED, opts = {}) {
 const docs = MANIFEST.documents.map(doc => plant(doc, seed, opts))
 const owner = new Map()
 for (const d of docs) for (const s of d.spans) {
  // The same person can be named twice in one document. A name word may not reach a second
  // document, and any other value may appear only once in the whole corpus.
  const keys = s.type === 'NAME' ? s.value.split(/[\s,.]+/).filter(w => w.length > 1).map(w => `NAME:${w.toLowerCase()}`) : [`${s.type}:${s.value}`]
  for (const k of keys) {
   const here = s.type === 'NAME' ? d.id : `${d.id}:${s.start}`
   if (owner.has(k) && owner.get(k) !== here) throw new Error(`value repeats across corpus: ${k}`)
   owner.set(k, here)
  }
 }
 return docs
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href && process.argv.includes('--write')) {
 const documents = plantCorpus(SEED)
 const key = {
  status: 'Fixed public benchmark. The generator, seed and this answer key are public, so this is not a blind test.',
  seed: SEED,
  generator: 'eval/public-plant.js',
  serializer: SERIALIZER,
  documents,
 }
 writeFileSync(new URL('data/public/planted.json', root), JSON.stringify(key, null, 1) + '\n')
 const planted = documents.filter(d => d.planted)
 console.log(`${documents.length} documents, ${planted.length} planted, ${documents.length - planted.length} untouched, ${planted.reduce((n, d) => n + d.spans.length, 0)} planted spans`)
}
