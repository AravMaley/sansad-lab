// Builders for RSS 2.0 feeds and the .ics session calendar.

const esc = (s) =>
  String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function toRss({ title, link, description = "", items }) {
  const body = items
    .map((i) => {
      const url = i.pdfUrl || i.docUrl || link;
      return [
        "<item>",
        `<title>${esc(i.subject)}</title>`,
        `<link>${esc(url)}</link>`,
        `<guid isPermaLink="false">${esc(i.id)}</guid>`,
        `<pubDate>${new Date(`${i.date}T00:00:00Z`).toUTCString()}</pubDate>`,
        `<description>${esc([i.ministry, i.answerExcerpt].filter(Boolean).join(" — "))}</description>`,
        "</item>",
      ].join("");
    })
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel>
<title>${esc(title)}</title>
<link>${esc(link)}</link>
<description>${esc(description)}</description>
${body}
</channel></rss>`;
}

const ymd = (iso) => iso.replace(/-/g, "");
function nextDay(iso) {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

export function toIcs({ sessions, stamp = new Date().toISOString() }) {
  const dtstamp = stamp.replace(/[-:]/g, "").replace(/\.\d+/, "");
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Sansad Lab//Parliament sessions//EN", "CALSCALE:GREGORIAN"];
  for (const s of sessions) {
    lines.push(
      "BEGIN:VEVENT",
      `UID:ls${s.lok_no}-session${s.session_no}@sansad-lab`,
      `DTSTAMP:${dtstamp}`,
      `DTSTART;VALUE=DATE:${ymd(s.start_date)}`,
      `DTEND;VALUE=DATE:${ymd(nextDay(s.end_date ?? s.start_date))}`,
      `SUMMARY:Lok Sabha sits (session ${s.session_no})`,
      "DESCRIPTION:Parliament is in session. See what your MP asks at sansad-lab-web.vercel.app",
      "END:VEVENT",
    );
  }
  lines.push("END:VCALENDAR");
  return lines.join("\r\n") + "\r\n";
}
