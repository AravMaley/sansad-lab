// Polite HTTP client for sansad.in: one request at a time, a fixed pause
// between requests, a named user agent, and retries on server errors.

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export const USER_AGENT = "SansadLab/1.0 (+https://github.com/AravMaley/sansad-lab)";

// A dropped connection ("fetch failed") throws instead of returning a status.
// Name the cause and the URL, so the error annotation says what broke.
function describe(e, url) {
  const cause = e?.cause?.code ?? e?.cause?.message;
  return new Error(`${e?.message ?? e}${cause ? ` (${cause})` : ""} for ${url}`, { cause: e });
}

// Wraps fetch so thrown network errors are retried with a growing pause.
// Used for the database client; sansad.in requests go through createHttp.
export function withRetry(fetchImpl = fetch, { tries = 4, waitMs = 3000 } = {}) {
  return async (url, opts) => {
    for (let attempt = 1; ; attempt++) {
      try {
        return await fetchImpl(url, opts);
      } catch (e) {
        if (attempt >= tries) throw describe(e, String(url).split("?")[0]);
        await sleep(waitMs * attempt);
      }
    }
  };
}

export function createHttp({ fetchImpl = fetch, delayMs = 500, retries = 2, retryWaitMs = 5000, userAgent = USER_AGENT } = {}) {
  let last = 0;
  let queue = Promise.resolve();

  // Serialises every request and enforces the gap between them.
  function request(url) {
    const run = queue.then(async () => {
      for (let attempt = 0; ; attempt++) {
        const wait = last + delayMs - Date.now();
        if (wait > 0) await sleep(wait);
        last = Date.now();
        let res;
        try {
          res = await fetchImpl(url, { headers: { "User-Agent": userAgent, Accept: "*/*" } });
        } catch (e) {
          if (attempt >= retries) throw describe(e, url);
          await sleep(retryWaitMs * (attempt + 1));
          continue;
        }
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
