# Fresh blind set v1

Locked on 2026-11-03 at `30b6061`, set hash `2d2011ff449da01bb3200b5f2832cb40faa70323cc85a5f97a79446dd4f71055`, scorer `047c193`. Scored once the same day at `a8bea3e`, with the files in [results/](results/). The result is in the repository [README](../../README.md#where-the-evidence-stands). This set is development data now: any later run on it is a regression check ([docs/fresh-test-spec.md](../../docs/fresh-test-spec.md), section 6).

## AMENDMENTS.md section 1 is superseded

Section 1 of [AMENDMENTS.md](AMENDMENTS.md) says a change Kevin makes to a keep label is recorded before the lock. [LOCK-NOTE.md](LOCK-NOTE.md) replaces that. His review of the 30 uncertain keep spans runs after the lock, as errata. Labels are never edited. Any change goes to `ERRATA.md` in this folder, and the score is published both ways, once on the labels as locked and once with the errata applied. AMENDMENTS.md is kept as staged and is not edited.

## What is here

- `documents/`, `labels.jsonl`, `manifest.json`: the locked set. `node eval/fresh/score.mjs fresh-test/v1 --check` verifies it.
- [LOCK-NOTE.md](LOCK-NOTE.md): who wrote, labeled and adjudicated the set, and the one deviation from the spec. Its "Not yet scored" is the status at the lock.
- [AMENDMENTS.md](AMENDMENTS.md): where the staged set differs from the spec, as staged. Section 1 is superseded, see above.
- `results/`: the single scored run, its report and Presidio's outputs.
- `provenance.json`, `prompts/`, `validation/`: the staging record.
