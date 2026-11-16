# Follow your MP (Sansad Lab v2) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn Sansad Lab into a free-to-run site where anyone can find their Lok Sabha MP, read what they asked in Parliament and what the government answered, follow MPs and issues without an account, and read party manifestos, all inside a 3D chamber.

**Architecture:** A nightly GitHub Actions job pulls members and questions from sansad.in's JSON endpoints, extracts text from each answer's `.docx`, builds verbatim excerpts and topic tags, and upserts into Supabase Postgres through its REST API. Vercel serves the existing static site from `web/` plus a few dependency-free serverless functions in `web/api/` that read Supabase. The front end stays plain ES modules, with three.js vendored for the chamber and the current SVG chamber as fallback.

**Tech Stack:** Node 20+ (local: `D:\node.exe`), `node:test`, esbuild (existing), `fflate` (docx unzip, ingestion only), three.js (vendored), Supabase Postgres + PostgREST, Vercel Hobby, GitHub Actions.

**Spec:** [docs/superpowers/specs/2026-11-15-follow-your-mp-design.md](../specs/2026-11-15-follow-your-mp-design.md)

## Global Constraints

- No paid services and no API keys beyond Supabase's own free-tier keys.
- English only.
- Never store or show MP phone numbers, addresses, emails, date of birth or family details. Member fields kept: `mpsno`, `name`, `party`, `party_short`, `state`, `constituency`, `photo_url`, `terms`, `status`.
- No user accounts. Follows live only in the visitor's `localStorage`; nothing about a visitor is sent to the server except the anonymous `/api/since` query.
- Excerpts are verbatim from the official document, never reworded; every excerpt links to the official document.
- A party being silent on a topic is shown as "not mentioned", never "opposes".
- Every page shows the "Working prototype" label; data pages show "Last updated".
- Polite fetching from sansad.in: one request at a time, at least 500 ms between requests, user agent `SansadLab/1.0 (+https://github.com/AravMaley/sansad-lab)`.
- The Supabase service key is server-side only: a GitHub Actions secret for ingestion and a Vercel environment variable for the API. The database grants the public role nothing; the browser never talks to Supabase.
- 3D: one canvas, device pixel ratio capped at 1.5, no post-processing, three.js loaded after first paint, SVG chamber when no WebGL, `prefers-reduced-motion: reduce`, or `navigator.connection.saveData`.
- Commits carry only the repo owner's git identity, with no Claude or Anthropic attribution lines.
- Tests use `node --test`; no live network calls in tests (fixtures only).

## Review Focus

1. **An MP with no questions (ministers, Speaker, new MPs).** The page shows the prototype empty-state note, never "0 questions" as a judgement. Test in Task 10.
2. **Old binary `.doc` files or a missing document.** Some records link `.doc`, not `.docx`. Ingestion stores the question with null text and the item shows subject and link only. Test in Task 3.
3. **"A statement is laid on the table" answers.** The answer excerpt must come from the statement, not the one-line placeholder. Test in Task 3.
4. **`localStorage` unavailable (private mode, blocked storage).** Follow buttons hide; nothing throws. Test in Task 11.
5. **Vacant seats and members no longer sitting.** The 5 non-sitting records show "No sitting MP" / "Former MP", and the picker still works. Test in Task 2 and Task 10.

---

## File structure

