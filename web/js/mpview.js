// Pure helpers for MP pages (no DOM), shared by the page and its tests.

const nf = new Intl.NumberFormat("en-IN");
export const formatCount = (n) => nf.format(n);

// The headline count; null for zero, so the page never leads with "0".
export function totalLine(total) {
  if (!total) return null;
  return `${formatCount(total)} ${total === 1 ? "question" : "questions"} asked in the 18th Lok Sabha`;
}

export const ministryLabel = (m) => (m ?? "Unknown ministry").toLowerCase();

export function statusLabel(member) {
  if (!member || member.status === "Sitting") return null;
  return "Former MP";
}

export function emptyStateMessage(member, total) {
  if (total > 0) return null;
  return (
    "We have no questions on record for this MP yet. Sansad Lab is a working prototype: " +
    "ministers do not ask questions, the Speaker presides rather than asks, some MPs ask few, " +
    "and our data may not have caught up. This is not a measure of their work."
  );
}
