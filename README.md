# Sansad Lab

Most people in India can't name a single question their MP asked in Parliament. That information is public. It's on sansad.in, buried in `.docx` files behind a search form that times out half the time. Sansad Lab pulls it out and puts it next to the manifestos, the votes and the protests, so you can check things for yourself.

It's live at https://sansad-lab-web.vercel.app/. It's a working prototype built by one student, it takes no money from any party, and every figure on it links to where it came from.

## What you can do on it

- **Find your MP.** Pick your state and constituency (or type a name) and you get every question they've asked in this Lok Sabha, with the government's answer quoted word for word and a link to the official document.
- **Follow an issue.** There are 15 of them: exams, jobs, farming, women's safety, railways and so on. Each one lists every question asked about it and which states and parties ask most. You can follow issues and MPs without an account, subscribe by RSS, or save a share card for WhatsApp.
- **Read the manifestos side by side.** The 2024 manifestos, by topic or by party, with page numbers.
- **Take the Manifesto Matcher.** Twelve statements and five parties. Every stance comes from the party's own 2024 manifesto with a page citation. Where a manifesto says nothing, a separate panel shows what the party actually did: votes, answers in Parliament, state schemes.
- **Be the MP.** Vote on six laws, then see how Parliament really voted and what happened next: the farm laws, women's reservation, the CAA, the data protection law, a national UCC (which was never introduced), and the 2025 income tax rewrite.
- **Walk down The Street.** Twelve protest movements from Chipko to the electoral-rolls protests still going on, each with a plain verdict on whether it got what it asked for.
- **Check The Ledger.** PRS numbers on how often Parliament sits, how long it works, and how many bills go to committee.

Behind all of it are 543 dots, one per seat in the 18th Lok Sabha. On the home page they gather into the House by alliance. On every other page they drift faintly in the background and light up the MP or parties you're reading about. Text always sits on its own translucent panel so the dots never get in the way of reading. On phones the canvas runs at 20 fps and lower resolution, and it stops completely when the tab is hidden or reduced motion is on.

## Why the matcher has only five parties

A matcher is only fair if every party is judged by its own document. BJP, INC, TMC, CPI(M) and DMK published 2024 Lok Sabha manifestos, and all five were read in full. AAP didn't publish one; it read out ten promises at a press conference. I couldn't find the NCP (SP) or CPI manifestos anywhere, web archives included. TVK didn't contest. Rather than guess their positions, I left them out.

A party that says nothing on a topic is never marked down for it, so a short manifesto isn't punished for being short.

## Where the data comes from

Every night a GitHub Actions job (`.github/workflows/ingest.yml`) reads members and questions from sansad.in's JSON endpoints. It opens each official `.docx`, pulls out the question and the answer, cuts verbatim excerpts, tags the issues and writes it all to a Supabase Postgres database. The public role on that database can't read anything; the Vercel functions in `web/api/` read it with a server-only key. MPs' phone numbers, addresses, emails and family details are dropped before anything is stored.

To set it up yourself, run `supabase/schema.sql` in the Supabase SQL editor, then add `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` as GitHub Actions secrets and as Vercel environment variables. `npm test` runs the tests.

## How the repo is laid out

```
web/                 the static site (Vercel serves it as is, no build step)
  index.html …       one HTML file per page
  css/style.css
  js/                one module per section, plus util.js and motion.js
  data/              JSON the site loads (bills.json is generated)
  img/               CC-licensed protest photos, credited in protests.json
  vendor/motion.js   generated: a tree-shaken motion.dev bundle
laws/                one JSON file per bill scenario (the source of truth)
scripts/             build-data.mjs, build-motion.mjs
reports/, research_notes/   the research behind every figure
PRODUCT.md           who the site is for and the rules it follows
```

## Changing things

- **Bills:** edit `laws/*.json`, then run `npm run build:data`. The script refuses any vote, argument or timeline entry that doesn't have a `source`.
- **Animation library:** change the import list in `scripts/build-motion.mjs`, then run `npm run build:motion`. It's 18 KB raw, 8 KB gzipped right now.
- **Anything else:** edit the JSON in `web/data/` directly.

On my machine Node lives at `D:\node.exe` and isn't on PATH, so if `node` isn't found, call it by its full path.

## Running it locally

```
cd web && python -m http.server 8000
```

The pages load, but the MP and issue pages need the `/api` functions, which only run on Vercel (or under `vercel dev`).

## Deploying

Vercel, with Root Directory set to `web` and no build command. `main` is production and every other branch gets its own preview URL.

## Photos

Every photo is freely licensed and credited, with its licence, in `web/data/protests.json`. Some movements, like Chipko, the anti-Mandal protests, Narmada, the RTI campaign and Telangana, have no free photograph I could find. Their cards say so instead of showing something that would mislead. All the images together come to about 900 KB.

## Still to check before a wider launch

- **BJP manifesto p.54 and p.55.** The UCC and One Nation One Election quotes came from a mirror of the official PDF, and p.55 extracts badly. Someone needs to open the official file and check both by eye.
- **Disputed dates.** The farm laws' assent date (24 or 27 Sep 2020) and repeal date (30 Nov or 1 Dec 2021) should be checked on egazette.gov.in.
- **Things still moving.** The electoral-rolls protests and the CAA court case both change. `protests.json` has a `verifiedOn` date for each.
- **Party positions today.** The seat chart shows the June 2024 result; sansad.in has the current numbers.

If you spot something wrong, [open an issue](https://github.com/AravMaley/sansad-lab/issues). I'd rather fix it than leave it up.
