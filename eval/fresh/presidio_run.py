#!/usr/bin/env python3
"""Run Microsoft Presidio over a set folder, offline, for eval/fresh/score.mjs.

    <venv>/bin/python eval/fresh/presidio_run.py <set-dir> <out.json>

Presidio runs with its defaults: AnalyzerEngine() with the default English
recognizers and spaCy en_core_web_lg, every entity it finds, no score
threshold. The one change from a plain install: the email recognizer's
public-suffix lookup (tldextract) uses the snapshot bundled with tldextract
instead of fetching the current list from the internet, so the run needs no
network and gives the same answer on any day.

Each found entity is replaced with "[presidio-<entity type>]" so the scorer can
align the output to the input. The output file records the versions of every
package that matters and, per document, the SHA-256 of the input it was made
from. Python 3.9 compatible. The document text is never printed.
"""

import hashlib
import importlib.metadata as md
import json
import os
import platform
import sys

os.environ.setdefault("HF_HUB_OFFLINE", "1")
os.environ.setdefault("TRANSFORMERS_OFFLINE", "1")

import tldextract  # noqa: E402

_offline_extract = tldextract.TLDExtract(suffix_list_urls=(), cache_dir=None)
tldextract.extract = _offline_extract

from presidio_analyzer import AnalyzerEngine  # noqa: E402
from presidio_anonymizer import AnonymizerEngine  # noqa: E402
from presidio_anonymizer.entities import OperatorConfig  # noqa: E402

PACKAGES = ["presidio-analyzer", "presidio-anonymizer", "spacy", "en-core-web-lg", "tldextract", "phonenumbers"]


def token(entity_type):
    return "[presidio-" + entity_type.lower().replace("_", "-") + "]"


def main(set_dir, out_path):
    analyzer = AnalyzerEngine()
    anonymizer = AnonymizerEngine()
    docs_dir = os.path.join(set_dir, "documents")
    outputs = {}
    for name in sorted(os.listdir(docs_dir)):
        if not name.endswith(".txt") or name.startswith("."):
            continue
        with open(os.path.join(docs_dir, name), "rb") as f:
            raw = f.read()
        text = raw.decode("utf-8")
        results = analyzer.analyze(text=text, language="en")
        operators = {r.entity_type: OperatorConfig("replace", {"new_value": token(r.entity_type)}) for r in results}
        anonymized = anonymizer.anonymize(text=text, analyzer_results=results, operators=operators) if results else None
        outputs[name[:-4]] = {
            "input_sha256": hashlib.sha256(raw).hexdigest(),
            "text": anonymized.text if anonymized else text,
            "entities": sorted({r.entity_type for r in results}),
        }
    versions = {p: md.version(p) for p in PACKAGES}
    versions["python"] = platform.python_version()
    engine = {
        "name": "presidio",
        "versions": versions,
        "config": "AnalyzerEngine() defaults: default English recognizers, spaCy en_core_web_lg, language en, no score threshold. AnonymizerEngine replace with [presidio-<type>]. tldextract uses its bundled public suffix snapshot.",
        "recognizers": sorted({r.name for r in analyzer.get_recognizers(language="en")}),
    }
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump({"engine": engine, "outputs": outputs}, f, ensure_ascii=False, indent=1)
        f.write("\n")


if __name__ == "__main__":
    if len(sys.argv) != 3:
        sys.stderr.write("usage: presidio_run.py <set-dir> <out.json>\n")
        sys.exit(1)
    main(sys.argv[1], sys.argv[2])