```
.github/workflows/ingest.yml        nightly ingestion
.github/workflows/probe.yml         temporary reachability probe (Task 1, deleted after)
supabase/schema.sql                 tables, indexes, RLS, RPC functions
scripts/ingest/http.js              polite fetch with delay, retries, user agent
scripts/ingest/sansad.js            sansad.in endpoint wrappers
scripts/ingest/members.js           member whitelist / normalisation
scripts/ingest/docx.js              .docx → plain text
scripts/ingest/excerpt.js           text → { question, answer, questionExcerpt, answerExcerpt }
scripts/ingest/topics.js            topic definitions + tagging
scripts/ingest/store.js             Supabase REST upserts and reads
scripts/ingest/run.js               orchestrator (incremental + backfill with time budget)
scripts/build-three.mjs             vendors three.js into web/vendor/three.js
tests/fixtures/                     saved API responses and .docx samples
tests/ingest/*.test.js, tests/api/*.test.js, tests/web/*.test.js
web/api/_lib/db.js                  read-only Supabase REST/RPC client
web/api/_lib/feeds.js               RSS and .ics builders (pure)
web/api/mp/[mpsno].js, web/api/topic/[slug].js, web/api/search.js,
web/api/since.js, web/api/sessions.js, web/api/members.js,
web/api/rss/mp/[mpsno].js, web/api/rss/topic/[slug].js, web/api/calendar.ics.js
web/vercel.json                     rewrites + cache headers
web/js/chamber3d.js                 three.js chamber
web/js/capability.js                use3D() decision (pure)
web/js/findmp.js                    state → constituency picker
web/js/mppage.js, web/js/topicpage.js, web/js/follow.js, web/js/manifestos.js
web/js/api.js                       fetch helpers for /api
web/mp.html, web/topic.html, web/manifestos.html, web/method.html
web/js/topics-data.js               shared topic list for the front end (generated from scripts/ingest/topics.js)
```

---

### Task 1: Go live with `redesign` and prove GitHub Actions can reach sansad.in

**Files:**
- Create: `.github/workflows/probe.yml` (deleted at end of task)

**Interfaces:** Produces the Vercel Root Directory value used by Task 8 (expected `web`).

- [ ] **Step 1: Merge `redesign` into `main`** — fast-forward: `git checkout main && git merge --ff-only redesign && git push origin main && git checkout redesign`. Confirm https://sansad-lab-web.vercel.app/ no longer shows "Sample data with fictional parties".
- [ ] **Step 2: Ask the owner for the Vercel project's Root Directory setting** (Project → Settings → Build and Deployment). If it is not `web`, Task 8's `vercel.json` and `api/` go in the repo root instead and paths in later tasks shift accordingly.
- [ ] **Step 3: Write `probe.yml`**: triggers on `push` to branch `probe`; one job on `ubuntu-latest` that runs `curl -fsS -A "SansadLab/1.0 (+https://github.com/AravMaley/sansad-lab)"` against the members, questions (`memberCode=5814`) and one `.docx` URL from the feasibility test, and fails if any is non-200.
- [ ] **Step 4: Push to a `probe` branch and read the result** from the public API: `curl -s "https://api.github.com/repos/AravMaley/sansad-lab/actions/runs?branch=probe&per_page=1"` → expect `"conclusion": "success"`. If it fails, stop and report: the fallback is running ingestion on the owner's PC via Windows Task Scheduler, which changes Task 7.
- [ ] **Step 5: Delete the `probe` branch locally and on origin.**

### Task 2: Polite HTTP client, sansad.in wrappers, member whitelist

**Files:**
- Create: `scripts/ingest/http.js`, `scripts/ingest/sansad.js`, `scripts/ingest/members.js`
- Create: `tests/fixtures/members-page.json` (5 records incl. one with `status` ≠ `Sitting`), `tests/fixtures/questions-mp.json`, `tests/fixtures/sessions.json` — trimmed from the feasibility downloads in the scratchpad `feas/` folder; replace personal phone/address/email values with obvious dummies before committing.
- Test: `tests/ingest/members.test.js`, `tests/ingest/sansad.test.js`

