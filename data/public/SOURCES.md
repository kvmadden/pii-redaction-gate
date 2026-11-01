# Public text sources

This acquisition snapshot is preparation for Sets B and C. Evaluation and inspector integration are not complete. No public-text score is reported. The existing frozen synthetic results are unchanged.

Retrieved on 2026-11-01. Corpus rights are separate from the repository MIT license. Case-report excerpts use the explicit CC BY license in each article. NLM supplies the article datasets and does not endorse this project. This pinned historical snapshot does not claim to be the latest source version.

PMC retired the legacy OA Web Service in August 2026. Downloads use its official anonymous PMC Cloud Service replacement, documented at https://pmc.ncbi.nlm.nih.gov/tools/pmcaws/. No article website is scraped. Discovery used the ESearch API and acceptance required a case-report or case-study article type plus an explicit CC BY license in JATS permissions.

CMS excerpts contain only the CMS-authored general narrative description from a pinned NCD version. They contain no LCD material, CPT descriptions or third-party figures. Historical coverage-policy text is a separate genre, not a clinical-note result or current coverage advice.

VAERS is deferred because the official archive requires a CAPTCHA. No challenge was bypassed. MIMIC, n2c2, i2b2 and MTSamples are excluded. No data use agreement sources are used.

## Reproduction

Run `python3 data/public/fetch.py` to verify every committed excerpt offline. Run `python3 data/public/fetch.py --online` to download the exact official source files into memory, verify retrieved sha256, reproduce the selected paragraph or NCD field and compare it with the committed fixture. Upstream changes fail explicitly. Neither command updates fixtures, dates, hashes or results. No temporary directories are created.

Whitespace within the chosen source paragraph is collapsed to single spaces, Unicode uses NFC, line endings use LF and files end with one newline. Source XML or JSON is not redistributed. The manifest pins its hash and extraction selector. No clinical text has yet been planted or redacted. Each document and all future variants belong to its one recorded dev or heldout partition.

## Review state

Automated screening excluded paragraphs with obvious contact URLs, emails, named hospitals, universities or clinics. This is not an identifier audit. Every included excerpt remains draft, pending pharmacist review for residual identifiers, clinical keep and remove spans, extraction labels and third-party notices. Any likely real direct identifier found during review requires exclusion without repeating the identifier in the exclusion log. Clinician and facility names in narrative text will be treated as identifiers, separately from bibliographic attribution. No re-identification lookup is performed.

## Included documents

### pmc-13720331

- Source: PMC / PMC13720331
- Original: https://pmc.ncbi.nlm.nih.gov/articles/PMC13720331/
- Official download: https://pmc-oa-opendata.s3.amazonaws.com/PMC13720331.1/PMC13720331.1.xml
- Title: Hyperdominant Left Circumflex Artery Challenging Conventional Paradigms and Current Guideline Recommendations: A Comprehensive Literature Review and Case Series
- Attribution: Amirmahdi Mohammadi, Mohammad Sadegh‐Vashveshady. Hyperdominant Left Circumflex Artery Challenging Conventional Paradigms and Current Guideline Recommendations: A Comprehensive Literature Review and Case Series. Wiley. © 2026 The Author(s). Clinical Case Reports published by John Wiley & Sons Ltd.
- Retrieval date: 2026-11-01
- Genre: case report
- Partition: dev
- License: CC-BY-4.0 / https://creativecommons.org/licenses/by/4.0/
- Required notice: © 2026 The Author(s). Clinical Case Reports published by John Wiley & Sons Ltd.
- Retrieved sha256: `1814e2cc62c5e5d7d52c41cce003b45c5ba7e9c6733e7ac22b8a1e6e357fdfc9`
- Excerpt: `data/public/text/pmc-13720331.txt`
- Excerpt sha256: `7a0489b5673000bcb94984a0739d9034b43839143f1f2677261e707c3754446e`

### pmc-13720340

