# 2024 Lok Sabha Manifestos, Regional & Left Parties: Party Stances on 12 Policy Statements (Manifesto Matcher)

Companion to `manifestos_2024.md` (BJP, INC). Same 12-statement grid, same coding rules.

**Scope.** 2024 Lok Sabha election only. Parties covered: AITC, AAP, NCP(SP), CPI(M), DMK, plus short notes on NCP (Ajit Pawar) and CPI.

## Method and document status

I tried to obtain each party's own manifesto document. Three of five were obtained and read; two were not.

| Party | Own document obtained? | What I used |
|---|---|---|
| AITC | **Yes** | "Didir Shopoth" English PDF, 102 PDF pages, printed page numbers match PDF pages |
| CPI(M) | **Yes** | English PDF, 44 PDF pages, **no printed page numbers** |
| DMK | **Yes** | "2024 General Elections Manifesto" English PDF, 68 pages, printed page numbers match PDF pages |
| AAP | **No** | Not a manifesto. A 10-point oral announcement. News reports only |
| NCP (SP) | **No** | "Shapatnama" document not locatable online. News reports only |

- **Extraction.** I downloaded each PDF and extracted text with `pdftotext -layout`, split on form feeds, and keyword-searched every page. Quotes below are copied from that extraction.
- **Page numbers.** For AITC and DMK the printed page number in the footer equals the PDF page number; I checked this against footers (`MANIFESTO 2024  41`, and `52` on DMK p.52). **The CPI(M) PDF carries no printed page numbers at all**, so every CPI(M) page citation below is a **PDF page number** in the 44-page file. Press coverage describes the CPI(M) manifesto as "64 pages", which is a different pagination from the PDF I read; do not mix the two. I have not invented any page number.
- **"Silent"** means a keyword search of the whole document found no commitment on that statement. I did not infer stances from ideology or from what a party is known for.
- **VERIFIED** = read in the party's own document, page cited. **SECONDARY** = news report only, outlet named.
- Where a party's commitment is close to but not the same as the statement (e.g. a monthly rather than annual cash transfer, or MSP at C2+50% without a *legal* guarantee), I code it and say so in the cell. These are flagged **partial**.

### Document URLs

- **AITC "Didir Shopoth" 2024** — PDF read: https://data.opencity.in/dataset/76e54184-f294-44e4-a40c-8594ccb410c8/resource/628261ee-a164-4760-a475-7a7e10d78d44/download/5e073a4f-f293-4cb0-90f1-bf5847a0015b.pdf (OpenCity's copy, dataset: https://data.opencity.in/dataset/parliamentary-elections-2024-manifestos). I could not retrieve a copy served from aitcofficial.org, so this is a third-party mirror, not a confirmed official upload. See Gaps.
- **CPI(M) 2024** — PDF read: https://data.opencity.in/dataset/76e54184-f294-44e4-a40c-8594ccb410c8/resource/c04b71e0-5941-4684-8b7e-c58cd713081d/download/2bc55e52-18f0-42fa-b228-56e85ec55de5.pdf (OpenCity records the source as cpim.org). Party press statement on the manifesto: https://cpim.org/?p=11104
- **DMK 2024** — PDF read: https://www.scobserver.in/wp-content/uploads/2024/04/2024-DMK-Election-Manifesto-English.pdf. This file is **byte-identical** (same MD5, `0758803e0637e7d817f4fa7a56a07f85`) to OpenCity's copy at https://data.opencity.in/dataset/76e54184-f294-44e4-a40c-8594ccb410c8/resource/c86a0519-1a32-407c-8381-41659734f9a2/download/a7964b61-ee79-4f84-9e1b-e3e28be52e04.pdf, which gives two independent hosts for the same document.

## Summary table

Legend: **S** = supports, **O** = opposes, **—** = silent, **?** = not determinable. Bold = VERIFIED in the party's own document. Plain = SECONDARY (news report).

| # | Statement (neutral) | AITC | AAP | NCP (SP) | CPI(M) | DMK |
|---|---|---|---|---|---|---|
| 1 | MSP for crops should be guaranteed by law | **S** (p.33) | S *partial* — MSP per Swaminathan, "legal" not reported | ? | **S** (PDF p.21) | **S** *partial* (p.52) — C2+50%, no "legal guarantee" wording |
| 2 | Lok Sabha and state assembly elections should be held at the same time (One Nation One Election) | **O** (p.14) | — | O | **—** | **O** (p.27) |
| 3 | India should adopt a Uniform Civil Code | **O** (p.7, 71, 74) | — | ? | **O** *critique only* (PDF p.2) | **O** (p.27, 41) |
| 4 | A nationwide caste census should be conducted | **—** | — | S | **S** (PDF p.9, 32) | **S** (p.45) |
| 5 | The Agnipath military recruitment scheme should be scrapped | **S** (p.57) | S | S | **S** *critique only* (PDF p.7) | **S** (p.53) |
| 6 | Women's reservation should start without waiting for a new census and delimitation | **—** (33% in WB assembly only, p.61) | — | — (50% women's quota in *jobs*) | **S** (PDF p.13, 30) | **S** (p.28) |
| 7 | Strict legal action against exam paper leaks | **S** (p.41) | — | — | **—** | **—** |
| 8 | Poor households should get free electricity | **—** (electricity as a "basic amenity", p.21) | S (200 free units for the poor) | — | **—** (subsidised, not free, PDF p.19) | **—** |
| 9 | Poor families should get a direct annual cash transfer to a woman of the household | **S** *partial* (p.62) — ₹1,000/mo to **all** women | — | ? (endorses Congress's five *nyay*) | **—** | **S** *partial* (p.24) — ₹1,000/mo to **all** women |
| 10 | The GST system should be restructured | **S** (p.14, 22) | S ("GST will be simplified") | S (GST with a "human face") | **S** (PDF p.16) | **S** (p.48) |
| 11 | Full statehood should be restored to Jammu & Kashmir | **—** | — (Delhi statehood, not J&K) | S | **S** (PDF p.11) | **S** (p.27) |
| 12 | Young graduates should have a legal right to a paid apprenticeship | **S** *partial* (p.68) — guaranteed, "legal right" not stated | — | S ("right to apprenticeship") | **—** | **—** |

**Quiz-design note.** Statement 7 (paper leaks) and statement 8 (free electricity) discriminate poorly across this set: four of five are silent on 7, and four of five are silent on 8. Statement 2 is the cleanest four-way opposition signal. Statements 10 and 11 are near-unanimous among those that speak and so carry little matching information within this group, though they do separate these parties from the BJP (see `manifestos_2024.md`).

---

## AITC / All India Trinamool Congress — "Didir Shopoth" (released 17 April 2024)

**Status: VERIFIED.** All codings below were read in the manifesto PDF. Page numbers are printed page numbers, which match PDF pages.

### Takeaway
The TMC manifesto is the most complete of the five on this grid. It explicitly supports a legal MSP guarantee, rejects One Nation One Election and UCC, pledges an anti-paper-leak bill, a nationwide monthly cash transfer to women, GST overhaul and guaranteed one-year apprenticeships. It is silent on a caste census, on J&K statehood, on free electricity, and on the census/delimitation question in women's reservation. The document is organised in paired "For Bengal" / "For India" sections, which matters: several pledges (33% women's reservation, MAA canteens) are West Bengal-only and should not be coded as national positions.

