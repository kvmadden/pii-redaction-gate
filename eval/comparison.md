# Before and after evaluation

Baseline: origin/main 91c4e16. Empty people map, identifiers profile. Original labels and published results unchanged. Held-out seed 20261031 was committed before tuning. Ages under 90 in the original set remain labeled identifiers, so original recall penalizes their intentional retention.

Full removal requires every labeled letter and digit removed. Precision counts emitted spans overlapping gold. Family precision groups relatives and facilities with names, DOB with dates, all labeled ID kinds with IDs, and fax with phone. A span overlapping multiple families counts once per family. False positives are attributed by emitted token. This is not exact-boundary precision. Detailed typed recall, every miss, damaged negative and false positive are in comparison.json.

## original

| Measure | Before | After |
|---|---|---|
| entityRecall | 70.5% | 90.3% |
| spanPrecision | 82.6% | 97.0% |
| charPrecision | 85.2% | 96.0% |
| hardNegativesKept | 88.1% | 98.2% |

| Gold type | Count | Recall before | Recall after |
|---|---|---|---|
| NAME | 51 | 84.3% | 90.2% |
| DOB | 11 | 90.9% | 100.0% |
| ID | 19 | 68.4% | 89.5% |
| FACILITY | 21 | 95.2% | 100.0% |
| DATE | 25 | 0.0% | 100.0% |
| AGE | 14 | 0.0% | 7.1% |
| RELATIVE | 26 | 80.8% | 100.0% |
| PHONE | 19 | 100.0% | 100.0% |
| ADDRESS | 13 | 92.3% | 100.0% |
| EMAIL | 8 | 100.0% | 100.0% |

| Precision family | Before | After |
|---|---|---|
| NAME | 74.0% | 95.3% |
| DATE | 100.0% | 97.3% |
| ID | 100.0% | 100.0% |
| PHONE | 100.0% | 100.0% |
| ADDRESS | 100.0% | 100.0% |
| EMAIL | 100.0% | 100.0% |
| AGE | n/a | 100.0% |

### After misses

| Snippet | Type | Value | Status |
|---|---|---|---|
| c002 | AGE | 72 | missed |
| c009 | AGE | 54 | missed |
| c014 | AGE | 81 | missed |
| c033 | AGE | 67 | missed |
| c047 | AGE | 82 | missed |
| c056 | AGE | 45 | missed |
| c065 | AGE | 3 | missed |
| c072 | AGE | 88 | missed |
| c077 | AGE | 86 | missed |
| c082 | AGE | 47 | missed |
| m002 | NAME | Omar | missed |
| m012 | AGE | 68 | missed |
| m013 | ID | 4500 1123 9987 | missed |
| m013 | ID | 77821 | missed |
| m024 | AGE | 101 | missed |
| m028 | NAME | tanya | missed |
| m030 | AGE | 79 | missed |
| g007 | NAME | June Park | partial |
| g017 | NAME | Carlos | missed |
| g018 | NAME | Fatima | missed |

### After false positives

| Snippet | Token | Removed |
|---|---|---|
| c053 | name | West |
| c080 | name | Twin |
| g015 | date | 2025-03-01 |
| g022 | name | Finance Reports |
| n030 | name | Social |
| n037 | name | Systems |

## heldout

| Measure | Before | After |
|---|---|---|
| entityRecall | 25.9% | 96.3% |
| spanPrecision | 66.7% | 96.4% |
| charPrecision | 57.5% | 96.1% |
| hardNegativesKept | 84.2% | 100.0% |

| Gold type | Count | Recall before | Recall after |
|---|---|---|---|
| NAME | 12 | 66.7% | 100.0% |
| DATE | 16 | 0.0% | 100.0% |
| DOB | 4 | 100.0% | 100.0% |
| AGE_OVER_89 | 8 | 0.0% | 100.0% |
| PHONE | 4 | 0.0% | 100.0% |
| FAX | 4 | 100.0% | 100.0% |
| EMAIL | 4 | 100.0% | 100.0% |
| MRN | 4 | 0.0% | 100.0% |
| ACCOUNT | 4 | 0.0% | 100.0% |
| PLAN | 4 | 0.0% | 100.0% |
| ADDRESS | 16 | 25.0% | 100.0% |
| SSN | 4 | 100.0% | 100.0% |
| DEVICE | 4 | 0.0% | 100.0% |
| LICENSE | 4 | 0.0% | 100.0% |
| VEHICLE | 4 | 0.0% | 100.0% |
| URL | 4 | 0.0% | 100.0% |
| IP | 8 | 0.0% | 50.0% |

| Precision family | Before | After |
|---|---|---|
| NAME | 30.8% | 100.0% |
| DATE | 100.0% | 100.0% |
| PHONE | 100.0% | 100.0% |
| EMAIL | 100.0% | 100.0% |
| ADDRESS | 100.0% | 80.0% |
| SSN | 100.0% | 100.0% |
| AGE | n/a | 100.0% |
| ID | n/a | 100.0% |
| URL | n/a | 100.0% |
| IP | n/a | 100.0% |

### After misses

| Snippet | Type | Value | Status |
|---|---|---|---|
| h26 | IP | 192.0.2.87 | missed |
| h53 | IP | 192.0.2.87 | missed |
| h80 | IP | 192.0.2.87 | missed |
| h107 | IP | 192.0.2.87 | missed |

### After false positives

| Snippet | Token | Removed |
|---|---|---|
| h19 | address | 90000 |
| h46 | address | 90000 |
| h73 | address | 90000 |
| h100 | address | 90000 |
