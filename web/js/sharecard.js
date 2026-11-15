// Draws a 1080×1350 share card on a canvas and downloads it as a PNG.

function wrap(ctx, text, maxWidth) {
  const words = String(text).split(/\s+/);
  const lines = [];
  let line = "";
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxWidth && line) { lines.push(line); line = w; }
    else line = test;
  }
  if (line) lines.push(line);
  return lines;
}

export async function downloadShareCard({ kicker, title, items, filename }) {
  await document.fonts?.ready;
  const W = 1080, H = 1350, P = 88;
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const ctx = c.getContext("2d");

  const g = ctx.createRadialGradient(W / 2, -200, 50, W / 2, -200, 1100);
  g.addColorStop(0, "#1d3b30"); g.addColorStop(1, "#0e1a16");
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

  // A small hemicycle mark.
  ctx.strokeStyle = "#ffcf6e"; ctx.lineWidth = 14;
  ctx.beginPath(); ctx.arc(P + 44, P + 70, 44, Math.PI, 0); ctx.stroke();

  ctx.fillStyle = "#a9b3a6"; ctx.font = "500 30px Inter, sans-serif";
  ctx.fillText(kicker.toUpperCase(), P, P + 170);

  ctx.fillStyle = "#f5f1e8"; ctx.font = "600 84px Fraunces, Georgia, serif";
  let y = P + 270;
  for (const l of wrap(ctx, title, W - 2 * P).slice(0, 3)) { ctx.fillText(l, P, y); y += 96; }

  y += 30;
  ctx.font = "400 36px Inter, sans-serif";
  for (const item of items.slice(0, 3)) {
    ctx.fillStyle = "#ffcf6e"; ctx.fillRect(P, y - 24, 10, 10);
    ctx.fillStyle = "#f5f1e8";
    for (const l of wrap(ctx, item, W - 2 * P - 40).slice(0, 2)) { ctx.fillText(l, P + 40, y); y += 50; }
    y += 34;
  }

  ctx.fillStyle = "#a9b3a6"; ctx.font = "500 32px Inter, sans-serif";
  ctx.fillText("sansad-lab-web.vercel.app", P, H - P);
  ctx.fillStyle = "#f5f1e8"; ctx.font = "600 40px Fraunces, Georgia, serif";
  ctx.textAlign = "right"; ctx.fillText("Sansad Lab", W - P, H - P);

  const blob = await new Promise((r) => c.toBlob(r, "image/png"));
  const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: filename });
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
