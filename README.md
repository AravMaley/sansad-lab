# Sansad Lab

Interactive civic tools for understanding India's Parliament.

## Prototypes

- **Manifesto Matcher** – answer policy statements, see which party manifesto you align with.
- **You Be the MP** – vote on a real bill (first scenario: the 2020 farm laws), then see what happened.

## Structure

```
web/             static site (Vercel serves this folder)
  index.html
  app.js
  style.css
  data/          JSON the site loads at runtime
laws/            one JSON file per law/scenario (source of truth)
data/money/      funding / finance datasets (placeholder for now)
```

`laws/` is the source of truth; `web/data/` holds copies the site can fetch. Keep them in sync until a build step exists.

## Run locally

fetch() needs HTTP, so don't open the file directly:

```
cd web
python -m http.server 8000
```

Then open http://localhost:8000.

## Data status

**Manifesto stances in `web/data/manifestos.json` are placeholder sample data** with fictional parties. Replace them with sourced, cited positions before any public launch. Each real entry should carry a `source` URL and page reference.

## Roadmap

Data stays in plain JSON so it can move to Postgres later (each file is a list of flat-ish records with stable `id`s).

## Deploy

Vercel: import the repo, set Root Directory to `web`, no build command.
