const $ = (sel) => document.querySelector(sel);

async function loadJSON(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Failed to load ${path}`);
  return res.json();
}

function el(tag, text) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  return node;
}

// Tabs
document.querySelectorAll("nav button").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll("nav button").forEach((b) => b.classList.toggle("active", b === btn));
    document.querySelectorAll("main > section").forEach((s) => {
      s.hidden = s.id !== btn.dataset.tab;
    });
  });
});

// Manifesto Matcher
async function initMatcher() {
  const data = await loadJSON("data/manifestos.json");
  const box = $("#statements");

  data.statements.forEach((st) => {
    const wrap = el("div");
    wrap.className = "statement";
    wrap.appendChild(el("p", st.text));
    [["1", "Agree"], ["0", "Neutral"], ["-1", "Disagree"]].forEach(([val, label]) => {
      const lab = el("label");
      const input = document.createElement("input");
      input.type = "radio";
      input.name = st.id;
      input.value = val;
      if (val === "0") input.checked = true;
      lab.append(input, " " + label);
      wrap.appendChild(lab);
    });
    box.appendChild(wrap);
  });

  $("#match-btn").addEventListener("click", () => {
    const answers = {};
    data.statements.forEach((st) => {
      answers[st.id] = Number(document.querySelector(`input[name="${st.id}"]:checked`).value);
    });

    const scores = data.parties.map((p) => {
      let score = 0;
      let max = 0;
      data.statements.forEach((st) => {
        const a = answers[st.id];
        if (a === 0) return; // skipped statements don't count
        max += 1;
        score += a * (st.stances[p.id] ?? 0);
      });
      // map [-max, max] to 0-100
      const pct = max === 0 ? 0 : Math.round(((score + max) / (2 * max)) * 100);
      return { name: p.name, pct };
    }).sort((a, b) => b.pct - a.pct);

    const out = $("#match-result");
    out.replaceChildren();
    scores.forEach((s) => {
      const row = el("div");
      row.className = "result-row";
      row.appendChild(el("div", `${s.name}: ${s.pct}%`));
      const bar = el("div");
      bar.className = "bar";
      const fill = el("span");
      fill.style.width = s.pct + "%";
      bar.appendChild(fill);
      row.appendChild(bar);
      out.appendChild(row);
    });
  });
}

// You Be the MP
async function initMP() {
  const sc = await loadJSON("data/farm-laws-2020.json");
  $("#scenario-title").textContent = `${sc.title} (${sc.year})`;
  $("#scenario-summary").textContent = sc.summary;
  sc.arguments_for.forEach((t) => $("#args-for").appendChild(el("li", t)));
  sc.arguments_against.forEach((t) => $("#args-against").appendChild(el("li", t)));

  sc.choices.forEach((c) => {
    const b = el("button", c.label);
    b.addEventListener("click", () => {
      const out = $("#mp-result");
      out.replaceChildren(
        el("p", c.outcome),
        el("h3", "What actually happened"),
        el("p", sc.what_happened)
      );
    });
    $("#choices").appendChild(b);
  });
}

initMatcher().catch((e) => { $("#match-result").textContent = e.message; });
initMP().catch((e) => { $("#mp-result").textContent = e.message; });