- Source: PMC / PMC13720340
- Original: https://pmc.ncbi.nlm.nih.gov/articles/PMC13720340/
- Official download: https://pmc-oa-opendata.s3.amazonaws.com/PMC13720340.1/PMC13720340.1.xml
- Title: Adipsic Hypernatremia Complicated by Hyperosmolar Hyperglycemic State and Extensive Venous Thromboembolism After Traumatic Brain Injury: A Case Report
- Attribution: Mahshad Ghoddusi, Khashayar Shahverdi, Negar Zareshahi, Zahra Shafizadeh, Mohammad Taghi Talebian, Amir Shokri, Fatemeh Afra. Adipsic Hypernatremia Complicated by Hyperosmolar Hyperglycemic State and Extensive Venous Thromboembolism After Traumatic Brain Injury: A Case Report. Wiley. © 2026 The Author(s). Clinical Case Reports published by John Wiley & Sons Ltd.
- Retrieval date: 2026-11-01
- Genre: case report
- Partition: dev
- License: CC-BY-4.0 / https://creativecommons.org/licenses/by/4.0/
- Required notice: © 2026 The Author(s). Clinical Case Reports published by John Wiley & Sons Ltd.
- Retrieved sha256: `f6997685a3bd54d719d07caa7ef2dca16862f919cf251a344463e8c56ea3ff29`
- Excerpt: `data/public/text/pmc-13720340.txt`
- Excerpt sha256: `3484ea749c228fb61cd4cbca52ed89eab39d9fd4752f1a5f21ef946e0582bfc4`

### pmc-13719627

- Source: PMC / PMC13719627
- Original: https://pmc.ncbi.nlm.nih.gov/articles/PMC13719627/
- Official download: https://pmc-oa-opendata.s3.amazonaws.com/PMC13719627.1/PMC13719627.1.xml
- Title: Case report: When encephalitis is not an infection: two cases of autoimmune GFAP astrocytopathy mimicking infectious encephalitis
- Attribution: Gabriela Trojan, Ngoc Hoang Anh Than, Abisha Senthilkumar, Faith Emmanuel, Anna Moniuszko-Malinowska, Piotr Czupryna. Case report: When encephalitis is not an infection: two cases of autoimmune GFAP astrocytopathy mimicking infectious encephalitis. Frontiers Media SA. Copyright © 2026 Trojan, Than, Senthilkumar, Emmanuel, Moniuszko-Malinowska and Czupryna.
- Retrieval date: 2026-11-01
- Genre: case report
- Partition: dev
- License: CC-BY-4.0 / https://creativecommons.org/licenses/by/4.0/
- Required notice: Copyright © 2026 Trojan, Than, Senthilkumar, Emmanuel, Moniuszko-Malinowska and Czupryna.
- Retrieved sha256: `5e2fb8695d7c8aba14811914b77dee9174adcc16fd21a4c96ae6ea9fe953697c`
- Excerpt: `data/public/text/pmc-13719627.txt`
- Excerpt sha256: `841cc657796ad5ea3ae65fc13b1b547ebb88119aefad1acee964e694b05d661b`

### pmc-13719403

- Source: PMC / PMC13719403
- Original: https://pmc.ncbi.nlm.nih.gov/articles/PMC13719403/
- Official download: https://pmc-oa-opendata.s3.amazonaws.com/PMC13719403.1/PMC13719403.1.xml
- Title: Two suspected sequential retinal arterial macroaneurysms in a single eye with secondary nonvascular cystoid macular edema: 5-year follow-up: a case report
- Attribution: Kaiyao Chi, Daoxi Lei, Tong Guo, Xiaoding Shui, Huili Li. Two suspected sequential retinal arterial macroaneurysms in a single eye with secondary nonvascular cystoid macular edema: 5-year follow-up: a case report. Frontiers Media SA. © 2026 Chi, Lei, Guo, Shui and Li.
- Retrieval date: 2026-11-01
- Genre: case report
- Partition: dev
- License: CC-BY-4.0 / https://creativecommons.org/licenses/by/4.0/
- Required notice: © 2026 Chi, Lei, Guo, Shui and Li.
- Retrieved sha256: `09d4d4a317cf44ddb36a3c178b86a6c5c7b58a3c5a17c1949715250dbf0d6898`
- Excerpt: `data/public/text/pmc-13719403.txt`
- Excerpt sha256: `cb6d692c422a5312f7c21693a48b81998985379607f0bc69d63111b10ee974d8`

