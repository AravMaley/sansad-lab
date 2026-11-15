# Sansad Lab

Understand India's Parliament by doing. Live at https://sansad-lab-web.vercel.app/

## What's on the site

1. **The House** — the 18th Lok Sabha as 543 dots, one per seat, gathered by alliance. The same dots drift behind every page and light up the MP or parties you are reading about (Canvas 2D, about 30 fps, paused when hidden, still for reduced motion).
2. **Your MP** — pick your state and constituency to see every question your MP asked in this Lok Sabha, with word-for-word excerpts of the government's answer and a link to the official document.
3. **Issues** — 15 issues (exams, jobs, farming, women's safety…) with every question on each, search across all questions, follows without an account, RSS feeds, share cards and a calendar file for the next session.
4. **Manifestos** — the 2024 manifestos side by side, by topic or by party, with page citations.
5. **Manifesto Matcher** — 12 statements, five parties, every stance read from the party's own 2024 manifesto with a page citation. Where a manifesto is silent, a separate "what they actually did" panel records votes, Parliament answers and state schemes.
6. **You Be the MP** — vote on six laws, then see the real record: the farm laws, women's reservation, the Citizenship Amendment Act, the data protection law, a national Uniform Civil Code (never introduced), and the 2025 income tax rewrite.
7. **The Street** — a timeline of 12 protest movements from Chipko to the electoral-rolls protests now running, each with an honest verdict on whether it got what it asked for.
8. **The Ledger** — PRS figures on committee scrutiny, sittings and session productivity.

Every figure links to its source.

## Why only five parties in the matcher

A matcher is only honest if every party is judged from its own document. BJP, INC, TMC, CPI(M) and DMK published 2024 Lok Sabha manifestos and all five were read in full. AAP published none — only ten promises read out at a press conference. NCP (SP) and CPI manifestos could not be obtained anywhere, including web archives. TVK did not contest. Their positions are left out rather than guessed.

"Silent" is never scored against a party, so a short manifesto is not penalised.

## How the data stays fresh

A GitHub Actions job (`.github/workflows/ingest.yml`) runs nightly. It reads members and questions from sansad.in's JSON endpoints, extracts the question and answer from each official `.docx`, builds verbatim excerpts, tags issues, and writes to a Supabase Postgres database. The database grants the public role nothing; Vercel functions in `web/api/` read it with a server-only key. Personal details in the member records (phone numbers, addresses, emails, family) are dropped before storage.

Setup: run `supabase/schema.sql` in the Supabase SQL editor; set `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` as GitHub Actions secrets and as Vercel environment variables. Tests: `npm test`.

## Structure

```
web/                 static site (Vercel serves this, no build step)
  index.html
  css/style.css
  js/                one module per section, plus util.js and motion.js
  data/              JSON the site loads (bills.json is GENERATED)
  img/               CC-licensed protest photos, credited in protests.json
  vendor/motion.js   GENERATED — tree-shaken motion.dev bundle
laws/                one JSON file per bill scenario (source of truth)
scripts/             build-data.mjs, build-motion.mjs
reports/, research_notes/   the research behind every figure
```

## Editing

- **Bills:** edit `laws/*.json`, then `npm run build:data`. The script rejects any vote, argument or timeline entry without a `source`.
- **Motion:** change the import list in `scripts/build-motion.mjs`, then `npm run build:motion`. Currently 18 KB raw / 8 KB gzipped.
- **Everything else:** edit the JSON in `web/data/` directly.

Node lives at `D:\node.exe` on the author's machine and is not on PATH; call it by full path if `node` is not found.

## Run locally

```
cd web && python -m http.server 8000
```

## Deploy

Vercel, Root Directory `web`, no build command. `main` is production; every other branch gets a preview URL.

## Images

Only freely licensed images are used, each credited with its licence in `web/data/protests.json`. Several movements — Chipko, anti-Mandal, Narmada, the RTI campaign, Telangana — have **no** free photograph, and the cards say so rather than substituting something misleading. Images are re-encoded to roughly 900 KB total.

## To verify before a wider launch

- **BJP manifesto p.54 and p.55** — the UCC and One Nation One Election quotes came from a mirror of the official PDF, and p.55 extracts badly. Open the official file and check both by eye.
- **Contested dates** — farm-law assent (24 vs 27 Sep 2020; 30 Nov vs 1 Dec 2021) on egazette.gov.in.
- **Live items** — the electoral-rolls protests and the CAA court case both move. `protests.json` carries a `verifiedOn` date.
- **Current party positions** — sansad.in. The seat chart shows the June 2024 result.