**Interfaces:**
- Produces: `createHttp({ fetchImpl = fetch, delayMs = 500, retries = 2, userAgent }) → { getJson(url): Promise<any>, getBuffer(url): Promise<Uint8Array|null> }` (`getBuffer` returns `null` on 404).
- Produces: `sansad(http)` → `{ members(lokNo = 18): Promise<RawMember[]>, questionsForMember(mpsno, page): Promise<{ total: number, items: RawQuestion[] }>, sessions(): Promise<RawSession[]> }`. `members` pages through all `totalPages`. Base URLs: `https://sansad.in/api_ls/member?loksabha=18&page=N&size=50&locale=en`, `https://sansad.in/api_ls/question/qetFilteredQuestionsAns?loksabhaNo=18&page=N&size=10&locale=en&memberCode=M`, `https://sansad.in/api_ls/business/AllLoksabhaAndSessionDates`.
- Produces: `normaliseMember(raw) → Member` with exactly the fields in Global Constraints: `name` = `mpFirstLastName`, `party` = `partyFname`, `party_short` = `partySname`, `constituency` = `constName`, `state` = `stateName`, `photo_url` = `imageUrl`, `terms` = `noOfTerms`, `status` = `status`.
- Produces: `normaliseQuestion(raw) → Question` = `{ lok_no, ques_no, type, date (ISO yyyy-mm-dd from dd.mm.yyyy), session_no, ministry, subject, members_text, doc_url, pdf_url }`, with `id` = `` `${lok_no}-${type}-${ques_no}-${date}` ``.

- [ ] **Step 1: Write failing tests**: `normaliseMember` output has exactly the 9 keys and none of `personalPhone`, `permanentFaddr`, `email`, `dob`; a non-sitting fixture keeps `status`; `normaliseQuestion` turns `"12.08.2026"` into `"2026-08-12"`; `createHttp` with a fake `fetchImpl` sends the user agent, waits ≥ `delayMs` between calls (use `delayMs: 20` and timestamps), retries a 500 twice then throws, and `getBuffer` returns `null` on 404; `questionsForMember` builds the URL with `memberCode`.
- [ ] **Step 2: Run** `D:\node.exe --test tests/ingest/` → FAIL (modules missing).
- [ ] **Step 3: Implement** the three modules.
- [ ] **Step 4: Run** `D:\node.exe --test tests/ingest/` → PASS.
- [ ] **Step 5: Commit** `Add sansad.in client and member field whitelist`.

### Task 3: `.docx` text and verbatim excerpts

**Files:**
- Create: `scripts/ingest/docx.js`, `scripts/ingest/excerpt.js`
- Create: `tests/fixtures/starred-statement.docx` (the feasibility sample AS359, "statement is laid on the table"), `tests/fixtures/unstarred-direct.docx` (download one unstarred answer that answers inline), `tests/fixtures/not-a-zip.doc` (any bytes not starting with `PK`)
- Modify: `package.json` — add devDependency `fflate`; add script `"test": "node --test"`
- Test: `tests/ingest/excerpt.test.js`

**Interfaces:**
- Produces: `docxToText(bytes: Uint8Array) → string|null` — `null` when the bytes are not a zip or lack `word/document.xml`; paragraphs separated by `\n`; XML entities decoded.
- Produces: `buildExcerpts(text: string) → { questionText, answerText, questionExcerpt, answerExcerpt }`, all strings or `null`.

Rules (from spec 5.1): the question body starts at the first line matching `/^\*?\d+\.\s/` after the subject and ends before the line `ANSWER`; drop the "Will the Minister of … be pleased to state:" line; the answer starts after the minister's name line (the line after `THE MINISTER OF …` / `MINISTER OF STATE …`); if the answer's first 200 characters contain `statement is laid on the table`, the answer text is everything after the line starting `THE STATEMENT REFERRED TO` up to the trailing `*****`; excerpts keep `(a)`, `(b)` markers and cut at the last sentence end (`.`, `?`, `;`) at or before 60 words, else hard-cut at 60 words with `…`.

- [ ] **Step 1: Write failing tests**: `docxToText(not-a-zip)` → `null`; starred fixture: `questionExcerpt` starts with `(a) the current status of mineral exploration`, contains no `Will the Minister`; `answerExcerpt` does not contain `statement is laid on the table` and is non-empty; unstarred fixture: `answerExcerpt` non-empty; every excerpt ≤ 61 words; every excerpt is a substring of the whitespace-normalised source text (proves "verbatim", except a trailing `…`); `buildExcerpts("")` returns all `null`.
- [ ] **Step 2: Run** `D:\node.exe --test tests/ingest/excerpt.test.js` → FAIL.
- [ ] **Step 3: Implement** both modules (unzip with `fflate.unzipSync`).
- [ ] **Step 4: Run** → PASS.
- [ ] **Step 5: Commit** `Extract question and answer excerpts from official documents`.