### pmc-13719311

- Source: PMC / PMC13719311
- Original: https://pmc.ncbi.nlm.nih.gov/articles/PMC13719311/
- Official download: https://pmc-oa-opendata.s3.amazonaws.com/PMC13719311.1/PMC13719311.1.xml
- Title: Intra-aortic Balloon Counterpulsation-Assisted Cardiac Support in the Anesthetic Management of Surgery for Acute Cervical Spine Compression With Severe Coronary Artery Disease in the Prone Position
- Attribution: Priya Motiani, Swathi Mallikarjuna, Murali Chakravarthy, Shafiya Shaikh. Intra-aortic Balloon Counterpulsation-Assisted Cardiac Support in the Anesthetic Management of Surgery for Acute Cervical Spine Compression With Severe Coronary Artery Disease in the Prone Position. Cureus Inc.. Copyright © 2026, Motiani et al.
- Retrieval date: 2026-11-01
- Genre: case report
- Partition: dev
- License: CC-BY-4.0 / https://creativecommons.org/licenses/by/4.0/
- Required notice: Copyright © 2026, Motiani et al.
- Retrieved sha256: `738b7ccc1b8a257f37e8eb560a73c574056e5884498460205e562fb3b50f248c`
- Excerpt: `data/public/text/pmc-13719311.txt`
- Excerpt sha256: `c9a1877a608ae5ca3d42c4db43bfa65ba95135cfe7e6cfdcfee7e878cefbe794`

### pmc-13721425

- Source: PMC / PMC13721425
- Original: https://pmc.ncbi.nlm.nih.gov/articles/PMC13721425/
- Official download: https://pmc-oa-opendata.s3.amazonaws.com/PMC13721425.1/PMC13721425.1.xml
- Title: Cocaine-induced PRES in a previously normotensive patient: a case report and review of literature
- Attribution: Akshayaa Kumar Aggarawal, Aniruddh Shailesh Shringare, Mansoor Gazi. Cocaine-induced PRES in a previously normotensive patient: a case report and review of literature. BMC. © The Author(s) 2026
- Retrieval date: 2026-11-01
- Genre: case report
- Partition: dev
- License: CC-BY-4.0 / https://creativecommons.org/licenses/by/4.0/
- Required notice: © The Author(s) 2026
- Retrieved sha256: `120e1fc39e22c560da7a8c93ac4eb528dde8c31542b40ad58f4b8abc2702b108`
- Excerpt: `data/public/text/pmc-13721425.txt`
- Excerpt sha256: `4583a21886bea467f867deb69c8600fbc4a57b84e6756cbf3a435b0078d6433a`

### pmc-13721315

- Source: PMC / PMC13721315
- Original: https://pmc.ncbi.nlm.nih.gov/articles/PMC13721315/
- Official download: https://pmc-oa-opendata.s3.amazonaws.com/PMC13721315.1/PMC13721315.1.xml
- Title: Tazemetostat combined PD-1 inhibitor achieving prolonged survival in primary proximal epithelioid sarcoma: a case report and review of the literature
- Attribution: Wei Li, Chenlu Zhang, Yang You, Xi Guo, Rongkui Luo, Yuhong Zhou. Tazemetostat combined PD-1 inhibitor achieving prolonged survival in primary proximal epithelioid sarcoma: a case report and review of the literature. BMC. © The Author(s) 2026
- Retrieval date: 2026-11-01
- Genre: case report
- Partition: heldout
- License: CC-BY-4.0 / https://creativecommons.org/licenses/by/4.0/
- Required notice: © The Author(s) 2026
- Retrieved sha256: `db0ef4033872c4dea32e43d917ee9c9b065eb2e5c3a7cb09c344586620d35d27`
- Excerpt: `data/public/text/pmc-13721315.txt`
- Excerpt sha256: `6629f928aa5f6f320d279ffcce6217011836a5056ec151f31f9b67fbda52de74`

