// Polite HTTP client for sansad.in: one request at a time, a fixed pause
// between requests, a named user agent, and retries on server errors.

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export const USER_AGENT = "SansadLab/1.0 (+https://github.com/AravMaley/sansad-lab)";

export function createHttp({ fetchImpl = fetch, delayMs = 500, retries = 2, userAgent = USER_AGENT } = {}) {
  let last = 0;
  let queue = Promise.resolve();

  // Serialises every request and enforces the gap between them.
  function request(url) {
    const run = queue.then(async () => {
      for (let attempt = 0; ; attempt++) {
        const wait = last + delayMs - Date.now();
        if (wait > 0) await sleep(wait);
        last = Date.now();
        const res = await fetchImpl(url, { headers: { "User-Agent": userAgent, Accept: "*/*" } });
        if (res.status >= 500 && attempt < retries) continue;
        return res;
      }
    });
    queue = run.catch(() => {});
    return run;
  }

  return {
    async getJson(url) {
      const res = await request(url);
      if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
      return res.json();
    },
    async getBuffer(url) {
      const res = await request(url);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
      return new Uint8Array(await res.arrayBuffer());
    },
  };
}