### Task 4: Topic tagging

**Files:**
- Create: `scripts/ingest/topics.js`, `scripts/build-topics.mjs` (writes `web/js/topics-data.js` exporting `TOPICS` without the matching rules: `slug`, `label`, `blurb`)
- Test: `tests/ingest/topics.test.js`

**Interfaces:**
- Produces: `TOPICS: Array<{ slug, label, blurb, ministries: string[], keywords: RegExp }>` — the 15 slugs: `education`, `jobs`, `farming`, `health`, `railways`, `womens-safety`, `environment`, `roads`, `internet`, `water`, `prices`, `defence`, `sport`, `startups`, `housing`. Ministries are matched against the upper-case `ministry` field (e.g. `education` ← `EDUCATION`; `farming` ← `AGRICULTURE AND FARMERS WELFARE`, `FISHERIES, ANIMAL HUSBANDRY AND DAIRYING`; `railways` ← `RAILWAYS`; `internet` ← `COMMUNICATIONS`, `ELECTRONICS AND INFORMATION TECHNOLOGY`).
- Produces: `tagTopics({ ministry, subject }) → string[]` (unique slugs, may be empty).

- [ ] **Step 1: Write failing tests**: `{ministry:"RAILWAYS", subject:"Vande Bharat trains"}` → `["railways"]`; `{ministry:"EDUCATION", subject:"NEET paper leak"}` includes `education`; `{ministry:"HOME AFFAIRS", subject:"Crimes against women in Delhi"}` includes `womens-safety` (keyword route); `{ministry:"ATOMIC ENERGY", subject:"Nuclear power"}` → `[]`; every topic has a non-empty `label` and `blurb`; slugs match `/^[a-z-]+$/`.
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement.** **Step 4: Run** → PASS; run `D:\node.exe scripts/build-topics.mjs` and confirm `web/js/topics-data.js` has 15 entries.
- [ ] **Step 5: Commit** `Add issue topics and automatic tagging`.

### Task 5: Database schema and store

**Files:**
- Create: `supabase/schema.sql`, `scripts/ingest/store.js`
- Test: `tests/ingest/store.test.js`

**Interfaces:**
- Schema: tables `members` (pk `mpsno`), `questions` (pk `id` text; columns from Task 2 `Question` plus `question_text`, `answer_text`, `question_excerpt`, `answer_excerpt`, `topics text[]`, `ingested_at timestamptz default now()`, generated `fts tsvector` over `subject || question_text || answer_text` with `english` config, GIN index), `question_members` (pk `question_id, mpsno`), `sessions` (pk `lok_no, session_no`, `start_date`, `end_date`), `meta` (`key` pk, `value` text; holds `last_updated`). Indexes: `questions(date desc)`, `question_members(mpsno)`, GIN on `topics`.
- RLS: enabled on every table; one `select` policy for `anon`; no anon write policies.
- RPC functions (SQL, `security invoker`, `stable`):
  - `mp_feed(p_mpsno int, p_ministry text, p_q text, p_limit int, p_offset int)` → rows of question + `total` count.
  - `mp_ministry_counts(p_mpsno int)` → `(ministry, n)`.
  - `topic_feed(p_slug text, p_limit int, p_offset int)`.
  - `topic_breakdown(p_slug text)` → `(kind 'state'|'party', name, n)`.
  - `search_questions(p_q text, p_limit int, p_offset int)` — uses `websearch_to_tsquery('english', p_q)`.
  - `since_counts(p_mpsnos int[], p_slugs text[], p_since timestamptz)` → `(kind, key, n)` counting rows with `ingested_at > p_since`.
- Produces: `createStore({ url, serviceKey, fetchImpl = fetch })` → `{ upsertMembers(Member[]), upsertQuestions(QuestionRow[]), linkMembers(Array<{question_id, mpsno}>), upsertSessions(Session[]), knownQuestionIds(ids: string[]): Promise<Set<string>>, setMeta(key, value) }`. Upserts `POST {url}/rest/v1/<table>` with `Prefer: resolution=merge-duplicates`, batches of 500.