### pmc-13721448

- Source: PMC / PMC13721448
- Original: https://pmc.ncbi.nlm.nih.gov/articles/PMC13721448/
- Official download: https://pmc-oa-opendata.s3.amazonaws.com/PMC13721448.1/PMC13721448.1.xml
- Title: Congenital fibrovascular pupillary membrane with secondary glaucoma and associated fundus anomalies: a case report and literature review
- Attribution: Yanyan Cheng, Ying Yang, Lihui Yin, Mingyu Ren, Juan Yin, Congying Wang, Yi Gao. Congenital fibrovascular pupillary membrane with secondary glaucoma and associated fundus anomalies: a case report and literature review. BMC. © The Author(s) 2026
- Retrieval date: 2026-11-01
- Genre: case report
- Partition: heldout
- License: CC-BY-4.0 / https://creativecommons.org/licenses/by/4.0/
- Required notice: © The Author(s) 2026
- Retrieved sha256: `daee889fffae5c609fa1190b804d0170321b2a814638faf20db3218ccb1b976e`
- Excerpt: `data/public/text/pmc-13721448.txt`
- Excerpt sha256: `a11942e435fabdfdee715a1711092e459ae01bc607ae7adf5c4f81659e5917be`

### pmc-13721443

- Source: PMC / PMC13721443
- Original: https://pmc.ncbi.nlm.nih.gov/articles/PMC13721443/
- Official download: https://pmc-oa-opendata.s3.amazonaws.com/PMC13721443.1/PMC13721443.1.xml
- Title: Membranous obliterans bronchitis after hematopoietic stem cell transplantation: case report
- Attribution: Weiquan Pan, Yang Li, Changjin Wei, Zhiyi He, Jianming Luo, Guopeng Liao, Lingyun Chen, Meihua Li. Membranous obliterans bronchitis after hematopoietic stem cell transplantation: case report. BMC. © The Author(s) 2026
- Retrieval date: 2026-11-01
- Genre: case report
- Partition: heldout
- License: CC-BY-4.0 / https://creativecommons.org/licenses/by/4.0/
- Required notice: © The Author(s) 2026
- Retrieved sha256: `637a38e557c1b538a8169a7068a4e1a83fa44e8a0b502cda64b7a518b762d869`
- Excerpt: `data/public/text/pmc-13721443.txt`
- Excerpt sha256: `1af8c41a1cd1e375387ed738ddc3d3b0457ee408cbce5b34cf6e1f809f9961bd`

### pmc-13722120

- Source: PMC / PMC13722120
- Original: https://pmc.ncbi.nlm.nih.gov/articles/PMC13722120/
- Official download: https://pmc-oa-opendata.s3.amazonaws.com/PMC13722120.1/PMC13722120.1.xml
- Title: Surgical management of cecal volvulus using endoscopic reduction as a bridge to elective laparoscopic surgery: a three-case series
- Attribution: Kaita Suzuki, Koshiro Harata, Ryo Taguchi, Rena Saito, Nobuaki Kagohashi, Ryosuke Niwamoto, Motoki Futamata, Tsuyoshi Saito, Shuji Koide, Takeyasu Katada, Futoshi Teranishi, Shuji Takiguchi. Surgical management of cecal volvulus using endoscopic reduction as a bridge to elective laparoscopic surgery: a three-case series. Oxford University Press. © The Author(s) 2026. Published by Oxford University Press and JSCR Publishing Ltd.
- Retrieval date: 2026-11-01
- Genre: case report
- Partition: heldout
- License: CC-BY-4.0 / https://creativecommons.org/licenses/by/4.0/
- Required notice: © The Author(s) 2026. Published by Oxford University Press and JSCR Publishing Ltd.
- Retrieved sha256: `0d4535421719aa67461ccee54338511582d4bb98b05b365b1e48a43c6def8b47`
- Excerpt: `data/public/text/pmc-13722120.txt`
- Excerpt sha256: `fb3f9637b66a75a59549cc9a99a5f5b1b2a1908d5b78e9a2ceb43cb7b0f20283`