### Cited findings
- **1. MSP (Supports) — VERIFIED p.33.** "We will set up an Expert Committee to assess the cost of production for major crops in various regions and, based on its recommendations, introduce a bill in Parliament that legally mandates an MSP at least 50% higher than the average cost of production of all such crops." Summary page p.6: "As per the recommendations of the Swaminathan Commission, MSP will be legally guaranteed to India's farmers, set at least 50% higher…" Also p.31 (key goal), p.32 (criticises BJP for failing "to guarantee a legal status to MSP").
- **2. One Nation One Election (Opposes) — VERIFIED p.14.** "We will not accept the `One Nation One Election' proposal."
- **3. UCC (Opposes) — VERIFIED p.74.** "The Uniform Civil Code will not be implemented. TMC will firmly endeavour to preserve the secular nature of India, as per the Constitution." Also p.7 and p.71: "Uniform Civil Code (UCC) will not be implemented across India".
- **4. Caste census (Silent) — VERIFIED.** No match for "caste census" anywhere in the document. The manifesto does commit to a census, but a **population** census only: "The next round of India's decadal population census will be conducted. TMC will ensure the conduct of the country's population census, which has not happened since 2011." (p.14); "We will plan and conduct the next round of India's demographic census expediently." (p.15). On OBCs it promises a task force on OBC *status* for unrecognised communities (p.73), not enumeration. **Code as silent, not supports** — the document never asks for caste enumeration.
- **5. Agnipath (Supports scrapping) — VERIFIED p.57.** Listed under things to be scrapped: "The Agnipath scheme. We will restore the Indian Armed Forces' traditional recruitment mechanisms." Context at p.56: "The Union Government's ill-conceived and thoughtless Agnipath scheme has undermined the professionalism of the Indian armed forces and jeopardised the future of countless youth".
- **6. Women's reservation without census/delimitation (Silent) — VERIFIED.** The only reservation pledge is state-level and says nothing about the census or delimitation linkage: "We will formally adopt 33% reservation for women in our state legislative assembly…" (p.61, in the "For Bengal" section). There is no national commitment on the Nari Shakti Vandan Adhiniyam's timing. **Code as silent on this statement.**
- **7. Paper leaks (Supports) — VERIFIED pp.40–41.** p.40: "A policy will be introduced to curb the menace of paper leaks. TMC will end the repeated misconduct in competitive examinations and preserve the future of our youth." p.41: "We will introduce a bill in Parliament to amend the Public Examinations (Prevention of Unfair Means) Bill 2024 with provisions to: • Constitute an independent judicial commission (Union and State level) to oversee the conduct of competitive examinations, end-to-end • Conduct rigorous audits of the various steps that involve third parties, such as printing and transportation of question papers…"
- **8. Free electricity (Silent) — VERIFIED.** No match for "free electricity" or "free power". The nearest item is a poverty-reduction bullet: "Basic amenities; All households will be provided amenities such as a house, electricity, LPG, tap water, etc." (p.21). That promises access, not free supply. The other electricity mentions are electricity-bill rebates for Durga Puja clubs (pp.82–83). **Code as silent.**
- **9. Cash transfer to a woman of the household (Supports, partial) — VERIFIED p.62.** "Learning from the success of Bengal's Lakshmir Bhandar scheme, we will provide all women in India a monthly financial assistance of ₹1,000 (General) and ₹1,200 (SC, ST), which will effectively supplement their annual income by an amount of ₹12,000 and ₹14,400 respectively… This amount will be credited to every woman enrolled via DBT every month". **Two differences from the statement as worded:** it is monthly, not annual, and it goes to *all* women, not only poor households. A separate conditional transfer of ₹1,000/yr goes to girls aged 13–18 who stay in school and unmarried (p.62).
- **10. GST restructuring (Supports) — VERIFIED p.22.** "A comprehensive reform of the GST system will be undertaken. The current GST regime, which has eroded the fiscal autonomy of our states and led to heavy losses, will be reformed into a more equitable instrument of revenue distribution." Also p.14: "We will reform the GST system entirely into a more equitable instrument of revenue distribution."
- **11. J&K statehood (Silent) — VERIFIED.** The document mentions Jammu and Kashmir exactly once, and it is about university teaching vacancies (p.40). No match for "Article 370" or for J&K statehood. **Code as silent.**
- **12. Apprenticeship right (Supports, partial) — VERIFIED p.68.** "…nationwide programme to provide guaranteed 1-year apprenticeships to all diploma holders or college graduates upto the age of 25, with prospects of assured skill growth and future full-time employment for successful apprentices." p.7: "All graduates and diploma holders upto the age of 25 will be provided 1-year apprenticeships… A monthly stipend will be provided to help apprentices support themselves economically." It is universal and paid but the document does not use the words "legal right" or promise a statute, unlike the INC's "Right to Apprenticeship". Coded supports, flagged partial.

