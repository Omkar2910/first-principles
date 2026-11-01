// Checks every external markdown link in content/ and docs/.
// Broken links (404, 410, 5xx, network errors) fail the run; 401/403/429 are
// reported as warnings because many sites block automated requests.
import fs from "node:fs";
import path from "node:path";

const ROOTS = ["content", "docs"];
const CONCURRENCY = 8;
const TIMEOUT_MS = 20_000;

function* files(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* files(p);
    else if (/\.mdx?$/.test(entry.name)) yield p;
  }
}

/** url → files that link to it */
const links = new Map();
for (const root of ROOTS) {
  for (const file of files(root)) {
    for (const [, url] of fs.readFileSync(file, "utf-8").matchAll(/\]\((https?:\/\/[^)\s]+)\)/g)) {
      links.set(url, [...(links.get(url) ?? []), file]);
    }
  }
}

async function check(url) {
  try {
    const res = await fetch(url, {
      redirect: "follow",
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { "user-agent": "Mozilla/5.0 (link checker)" },
    });
    return res.status;
  } catch (err) {
    return err.name === "TimeoutError" ? "timeout" : "network error";
  }
}

const urls = [...links.keys()];
const results = [];
for (let i = 0; i < urls.length; i += CONCURRENCY) {
  const batch = urls.slice(i, i + CONCURRENCY);
  results.push(...(await Promise.all(batch.map(async (url) => ({ url, status: await check(url) })))));
}

// Some hosts throttle parallel requests: retry network failures and timeouts once, one at a time.
for (const r of results.filter((r) => typeof r.status !== "number")) {
  r.status = await check(r.url);
}

const blocked = results.filter((r) => [401, 403, 429].includes(r.status));
const broken = results.filter((r) => typeof r.status !== "number" || (r.status >= 400 && !blocked.includes(r)));

for (const r of blocked) console.warn(`warn  ${r.status}  ${r.url}\n        in ${links.get(r.url).join(", ")}`);
for (const r of broken) console.error(`FAIL  ${r.status}  ${r.url}\n        in ${links.get(r.url).join(", ")}`);
console.log(`\n${urls.length} links checked: ${urls.length - broken.length - blocked.length} ok, ${blocked.length} blocked, ${broken.length} broken.`);
process.exit(broken.length ? 1 : 0);