### pmc-13722112

- Source: PMC / PMC13722112
- Original: https://pmc.ncbi.nlm.nih.gov/articles/PMC13722112/
- Official download: https://pmc-oa-opendata.s3.amazonaws.com/PMC13722112.1/PMC13722112.1.xml
- Title: Joint-preserving reconstruction of an acute Type IV reverse Hill–Sachs lesion following posterior shoulder fracture-dislocation: a case report
- Attribution: Matteo Vitali, Filippo Montalbano, Vincenzo Salini. Joint-preserving reconstruction of an acute Type IV reverse Hill–Sachs lesion following posterior shoulder fracture-dislocation: a case report. Oxford University Press. © The Author(s) 2026. Published by Oxford University Press and JSCR Publishing Ltd.
- Retrieval date: 2026-11-01
- Genre: case report
- Partition: heldout
- License: CC-BY-4.0 / https://creativecommons.org/licenses/by/4.0/
- Required notice: © The Author(s) 2026. Published by Oxford University Press and JSCR Publishing Ltd.
- Retrieved sha256: `eb70daad6b787a7b3d89e48bf3986d0150efdea47eb76f608151175d42e616fe`
- Excerpt: `data/public/text/pmc-13722112.txt`
- Excerpt sha256: `922ff0403ed4b2d7816ab31b5e66c35afaf80390f7d4cddc3bdbb8677eb37221`

### pmc-13722088

- Source: PMC / PMC13722088
- Original: https://pmc.ncbi.nlm.nih.gov/articles/PMC13722088/
- Official download: https://pmc-oa-opendata.s3.amazonaws.com/PMC13722088.1/PMC13722088.1.xml
- Title: Prenatal Diagnosis and Perinatal Management of Acrania Progressing to Anencephaly
- Attribution: Cesar Alas-Pineda, Oswaldo Montes Bardales, Anahi Pacheco, Sendy Ruiz, Elijah J Remis, Simmons Gough. Prenatal Diagnosis and Perinatal Management of Acrania Progressing to Anencephaly. Cureus Inc.. Copyright © 2026, Alas-Pineda et al.
- Retrieval date: 2026-11-01
- Genre: case report
- Partition: heldout
- License: CC-BY-4.0 / https://creativecommons.org/licenses/by/4.0/
- Required notice: Copyright © 2026, Alas-Pineda et al.
- Retrieved sha256: `057a76a172132ad0f20a984d2ab0703578ce3465f0bf13e79a9138f78fb1cb7e`
- Excerpt: `data/public/text/pmc-13722088.txt`
- Excerpt sha256: `6c50ddfe104556cacf4c21402f8a5da02db380a870028e72dffbd20ce4abcb3a`

### pmc-13720603

