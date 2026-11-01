#!/usr/bin/env python3
"""Verify pinned excerpts offline, or reproduce them from official API downloads.

No credentials, scraping, live search or generated replacement data.
"""
import argparse
import hashlib
import html
import json
import re
import time
import unicodedata
import urllib.request
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
MANIFEST = Path(__file__).with_name('manifest.json')
ALLOWED_LICENSES = {'CC-BY-2.0', 'CC-BY-3.0', 'CC-BY-4.0', 'CC0-1.0'}


def sha(data):
    return hashlib.sha256(data).hexdigest()


def normalized(text):
    return unicodedata.normalize('NFC', text).replace('\r\n', '\n').replace('\r', '\n')


def extract(doc, raw):
    if sha(raw) != doc['retrievedSha256']:
        raise ValueError(f"Upstream bytes changed for {doc['id']}. Review a new snapshot explicitly.")
    if doc['source'] == 'PMC':
        if doc['license'] not in ALLOWED_LICENSES:
            raise ValueError('PMC license outside allowlist')
        root = ET.fromstring(raw)
        if root.get('article-type') not in ('case-report', 'case-study'):
            raise ValueError('Not a case report')
        permissions = root.find('.//permissions')
        if permissions is None or doc['licenseUrl'] not in ET.tostring(permissions, encoding='unicode'):
            raise ValueError('Pinned license absent from article permissions')
        paragraphs = [' '.join(''.join(p.itertext()).split()) for p in root.findall('.//body//p')]
        text = doc['selector']['paragraph']
        if paragraphs.count(text) != 1:
            raise ValueError('Pinned narrative paragraph is absent or ambiguous')
    elif doc['source'] == 'CMS':
        data = json.loads(raw)['data'][0]
        text = html.unescape(data[doc['selector']['jsonField']])
        text = html.unescape(re.sub('<[^>]+>', ' ', text))
        text = ' '.join(text.split())
    else:
        raise ValueError('Source not cleared for this snapshot')
    return (normalized(text) + '\n').encode()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--online', action='store_true', help='download pinned official API files and verify extraction in memory')
    args = parser.parse_args()
    manifest = json.loads(MANIFEST.read_text())
    for doc in manifest['documents']:
        path = ROOT / doc['file']
        if path.parent != ROOT / 'data/public/text':
            raise ValueError('Unexpected fixture path')
        committed = path.read_bytes()
        if sha(committed) != doc['sha256']:
            raise ValueError(f"Fixture hash mismatch: {doc['id']}")
        if committed != (normalized(committed.decode()).rstrip('\n') + '\n').encode():
            raise ValueError('Fixture does not use canonical NFC, LF and one final newline')
        if args.online:
            url = doc['fetchUrl']
            prefixes = ('https://pmc-oa-opendata.s3.amazonaws.com/', 'https://api.coverage.cms.gov/v1/data/ncd/?')
            if not url.startswith(prefixes):
                raise ValueError('Unapproved retrieval URL')
            request = urllib.request.Request(url, headers={'User-Agent': 'pii-redaction-gate-public-corpus/1.0'})
            with urllib.request.urlopen(request, timeout=45) as response:
                raw = response.read()
            if extract(doc, raw) != committed:
                raise ValueError(f"Extraction mismatch: {doc['id']}")
            time.sleep(0.35)
        print(f"verified {doc['id']} {doc['sha256']}")


if __name__ == '__main__':
    main()
