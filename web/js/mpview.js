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
    "No questions on record for this MP yet. " +
    "Sansad Lab is a working prototype, so our data may not have caught up. " +
    "Some MPs also ask few questions, and ministers do not ask questions at all. " +
    "This is not a measure of anyone's work."
  );
}