- Source: PMC / PMC13720603
- Original: https://pmc.ncbi.nlm.nih.gov/articles/PMC13720603/
- Official download: https://pmc-oa-opendata.s3.amazonaws.com/PMC13720603.1/PMC13720603.1.xml
- Title: Recognizing a duplicated inferior vena cava during radical nephrectomy for papillary renal cell carcinoma: A case report
- Attribution: Muhammad Wajid Siddique, Muhammad Waqas, Muhammad Hanzla Shahzad, Muhammad Hassaan Javaid, Nazila Dalir. Recognizing a duplicated inferior vena cava during radical nephrectomy for papillary renal cell carcinoma: A case report. Elsevier. © 2026 The Authors
- Retrieval date: 2026-11-01
- Genre: case report
- Partition: heldout
- License: CC-BY-4.0 / https://creativecommons.org/licenses/by/4.0/
- Required notice: © 2026 The Authors
- Retrieved sha256: `ef35ceb0339f5eba29bfa6f62cf651ee43c370f51f2488250bf715ce1da34691`
- Excerpt: `data/public/text/pmc-13720603.txt`
- Excerpt sha256: `96baeab6a0b9d7a6278e87994a2cb2af48feea43e6e53de83ccf074c6f890df0`

### pmc-13720511

- Source: PMC / PMC13720511
- Original: https://pmc.ncbi.nlm.nih.gov/articles/PMC13720511/
- Official download: https://pmc-oa-opendata.s3.amazonaws.com/PMC13720511.1/PMC13720511.1.xml
- Title: Nd:YAG Laser for Effective Treatment of Subhyaloid and Sub–Internal Limiting Membrane Hemorrhages Secondary to Valsalva Retinopathy: A Case Series
- Attribution: Yong Zheng Wai, Kar Yong Chong, Elicia Tze Zhing Chieng, Nurhayati Abdul Kadir, Lik Thai Lim, Wai Seng Chiang. Nd:YAG Laser for Effective Treatment of Subhyaloid and Sub–Internal Limiting Membrane Hemorrhages Secondary to Valsalva Retinopathy: A Case Series. Wiley. Copyright © 2026 Yong Zheng Wai et al. Case Reports in Ophthalmological Medicine published by John Wiley & Sons Ltd.
- Retrieval date: 2026-11-01
- Genre: case report
- Partition: heldout
- License: CC-BY-4.0 / https://creativecommons.org/licenses/by/4.0/
- Required notice: Copyright © 2026 Yong Zheng Wai et al. Case Reports in Ophthalmological Medicine published by John Wiley & Sons Ltd.
- Retrieved sha256: `5a402f9c6d162c2e90122319341aa5317dd14e155e2bff149b262cd29fe71e43`
- Excerpt: `data/public/text/pmc-13720511.txt`
- Excerpt sha256: `ff358c6f5b6cca790fdac6b1bac974c718fe6be0bfdb201015b31cecf34f8e1f`

### pmc-13720756

- Source: PMC / PMC13720756
- Original: https://pmc.ncbi.nlm.nih.gov/articles/PMC13720756/
- Official download: https://pmc-oa-opendata.s3.amazonaws.com/PMC13720756.1/PMC13720756.1.xml
- Title: When Fibrosis Mimics Cancer: A Rare Case of Idiopathic Sclerosing Mesenteritis Presenting as Locally Advanced Colonic Neoplasia
- Attribution: Adelaide Andriani, Daniele Lomiento, Enrica Avezzù Pignatelli di Montecalvo, Amin Titi. When Fibrosis Mimics Cancer: A Rare Case of Idiopathic Sclerosing Mesenteritis Presenting as Locally Advanced Colonic Neoplasia. Wiley. Copyright © 2026 Adelaide Andriani et al. Case Reports in Surgery published by John Wiley & Sons Ltd.
- Retrieval date: 2026-11-01
- Genre: case report
- Partition: heldout
- License: CC-BY-4.0 / https://creativecommons.org/licenses/by/4.0/
- Required notice: Copyright © 2026 Adelaide Andriani et al. Case Reports in Surgery published by John Wiley & Sons Ltd.
- Retrieved sha256: `d1337924c589190bb6bbb0f6c48c64b2834922a0c42a6dcac8ca343f68f81f26`
- Excerpt: `data/public/text/pmc-13720756.txt`
- Excerpt sha256: `3b7ebed4cdcaeee0e4f14ed2f7275315667fcec017b1339a12ec3e4549a0a125`

