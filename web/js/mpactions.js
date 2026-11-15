// Follow, share and share-card actions on MP pages (loaded alongside mppage.js).
import { el } from "./util.js";
import { createFollows, followButton, shareButton } from "./follow.js";
import { downloadShareCard } from "./sharecard.js";

const follows = createFollows();
let done = false;

document.addEventListener("mp:loaded", ({ detail }) => {
  if (done || !detail?.member) return;
  done = true;
  const m = detail.member;
  const url = `${location.origin}/mp/${m.mpsno}`;
  const slot = document.getElementById("mp-actions");
  if (!slot) return;
  slot.replaceChildren(
    followButton(follows, "mp", m.mpsno, "this MP") ?? "",
    shareButton({ url, text: `What ${m.name} (${m.constituency}) asked in Parliament:` }),
    el("button", {
      class: "btn btn-quiet", type: "button",
      onclick: () => downloadShareCard({
        kicker: `${m.constituency} · ${m.state}`,
        title: m.name,
        items: detail.items.slice(0, 3).map((i) => i.subject),
        filename: `sansad-lab-${m.mpsno}.png`,
      }),
    }, "Save share card"),
  );
});
