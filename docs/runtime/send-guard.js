// Pure send guard shared by Node writers and the browser demonstration.
export function assertSendable(gate) {
  if (!gate || gate.blocked) {
    const err = new Error("redaction gate blocked this record; refusing to send");
    err.name = "RedactionBlockedError";
    throw err;
  }
  return gate;
}

