import assert from "node:assert/strict";

const target = process.argv[2];
if (!target)
  throw new Error(
    "Usage: npm run check:preview -- https://your-test-site.example",
  );
const origin = new URL(target);
const intakeEnabled = process.argv.includes("--intake-enabled");
if (
  !["http:", "https:"].includes(origin.protocol) ||
  origin.username ||
  origin.password ||
  origin.pathname !== "/" ||
  origin.search ||
  origin.hash
)
  throw new Error("Supply an HTTP(S) origin without credentials or a path.");
const request = (path, init = {}) =>
  fetch(new URL(path, origin), { ...init, signal: AbortSignal.timeout(25000) });
const assets = new Set();
for (const path of [
  "/",
  "/about",
  "/services",
  "/projects",
  "/reviews",
  "/contact",
  "/faq",
  "/privacy",
  "/login",
]) {
  const response = await request(path);
  assert.equal(response.status, 200, path);
  const html = await response.text();
  assert.match(html, /<html[^>]*lang="en-AU"/, path);
  assert.match(html, /name="robots" content="noindex, nofollow"/, path);
  if (path === "/login") {
    assert.match(
      html,
      /type="password"/,
      "Connected login form must be present",
    );
    assert.match(response.headers.get("cache-control") || "", /no-store/);
  }
  for (const match of html.matchAll(/(?:src|href)="([^"<>]+)"/g)) {
    const asset = match[1].replaceAll("&amp;", "&");
    if (asset.startsWith("/_next/static/") || asset.startsWith("/_next/image"))
      assets.add(asset);
  }
  console.log(`PASS public response, decompression and noindex: ${path}`);
}
assert.ok(assets.size > 0, "Expected referenced application assets");
for (const path of assets) {
  const response = await request(path);
  assert.equal(response.status, 200, `Referenced asset: ${path}`);
  // Fully consume the body so compression/streaming errors are detected.
  await response.arrayBuffer();
}
console.log(`PASS ${assets.size} referenced script/style/image assets`);
for (const path of ["/api/enquiries", "/api/reviews"]) {
  // Deliberately incomplete: this check must never submit customer data.
  const response = await request(path, {
    method: "POST",
    headers: { Origin: origin.origin, "Content-Type": "application/json" },
    body: "{}",
  });
  assert.equal(response.status, intakeEnabled ? 400 : 503, path);
  assert.match(response.headers.get("cache-control") || "", /no-store/);
  await response.body?.cancel();
  console.log(
    `PASS ${intakeEnabled ? "invalid intake rejected" : "public intake remains disabled"}: ${path}`,
  );
}
const tokenResponse = await request("/api/intake/token?kind=enquiry");
assert.equal(tokenResponse.status, intakeEnabled ? 200 : 503);
assert.match(tokenResponse.headers.get("cache-control") || "", /no-store/);
await tokenResponse.body?.cancel();
console.log("PASS form security check matches the expected intake state");
const robots = await request("/robots.txt");
assert.equal(robots.status, 200);
assert.match(await robots.text(), /Disallow: \//);
const sitemap = await request("/sitemap.xml");
assert.equal(sitemap.status, 200);
assert.doesNotMatch(await sitemap.text(), /<url>/);
console.log("PASS crawling disabled and sitemap empty");
console.log(
  "These HTTP checks do not replace browser interaction, real owner sessions or upload testing.",
);