### Gaps
- The PDF I read is OpenCity's copy, filename `aitc-ge-2024-manifesto_english.pdf`. I could not retrieve a copy served from aitcofficial.org to confirm it byte-for-byte against the party's own upload. Content matches press descriptions of the manifesto (CAA repeal, NRC discontinued, UCC not implemented, ₹10 lakh health cover, ₹1,000 old-age pension), so I am confident it is the right document, but the provenance is one step removed.

---

## AAP / Aam Aadmi Party — "Kejriwal ki Guarantee" (announced 12 May 2024)

**Status: SECONDARY ONLY. And an important caveat about what this document is.**

> **AAP did not release a 2024 Lok Sabha manifesto.** What exists is a short list of ten guarantees that Arvind Kejriwal announced orally at a press conference in Delhi on 12 May 2024, framed as what he would press the INDIA bloc to do if it formed the government at the Centre. It is roughly ten sentences, not a policy document. It has no pages, no sections, and no detail. Kejriwal said he had not discussed the list with his INDIA bloc partners.
>
> **Consequence for the quiz: AAP is silent on 8 of the 12 statements, and that silence is an artefact of the format, not evidence of a position.** A ten-point list cannot be compared like-for-like with a 64- or 102-page manifesto. If the quiz scores "silent" as a mismatch, AAP will be penalised for not having written a manifesto. The AAP row should carry a visible note to the user, or AAP should be scored only on the four statements it actually touches.

I could not find an AAP-hosted text of the ten guarantees. I searched aamaadmiparty.org via Wayback Machine CDX for May–June 2024 (the site is overwhelmingly Hindi press releases; no guarantees page surfaced) and found no official PDF or press release page. All codings below are SECONDARY.

### The ten guarantees as reported
Reconstructed from three outlets that each give a near-complete list. They agree on content; they differ slightly on numbering and grouping.

1. 24-hour electricity nationwide, with up to 200 units free for the poor
2. Free, high-quality education; government schools better than private
3. Free healthcare: mohalla clinics, upgraded district hospitals, treatment without insurance
4. Reclaim Indian land occupied by China; full freedom to the Army
5. Withdraw the Agniveer scheme; make existing Agniveer recruits permanent
6. MSP for all crops as per the Swaminathan Commission report
7. Full statehood for Delhi
8. Two crore jobs
9. End corruption / dismantle the BJP's "washing machine"
10. Simplify GST; hassle-free trade and business

