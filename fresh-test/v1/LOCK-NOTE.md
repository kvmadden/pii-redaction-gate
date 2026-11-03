# Lock note for fresh blind set v1

Locked on 2026-11-03, before any gate run. Set hash `2d2011ff449da01bb3200b5f2832cb40faa70323cc85a5f97a79446dd4f71055`. Scorer commit `047c19326ad0fcd570c55bc480ccd6878c350829`. Not yet scored.

## The set

132 documents, 2,577 labeled identifier mentions, 28 documents with no identifier. `manifest.json` lists the SHA-256 of `labels.jsonl` and of every document. The set hash is the SHA-256 of the sorted file hashes joined by newlines. Documents and labels are exactly as staged. Nothing was scrubbed or edited.

## Who wrote, labeled and adjudicated it

- Written by Grok 4.7 (67 documents) and Gemini 3.8 Flash (65 documents).
- Labeled independently by both of them.
- Adjudicated by GPT 6.1 Sol. Every place where the two labelers did not give the same span went to it.
- Agreement between the two labelers before adjudication, strict span match: identifier spans F1 0.99 (0.9906), KEEP spans F1 0.85 (0.8452). Per-type figures are in `provenance.json`.
- The Claude agents that wrote the gate's rules never saw the documents or the labels.

## The scorer and the gate

`eval/fresh/score.mjs` at commit `047c19326ad0fcd570c55bc480ccd6878c350829`, content hash `ddd1cfa5d2e8714c87ec25d8f6ac5add2ada974079f6a633f29af767d9218815`, recorded in `eval/fresh/scorer-lock.json`. The gate under test is `src/` at branch head `e328c73`. The lock commit changes nothing under `src/` or `eval/fresh/`. The single scored run uses the command in section 4 of `docs/fresh-test-spec.md`.

## One deviation from the spec, decided before the lock

The spec has a pharmacist review the keep spans. `AMENDMENTS.md` limits that review to 30 items, the keep spans that a labeler or the adjudicator marked uncertain, and says any change would be noted before the lock. That last part is replaced by this note. Kevin Madden's review of those 30 spans runs after the lock. Labels are never edited. Any change he makes goes to `ERRATA.md` in this folder, and the score is published both ways: once on the labels as locked and once with the errata applied. The review queue is kept outside this folder.

## What is in this folder

- `documents/`, `labels.jsonl`, `manifest.json`: the locked set.
- `AMENDMENTS.md`: where the staged set differs from the spec, as staged and unedited.
- `provenance.json`: the full staging manifest (`MANIFEST.json`), renamed because `manifest.json` is the scorer's file and the two names collide on case-insensitive file systems.
- `prompts/`: every prompt used to write, label and adjudicate.
- `validation/`: agreement, coverage and check statistics.
- `results/`: added by the single scored run, in its own commit.

Not included: the pharmacist review queue, the per-span label provenance, the list of disputed spans (empty, `provenance.json` records 0 disputed items) and the staging work folders.
