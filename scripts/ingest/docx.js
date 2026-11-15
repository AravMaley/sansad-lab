// Extracts plain text from a .docx (a zip holding word/document.xml).
// Returns null for anything else, e.g. an old binary .doc.
import { unzipSync, strFromU8 } from "fflate";

const ENTITIES = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" };

export function docxToText(bytes) {
  if (!bytes || bytes.length < 4 || bytes[0] !== 0x50 || bytes[1] !== 0x4b) return null;
  let xml;
  try {
    const files = unzipSync(bytes, { filter: (f) => f.name === "word/document.xml" });
    if (!files["word/document.xml"]) return null;
    xml = strFromU8(files["word/document.xml"]);
  } catch {
    return null;
  }
  return xml
    .replace(/<w:tab\/>/g, " ")
    .replace(/<w:br[^>]*\/>/g, "\n")
    .replace(/<\/w:p>/g, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&(#x?[0-9a-f]+|\w+);/gi, (m, e) => {
      if (e[0] === "#") return String.fromCodePoint(e[1].toLowerCase() === "x" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10));
      return ENTITIES[e] ?? m;
    })
    .replace(/ /g, " ")
    .split("\n")
    .map((l) => l.replace(/[ \t]+/g, " ").trim())
    .filter(Boolean)
    .join("\n");
}