### pmc-13720755

- Source: PMC / PMC13720755
- Original: https://pmc.ncbi.nlm.nih.gov/articles/PMC13720755/
- Official download: https://pmc-oa-opendata.s3.amazonaws.com/PMC13720755.1/PMC13720755.1.xml
- Title: A Case of Treatment‐Refractory Tumefactive Multiple Sclerosis Mimicking Brain Abscess
- Attribution: Pooja Patel, Henrik Ehrhardt, Daniel Augh, Kant Matsuda, Kanika Sharma. A Case of Treatment‐Refractory Tumefactive Multiple Sclerosis Mimicking Brain Abscess. Wiley. Copyright © 2026 Pooja Patel et al. Case Reports in Neurological Medicine published by John Wiley & Sons Ltd.
- Retrieval date: 2026-11-01
- Genre: case report
- Partition: heldout
- License: CC-BY-4.0 / https://creativecommons.org/licenses/by/4.0/
- Required notice: Copyright © 2026 Pooja Patel et al. Case Reports in Neurological Medicine published by John Wiley & Sons Ltd.
- Retrieved sha256: `b18c71fe694516aaacaa8195c703fee1154816529143c089abc364367c439992`
- Excerpt: `data/public/text/pmc-13720755.txt`
- Excerpt sha256: `5a47f3223384bed9373eb6a49b253dc1d3201b92a5bcaabbe326ef368e17f26b`

### pmc-13720758

- Source: PMC / PMC13720758
- Original: https://pmc.ncbi.nlm.nih.gov/articles/PMC13720758/
- Official download: https://pmc-oa-opendata.s3.amazonaws.com/PMC13720758.1/PMC13720758.1.xml
- Title: Beyond the Gastrointestinal Tract: When Ingestion Turns Into Migration—A Case Series
- Attribution: Yusuf AlSaffar, Rawan Mahdi, Jaffar Alkhuzaie, Mariam Alkooheji. Beyond the Gastrointestinal Tract: When Ingestion Turns Into Migration—A Case Series. Wiley. Copyright © 2026 Yusuf AlSaffar et al. Case Reports in Surgery published by John Wiley & Sons Ltd.
- Retrieval date: 2026-11-01
- Genre: case report
- Partition: heldout
- License: CC-BY-4.0 / https://creativecommons.org/licenses/by/4.0/
- Required notice: Copyright © 2026 Yusuf AlSaffar et al. Case Reports in Surgery published by John Wiley & Sons Ltd.
- Retrieved sha256: `d325b74856b013263e84f61e5b67333dd08af083ec4660b2c06b8e6f50beedf4`
- Excerpt: `data/public/text/pmc-13720758.txt`
- Excerpt sha256: `0adc103c8576c6178e3b757cf36e6609990aecf8f4c8090f21b77e43076b6bfe`

### pmc-13720761

- Source: PMC / PMC13720761
- Original: https://pmc.ncbi.nlm.nih.gov/articles/PMC13720761/
- Official download: https://pmc-oa-opendata.s3.amazonaws.com/PMC13720761.1/PMC13720761.1.xml
- Title: Fistulo‐Jejunostomy for Bilio‐Cutaneous Fistula After Hydatid Cyst Surgery: A Case Report
- Attribution: Kenan Mohsen Sbh, Abdul Ghani Alshalabi. Fistulo‐Jejunostomy for Bilio‐Cutaneous Fistula After Hydatid Cyst Surgery: A Case Report. Wiley. Copyright © 2026 Kenan Mohsen Sbh and Abdul Ghani Alshalabi. Case Reports in Surgery published by John Wiley & Sons Ltd.
- Retrieval date: 2026-11-01
- Genre: case report
- Partition: heldout
- License: CC-BY-4.0 / https://creativecommons.org/licenses/by/4.0/
- Required notice: Copyright © 2026 Kenan Mohsen Sbh and Abdul Ghani Alshalabi. Case Reports in Surgery published by John Wiley & Sons Ltd.
- Retrieved sha256: `0ba5b5470b9f3117cb0b4b75d8ee4768be86521aed0a1671eb933bf384aec49f`
- Excerpt: `data/public/text/pmc-13720761.txt`
- Excerpt sha256: `3221eae00b6adaa9e9b999155958d55a1e44fbe0f76d8e2142ce4adf168f89a3`

