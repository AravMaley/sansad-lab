# Sansad Lab

Understand India's Parliament by doing. Live at https://sansad-lab-web.vercel.app/

## What's on the site

1. **The House.** A seat chart of the 18th Lok Sabha as elected on 4 June 2024, with alliance totals and MP profile figures.
2. **Manifesto Matcher.** Twelve statements coded from the 2024 BJP and INC manifestos, with page-cited quotes. "Silent" is its own state and is never scored as disagreement.
3. **You Be the MP.** Vote on four real laws (the farm laws, women's reservation, the Citizenship Amendment Act and the data protection law), then see the actual votes, the timeline and where each law stands now.
4. **The Ledger.** PRS figures on committee scrutiny, session productivity and sittings across four full Lok Sabhas and the 18th Lok Sabha so far.

Every figure links to its source.

## Structure

```
web/                 static site (Vercel serves this folder, no build step)
  index.html
  css/style.css
  js/                one module per section, plus util.js
  data/              JSON the site loads
    bills.json       GENERATED from laws/ (don't edit by hand)
    manifestos.json
    lok-sabha-18.json
    productivity.json
laws/                one JSON file per bill scenario (source of truth)
scripts/build-data.mjs   validates laws/*.json and writes web/data/bills.json
data/money/          placeholder for funding datasets
reports/             research report behind the data
research_notes/      the raw research notes, with every source
```

## Editing data

- **To add or change a bill:** edit or add a file in `laws/`, then run:
  ```
  node scripts/build-data.mjs
  ```
  The script fails if a vote, argument or timeline entry is missing its `source`, or if a division has no numeric counts.
- **Everything else:** edit the JSON file in `web/data/` directly.

## Run locally

```
cd web
python -m http.server 8000
```

Then open http://localhost:8000.

## Deploy

Vercel is connected to the GitHub repo, with Root Directory set to `web` and no build command.

- `main` is production.
- Every other branch gets a preview URL.

## To verify before a wider launch

See `reports/Sansad Lab civic data sources.md` for full detail.

- **BJP manifesto p.55 (One Nation One Election):** the quote was rebuilt from text that extracted badly. Check it against the PDF.
- **Contested dates:** check the farm-law assent dates (24 vs 27 Sep 2020, 30 Nov vs 1 Dec 2021) on egazette.gov.in.
- **Current party positions:** check them on sansad.in. The site shows the June 2024 result.
- **2024 sessions:** the PRS figures for Budget 2024 and Winter 2024 came from search snippets, so confirm them on the PRS pages.
- **Other parties:** AAP, AITC and CPI(M) manifesto positions need checking against their own documents before they can join the matcher.