- [ ] **Step 1: Write failing tests** with a fake `fetchImpl` recording requests: `upsertQuestions` of 1,200 rows makes 3 POSTs to `/rest/v1/questions` with the merge-duplicates header and both `apikey` and `Authorization: Bearer` set; `knownQuestionIds` issues `GET /rest/v1/questions?select=id&id=in.(...)` and returns a `Set`; a non-2xx response throws an error containing the status and table name.
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement `store.js`; write `schema.sql`.**
- [ ] **Step 4: Run** → PASS.
- [ ] **Step 5: Owner action**: create a free Supabase project, run `supabase/schema.sql` in its SQL editor, and store `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` as GitHub Actions secrets and `SUPABASE_URL` + `SUPABASE_SERVICE_KEY` as Vercel environment variables (server-side only; never the anon key). Verify in the SQL editor: `select * from mp_feed(5814, null, null, 5, 0);` runs (empty is fine).
- [ ] **Step 6: Commit** `Add database schema and Supabase store`.

### Task 6: Ingestion orchestrator

**Files:**
- Create: `scripts/ingest/run.js` (CLI: `node scripts/ingest/run.js [--budget-min=50] [--only=5814]`)
- Test: `tests/ingest/run.test.js`

**Interfaces:**
- Consumes: Tasks 2–5.
- Produces: `ingest({ api, store, http, now = Date.now, budgetMs, only }) → Promise<{ members: number, newQuestions: number, linked: number, docFailures: number, stoppedEarly: boolean }>`.

Algorithm: upsert all members and sessions; for each sitting MP (or `only`), page through `questionsForMember` newest first; per page, ask `store.knownQuestionIds`; link known ones (cheap, keeps joint-question links complete) and fully process unknown ones (download `doc_url` via `getBuffer`, `docxToText`, `buildExcerpts`, `tagTopics`, upsert, link); stop paging that MP after a page in which every question was already known; stop the whole run when `now()` exceeds the budget, setting `stoppedEarly` (the next run resumes, because unfinished MPs still have unknown questions). A document that fails (`null` buffer, `null` text) still stores the question with null text and increments `docFailures`. Finally `setMeta('last_updated', ISO now)`.