### cms-ncd-211-3

- Source: CMS / NCD 220.6 version 3
- Original: https://www.cms.gov/medicare-coverage-database/view/ncd.aspx?ncdid=211&ncdver=3
- Official download: https://api.coverage.cms.gov/v1/data/ncd/?ncdid=211&ncdver=3
- Title: PET Scans
- Attribution: Centers for Medicare & Medicaid Services. PET Scans. Historical NCD version 3.
- Retrieval date: 2026-11-01
- Genre: coverage policy
- Partition: heldout
- License: US-government-work / https://www.cms.gov/about-cms/web-policies-important-links/website-policies
- Required notice: CMS-authored NCD narrative only. No LCD or CPT material. Historical snapshot, not current coverage advice.
- Retrieved sha256: `8c869406c420bc08b54c37783e45aec887dde3f92b62f76960b2cb37f9defe5f`
- Excerpt: `data/public/text/cms-ncd-211-3.txt`
- Excerpt sha256: `0f1c5ea6b58fe159855b974658aae2c5d351b7221f6d8012cee4b424a5e338f8`

### cms-ncd-22-2

- Source: CMS / NCD 160.2 version 2
- Original: https://www.cms.gov/medicare-coverage-database/view/ncd.aspx?ncdid=22&ncdver=2
- Official download: https://api.coverage.cms.gov/v1/data/ncd/?ncdid=22&ncdver=2
- Title: Treatment of Motor Function Disorders with Electric Nerve Stimulation
- Attribution: Centers for Medicare & Medicaid Services. Treatment of Motor Function Disorders with Electric Nerve Stimulation. Historical NCD version 2.
- Retrieval date: 2026-11-01
- Genre: coverage policy
- Partition: dev
- License: US-government-work / https://www.cms.gov/about-cms/web-policies-important-links/website-policies
- Required notice: CMS-authored NCD narrative only. No LCD or CPT material. Historical snapshot, not current coverage advice.
- Retrieved sha256: `10bbf4960154d52cf77071be24dffea471e6f49f77ce021d81f0c6ed720b4ab5`
- Excerpt: `data/public/text/cms-ncd-22-2.txt`
- Excerpt sha256: `f13d923db8a661550329dab5021e320efb980e3f1b2bce880d8c45559c9dbbaa`

## Exclusions and deferrals

- DailyMed: Excluded pending affirmative redistribution rights for manufacturer-authored label text. API access is not a license. No copyright notice in selected indications paragraph, but reuse rights remain unresolved.
  Original: https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=583f2a2e-a9d7-f266-e063-6294a90ad0ab
  Retrieved sha256: `8a464bb856477ae052464f04e20265bdfd7cfc79bbe722d418f5a5d050dc08c0`
- VAERS: Deferred. Official download requires CAPTCHA. No challenge bypassed.

DailyMed content is submitted by companies, as described at https://dailymed.nlm.nih.gov/dailymed/about-dailymed.cfm. The selected metformin indications paragraph had no explicit copyright notice, but that does not establish reuse rights. NLM explains that privately contributed content can retain copyright without a notice at https://www.nlm.nih.gov/web_policies.html#copyright. openFDA also warns that supplied works can retain third-party rights at https://open.fda.gov/terms/. No label text is committed until its rights are resolved.
