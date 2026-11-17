import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { writeQuarantineSidecar } from "../src/quarantine.js";

const now = new Date("2026-11-17T00:00:00Z");
const changes = [{ field: "text", before: "Fictional café record", after: "[redacted]" }];

function fixture(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "quarantine-write-"));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  return { args: { dir, now, changes }, day: path.join(dir, "2026-11-17") };
}

function shortWrite(t, failure) {
  const write = fs.writeSync;
  let writes = 0;
  t.mock.method(fs, "writeSync", (fd, data, ...args) => {
    writes += 1;
    if (writes === 1) {
      // Exercise the actual filesystem with only a prefix of the first write.
      return typeof data === "string"
        ? write(fd, data.slice(0, 12), ...args)
        : write(fd, data, args[0], Math.min(args[1], 12), ...args.slice(2));
    }
    if (failure) throw Object.assign(new Error("synthetic write fault"), { code: failure });
    return write(fd, data, ...args);
  });
  return () => writes;
}

test("quarantine completes short writes before publishing valid UTF-8 JSON", (t) => {
  const { args, day } = fixture(t);
  const writes = shortWrite(t);
  const result = writeQuarantineSidecar(args);
  assert.ok(writes() >= 2);
  assert.equal(result.error, null);
  assert.deepEqual(JSON.parse(fs.readFileSync(result.path, "utf8")).changes, changes);
  assert.deepEqual(fs.readdirSync(day), [path.basename(result.path)]);
  assert.equal(fs.statSync(result.path).mode & 0o777, 0o600);
});

test("quarantine removes staging data after a write fails partway", (t) => {
  const { args, day } = fixture(t);
  shortWrite(t, "ENOSPC");
  assert.deepEqual(writeQuarantineSidecar(args), { path: null, error: "ENOSPC" });
  assert.deepEqual(fs.readdirSync(day), []);
});

test("quarantine publication fails closed if the final path is occupied", (t) => {
  const { args, day } = fixture(t);
  const link = fs.linkSync;
  let occupied;
  t.mock.method(fs, "linkSync", (temporary, final) => {
    occupied = final;
    fs.writeFileSync(final, "previous fictional record", { flag: "wx" });
    return link(temporary, final);
  });
  assert.deepEqual(writeQuarantineSidecar(args), { path: null, error: "EEXIST" });
  assert.deepEqual(fs.readdirSync(day), [path.basename(occupied)]);
  assert.equal(fs.readFileSync(occupied, "utf8"), "previous fictional record");
});

test("a payload that cannot be serialized leaves the directory untouched", (t) => {
  const { args } = fixture(t);
  const circular = { ...changes[0] };
  circular.context = circular;
  assert.deepEqual(writeQuarantineSidecar({ ...args, changes: [circular] }), {
    path: null,
    error: "write-failed",
  });
  assert.deepEqual(fs.readdirSync(args.dir), []);
});
