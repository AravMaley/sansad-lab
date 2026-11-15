// Turns raw sansad.in records into the rows we store. Member records arrive
// with personal phone numbers, addresses, emails and family details; only the
// public, role-related fields below are ever kept.

export function normaliseMember(raw) {
  return {
    mpsno: raw.mpsno,
    name: raw.mpFirstLastName?.trim() || `${raw.firstName ?? ""} ${raw.lastName ?? ""}`.trim(),
    party: raw.partyFname ?? null,
    party_short: raw.partySname ?? null,
    state: raw.stateName ?? null,
    constituency: raw.constName ?? null,
    photo_url: raw.imageUrl ?? null,
    terms: raw.noOfTerms ?? null,
    status: raw.status ?? null,
  };
}

// "12.08.2026" or "12/08/2026" -> "2026-08-12"
export function isoDate(d) {
  const m = /^(\d{2})[./](\d{2})[./](\d{4})$/.exec(String(d ?? "").trim());
  return m ? `${m[3]}-${m[2]}-${m[1]}` : null;
}

export function normaliseQuestion(raw) {
  const lok_no = Number(raw.lokNo);
  const date = isoDate(raw.date);
  const type = String(raw.type ?? "").toUpperCase();
  return {
    id: `${lok_no}-${type}-${raw.quesNo}-${date}`,
    lok_no,
    ques_no: raw.quesNo,
    type,
    date,
    session_no: raw.sessionNo == null ? null : Number(raw.sessionNo),
    ministry: raw.ministry ?? null,
    subject: raw.subjects?.trim() ?? null,
    members_text: (raw.member ?? []).join(", "),
    doc_url: raw.questionsDocPath ?? null,
    pdf_url: raw.questionsFilePath ?? null,
  };
}
