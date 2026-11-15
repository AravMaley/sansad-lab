# Sansad Lab v2: Follow your MP, in a 3D chamber

Date: 2026-11-15
Status: approved 2026-11-15 (no paid services)

## 1. Purpose

Sansad Lab becomes a place a first-time voter, student or member of the public can use to answer three questions, in plain English:

1. **Who is my MP, and what have they done in Parliament?**
2. **What is Parliament saying about the issues I care about?**
3. **What did each party actually promise?**

It must stay useful after the first visit (people come back when Parliament sits), look distinctive enough to launch on LinkedIn, and cost close to nothing to run.

### Audience

- First-time voters and students (primary).
- The general public.
- Not designed around UPSC aspirants; plenty of sites already serve them.

### Out of scope for v2

- Hindi or other languages (English only at launch).
- Email or push alerts, and user accounts.
- Floor Test (the bill-passing game) and classroom mode.
- Rajya Sabha MPs (Lok Sabha only; Rajya Sabha can be added later on the same pipeline).
- Per-MP voting records (most bills pass by voice vote, so the data does not exist).
- A manifesto promise tracker.

## 2. What the feasibility test established (15 Nov 2026)

| Check | Result |
|---|---|
| Lok Sabha members endpoint | Works. 545 records for the 18th Lok Sabha, 540 constituencies, 5 not sitting. |
| Questions endpoint | Works. 34,720 questions in the 18th Lok Sabha. Each record has number, date, subject, ministry, type, session and asking MPs. |
| Filter questions by MP | Works with `memberCode=<mpsno>` (e.g. one MP: 127 questions). Other filter parameters tried were ignored. |
| Question and answer text | Not in the JSON. Each record links a `.docx` and `.pdf`. The `.docx` unzips to clean text containing the full question and the minister's answer. |
| Page size | Fixed at 10 records, whatever `size` is requested. |
| Request from a cloud server | Worked (both endpoints returned 200 from a hosted fetcher). |
| Request from GitHub Actions | **Not yet tested.** First task of the plan. |

The member records include personal phone numbers, home addresses, personal emails, date of birth and family details. These are never stored or shown.

## 3. Product

### 3.1 Find your MP

- Pick a state, then a constituency. Your MP's seat lights up in the chamber and the page opens.
- Each MP has a shareable URL: `/mp/<mpsno>`.

### 3.2 MP page

- Name, photo, party, constituency, state, number of terms.
- Counts: questions asked this Lok Sabha, and by ministry (a small bar list).
- A feed of their questions, newest first. Each item shows the subject, ministry, date, a cleaned-up "Asked" and "Answer" excerpt taken word for word from the official document (see 5.1), and a link to the official document.
- Filter the feed by ministry; search within it.
- Joint questions (several MPs asking together) appear on each asking MP's page.
- **Empty or thin pages** carry a clear note: Sansad Lab is a working prototype; this MP may have asked no questions, may be a minister (ministers do not ask questions), or the data may not have been found yet. Never imply an MP is inactive from missing data.

### 3.3 Issues

