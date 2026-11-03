// Curated fictional demonstrations, separate from the frozen evaluation corpus.
export const examples = {
 fax: {source:'Synthetic fax transcription / PA-001 / 2025-10-22', text:'FAX / Prior authorization request\nPatient Inez Q. Thorn-Smith, DOB 03/04/1961. Plan ID: DEMO881122.\nFax: 202-555-0143. Requested on 10/22/2025.\nRequest: Ozempic 0.5 mg weekly. A1c 7.4%.\nPrior therapy: metformin 500 mg BID.\nReviewer must verify the source before routing. No coverage decision is made here.'},
 discharge: {source:'Synthetic discharge summary / DS-002 / 2025-10-23', text:'DISCHARGE SUMMARY\nPatient Inez Q. Thorn-Smith. MRN#: Z9900188. Age: 64.\nDischarged 10/23/2025. Phone 202-555-0143.\nType 2 diabetes. A1c 7.4%, BP 138/84.\nContinue metformin 500 mg BID.\nFollow-up requested. Medication reconciliation requires clinician review.'},
 refill: {source:'Synthetic pharmacy call note / RX-003 / 2025-10-24', text:'PHARMACY REFILL CALL\nPatient Inez Q. Thorn-Smith, DOB 03/04/1961.\nCallback 202-555-0143. Call dated 10/24/2025.\ntanya called about metformin 500 mg BID.\nPatient reports two days remaining. No dose change requested.\nPharmacist must verify caller and prescription. This note does not authorize a refill.'}
}
const familyFor = type => ({RELATIVE:'NAME',FACILITY:'NAME',DOB:'DATE',MRN:'ID',ACCOUNT:'ID',PLAN:'ID',LICENSE:'ID',DEVICE:'ID',VEHICLE:'ID',FAX:'PHONE',AGE_OVER_89:'AGE'}[type] || type)
// Rows for this tree's engine on one development set ("development" or "templates").
export function metricRows(comparison, corpus) {
 const run = comparison.sets[corpus].results.current
 return Object.entries(run.byType).map(([type, row]) => {
  const family = familyFor(type)
  const precision = run.precisionByFamily[family]
  return {type, family, n:row.n, full:row.full, recall:row.recall, precision:precision?.precision, tp:precision?.tp, fp:precision?.fp}
 })
}
export const reviewKey = 'redaction-inspector-reviews-v1'
export function recordReview(storage, action, context, at = new Date().toISOString()) {
 if (!context.ready || context.blocked) throw Error('Inspect a current unblocked note first')
 if (!['reviewed','flagged'].includes(action)) throw Error('Unknown review action')
 const entries = JSON.parse(storage.getItem(reviewKey) || '[]')
 if (!Array.isArray(entries)) throw Error('Unreadable review log')
 const entry = {action, at, document:context.document, profile:context.profile, revision:context.revision}
 storage.setItem(reviewKey, JSON.stringify([...entries, entry]))
 return entry
}
