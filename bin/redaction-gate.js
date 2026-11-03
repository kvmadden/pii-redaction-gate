#!/usr/bin/env node
// redaction-gate: redact a text file or stdin from the command line.
//
//   redaction-gate [options] [file]      reads stdin when no file is given, or with "-"
//
// Options:
//   --source <id>           registered source id (selects the profile). Unknown ids block.
//   --profile <name>        light, standard, identifiers or strict (wins over --source)
//   --people-map <path>     JSON people map ({ people: [...], safe: [...] }). Unreadable blocks.
//   --reference-date <date> date used to judge birth years (ages over 89)
//   --json                  print the whole result as JSON instead of the text
//   --help
//
// Exit codes. Pipe the output onward only on 0:
//   0  clean: the profile's checks ran over every character and found nothing
//      left to decide (not proof that no identifier remains)
//   3  review: spans need a person to look before the text is used. They are
//      listed on stderr (or in result.review with --json)
//   2  blocked: the engine failed, the input could not be read, or the source
//      or people map is invalid. stdout gets [redaction-blocked] only
//   1  usage error

import fs from "node:fs";
import { redactText, BLOCKED_TEXT } from "../src/engine.js";

const EXIT = { clean: 0, usage: 1, blocked: 2, review: 3 };

const HELP = `usage: redaction-gate [--source id | --profile name] [--people-map path]
                      [--reference-date YYYY-MM-DD] [--json] [file | -]
exit codes: 0 clean, 3 needs review, 2 blocked, 1 usage error`;

export function parseArgs(argv) {
  const opts = { json: false, file: null };
  const takes = new Set(["--source", "--profile", "--people-map", "--reference-date"]);
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--help" || a === "-h") return { help: true };
    if (a === "--json") opts.json = true;
    else if (takes.has(a)) {
      const v = argv[++i];
      if (v === undefined || v.startsWith("--")) return { error: `${a} needs a value` };
      opts[a.slice(2)] = v;
    } else if (a.startsWith("--")) return { error: `unknown option ${a}` };
    else if (opts.file === null) opts.file = a;
    else return { error: "only one input file" };
  }
  return opts;
}

function readInput(file) {
  return file === null || file === "-" ? fs.readFileSync(0, "utf8") : fs.readFileSync(file, "utf8");
}

/** Run the CLI. Returns { code, stdout, stderr } so it can be tested without a process. */
export function run(argv, { readText = readInput } = {}) {
  const opts = parseArgs(argv);
  if (opts.help) return { code: EXIT.clean, stdout: HELP + "\n", stderr: "" };
  if (opts.error) return { code: EXIT.usage, stdout: "", stderr: `redaction-gate: ${opts.error}\n${HELP}\n` };
  const blocked = (why) => ({ code: EXIT.blocked, stdout: (opts.json ? JSON.stringify({ status: "blocked", blocked: true, text: BLOCKED_TEXT, error: { stage: why } }) : BLOCKED_TEXT) + "\n", stderr: `redaction-gate: BLOCKED (${why})\n` });
  let text;
  try {
    text = readText(opts.file);
  } catch {
    return blocked("input");
  }
  let peopleMap = { people: [], safe: [] };
  if (opts["people-map"]) {
    try {
      peopleMap = JSON.parse(fs.readFileSync(opts["people-map"], "utf8"));
      if (!peopleMap || typeof peopleMap !== "object" || Array.isArray(peopleMap)) throw new TypeError("not an object");
    } catch {
      return blocked("people-map");
    }
  }
  const call = { peopleMap };
  if (opts.profile) call.profile = opts.profile;
  if (opts.source) call.source = opts.source;
  if (opts["reference-date"]) call.referenceDate = opts["reference-date"];
  const r = redactText(text, call);
  if (r.blocked) return blocked(r.error?.stage || "engine");
  const code = r.status === "review" ? EXIT.review : EXIT.clean;
  if (opts.json) {
    // Review spans carry the flagged text so a reviewer can find them. Offsets are into result.text.
    const review = r.review.map((x) => ({ ...x, text: r.text.slice(x.start, x.end) }));
    return { code, stdout: JSON.stringify({ ...r, review }, null, 2) + "\n", stderr: "" };
  }
  let stderr = "";
  if (r.status === "review") {
    stderr += `redaction-gate: REVIEW REQUIRED, ${r.review.length} span(s) the rules could not decide:\n`;
    for (const x of r.review) stderr += `  ${x.start}-${x.end} ${x.check}: ${x.reason}\n`;
  } else {
    stderr += `redaction-gate: checks found nothing left to decide under the ${r.profile} profile. Not proof that no identifier remains.\n`;
  }
  return { code, stdout: r.text.endsWith("\n") ? r.text : r.text + "\n", stderr };
}

const isMain = process.argv[1] && fs.realpathSync(process.argv[1]) === fs.realpathSync(new URL(import.meta.url).pathname);
if (isMain) {
  const out = run(process.argv.slice(2));
  process.stdout.write(out.stdout);
  process.stderr.write(out.stderr);
  process.exitCode = out.code;
}
