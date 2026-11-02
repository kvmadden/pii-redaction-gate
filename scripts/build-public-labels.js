#!/usr/bin/env node
// scripts/build-public-labels.js. Builds data/public/labels.json, the draft Set C labels.
//
// These labels were proposed by an AI coding assistant and have not been reviewed. Every
// metric built on them is marked "draft, pending pharmacist review" until Kevin Madden
// reviews them as the pharmacist on the project. Disagreements go in `reviewLog`.
//
// keep             clinical meaning that redaction should leave intact
// realIdentifiers  identifier elements the source itself left in (dates finer than a year).
//                  Removing these is required by policy, so it is not counted as over-redaction.
//                  Nothing here is ever looked up.
// extractions      medications, doses (with units), routes, frequencies and diagnoses, with negation
//
// Phrases are located in the untouched excerpt. Every occurrence with word boundaries is labeled.

import { readFileSync, writeFileSync } from 'node:fs'

const root = new URL('../', import.meta.url)
const manifest = JSON.parse(readFileSync(new URL('data/public/manifest.json', root), 'utf8'))

const L = {
 'cms-ncd-211-3': {
  keep: ['Positron emission tomography (PET)', 'noninvasive diagnostic imaging procedure', 'metabolic activity and perfusion', 'positron camera (tomograph)', 'cross-sectional tomographic images', 'positron emitting radioactive tracer substances', 'radiopharmaceuticals', '2-[F-18] Fluoro-D-Glucose (FDG)', 'administered intravenously'],
  extractions: [['medication', 'Fluoro-D-Glucose'], ['route', 'intravenously']],
 },
 'cms-ncd-22-2': {
  keep: ['electric nerve stimulation', 'chronic intractable pain', 'motor function disorders', 'multiple sclerosis'],
  extractions: [['diagnosis', 'chronic intractable pain'], ['diagnosis', 'multiple sclerosis']],
 },
 'pmc-13719311': {
  keep: ['74-year-old', 'weakness involving both upper and lower limbs', 'exertional chest pain', 'fall at home due to dizziness', 'anterolateral ischemia', 'troponin T level was 313', 'global hypokinesia of the left ventricle', 'ejection fraction of 45%', 'severe triple-vessel coronary artery disease', 'ACS with NSTEMI', 'heparin 5000 units (injection)', 'a diuretic', 'aspirin (tablet)'],
  extractions: [['medication', 'heparin'], ['dose', '5000 units'], ['route', 'injection'], ['medication', 'aspirin'], ['diagnosis', 'anterolateral ischemia'], ['diagnosis', 'triple-vessel coronary artery disease'], ['diagnosis', 'NSTEMI']],
 },
 'pmc-13719403': {
  keep: ['visual obscuration in her left eye', 'BCVA remained 0.8', 'hand motions at 60 cm', '187/104 mmHg', 'hypertensive emergency', 'mild vitreous hemorrhage', 'subretinal hemorrhage', 'intravitreal anti-VEGF therapy', 'oral nifedipine controlled-release tablets (30 mg twice daily)', 'metoprolol succinate sustained-release tablets (47.5 mg once daily)', 'strict bed rest'],
  realIdentifiers: [['DATE', 'September 30, 2020']],
  extractions: [['diagnosis', 'hypertensive emergency', true], ['diagnosis', 'headache', true], ['diagnosis', 'chest pain', true], ['diagnosis', 'vitreous hemorrhage'], ['route', 'oral'], ['medication', 'nifedipine'], ['dose', '30 mg'], ['frequency', 'twice daily'], ['medication', 'metoprolol succinate'], ['dose', '47.5 mg'], ['frequency', 'once daily']],
 },
 'pmc-13719627': {
  keep: ['36-year-old woman', 'low-grade fever', 'severe stabbing headaches', 'marked meningeal signs', 'lymphocytic pleocytosis (183 cells/µL; 97.8% lymphocytes)', '83.3 mg/dL', 'Borrelia burgdorferi', 'lymphocytic meningitis syndrome', 'intravenous dexamethasone (Dexaven)', '8 mg/day', '12 mg/day', '4 mg/day', '130 cells/µL', '46.1 mg/dL'],
  realIdentifiers: [['DATE', '11 March 2026']],
  extractions: [['diagnosis', 'lymphocytic meningitis syndrome'], ['diagnosis', 'Borrelia burgdorferi', true], ['route', 'intravenous'], ['medication', 'dexamethasone'], ['medication', 'Dexaven'], ['dose', '8 mg/day'], ['dose', '12 mg/day'], ['dose', '4 mg/day']],
 },
 'pmc-13720331': {
  keep: ['lateral ST‐segment changes', 'elevated troponin‐T', 'HbA1c 5.7%', 'LDL‐C 142 mg/dL', 'refractory angina', 'troponin T (8160 ng/L)', 'NSTEMI', 'acute thrombotic occlusion', 'left PDA', 'hyperdominant‐LCx', 'right coronary artery (RCA)', 'left anterior descending artery (LAD)', '~50% stenosis', 'percutaneous coronary intervention (PCI)'],
  extractions: [['diagnosis', 'refractory angina'], ['diagnosis', 'NSTEMI'], ['diagnosis', 'acute thrombotic occlusion']],
 },
 'pmc-13720340': {
  keep: ['clinically dehydrated', 'cognitive slowing', 'impaired orientation', 'dysarthria', '119/88 mmHg', '126 beats/min', '19 breaths/min', '93% on room air', '185 cm', '84 kg', '24.5 kg/m2', 'non‐pitting edema of the left lower extremity', 'muscle strength (2/5)'],
  extractions: [['diagnosis', 'dysarthria'], ['diagnosis', 'non‐pitting edema'], ['diagnosis', 'cognitive slowing']],
 },
 'pmc-13720511': {
  keep: ['hemorrhage spared the fovea', 'severe anxiety', 'dense inferior visual field defect', 'third trimester of pregnancy', 'scotoma', 'Nd:YAG laser hyaloidotomy'],
  extractions: [['diagnosis', 'severe anxiety'], ['diagnosis', 'scotoma'], ['diagnosis', 'inferior visual field defect']],
 },
 'pmc-13720603': {
  keep: ['erythrocytosis with microcytosis', 'Hb was 18.3 g/dL', 'Hct 55%', 'RBC count 7.19 × 106/μL', 'MCV 76.5 fL', '18.9 g/dL', 'renal cell carcinoma', 'paraneoplastic', 'erythropoietin levels'],
  realIdentifiers: [['DATE', '21st January 2026'], ['DATE', '4th March 2026'], ['DATE', '21 Jan 2026', 'table'], ['DATE', '23 Jan 2026', 'table'], ['DATE', '22 Feb 2026', 'table'], ['DATE', '4 Mar 2026', 'table']],
  extractions: [['diagnosis', 'erythrocytosis'], ['diagnosis', 'microcytosis'], ['diagnosis', 'renal cell carcinoma']],
 },
 'pmc-13720755': {
  keep: ['47‐year‐old female', 'dental extractions', 'left facial numbness', '98.2°F', '157/78 mmHg', '78 bpm', '18 breaths/minute', 'left mandibular swelling', 'gingival swelling', 'V1‐V2 region', 'hypodensities in the right parietal and occipital lobes', '11 × 18 mm enhancing lesion', 'vasogenic edema', 'odontogenic brain abscesses', 'IV vancomycin, ceftriaxone, and metronidazole', 'QuantiFERON‐TB Gold test', 'rapid plasma reagin (RPR)', 'HIV screen', 'cryptococcal antigen', 'occult malignancy'],
  extractions: [['route', 'IV'], ['medication', 'vancomycin'], ['medication', 'ceftriaxone'], ['medication', 'metronidazole'], ['diagnosis', 'odontogenic brain abscesses'], ['diagnosis', 'vasogenic edema'], ['diagnosis', 'occult malignancy', true], ['diagnosis', 'acute distress', true]],
 },
 'pmc-13720756': {
  keep: ['56‐year‐old Moroccan man', 'diffuse abdominal pain', 'mesogastric region', 'constipation', 'subacute intestinal obstruction', 'afebrile', 'urinary symptoms', 'vomiting'],
  realIdentifiers: [['DATE', 'March 2026']],
  extractions: [['diagnosis', 'subacute intestinal obstruction'], ['diagnosis', 'constipation'], ['diagnosis', 'urinary symptoms', true], ['diagnosis', 'vomiting', true]],
 },
 'pmc-13720758': {
  keep: ['48‐year‐old healthy male', 'right flank pain radiating to the groin', 'slightly hypotensive', 'epigastric and right hypochondriac tenderness', 'peritoneal signs', 'white blood count (WBC) of 20 × 109/L', 'radiopaque needlelike structure', 'foreign body'],
  extractions: [['diagnosis', 'right flank pain'], ['diagnosis', 'peritoneal signs', true], ['diagnosis', 'foreign body']],
 },
 'pmc-13720761': {
  keep: ['ERCP', 'open surgery', 'bilio‐cutaneous fistula', 'omentoplasty and drainage', 'less than 10 mL per day', 'foul‐smelling, yellowish–green fluid'],
  extractions: [['diagnosis', 'bilio‐cutaneous fistula']],
 },
 'pmc-13721315': {
  keep: ['44-year-old Han woman', 'performance status (ECOG PS) score of 1', 'epithelioid low-grade spindle cell tumors', 'systemic chemotherapy with IA', 'severe myelosuppression', 'grade 4 leukopenia', 'grade 4 neutropenia', 'grade 2 anemia', 'disease progression', 'anlotinib (12 mg orally once daily)', 'vaginal hemorrhage'],
  realIdentifiers: [['DATE', 'August 2022'], ['DATE', 'May 2022'], ['DATE', 'September 2022']],
  extractions: [['medication', 'anlotinib'], ['dose', '12 mg'], ['route', 'orally'], ['frequency', 'once daily'], ['diagnosis', 'myelosuppression'], ['diagnosis', 'leukopenia'], ['diagnosis', 'neutropenia'], ['diagnosis', 'anemia'], ['diagnosis', 'vaginal hemorrhage']],
 },
 'pmc-13721425': {
  keep: ['Urine toxicology screening', 'benzoylecgonine', 'metabolite of cocaine', 'cocaine use', 'intermittent recreational use'],
  extractions: [['diagnosis', 'cocaine use']],
 },
 'pmc-13721443': {
  keep: ['cough and wheezing', 'expectoration and diarrhea', 'yellow-green watery stool', 'fever, chest pain or hemoptysis', '36.4℃', '135 beats/min', '32 breaths/min', '121/95 mmHg', 'acute facies', 'three-depressions sign', 'wheezes and fine crackles', 'abdominal distension', 'liver palpable 6 cm below the costal margin', 'digital clubbing'],
  realIdentifiers: [['DATE', 'December 29, 2020']],
  extractions: [['diagnosis', 'cough'], ['diagnosis', 'wheezing'], ['diagnosis', 'diarrhea'], ['diagnosis', 'fever', true], ['diagnosis', 'chest pain', true], ['diagnosis', 'hemoptysis', true], ['diagnosis', 'digital clubbing']],
 },
 'pmc-13721448': {
  keep: ['5-month-old female infant', 'right eye photophobia and epiphora', 'miosis', 'inferior pupil displacement'],
  extractions: [['diagnosis', 'photophobia'], ['diagnosis', 'epiphora'], ['diagnosis', 'miosis']],
 },
 'pmc-13722088': {
  keep: ['7 weeks of gestation', 'folic acid and iron supplementation', '12 weeks', 'acrania', 'complete absence of cranial ossification', 'exposed brain tissue'],
  extractions: [['medication', 'folic acid'], ['medication', 'iron'], ['diagnosis', 'acrania'], ['diagnosis', 'degeneration', true]],
 },
 'pmc-13722112': {
  keep: ['comminuted displaced fracture of the proximal humerus', 'posterior dislocation of a large osseous fragment', '~4 cm', 'acute posterior fracture-dislocation', 'adequate pain control'],
  extractions: [['diagnosis', 'comminuted displaced fracture of the proximal humerus'], ['diagnosis', 'posterior fracture-dislocation']],
 },
 'pmc-13722120': {
  keep: ['bowel necrosis or perforation', 'endoscopic reduction', 'volvulus', 'mucosal ischemia', 'abdominal pain and distension', 'parenteral nutrition', 'oral liquid nutritional formula', 'laparoscopic ileocecal resection', 'hospital day 9', 'postoperative day 14'],
  extractions: [['diagnosis', 'volvulus'], ['diagnosis', 'mucosal ischemia', true], ['route', 'oral']],
 },
}

