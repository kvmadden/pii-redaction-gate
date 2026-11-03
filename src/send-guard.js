// send-guard.js: the one check before anything leaves. Pure, shared by the
// Node writers and the browser demonstration.
//
// A result may be sent only when all of these hold:
//   - this library built it. Results are sealed inside ./engine.js, which does
//     not export its sealing function, so a hand-built { blocked: false }, a
//     spread copy or the raw record cannot pass
//   - it is frozen, so nothing in it changed after the check
//   - it is not blocked, and its status agrees with its review list
//   - nothing in it is waiting for review, unless the caller states that a
//     person reviewed the flagged spans ({ acceptReview: true })
// "clean" means the checks this profile runs found nothing left to decide. It
// does not mean the text is free of identifiers: see result.scan for what was
// read, what was not checked and the known gaps.

import { isSealed } from "./engine.js";

function fail(name, message) {
  const err = new Error(message);
  err.name = name;
  return err;
}

/**
 * Throw unless the result may be sent. Returns the result so the caller sends
 * exactly what was checked.
 * @param {object} result  a redactText, record or gate result
 * @param {{acceptReview?: boolean}} [opts]
 */
export function assertSendable(result, { acceptReview = false } = {}) {
  if (!isSealed(result) || !Object.isFrozen(result)) throw fail("RedactionBlockedError", "not a redaction result from this library; refusing to send");
  if (result.blocked !== false || result.status === "blocked") throw fail("RedactionBlockedError", "redaction gate blocked this record; refusing to send");
  if (result.status !== "clean" && result.status !== "review") throw fail("RedactionBlockedError", "redaction result has no valid status; refusing to send");
  if (!Array.isArray(result.review) || (result.status === "clean") !== (result.review.length === 0)) {
    throw fail("RedactionBlockedError", "redaction result status does not match its review list; refusing to send");
  }
  if (result.status === "review" && acceptReview !== true) {
    throw fail("RedactionReviewRequiredError", "redaction found spans that need a person to review them; refusing to send");
  }
  return result;
}