- [ ] **Step 1: Write failing tests** with fake `api`/`store`/`http`: two MPs sharing one joint question → one question row, two links; an MP whose first page is fully known triggers no second-page fetch; a `.doc` (null buffer) yields a stored question with `question_text: null` and `docFailures: 1`; a fake clock past budget returns `stoppedEarly: true` without touching remaining MPs; `last_updated` is set.
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement.** **Step 4: Run** → PASS.
- [ ] **Step 5: Live smoke run** (owner's machine, env vars from a local `.env` not committed): `D:\node.exe scripts/ingest/run.js --only=5814` → reports ~127 questions; spot-check three excerpts in Supabase against the official documents.
- [ ] **Step 6: Commit** `Add ingestion run with resumable backfill`.

### Task 7: Nightly workflow

**Files:**
- Create: `.github/workflows/ingest.yml`

- [ ] **Step 1: Write the workflow**: `schedule: cron '30 20 * * *'` (02:00 IST) plus `workflow_dispatch`; `ubuntu-latest`, `actions/setup-node` Node 20, `npm ci`, `npm test`, then `node scripts/ingest/run.js --budget-min=50` with the two secrets; `timeout-minutes: 60`; `concurrency: ingest` so runs never overlap.
- [ ] **Step 2: Trigger manually** (owner, Actions tab → Run workflow) and repeat until a run reports `stoppedEarly: false` (backfill complete; expect several runs). Check the public runs API shows `success`.
- [ ] **Step 3: Record** the database size after backfill (Supabase dashboard) in the spec's risk table.
- [ ] **Step 4: Commit** `Run ingestion nightly`.

### Task 8: Read API, RSS and calendar

**Files:**
- Create: `web/api/_lib/db.js`, `web/api/_lib/feeds.js`, the endpoint files listed in File structure, `web/vercel.json`
- Test: `tests/api/feeds.test.js`, `tests/api/handlers.test.js`

**Interfaces:**
- Produces: `rpc(name, args, { fetchImpl = fetch } = {})` and `select(path)` in `db.js` using `process.env.SUPABASE_URL` / `SUPABASE_ANON_KEY`.
- Produces endpoints (all `GET`, JSON unless noted, `Cache-Control: s-maxage=3600, stale-while-revalidate=86400`):
  - `/api/members` → `{ lastUpdated, members: Member[] }` (feeds the picker and chamber).
  - `/api/mp/:mpsno?ministry=&q=&page=` → `{ member, counts: [{ministry,n}], total, items: FeedItem[], lastUpdated }`; 404 JSON for an unknown `mpsno`; page size 20.
  - `/api/topic/:slug?page=` → `{ topic, items, breakdown: { states: [...], parties: [...] }, total }`; 404 for unknown slug.
  - `/api/search?q=&page=` → `{ items, total }`; `q` shorter than 2 characters → 400.
  - `/api/since?mp=1,2&topic=a,b&t=<ISO>` → `{ mp: {"1": n}, topic: {"a": n} }`; at most 50 ids; invalid `t` → 400.
  - `/api/sessions` → upcoming and recent sessions.
  - `/api/rss/mp/:mpsno`, `/api/rss/topic/:slug` → RSS 2.0, `application/rss+xml`.
  - `/api/calendar.ics` → next session as an all-day `VEVENT`, `text/calendar`.
- `FeedItem` = `{ id, date, type, ministry, subject, questionExcerpt, answerExcerpt, docUrl, pdfUrl, askedBy: [{mpsno,name}] }`.
- Produces: `toRss({ title, link, items }) → string`, `toIcs({ sessions }) → string` in `feeds.js`.
- `web/vercel.json` rewrites: `/mp/:id` → `/mp.html`, `/topic/:slug` → `/topic.html`, `/manifestos` → `/manifestos.html`, `/method` → `/method.html`.

- [ ] **Step 1: Write failing tests**: `toRss` escapes `&`/`<` in subjects and produces one `<item>` per item with the official doc URL as `<link>`; `toIcs` contains `BEGIN:VCALENDAR`, CRLF line endings and a `DTSTART;VALUE=DATE:`; the `since` handler rejects 51 ids and a bad timestamp with 400; the `search` handler returns 400 for `q=a`; the `mp` handler maps an empty RPC result for an unknown MP to 404 (handlers tested by calling the exported default with fake `req`/`res` and a stubbed `fetchImpl`).
- [ ] **Step 2: Run** `D:\node.exe --test tests/api/` → FAIL. **Step 3: Implement.** **Step 4: Run** → PASS.
- [ ] **Step 5: Deploy a preview** (push branch) and check `/api/mp/5814` returns that MP's feed and `/api/rss/mp/5814` validates at https://validator.w3.org/feed/.
- [ ] **Step 6: Commit** `Add read API, RSS feeds and session calendar`.

### Task 9: Design system and the 3D chamber

**Files:**
- Create: `scripts/build-three.mjs` (pattern of `scripts/build-motion.mjs`; exports only `WebGLRenderer, Scene, PerspectiveCamera, InstancedMesh, BoxGeometry` or `CylinderGeometry`, `MeshStandardMaterial, AmbientLight, DirectionalLight, Color, Object3D, Raycaster, Vector2, Vector3`), `web/js/capability.js`, `web/js/chamber3d.js`
- Modify: `package.json` (dependency `three`, script `build:three`, add to `build`), `web/css/style.css` (tokens), `web/js/house.js` (export `layoutSeats` and the seat→party assignment), `web/index.html` (canvas mount over the SVG hemicycle)
- Test: `tests/web/capability.test.js`

**Interfaces:**
- Produces: `use3D({ webgl: boolean, reducedMotion: boolean, saveData: boolean }) → boolean`.
- Produces: `mountChamber(container, { seats: Array<{ x, y, party, mpsno|null }>, colors }) → { focusSeat(mpsno), highlight(mpsnoSet|null), setCamera('plan'|'seat'|'doors'), dispose() }`.
- Tokens on `:root`: `--stage #0e1a16`, `--stage-2 #15241f`, `--cream #f5f1e8`, `--saffron #f28c28`, `--ls-green #1e5b48`, `--rs-maroon #8c2f2f`, `--ink #1b1b1b`, `--font-display 'Fraunces'`, `--font-text 'Inter'`, `--font-mono 'JetBrains Mono'` (Google Fonts). Dark stage is the default for `index.html`; reading pages (`mp.html`, `topic.html`, `manifestos.html`) follow `prefers-color-scheme` with the existing cream theme as light.

- [ ] **Step 1: Write failing test**: `use3D` is true only for `{webgl:true, reducedMotion:false, saveData:false}`; false for each other single-flag change.
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement `capability.js`; then `build-three.mjs`** and run `npm run build:three` → `web/vendor/three.js` reported under 200 KB gzipped (print gzip size with `zlib.gzipSync`).
- [ ] **Step 4: Implement `chamber3d.js`**: seats as one `InstancedMesh` from `layoutSeats` positions; party colour per instance; camera presets for `plan`/`seat`/`doors` animated with the vendored `animate`; scroll drives presets via the vendored `scroll`; `setPixelRatio(Math.min(devicePixelRatio, 1.5))`; mounted from `main.js` inside `requestIdleCallback` (fallback `setTimeout(…, 200)`) only when `use3D(...)`; the SVG stays in the DOM, hidden only after the canvas renders its first frame.
- [ ] **Step 5: Verify** with `npm run serve`: desktop shows the 3D chamber; DevTools "Emulate prefers-reduced-motion" shows the SVG; Performance panel with 4× CPU throttle keeps the chamber above ~30 fps while scrolling.
- [ ] **Step 6: Commit** `Add 3D chamber with SVG fallback and dark stage design tokens`.

### Task 10: Find your MP and MP pages

**Files:**
- Create: `web/js/api.js`, `web/js/findmp.js`, `web/js/mppage.js`, `web/mp.html`
- Modify: `web/index.html` (new "Find your MP" room after the house), `web/js/main.js`
- Test: `tests/web/findmp.test.js`, `tests/web/mppage.test.js`

**Interfaces:**
- Consumes: `/api/members`, `/api/mp/:mpsno` (Task 8); `mountChamber().focusSeat` (Task 9).
- Produces: `groupByState(members) → Array<{ state, constituencies: Array<{ name, mpsno|null, status }> }>` sorted alphabetically; `emptyStateMessage(member, total) → string|null`; `formatCount(n) → string`.

- [ ] **Step 1: Write failing tests**: `groupByState` sorts states and constituencies; a non-sitting record appears with `status` preserved; `emptyStateMessage` returns `null` when `total > 0`, and when `total === 0` returns text containing "working prototype" and "ministers do not ask questions", and never the words "inactive" or "zero".
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement**: picker (state `<select>`, then constituency `<select>`, both keyboard-accessible) → `focusSeat` then navigate to `/mp/<mpsno>`; `mp.html` shows profile, ministry counts as a bar list, the feed (20 per page, "Load more"), ministry filter, in-feed search, "Asked"/"Answer" excerpts each with "Read the official answer" link, joint-question "Asked with …" line, "Last updated", prototype label, and the empty-state note. Vacant / former seats show "No sitting MP" or "Former MP".
- [ ] **Step 4: Run** → PASS. **Verify** on the preview: one active MP, one minister, one non-sitting record.
- [ ] **Step 5: Commit** `Add Find your MP and MP pages`.

### Task 11: Issues, search and follow

**Files:**
- Create: `web/js/topicpage.js`, `web/js/follow.js`, `web/topic.html`
- Modify: `web/index.html` (Issues room: 15 topic cards from `topics-data.js` + search box), `web/mp.html`, `web/js/main.js`
- Test: `tests/web/follow.test.js`

**Interfaces:**
- Produces in `follow.js`: `createFollows(storage = safeLocalStorage()) → { available: boolean, list(): { mps: number[], topics: string[], lastVisit: string|null }, toggleMp(id), toggleTopic(slug), isFollowing(kind, key), markVisited(nowIso) }`; `safeLocalStorage()` returns `null` if access throws.
- Produces: `shareLinks({ url, text }) → { whatsapp: string }` (`https://wa.me/?text=` + encoded text and URL).
- Consumes: `/api/topic/:slug`, `/api/search`, `/api/since`, `/api/rss/*`, `/api/calendar.ics`.

- [ ] **Step 1: Write failing tests**: with an in-memory storage stub, toggling an MP twice leaves it unfollowed; follows persist across a second `createFollows` on the same storage; a storage whose `getItem` throws gives `available: false` and every method is a safe no-op; `lastVisit` is null before the first `markVisited`; corrupt JSON in storage resets to empty follows instead of throwing; `shareLinks` encodes spaces and `&`.
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement**: topic page (feed, chamber `highlight` of MPs who raised it, top states and parties as bar lists), site search results, Follow buttons (hidden when `available` is false), "Since your last visit" strip on the home page calling `/api/since` with the stored follows and `lastVisit`, then `markVisited`; RSS and WhatsApp links on MP and topic pages; a "Save share card" button that draws a 1080×1350 PNG on a `<canvas>` (MP or topic name, three latest subjects, site URL, dark-stage colours) and downloads it; "Next session" card with `.ics` download.
- [ ] **Step 4: Run** → PASS. **Verify** in a private window that follow buttons are hidden or work without errors in the console.
- [ ] **Step 5: Commit** `Add issues, search, follows and share links`.

### Task 12: Manifesto reader

**Files:**
- Create: `web/js/manifestos.js`, `web/manifestos.html`
- Test: `tests/web/manifestos.test.js`

**Interfaces:**
- Consumes: `web/data/manifestos.json` (`parties`, `statements`, `excluded`, `method`).
- Produces: `byTopic(data) → Map<topic, Array<{ party, text, source, page }>>`; `compare(data, topic, parties[]) → Array<{ party, entries: [...] , mentioned: boolean }>`; `searchStatements(data, q) → [...]` (case-insensitive, matches text and topic).

- [ ] **Step 1: Write failing tests** against the real `manifestos.json`: `compare` for a party with no statement on a topic returns `mentioned: false` (rendered "Not mentioned in the manifesto"); `searchStatements(data, "")` returns `[]`; every entry from `byTopic` has a non-empty `source`.
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement** the page: browse by party or topic, compare up to 3 parties side by side, search, each line with source and page, link to the matcher, paper-card treatment.
- [ ] **Step 4: Run** → PASS.
- [ ] **Step 5: Commit** `Add manifesto reader`.

### Task 13: Methodology, restyle and launch checks

**Files:**
- Create: `web/method.html`
- Modify: `web/index.html`, `web/css/style.css` (matcher, bill, timeline, ledger in the new design; timeline and ledger as paper cards), `README.md` (what it is, data sources, how ingestion runs, licence notes: link to official PDFs rather than mirroring)

- [ ] **Step 1: Write `method.html`** covering: data sources (sansad.in, manifestos), nightly refresh and "last updated", topic rules (generated list from `topics-data.js`), excerpts verbatim and never reworded, seat layout grouped by party (not the official seating plan), why there are no voting records (voice votes), privacy (no accounts, follows stay in your browser), and how to report an error (GitHub issues link).
- [ ] **Step 2: Add the "Working prototype" label** to every page header, linking to `/method`.
- [ ] **Step 3: Restyle** the existing rooms; confirm the matcher, scenarios and timeline still work end to end.
- [ ] **Step 4: Launch checks** on the preview URL: Lighthouse mobile performance ≥ 80 and accessibility ≥ 90 on `/` and one `/mp/…` page; the chamber on a real mid-range Android phone over 4G is interactive within 3 seconds; no console errors; `npm test` passes.
- [ ] **Step 5: Commit** `Add methodology page and restyle existing rooms`, then merge to `main` once the owner approves the preview.
