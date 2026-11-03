// send-guard.js: the one check before anything leaves. Pure, shared by the
// Node writers and the browser demonstration.
//
// A result may be sent only when all of these hold:
//   - this library produced it (sealed by ./seal.js), so a hand-built
//     { blocked: false } or the raw record cannot pass
//   - it is not blocked
//   - nothing in it is waiting for review, unless the caller states that a
//     person reviewed the flagged spans ({ acceptReview: true })
// "clean" means the checks this profile runs found nothing left to decide. It
// does not mean the text is free of identifiers: see result.scan for what was
// read and what was not checked.

import { isSealed } from "./seal.js";

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
  if (!isSealed(result)) throw fail("RedactionBlockedError", "not a redaction result from this library; refusing to send");
  if (result.blocked || result.status === "blocked") throw fail("RedactionBlockedError", "redaction gate blocked this record; refusing to send");
  if (result.status === "review" && !acceptReview) {
    throw fail("RedactionReviewRequiredError", "redaction found spans that need a person to review them; refusing to send");
  }
  if (result.status !== "clean" && result.status !== "review") throw fail("RedactionBlockedError", "redaction result has no valid status; refusing to send");
  return result;
}
