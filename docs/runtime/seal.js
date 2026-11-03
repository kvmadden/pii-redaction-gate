// seal.js: marks results that this library produced.
//
// Pure. The send guard accepts only sealed results, so an object built by hand
// ({ blocked: false }) or the raw record itself can never pass as redacted.
// Internal module: not part of the package exports.

const SEALED = new WeakSet();

export function seal(result) {
  SEALED.add(result);
  return result;
}

export function isSealed(value) {
  return value !== null && typeof value === "object" && SEALED.has(value);
}
