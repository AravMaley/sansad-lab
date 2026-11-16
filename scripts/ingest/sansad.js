// Wrappers for the (undocumented) sansad.in JSON endpoints used by ingestion.
import { isoDate } from "./members.js";

const BASE = "https://sansad.in";

export function sansad(http, lokNo = 18) {
  return {
    async members() {
      const all = [];
      for (let page = 1, pages = 1; page <= pages; page++) {
        const r = await http.getJson(`${BASE}/api_ls/member?loksabha=${lokNo}&page=${page}&size=50&locale=en`);
        pages = r.metaDatasDto?.totalPages ?? 1;
        all.push(...(r.membersDtoList ?? []));
      }
      return all;
    },
    // This endpoint ignores "page" and always returns page 1; "pageNo" is the
    // parameter that moves through the results.
    async questionsForMember(mpsno, page = 1) {
      const r = await http.getJson(
        `${BASE}/api_ls/question/qetFilteredQuestionsAns?loksabhaNo=${lokNo}&pageNo=${page}&size=10&locale=en&memberCode=${mpsno}`,
      );
      const block = Array.isArray(r) ? r[0] : r;
      return { total: block?.totalRecordSize ?? 0, items: block?.listOfQuestions ?? [] };
    },
    async sessions() {
      return normaliseSessions(await http.getJson(`${BASE}/api_ls/business/AllLoksabhaAndSessionDates`), lokNo);
    },
  };
}

// sessionPeriod is a list like ["28/01/2026 to 02/04/2026", "16/04/2026 to 18/04/2026"]
// (a session can sit in parts); the session runs from the first start to the last end.
export function normaliseSessions(raw, lokNo = 18) {
  const out = [];
  for (const ls of raw ?? []) {
    if (ls.loksabha !== lokNo) continue;
    for (const s of ls.sessions ?? []) {
      const parts = (s.sessionPeriod ?? []).map((p) => p.split(/\s+to\s+/i).map(isoDate));
      if (!parts.length) continue;
      out.push({
        lok_no: lokNo,
        session_no: s.sessionNo,
        start_date: parts[0][0],
        end_date: parts[parts.length - 1][1] ?? parts[parts.length - 1][0],
      });
    }
  }
  return out;
}
