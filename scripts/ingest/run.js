// Nightly ingestion: members, sessions, and each sitting MP's questions,
// newest first, until reaching questions already stored. Resumable: a run
// that hits its time budget stops, and the next run carries on.
//
//   node scripts/ingest/run.js [--budget-min=50] [--only=5814]
//   env: SUPABASE_URL, SUPABASE_SERVICE_KEY
import { pathToFileURL } from "node:url";
import { createHttp } from "./http.js";
import { sansad } from "./sansad.js";
import { normaliseMember, normaliseQuestion } from "./members.js";
import { docxToText } from "./docx.js";
import { buildExcerpts } from "./excerpt.js";
import { tagTopics } from "./topics.js";
import { createStore } from "./store.js";

const MAX_PAGES_PER_MP = 1000;

export async function ingest({ api, store, http, now = Date.now, budgetMs, only, log = () => {} }) {
  const start = now();
  const out = { members: 0, newQuestions: 0, linked: 0, docFailures: 0, stoppedEarly: false };

  const members = (await api.members()).map(normaliseMember);
  await store.upsertMembers(members);
  out.members = members.length;
  await store.upsertSessions(await api.sessions());

  const targets = members.filter((m) => (only ? m.mpsno === Number(only) : m.status === "Sitting"));
  // MPs whose full history has been loaded once. Until then a known page
  // does not mean "caught up": an earlier run may have stopped mid-history.
  const backfilled = new Set(JSON.parse((await store.getMeta("backfilled")) ?? "[]"));

  outer: for (const m of targets) {
    for (let page = 1; page <= MAX_PAGES_PER_MP; page++) {
      if (now() - start > budgetMs) {
        out.stoppedEarly = true;
        break outer;
      }
      const { items } = await api.questionsForMember(m.mpsno, page);
      if (!items.length) {
        if (!backfilled.has(m.mpsno)) {
          backfilled.add(m.mpsno);
          await store.setMeta("backfilled", JSON.stringify([...backfilled]));
        }
        break;
      }

      const qs = items.map(normaliseQuestion);
      const known = await store.knownQuestionIds(qs.map((q) => q.id));
      const fresh = qs.filter((q) => !known.has(q.id));

      const rows = [];
      for (const q of fresh) rows.push(await withText(q, http, out));
      await store.upsertQuestions(rows);
      await store.linkMembers(qs.map((q) => ({ question_id: q.id, mpsno: m.mpsno })));
      out.newQuestions += rows.length;
      out.linked += qs.length;

      if (!fresh.length && backfilled.has(m.mpsno)) break; // caught up
    }
    log(`MP ${m.mpsno} done`);
  }

  await store.setMeta("last_updated", new Date().toISOString());
  return out;
}

async function withText(q, http, out) {
  let text = null;
  try {
    text = q.doc_url ? docxToText(await http.getBuffer(q.doc_url)) : null;
  } catch {
    text = null;
  }
  if (!text) out.docFailures++;
  const e = buildExcerpts(text);
  return {
    ...q,
    question_text: e.questionText,
    answer_text: e.answerText,
    question_excerpt: e.questionExcerpt,
    answer_excerpt: e.answerExcerpt,
    topics: tagTopics(q),
  };
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const arg = (k) => process.argv.find((a) => a.startsWith(`--${k}=`))?.split("=")[1];
  const { SUPABASE_URL, SUPABASE_SERVICE_KEY } = process.env;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error("Set SUPABASE_URL and SUPABASE_SERVICE_KEY");
    process.exit(1);
  }
  const http = createHttp();
  const result = await ingest({
    api: sansad(http),
    http,
    store: createStore({ url: SUPABASE_URL, serviceKey: SUPABASE_SERVICE_KEY }),
    budgetMs: Number(arg("budget-min") ?? 50) * 60_000,
    only: arg("only"),
    log: console.log,
  });
  console.log(JSON.stringify(result));
}
