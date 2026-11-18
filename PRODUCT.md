# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Engaged citizens across India: any curious adult who wants to check what their MP has actually done, follow an issue they care about, or compare what parties promised. They arrive with a specific question (who is my MP, what did the government answer on exams, what did the BJP manifesto say about UCC) and expect a sourced answer without wading through sansad.in.

## Product Purpose

Sansad Lab makes the 18th Lok Sabha legible by letting people do things with it: find their MP's questions and the government's answers, follow issues, read manifestos side by side, match their views against party stances, vote on real laws and see the real record. Success is a visitor leaving with a correct, cited answer they could not easily have found elsewhere.

## Positioning

Every figure links to a primary source (sansad.in, party manifestos with page numbers, PRS, gazettes). Where a source is missing, the site says so instead of guessing: parties without obtainable manifestos are left out of the matcher, "silent" is never scored against a party, and protest movements without a free photograph show no photograph.

## Operating Context

- Static site in `web/` served by Vercel with no build step; Vercel functions in `web/api/` read a Supabase Postgres database.
- A nightly GitHub Actions job ingests members and questions from sansad.in.
- `main` is production; every other branch gets a Vercel preview URL.
- Pages: home (The House), Your MP, MPs, Issues, topic pages, Manifestos, Bills (You Be the MP), Timeline (The Street), Method.

## Capabilities and Constraints

- The 543-seat dot field (Canvas 2D) drifts behind every page and highlights the MP or parties being read about. It must stay readable over text: content sits above it, never competes with it.
- Reduced motion stills the dots; the field pauses when the tab is hidden.
- Light and dark themes are both supported.
- Personal details of MPs (phones, addresses, emails, family) are never stored or shown.
- Only freely licensed images, each credited.

## Brand Commitments

- Name: Sansad Lab. Wordmark is serif with an italic accent word.
- Voice: plain, factual, and candid about gaps. It doesn't take sides, and it gives verdicts only where the record supports them.
- Existing identity ("paper and ink", chamber green and maroon accents, NDA/INDIA alliance colours) is kept; the current redesign refines it rather than replacing it.

## Evidence on Hand

- `web/data/*.json`, `laws/*.json`: sourced data behind every page.
- `reports/`, `research_notes/`: research behind each figure.
- No testimonials, usage numbers or press; do not invent any.

## Product Principles

1. Source or silence: never show a claim without its citation.
2. Answer the visitor's question first; context and depth second.
3. Neutral across parties in layout, colour weight and wording.
4. Readable before decorative: the dots are atmosphere, text is the content.

## Accessibility & Inclusion

Readers on cheap Android phones and slow connections are a core audience; text contrast must hold over the animated background, and every interaction must work with reduced motion and keyboard.