Sources: [Business Today, 12 May 2024](https://www.businesstoday.in/india/story/free-power-free-treatment-free-education-kejriwals-10-guarantees-for-lok-sabha-elections-2024-429249-2024-05-12) (numbers 1–10, closest to a numbered list); [Free Press Journal](https://www.freepressjournal.in/india/lok-sabha-elections-2024-delhi-cm-arvind-kejriwal-announces-10-guarantees-check-full-list-here); [The South First](https://thesouthfirst.com/politics/aap-chief-arvind-kejriwal-announces-kejriwal-ki-guarantee-lists-10-promises-if-india-bloc-comes-to-power); [Tribune India](https://www.tribuneindia.com/news/delhi/24x7-free-power-quality-education-2-crore-jobs-arvind-kejriwal-unveils-10-guarantees-620530/amp); [newsonair.gov.in](https://newsonair.gov.in/arvind-kejriwal-announces-ten-poll-guarantees-including-24x7-electricity-giving-statehood-to-delhi).

### Cited findings
- **1. MSP (Supports, partial) — SECONDARY.** Guarantee 6: MSP on all crops per the Swaminathan Commission. Business Today: "Our sixth guarantee is for farmers," based on MSP and the Swaminathan report. **No report uses the words "legal guarantee" or "law".** The statement as worded asks about a *legal* guarantee; AAP's reported promise is MSP at Swaminathan levels. Coded supports-partial. — [Business Today](https://www.businesstoday.in/india/story/free-power-free-treatment-free-education-kejriwals-10-guarantees-for-lok-sabha-elections-2024-429249-2024-05-12)
- **2. One Nation One Election (Silent) — SECONDARY.** Not in the ten guarantees; no report mentions it.
- **3. UCC (Silent) — SECONDARY.** Not in the ten guarantees.
- **4. Caste census (Silent) — SECONDARY.** Not in the ten guarantees.
- **5. Agnipath (Supports scrapping) — SECONDARY.** Guarantee 5: "The Agniveer scheme will be withdrawn," with existing recruits made permanent. — [Business Today](https://www.businesstoday.in/india/story/free-power-free-treatment-free-education-kejriwals-10-guarantees-for-lok-sabha-elections-2024-429249-2024-05-12), [WION](https://www.wionews.com/india-news/kejriwal-ki-10-guarantee-aap-leader-vows-to-end-agniveer-scheme-give-statehood-to-delhi-720607)
- **6. Women's reservation (Silent) — SECONDARY.** Not in the ten guarantees.
- **7. Paper leaks (Silent) — SECONDARY.** Not in the ten guarantees.
- **8. Free electricity (Supports) — SECONDARY.** Guarantee 1: 24-hour electricity nationwide plus "200 units of free electricity to all the poor", costed by Kejriwal at ₹1.25 lakh crore. This is the one statement in the grid where AAP is the clearest of the five. — [Business Today](https://www.businesstoday.in/india/story/free-power-free-treatment-free-education-kejriwals-10-guarantees-for-lok-sabha-elections-2024-429249-2024-05-12), [newsonair.gov.in](https://newsonair.gov.in/arvind-kejriwal-announces-ten-poll-guarantees-including-24x7-electricity-giving-statehood-to-delhi)
- **9. Cash transfer to women (Silent) — SECONDARY.** Not in the ten guarantees.
- **10. GST restructuring (Supports) — SECONDARY.** Guarantee 10: "GST will be simplified," with simpler administrative processes for traders. Free Press Journal renders the same guarantee more loosely as "GST will be ended", with GST removed from the PMLA; Business Today and Deccan Herald render it as simplification and a trader-friendly regime. **The two renderings disagree in substance.** I code it as supports-restructuring on the weight of the Business Today / Deccan Herald / Tribune accounts, and flag the discrepancy. — [Business Today](https://www.businesstoday.in/india/story/free-power-free-treatment-free-education-kejriwals-10-guarantees-for-lok-sabha-elections-2024-429249-2024-05-12); [Free Press Journal](https://www.freepressjournal.in/india/lok-sabha-elections-2024-delhi-cm-arvind-kejriwal-announces-10-guarantees-check-full-list-here); [Deccan Herald](https://www.deccanherald.com/elections/india/lok-sabha-elections-2024-aap-chief-arvind-kejriwal-announces-kejriwal-ki-guarantee-3019149)
- **11. J&K statehood (Silent) — SECONDARY.** Guarantee 7 is full statehood **for Delhi**. No report mentions J&K. **Do not code Delhi statehood as support for J&K statehood** — they are different commitments and a matcher that conflates them will mislead.
- **12. Apprenticeship right (Silent) — SECONDARY.** Not in the ten guarantees. Guarantee 8 is two crore jobs, which is not an apprenticeship right.

### Gaps
- No AAP-hosted text located. If a primary source is needed, the next places to try are AAP's and Kejriwal's X accounts for 12 May 2024, and the full video of that press conference.
- Outlets disagree on guarantee 10 (simplify GST vs. end GST). Worth resolving from the press-conference video before publishing.
- No outlet gives a clean, officially-numbered ten. Business Today's numbering is the most explicit and is what I used.

---

## NCP (Sharadchandra Pawar) / NCP(SP) — "Shapatnama" (released 25 April 2024, Pune)

**Status: SECONDARY ONLY. Document not obtained.**

I could not locate the Shapatnama document in any form: no PDF, no official page, no mirror. Checks run: web search for the document by both spellings ("Shapatnama", "Shapathnama"); Wayback Machine CDX for `ncpsp.org.in` (the only archived capture, 16 Apr 2024, is an unrelated site template, not a party site) and for `sharadpawarspeaks.com` (no captures); OpenCity's 2024 manifestos dataset (contains INC, BJP, CPI(M), AITC, DMK and some constituency manifestos — **no NCP of either faction**). Every coding below is SECONDARY.

The manifesto was released in Pune on 25 April 2024 with Sharad Pawar and Maharashtra NCP(SP) president Jayant Patil present. The party contested 10 seats and won 8.

### Cited findings
All items from the PTI/IANS report as carried by [Siasat](https://www.siasat.com/ncp-sp-unveils-manifesto-favours-caste-census-stresses-on-welfare-of-farmers-women-3014762/) (this host blocks automated requests with HTTP 403; the copy I actually read is the same text at [this Siasat URL](https://www.siasat.com/akhilesh-yadav-files-nomination-from-kannauj-ls-seat-3014811/ncp-sp-unveils-manifesto-favours-caste-census-stresses-on-welfare-of-farmers-women)) and [Deccan Herald](https://www.deccanherald.com/elections/india/lok-sabha-polls-2024-ncp-sp-unveils-manifesto-favours-caste-census-stresses-on-welfare-of-farmers-women-lgbtq-community-2993974), cross-checked against [newsonair.gov.in](https://www.newsonair.gov.in/sharad-pawars-ncp-releases-lok-sabha-poll-manifesto/) (Prasar Bharati) and [Madhyamam](https://madhyamamonline.com/india/ncp-sps-manifesto-out-backs-caste-census-welfare-of-farmers-women-1281475). These are largely the same wire copy, so treat them as one source with three carriers, not three independent confirmations.

- **1. MSP legal guarantee (Not determinable) — SECONDARY.** Reports mention "a separate commission for farmers' welfare" and that the party "supports five 'nyay' (guarantees) of the Congress on farmers, youth, women, labourers and caste census". The Congress *Kisan Nyay* includes a legal MSP guarantee, so an endorsement of it would imply support — but no report states an MSP position directly, and deriving one from the endorsement is exactly the inference the brief asks me not to make. **Coded `?`.**
- **2. One Nation One Election (Opposes) — SECONDARY.** The manifesto "rejects the idea of 'one nation, one election'." — newsonair.gov.in, Deccan Herald, Siasat
- **3. UCC (Not determinable) — SECONDARY.** No report mentions UCC. The reported legal agenda is review of the CAA, NRC and UAPA. **Coded `?`** rather than silent, because I have not seen the document and cannot say it is silent.
- **4. Caste census (Supports) — SECONDARY.** "The party favours caste census". — newsonair.gov.in, Siasat, Deccan Herald
- **5. Agnipath (Supports scrapping) — SECONDARY.** "It also favours scrapping of the Agnipath scheme." — newsonair.gov.in, Siasat
- **6. Women's reservation without census/delimitation (Silent as reported) — SECONDARY.** Reports give "50 per cent reservation for women in jobs", which is employment, not legislatures, and says nothing about census or delimitation. **Do not code this as support for statement 6.**
- **7. Paper leaks (Not reported) — SECONDARY.** No mention in any report.
- **8. Free electricity (Not reported) — SECONDARY.** No mention. Reports do mention "reviewing power distribution", but in context that is distribution of *constitutional powers* between Centre and states, not electricity. Easy to misread — flagging it.
- **9. Cash transfer to a woman of the household (Not determinable) — SECONDARY.** Same problem as statement 1: the party endorses Congress's five *nyay*, one of which (*Nari Nyay*) is the Mahalakshmi ₹1 lakh/year transfer to a woman of every poor family, but no report states the commitment directly. **Coded `?`.**
- **10. GST restructuring (Supports) — SECONDARY, and attributed to a person, not the document.** Jayant Patil, Maharashtra NCP(SP) president, said at the launch that the party would bring a GST regime with a "human face" if it gained power at the Centre, along with keeping LPG at ₹500 and restructuring petrol and diesel taxes. These are reported as his remarks at the launch rather than as text of the Shapatnama. Weaker than the other codings. — [Siasat](https://www.siasat.com/ncp-sp-unveils-manifesto-favours-caste-census-stresses-on-welfare-of-farmers-women-3014762/)
- **11. J&K statehood (Supports) — SECONDARY.** "It supports full statehood for Jammu and Kashmir." — newsonair.gov.in, Siasat, Deccan Herald
- **12. Apprenticeship right (Supports) — SECONDARY.** The manifesto "promises… right to apprenticeship." The word used in the wire copy is "right". Whether the document promises a *legal* right and whether it is *paid* are not reported. — newsonair.gov.in, Siasat

### NCP (Ajit Pawar) — separate manifesto, 23 April 2024
The Ajit Pawar faction, which holds the "NCP" name and symbol and contested in Maharashtra as part of the BJP-led Mahayuti, released its own manifesto on 23 April 2024, two days before the Sharad Pawar faction's. Reported contents: a caste-based census; an MSP guarantee for farmers; 33% reservation for women; 50% concession on rail and metro fares for those over 60; Ayushman Bharat cover for those aged 70+; working women's hostels; classical language status for Marathi; Bharat Ratna for Yashwantrao Chavan; funds for minority students' higher education. The report mentions nothing on One Nation One Election, UCC, Agnipath, paper leaks, free electricity, cash transfers to women, GST, J&K statehood or apprenticeship. Source: [Business Today, 23 Apr 2024](https://www.businesstoday.in/elections/story/maharashtra-lok-sabha-polls-ajit-pawars-ncp-unveils-manifesto-caste-based-census-50-concession-to-senior-citizens-above-60-in-railways-and-metro-among-top-highlights-426572-2024-04-23). I did not obtain this document either. **Note for the quiz:** on caste census and MSP the two NCP factions are reported in the same direction despite being in opposing alliances, so neither is a useful discriminator between them.

### Gaps
- The Shapatnama itself was not obtained. Everything above is one wire story carried by several outlets. Four of the twelve statements are undetermined.
- NCP(SP)'s positions on UCC, MSP and the women's cash transfer could probably be settled by reading the document. Worth asking the party directly, or checking Marathi-language coverage (Loksatta, Sakal, Maharashtra Times) from 25–26 April 2024, which I did not search.

---

## CPI(M) — 2024 manifesto (released 4 April 2024)

**Status: VERIFIED.** Read in full. **All page numbers below are PDF page numbers in a 44-page file; the document carries no printed page numbers.** Press reports describe a "64-page" manifesto, which is a different pagination — do not cite those page numbers against mine.

Released by General Secretary Sitaram Yechury in New Delhi, with Prakash Karat and Brinda Karat present.

### Takeaway
Structurally, the manifesto is in two halves: a long critique of the Modi government's record, then sectioned lists of commitments ("The CPI(M) is committed to:", "The CPI(M) stands for:"). **This distinction matters for coding.** Two statements in our grid — UCC and Agnipath — appear only in the critique half and never in any commitments list. I have coded both as opposing the policy, because the document attacks each in explicit terms, but flagged them as *critique only* so the quiz can decide whether to treat them as pledges. On MSP, caste census, women's reservation, GST and J&K statehood the commitments are explicit and unambiguous. It is silent on One Nation One Election, paper leaks, free electricity, cash transfers to women and apprenticeships.

### Cited findings
- **1. MSP (Supports) — VERIFIED PDF p.21.** "Ensure legal guarantee for the Minimum Support Price (MSP), which will be at least one and a half times the comprehensive cost of production (C2+50 per cent)." Followed by: "Expand the coverage and implementation of the MSPs; increase the number of crops for which MSPs are announced; ensure effective procurement in all states; Increase the number of APMC mandis in India to 10,000 within three years." Also PDF p.5: "food security depends on ensuring security of the farmers of India though a legal guarantee of MSP according to the Swaminathan Commission recommendations"; PDF p.13: "Enforce the farmers right to sell their produce at a Minimum Support Price, which is at least 50 per cent higher than the total cost of production."; PDF p.33 extends MSP to minor forest produce procured by adivasis.
- **2. One Nation One Election (Silent) — VERIFIED.** No match for "One Nation", "One Election" or "simultaneous election". The only hit for "simultaneous" is unrelated (a passage on the NEP, PDF p.7). The manifesto has a substantial electoral-reform section (state funding of elections, electoral bonds, proportional representation, PDF pp.10, 13, 44) but does not address simultaneous elections. **Code as silent.**
- **3. UCC (Opposes — critique only) — VERIFIED PDF p.2.** "BJP state governments have enacted laws aiming to sharpen communal polarization. These range from issues concerning cow and cattle protection, cattle trade and meat selling, the so-called love jihad, Uniform Civil Code etc., which routinely target innocent people from minority communities, physically attacking them and legally prosecuting them." **This is the only mention of UCC in the document.** I read the full "In Defence of Secularism" commitments list (PDF pp.14–15): it covers scrapping the CAA, repealing anti-conversion laws, removing RSS appointees, banning vigilante groups, an anti-lynching law, punishing communal violence, protecting minority rights and purging textbooks — **UCC is not in it.** So the party clearly treats UCC as a communal-polarisation measure, but makes no pledge about it. Coded opposes, flagged critique-only.
- **4. Caste census (Supports) — VERIFIED PDF p.32.** "Immediate conduct of a Caste Census as part of general census." Also PDF p.9: "In order to acquire proper data on the OBCs in the country it is necessary to conduct a caste census along with the 2021 general census that is overdue."
- **5. Agnipath (Supports scrapping — critique only) — VERIFIED PDF p.7.** "Even recruitment in the armed forces - critical for the countrys security are now being contractorised with the cruel 'agniveer' scheme." **This is the only mention of the scheme.** It does not reappear in the commitments lists. I checked the ex-servicemen and security sections (PDF pp.25, 38), which cover OROP, casualty pensions, a commission for ex-servicemen and public-sector defence units, but say nothing about Agnipath. The party's long "scrapping/repealing" list (CAA, UAPA, NSA, AFSPA, NEP 2020, FRBM, PMJAY, DPDP Act and others) does **not** include Agnipath. Coded supports-scrapping on the strength of "cruel", flagged critique-only.
- **6. Women's reservation without census/delimitation (Supports) — VERIFIED PDF p.13 and p.30.** p.13: "Immediately implement the legislation for one-third reservation for women in Parliament and state assemblies without linking it to census and delimitation; take comprehensive steps to end violence against women and children." p.30: "Implementing 33 per cent reservation for women in Parliament and state assemblies immediately without linking it to census and delimitation." Critique at p.9: "The Modi government has betrayed women by linking the womens reservation law with that of the census and delimitation, postponing it indefinitely." **This is the most exactly on-point wording of any party in this set for statement 6.**
- **7. Paper leaks (Silent) — VERIFIED.** No match for "paper leak". No match for "examination" in any recruitment-integrity sense. The employment section (PDF pp.31, 38) demands that vacancies be filled and the recruitment ban lifted, but says nothing about exam malpractice. **Code as silent.**
- **8. Free electricity (Silent) — VERIFIED.** No promise of free electricity. The power commitments are subsidy and anti-privatisation: "Ensuring affordable electricity at subsidized rates; repealing of the Electricity (Amendment) Bill 2022; halting prepaid smart metering in the TOTEX model by private corporations; rollback privatization of public electricity sector…" (PDF p.19). Free electricity for farmers is also not promised; agricultural electricity appears as an input subsidy (PDF pp.15, 22). **"Subsidised" is not "free" — code as silent.**
- **9. Cash transfer to a woman of the household (Silent) — VERIFIED.** No such commitment. The only cash-transfer mention runs the other way: "No cash transfers in lieu of foodgrains." (PDF p.23), i.e. opposing cash substitution for PDS rations. That is a different proposition from statement 9 and should not be coded against it. The women's section (PDF p.30) covers reservation, equal property rights and violence against women, not transfers. **Code as silent.**
- **10. GST restructuring (Supports) — VERIFIED PDF p.16.** "GST to be overhauled respecting the federal structure of our country and the rights of the states by sharing resources with them." Also targeted GST removals: on life, medical and general insurance (PDF p.17), on disability aids and appliances (PDF p.35), on life-saving medicines (PDF p.37). Critique at PDF p.8 on the refusal to extend GST compensation to states.
- **11. J&K full statehood (Supports) — VERIFIED PDF p.11.** "The CPI(M) stands for immediate elections to the State Assembly and also for the restoration of full statehood as a first step." The dedicated J&K commitments list (PDF p.25) adds: "Restoration of Article 35A and 370 of the Constitution; Ladakh being given regional autonomy; holding elections to the state assembly immediately", plus a political dialogue, confidence-building measures and "Withdrawal of AFSPA, except in border areas" (PDF p.26). Note the p.25 list does not itself repeat the word "statehood"; the explicit statehood pledge is at p.11.
- **12. Apprenticeship right (Silent) — VERIFIED.** No match for "apprentice" or "internship" anywhere in the document. The youth section (PDF p.31) promises jobs or an unemployment allowance, lifting the recruitment ban, a new National Youth Policy and sports missions. The employment-guarantee section (PDF p.38) promises an urban employment guarantee law and 200 days of MGNREGA. None of these is an apprenticeship right. **Code as silent.**

### CPI — separate manifesto, 6 April 2024
CPI released its own manifesto separately, two days after CPI(M)'s, in New Delhi, released by General Secretary D. Raja. **I could not obtain this document.** I checked cpofindia.org (the live site returned nothing usable from this environment) and Wayback Machine CDX for the domain across March–September 2024, which surfaced only two unrelated PDFs from 2020 and 2022. Reported contents, all SECONDARY: scrap the CAA; remove the 50% cap on reservations; **conduct a caste census**; reservations in the private sector; restore the Old Pension Scheme; wealth and inheritance taxes; higher corporate tax; MGNREGA wage to ₹700/day and 200 days of work; an Urban Employment Guarantee Act; social security for gig workers; bring the ED and CBI under parliamentary oversight; abolish Article 356 and the office of Governor. Sources: [Onmanorama](https://www.onmanorama.com/news/india/2024/04/06/lok-sabha-elections-2024-cpi-releases-manifesto-vows-scrap-caa-cap-quotas.html), [The Week / PTI](https://www.theweek.in/wire-updates/national/2024/04/06/del38-elections-cpi-manifesto.html), [Daily Pioneer](https://www.dailypioneer.com/2024/india/cpi-releases-manifesto-for-ls-polls.html), [Deccan Herald](https://www.deccanherald.com/elections/india/cpi-releases-lok-sabha-election-manifesto-promises-to-scrap-caa-2967837). **Of our 12 statements, press coverage establishes only statement 4 (caste census, supports).** The other eleven are unreported. I recommend **not** putting CPI in the quiz on this evidence; if it must appear, it should be labelled document-not-obtained and scored on statement 4 alone.

### Gaps
- CPI(M) page citations are PDF pages in a 44-page file with no printed numbers. If the published 64-page edition is the citable one, someone should re-map these before the pages appear in a public-facing product.
- UCC and Agnipath for CPI(M) are critique-only codings. A reviewer should decide the house rule for the quiz: does an explicit textual attack with no pledge count as a stance? I have coded it as one and flagged every instance.
- The CPI document was not obtained.

---

## DMK — 2024 Lok Sabha manifesto (released 20 March 2024)

**Status: VERIFIED.** Read in full. Printed page numbers match PDF pages. Prepared by the DMK General Election Manifesto Committee chaired by Kanimozhi, released 20 March 2024 alongside the party's first list of 21 candidates.

### Takeaway
DMK is explicit on nine of the twelve statements and silent on three (paper leaks, free electricity, apprenticeship). The document has a distinctive structure: pp.24–30 are a numbered list of promises "to be implemented after the formation of the 'INDIA' alliance government", and later sections (pp.37–53) are sectoral chapters that repeat and expand several items. Where both exist I cite the more specific one. Note that some DMK pledges are Tamil Nadu-specific (NEET exemption, Union universities in Tamil Nadu) and should not be read as national positions.

### Cited findings
- **1. MSP (Supports, partial) — VERIFIED p.52.** "The recommendations of the M.S. Swaminathan committee will be adopted, ensuring that agricultural products' MSP is set at total production cost + 50%." Also p.51: "…the national, state, and district levels will be established to determine the Minimum Support Price (MSP) for bananas, turmeric, tapioca, pulses, chillies, millets, tea, oilseeds, horticultural products, etc. The government will procure…"; p.46: "Cotton will be provided nationwide at the MSP price through 100% CCI." **The manifesto commits to the C2+50% level and to procurement, but nowhere uses "legal guarantee", "legally" or "statutory" in connection with MSP.** I checked. Coded supports-partial: on the price level yes, on the legal-guarantee mechanism not stated.
- **2. One Nation One Election (Opposes) — VERIFIED p.27, item 36.** "The plan for 'One Nation, One Election' will be abandoned, and the current practice based on the 1971 census for the allocation of Lok Sabha seats will [continue]." Relatedly, on delimitation (p.51): "The DMK assures that this status will continue during the upcoming constituency delimitation as well."
- **3. UCC (Opposes) — VERIFIED p.27, item 30.** "The introduction of the Uniform Civil Code will be strictly prevented to preserve the secular nature of India as stated in the Constitution's preamble." Also p.41, item 5: "The Uniform Civil Code, which takes away the rights of minorities, will not be implemented."
- **4. Caste census (Supports) — VERIFIED p.45,** under the heading "Caste Census": "Every ten years, the Union government has conducted a population census in India. The population census that was supposed to be conducted in 2021 has not yet been conducted. From now on, population censuses, including caste-wise censuses and censuses concerning people below the poverty line, will be conducted by the Union government once every five years simultaneously." Note DMK goes further than the statement: it wants the census every five years, not ten.
- **5. Agnipath (Supports scrapping) — VERIFIED p.53,** under "Welfare of Armed Forces Personnel": "1. The Agnipath scheme will be withdrawn. 2. Permanent recruitment service for Indian Armed Forces personnel will be [restored]."
- **6. Women's reservation without census/delimitation (Supports) — VERIFIED p.28, item 39.** "A 33% reservation for women in Parliament and legislative assemblies will be implemented immediately." Item 40 adds 33% in education and employment. Context at p.20: "It is imperative to immediately implement a 33% reservation for women in Parliament." **The word used is "immediately"; unlike CPI(M), DMK does not name the census/delimitation linkage explicitly.** Coded supports, since "immediately" is the operative claim the statement tests.
- **7. Paper leaks (Silent) — VERIFIED.** No match for "paper leak" or for exam malpractice. The exam-related promises are a different issue: NEET exemption for Tamil Nadu (p.24, item 6) and conducting UPSC and other Union exams in Tamil and other state languages (pp.11–12, p.30). **Code as silent — and specifically, do not read the NEET pledge as a paper-leak position.**
- **8. Free electricity (Silent) — VERIFIED.** The word "electricity" does not appear anywhere in the document (zero matches). **Code as silent.**
- **9. Cash transfer to a woman of the household (Supports, partial) — VERIFIED p.24, item 3.** In the list of promises to be implemented after an INDIA alliance government forms: "A monthly entitlement of Rs. 1000 for all women in every state." **Same two differences as TMC:** monthly rather than annual, and all women rather than poor households. The manifesto's background section (pp.6–7) cites Tamil Nadu's own Kalaignar Magalir Urimai Thogai, under which "about 1.15 crore women in Tamil Nadu receive Rs. 1000 per month", as the model.
- **10. GST restructuring (Supports) — VERIFIED p.48,** under the heading "Goods and Services Tax (GST) Reforms": "1. The Union government's financial contributions to states will be based on the income tax and GST collected in those states. Thus, financial contributions will be assured based on the taxes collected within each state." Same page, item 1 of the preceding block: "Taxpayers will be given the opportunity to correct mistakes made while filling out GST forms. The practice of imposing additional taxes and penalties for these mistakes will be completely stopped." Plus exemptions: GST exemption on essential food items — rice, wheat, pulses, cooking oil, cereals (p.46, item 6) — and reduced GST on pesticides and fertilizers (p.52, item 5).
- **11. J&K full statehood (Supports) — VERIFIED p.27, item 28.** "State status will be restored to the bifurcated Jammu and Kashmir, and democratic elections will be conducted for the state legislature immediately." Item 29: "The livelihood of the people of Kashmir will be improved." The critique section (p.19) sets this up: Article 370's abolition and bifurcation "stripp[ed] it of its statehood… These move by the BJP government indicate an intent to dismantle the rights of states and the structure of statehood itself." Separately, DMK promises full statehood for Puducherry (p.11) — a different commitment, do not merge the two.
- **12. Apprenticeship right (Silent) — VERIFIED.** No match for "apprentice" or "internship". The employment promises are different instruments: MGNREGA raised from 100 to 150 days at a ₹400 national wage (p.38, item 3); a new "Urban Employment Scheme" law modelled on MGNREGA (p.47, item 8); skills development and guidance for young people going abroad for work (p.29, item 55). None of these is an apprenticeship right. **Code as silent.**

### Gaps
- None material for this grid. The document was obtained from two independent hosts with identical checksums, is in English, extracts cleanly, and is explicit on nine of twelve statements.
- One provenance note: I could not retrieve the file from dmk.in itself. The two hosts I used are the Supreme Court Observer and OpenCity, which both attribute it to the DMK. Byte-identity between them is good evidence of a single authentic original but is not the party's own server.

---

## Gaps and caveats across the whole set

### Documents not obtained
1. **AAP** — no manifesto exists to obtain. The ten guarantees are an oral announcement; I found no AAP-hosted text. Four of twelve statements coded, all SECONDARY.
2. **NCP (SP)** — "Shapatnama" not locatable in any form after searching the open web, Wayback CDX for two candidate domains, and the OpenCity 2024 dataset. Eight of twelve statements coded, all SECONDARY, from what is essentially a single wire story.
3. **NCP (Ajit Pawar)** — not obtained; one news report only.
4. **CPI** — not obtained; cpofindia.org unreachable and no archived copy. Only one of twelve statements has any reported evidence.

### Coding judgements a reviewer should check
- **Critique vs. pledge (CPI(M), statements 3 and 5).** UCC and Agnipath appear only in CPI(M)'s critique of the government, never in its commitments lists. I coded both as stances and flagged them. If the house rule is "pledges only", both become silent.
- **Monthly vs. annual cash transfer (statement 9).** The statement is worded on the Congress *Mahalakshmi* model: annual, to a woman of a *poor* household. AITC and DMK both promise ₹1,000/month to *all* women. I coded both as supports-partial. If the quiz wants to distinguish the Congress design specifically, statement 9 needs rewording.
- **MSP: price level vs. legal guarantee (statement 1).** AITC and CPI(M) explicitly promise a *legal* guarantee. DMK and AAP promise the C2+50% *level* without saying "law". Coded supports-partial for the latter two. The statement as worded tests the legal mechanism, so this distinction is real.
- **Statehood confusion (statement 11).** AAP promises statehood for **Delhi**, DMK for **Puducherry** (in addition to J&K). Neither should be scored as J&K statehood. AAP is silent on J&K.
- **"Reviewing power distribution" (NCP SP, statement 8).** In the wire copy this means constitutional powers between Centre and states, not electricity. Do not mis-key it.
- **NEET is not a paper-leak position (DMK, statement 7).** DMK's exam promises concern NEET exemption and exam language, not malpractice.

### Discrimination quality of the 12 statements across these five parties
- **Good discriminators:** 2 (ONOE), 4 (caste census), 6 (women's reservation timing), 9 (cash transfer), 12 (apprenticeship).
- **Weak within this group:** 10 (GST) and 11 (J&K statehood) — near-unanimous among those that speak; 3 (UCC) and 5 (Agnipath) — all five lean the same way. These still separate the group from the BJP, so they are worth keeping only if the quiz includes BJP.
- **Poor:** 7 (paper leaks) and 8 (free electricity) — four of five silent on each, and in AAP's case the single "support" on 8 comes from a ten-point list rather than a manifesto. Consider dropping or replacing these two for this cohort.

### Suggested next steps
1. Get the Shapatnama. Try the NCP(SP) directly, and search Marathi coverage (Loksatta, Sakal, Maharashtra Times) for 25–26 April 2024 — I did not search Marathi-language sources.
2. Resolve AAP guarantee 10 (simplify GST vs. end GST) from the 12 May 2024 press-conference video, and look for an AAP-hosted text on the party's or Kejriwal's X accounts.
3. Re-map CPI(M) citations from PDF pages to the printed 64-page edition if those page numbers will be shown publicly.
4. Decide the critique-vs-pledge house rule and apply it consistently across all parties, including the BJP and INC rows in `manifestos_2024.md`.
