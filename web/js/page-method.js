// Fills in the topic rules on the methodology page. Lives in its own file
// because the site's content policy does not allow scripts written inside the page.
import { TOPICS } from "./topics-data.js";
import { el } from "./util.js";

document.getElementById("topic-rules").append(el("dl", {}, TOPICS.flatMap((t) => [
  el("dt", {}, t.label),
  el("dd", {}, "Ministries: ", t.ministries.map((m) => m.toLowerCase()).join("; "), ". Keywords: ",
    el("code", {}, t.keywords.replace(/\\b|\(|\)/g, "").split("|").join(", "))),
])));
