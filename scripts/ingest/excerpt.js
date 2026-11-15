// Cuts the question and the government's answer out of an official
// question document's text, and builds short excerpts from them.
// Excerpts are always a verbatim run of the original words.

const MAX_WORDS = 60;
const MIN_SENTENCE_WORDS = 15;
const NONE = { questionText: null, answerText: null, questionExcerpt: null, answerExcerpt: null };

const isAskerLine = (l) => /^\*?\d+\.\s/.test(l);
const isWillLine = (l) => /^will the (prime )?minister\b.*\bstate\b/i.test(l);
const isAnswerHeading = (l) => /^ANSWER\b/.test(l);
const isMinisterLine = (l) => /^(THE )?(PRIME )?MINISTER\b|^(THE )?MINISTER OF STATE\b|^\(.*\)$/.test(l);
const isStars = (l) => /^\*{3,}$/.test(l);
const LAID = /statement is laid on the table/i;

export function buildExcerpts(text) {
  if (!text) return { ...NONE };
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

  const ask = lines.findIndex(isAskerLine);
  const ans = lines.findIndex((l, i) => i > ask && isAnswerHeading(l));
  if (ask < 0 || ans < 0) return { ...NONE };

  const qLines = lines.slice(ask + 1, ans).filter((l) => !isWillLine(l));

  let i = ans + 1;
  while (i < lines.length && isMinisterLine(lines[i])) i++;
  let aLines = lines.slice(i);
  if (LAID.test(aLines.slice(0, 3).join(" ").slice(0, 200))) {
    const s = aLines.findIndex((l) => /^THE STATEMENT REFERRED TO/i.test(l));
    aLines = s >= 0 ? aLines.slice(s + 1) : [];
  }
  const stop = aLines.findIndex(isStars);
  if (stop >= 0) aLines = aLines.slice(0, stop);

  const questionText = qLines.join("\n") || null;
  const answerText = aLines.join("\n") || null;
  return {
    questionText,
    answerText,
    questionExcerpt: excerpt(questionText),
    answerExcerpt: excerpt(answerText),
  };
}

// First MAX_WORDS words, ending on the last sentence break inside them;
// a hard cut with an ellipsis when no sentence ends early enough.
export function excerpt(text) {
  if (!text) return null;
  const w = text.split(/\s+/).filter(Boolean);
  if (w.length <= MAX_WORDS) return w.join(" ");
  const head = w.slice(0, MAX_WORDS);
  for (let n = MAX_WORDS; n >= MIN_SENTENCE_WORDS; n--) {
    if (/[.?;]$/.test(head[n - 1]) && !/^\(?[a-z0-9]{1,3}\.$/i.test(head[n - 1])) return head.slice(0, n).join(" ");
  }
  return head.join(" ") + "…";
}