const escape = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
// Table cells in the PMC excerpt run together with no spaces, so `table` labels skip the boundary check.
function locateAll(text, value, table = false) {
 const pre = !table && /[\p{L}\p{N}]/u.test(value[0]) ? '(?<![\\p{L}\\p{N}])' : ''
 const post = !table && /[\p{L}\p{N}]/u.test(value[value.length - 1]) ? '(?![\\p{L}\\p{N}])' : ''
 const hits = [...text.matchAll(new RegExp(pre + escape(value) + post, 'gu'))].map(m => ({ start: m.index, end: m.index + value.length, value }))
 if (!hits.length) throw new Error(`label not found: ${JSON.stringify(value)}`)
 return hits
}

const documents = manifest.documents.map(doc => {
 const text = readFileSync(new URL(doc.file, root), 'utf8')
 const spec = L[doc.id]
 if (!spec) throw new Error(`no labels for ${doc.id}`)
 return {
  id: doc.id,
  split: doc.split,
  keep: spec.keep.flatMap(v => locateAll(text, v)).sort((a, b) => a.start - b.start),
  realIdentifiers: (spec.realIdentifiers || []).flatMap(([type, v, table]) => locateAll(text, v, table === 'table').map(s => ({ ...s, type }))).filter((s, i, all) => !all.some((o, j) => j !== i && o.start <= s.start && o.end >= s.end && o.end - o.start > s.end - s.start)),
  extractions: spec.extractions.map(([type, value, negated = false]) => { locateAll(text, value); return { type, value, negated } }),
 }
})

const out = {
 status: 'draft, pending pharmacist review',
 proposedBy: 'AI coding assistant, not reviewed',
 reviewer: null,
 secondReviewer: 'not done',
 reviewLog: [],
 documents,
}
writeFileSync(new URL('data/public/labels.json', root), JSON.stringify(out, null, 1) + '\n')
console.log(`${documents.length} documents, ${documents.reduce((n, d) => n + d.keep.length, 0)} keep spans, ${documents.reduce((n, d) => n + d.realIdentifiers.length, 0)} source-left-in identifiers, ${documents.reduce((n, d) => n + d.extractions.length, 0)} extraction labels`)