- A fixed list of about 15 topics a young voter recognises (exams and education, jobs, farming, health, railways, women's safety, climate and environment, roads, internet and telecom, water, prices and inflation, defence, sport, startups, housing).
- Each topic is defined as a set of ministries plus keywords on the subject line, so tagging needs no manual work.
- A topic page shows recent questions on it across all MPs, with the same excerpts, and which states and parties raise it most.
- Free-text search across all question subjects and text.

### 3.4 Follow without accounts (replacing email alerts)

- **Follow** an MP or a topic. Follows are stored in the browser only (localStorage); nothing is sent to the server.
- On return, a "Since your last visit" strip shows how many new questions each follow has, with links.
- Each MP and topic has an RSS feed, for people who use readers.
- Each MP and topic page has a "Share on WhatsApp" link and a generated share image.
- A "Parliament calendar" shows the next session dates (from the sessions endpoint), with an "Add to calendar" `.ics` download, so people know when to come back.

### 3.5 Manifesto reader

Built from the existing `web/data/manifestos.json`.

- Browse by party or by topic.
- Compare two or three parties side by side on one topic.
- Each position is a one-line plain-English statement with its source and page.
- Search across all statements.
- Keeps the existing rule that a party being silent on something is shown as "not mentioned", never as "opposes".
- Links into the existing matcher.

### 3.6 Existing features

The matcher, "You Be the MP" scenarios, the protest timeline and the ledger stay, restyled into the new design. Their content does not change in v2.

### 3.7 Trust

- A site-wide "Working prototype" label.
- A methodology page: where the data comes from, how often it refreshes, how topics are tagged, that excerpts are shortened from the official text (never reworded), and how to report an error.
- Every excerpt sits next to a link to the full official document.
- A "last updated" timestamp on every data page.

## 4. Design: the Living Chamber

### 4.1 Look

- **Stage:** a deep green-black background, cream type, saffron as the single accent; Lok Sabha green and Rajya Sabha maroon kept as secondary colours.
- **Type:** Fraunces for display (already in use), Inter for text, a monospace face for data and counts.
- **Paper:** the timeline, ledger and manifesto reader use a paper-on-dark-table treatment (cards with depth, grain and soft shadow) for contrast with the 3D chamber.
- A light theme is kept for reading-heavy pages (MP feed, manifesto reader) and follows the system setting.

### 4.2 The chamber

- The hero is a three.js scene: 543 seats rendered as one instanced mesh in the hemicycle layout already computed in `web/js/house.js`, coloured by party.
- Scroll moves the camera through the chamber:
  - overhead plan for the opening;
  - a sweep down to seat level for "Find your MP";
  - out through the doors for the protest timeline.
- Seats regroup to show data: by alliance, by party, and by "who asked about this" on a topic page (seats of MPs who raised the topic glow).
- Selecting a constituency flies the camera to that MP's seat.
- Seat positions are assigned by party (grouped), not the official seating plan; the methodology page says so.

### 4.3 Performance and fallbacks

- three.js is vendored and loaded lazily after first paint; the existing SVG hemicycle is the first paint.
- One canvas, device pixel ratio capped at 1.5, no post-processing, under 300 KB of 3D code and assets beyond three.js itself.
- The SVG version is used permanently when the browser has no WebGL, the user prefers reduced motion, or the connection reports save-data.
- Target: interactive within 3 seconds on a mid-range Android phone over 4G. Measured on a real device before launch.
- Seats are not the only way to select an MP: the state and constituency pickers are always available, since small seats are hard to tap on phones.

## 5. Architecture

```
sansad.in JSON + .docx  ──>  GitHub Actions (nightly)  ──>  Supabase Postgres
                              fetch, parse, excerpt            │
                                                               v
              Browser  <──  Vercel: static site (web/)  +  /api serverless functions
```

### 5.1 Ingestion (GitHub Actions, nightly)

1. Fetch all members; keep only whitelisted fields (mpsno, name, party, state, constituency, photo URL, terms, status).
2. Fetch questions newest first, page by page, stopping at the first page already fully stored. The first run backfills all of the 18th Lok Sabha (about 3,500 requests; spread over several runs if a run's time limit is hit).
3. For each new question, download the `.docx`, extract the text, and split it into question and answer.
4. Build excerpts without any AI, so the project runs free:
   - strip boilerplate (headers, "Will the Minister of … be pleased to state", the minister's name line);
   - when an answer says "a statement is laid on the table", take the statement instead;
   - keep the question's lettered parts;
   - cut each excerpt at about 60 words on a sentence boundary.
   Excerpts are never reworded. AI summaries are a possible later addition; the schema leaves room for one beside each excerpt.
5. Tag topics by ministry and keyword rules.
6. Be polite to sansad.in: one request at a time, a short pause between requests, a clear user-agent naming the project.
7. On failure, the job leaves existing data untouched and the GitHub Actions run fails visibly; the site keeps serving the last good data.

### 5.2 Database (Supabase, free tier)

- `members`: the whitelisted member fields.
- `questions`: number, date, session, type, ministry, subject, document URLs, question text, answer text, question excerpt, answer excerpt, topic tags.
- `question_members`: links questions to the MPs who asked them.
- `sessions`: session numbers and dates.
- Full-text search on subject, question text and answer text using Postgres built-in search.
- Nightly writes keep the free project from pausing for inactivity.

### 5.3 API (Vercel serverless functions)

- `GET /api/mp/:mpsno` — profile, counts, paginated feed (filters: ministry, search text).
- `GET /api/topic/:slug` — paginated feed and per-state and per-party counts.
- `GET /api/search?q=` — search across questions.
- `GET /api/since?mp=…&topic=…&t=<timestamp>` — new-item counts for followed items.
- `GET /api/rss/mp/:mpsno` and `/api/rss/topic/:slug`.
- `GET /api/sessions` — calendar data.
- Responses cached at Vercel's edge for an hour.
- The database is closed to the public: no anon access and no policies. The API reads through Vercel functions using a server-only service key, stored as a Vercel environment variable and never sent to the browser. The write path uses the same key only inside GitHub Actions.

### 5.4 Front end

- Stays a static site in `web/` with ES modules, as now; no framework rewrite.
- New modules: `chamber3d.js` (three.js scene), `findmp.js`, `mppage.js`, `topics.js`, `follow.js`, `manifestos.js`.
- `/mp/:mpsno` and `/topic/:slug` are routed by Vercel rewrites to the same page, which reads the path.
- three.js is vendored by a build script, following the pattern of `scripts/build-motion.mjs`.

## 6. Accounts and keys you will need

- **Supabase:** a free project (you create it; I set up the schema).
- No paid services or API keys. Everything runs on free tiers: Supabase, Vercel Hobby, and GitHub Actions on a public repo.

## 7. Error handling

- sansad.in down or changed: the nightly job fails; the site keeps the last good data and shows its "last updated" date.
- A `.docx` that fails to parse: store the question with no text; the item shows the subject and the official link only.
- An excerpt that cannot be built (unusual layout): show the subject and the official link only.
- WebGL unavailable or slow: the SVG chamber.
- API down: MP and topic pages show a clear "data temporarily unavailable" message; the manifesto reader, matcher, scenarios and timeline still work from static files.

## 8. Testing

- Unit tests for the `.docx` parser and excerpt builder (using saved sample files), topic tagging, the member field whitelist, and "since" counting.
- An integration test of ingestion against a few saved API responses (no live calls in tests).
- API tests against a local Postgres.
- Manual checks: the 3D chamber on a real mid-range Android phone; reduced-motion and no-WebGL fallbacks; a minister's page and a page with no questions.

## 9. Build order

1. Get `redesign` into production (merge to `main`).
2. Prove GitHub Actions can reach sansad.in.
3. Ingestion pipeline and database, with the backfill.
4. API.
5. Design system and the 3D chamber.
6. Find your MP and MP pages.
7. Issues, search and follow.
8. Manifesto reader.
9. Restyle existing features; methodology page; launch checks.

## 10. Risks

| Risk | Mitigation |
|---|---|
| sansad.in endpoints are undocumented and may change or block automated requests | Polite fetching; failures keep last good data; the OpenSansad dataset (about 150k questions, CC BY 4.0) as a fallback for history |
| An excerpt cuts off something important | Excerpts are verbatim and always link to the full document; correction route on the methodology page |
| GitHub Actions is free only for public repos | Keep the repo public |
| Perceived political bias | Only factual, sourced records; no scores or rankings of MPs; topic rules published |
| Supabase free tier pauses or fills up | Nightly writes prevent pausing; text for 35k questions is well under 500 MB (to be confirmed after backfill) |
| 3D is slow on cheap phones | Lazy loading, fallbacks, and a real-device test before launch |
