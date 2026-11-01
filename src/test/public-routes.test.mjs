import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import { after, before, test } from "node:test";
import { setTimeout as delay } from "node:timers/promises";

let server;
let origin;
let output = "";
before(async () => {
  server = spawn(
    process.execPath,
    [
      "node_modules/next/dist/bin/next",
      "start",
      "--hostname",
      "127.0.0.1",
      "--port",
      "0",
    ],
    {
      env: {
        ...process.env,
        SUPABASE_URL: "",
        SUPABASE_PUBLISHABLE_KEY: "",
        NEXT_TELEMETRY_DISABLED: "1",
      },
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  server.stdout.on("data", (chunk) => {
    output += chunk;
  });
  server.stderr.on("data", (chunk) => {
    output += chunk;
  });
  for (let attempt = 0; attempt < 100; attempt++) {
    const port = output.match(/http:\/\/127\.0\.0\.1:(\d+)/)?.[1];
    if (port) {
      origin = `http://127.0.0.1:${port}`;
      try {
        if ((await fetch(origin)).ok) return;
      } catch {
        /* Wait for readiness. */
      }
    }
    if (server.exitCode !== null) throw new Error(`Preview exited: ${output}`);
    await delay(100);
  }
  throw new Error(`Preview did not become ready: ${output}`);
});
after(async () => {
  if (server && server.exitCode === null) {
    const closed = new Promise((resolve) => server.once("close", resolve));
    server.kill("SIGTERM");
    await closed;
  }
});

const routes = [
  "/",
  "/about",
  "/services",
  "/projects",
  "/reviews",
  "/contact",
  "/faq",
  "/privacy",
];
for (const route of routes) {
  test(`public route ${route} is accessible and respects the indexing policy`, async () => {
    const response = await fetch(origin + route);
    assert.equal(response.status, 200);
    const html = await response.text();
    assert.match(html, /<html[^>]*lang="en-AU"/);
    assert.equal((html.match(/<h1[ >]/g) || []).length, 1);
    assert.match(html, /<main[^>]*id="main-content"/);
    assert.match(html, /href="#main-content"/);
    assert.match(
      html,
      process.env.SITE_INDEXING_ENABLED === "true"
        ? /name="robots" content="index, follow"/
        : /name="robots" content="noindex, nofollow"/,
    );
    assert.match(html, /<title>[^<]+<\/title>/);
    assert.match(html, /name="description"/);
  });
}

test("every internal navigation link resolves", async () => {
  const html = await (await fetch(origin)).text();
  const links = new Set(
    [...html.matchAll(/<a[^>]*href="(\/[^"#]*)"/g)].map((match) => match[1]),
  );
  assert.ok(links.has("/contact"));
  for (const link of links)
    assert.equal((await fetch(origin + link)).status, 200, link);
});

test("quotation fallback reaches verified direct contact channels", async () => {
  const html = await (await fetch(`${origin}/contact`)).text();
  assert.match(html, /href="tel:\+61497175163"/);
  assert.match(html, /href="mailto:emcarpentry.maintenance@gmail.com"/);
  assert.match(html, /href="https:\/\/www.facebook.com\/EMscarpentryworks"/);
  assert.doesNotMatch(html, /<form[ >]/);
});

test("owner routes fail closed when the backend is unconfigured", async () => {
  for (const route of [
    "/admin",
    "/admin/projects",
    "/admin/enquiries",
    "/admin/reviews",
    "/admin/settings",
    "/admin/content",
    "/admin/account",
    "/admin/export",
  ]) {
    const response = await fetch(origin + route, { redirect: "manual" });
    assert.equal(response.status, 307, route);
    assert.match(response.headers.get("location"), /^\/login/);
    assert.match(response.headers.get("cache-control"), /no-store/);
  }
  const login = await (await fetch(`${origin}/login`)).text();
  assert.match(login, /Owner sign-in is not configured/);
  assert.doesNotMatch(login, /<input[^>]*type="password"/);
  assert.equal(
    (await fetch(`${origin}/projects/unpublished-example`)).status,
    404,
  );
  assert.equal(
    (await fetch(`${origin}/media/55555555-5555-4555-8555-555555555555`))
      .status,
    404,
  );
});
test("public submission endpoints reject requests without accepting customer data", async () => {
  for (const route of ["/api/enquiries", "/api/reviews"]) {
    const response = await fetch(origin + route, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ example: "not collected" }),
    });
    assert.equal(response.status, 503);
    assert.match(response.headers.get("cache-control"), /no-store/);
    assert.match((await response.json()).error, /retention/);
  }
});

test("logo is served and robots blocks unfinished content", async () => {
  const logo = await fetch(`${origin}/images/brand/em-logo.webp`);
  assert.equal(logo.status, 200);
  assert.match(logo.headers.get("content-type"), /image\/webp/);
  const robots = await (await fetch(`${origin}/robots.txt`)).text();
  assert.match(
    robots,
    process.env.SITE_INDEXING_ENABLED === "true"
      ? /Disallow: \/admin/
      : /Disallow: \//,
  );
});

function luminance(hex) {
  const channels = hex
    .match(/[a-f\d]{2}/gi)
    .map((channel) => Number.parseInt(channel, 16) / 255);
  const [red, green, blue] = channels.map((channel) =>
    channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4,
  );
  return red * 0.2126 + green * 0.7152 + blue * 0.0722;
}
function contrast(first, second) {
  const [lighter, darker] = [luminance(first), luminance(second)].sort(
    (a, b) => b - a,
  );
  return (lighter + 0.05) / (darker + 0.05);
}
test("both themes meet AA contrast for normal text and focus indicators", async () => {
  const css = await readFile(
    new URL("../app/globals.css", import.meta.url),
    "utf8",
  );
  for (const theme of [":root", ':root[data-theme="dark"]']) {
    const start = css.indexOf(`${theme} {`);
    assert.ok(start >= 0, theme);
    const block = css.slice(start, css.indexOf("}", start));
    const tokens = Object.fromEntries(
      [...block.matchAll(/--([a-z-]+):\s*(#[a-f\d]{6})/gi)].map((match) => [
        match[1],
        match[2],
      ]),
    );
    for (const background of ["background", "surface"]) {
      for (const text of ["foreground", "muted", "accent"]) {
        assert.ok(
          contrast(tokens[text], tokens[background]) >= 4.5,
          `${theme}: ${text} on ${background}`,
        );
      }
      assert.ok(
        contrast(tokens.accent, tokens[background]) >= 3,
        `${theme} focus indicator`,
      );
    }
    assert.ok(
      contrast(tokens["button-text"], tokens.button) >= 4.5,
      `${theme} button text`,
    );
  }
});

test("verified business structured data is parseable and contains no invented claims", async () => {
  const html = await (await fetch(origin)).text();
  const match = html.match(
    /<script[^>]*id="business-structured-data"[^>]*>([\s\S]*?)<\/script>/,
  );
  assert.ok(match, "JSON-LD script is rendered");
  assert.match(html, /<title>EM Carpentry &amp; Home Maintenance<\/title>/);
  const business = JSON.parse(match[1]);
  assert.equal(business["@type"], "HomeAndConstructionBusiness");
  assert.equal(business.name, "EM Carpentry & Home Maintenance");
  assert.equal(business.telephone, "+61 497 175 163");
  assert.equal(business.foundingDate, "2018");
  assert.equal(
    business.areaServed.name,
    "Geelong, VIC, Australia, and nearby areas",
  );
  for (const key of [
    "address",
    "aggregateRating",
    "review",
    "priceRange",
    "openingHours",
  ])
    assert.equal(business[key], undefined, key);
});

test("sitemap and canonical metadata follow the build-time indexing settings", async () => {
  const expectedOrigin = process.env.SITE_URL?.replace(/\/$/, "");
  const enabled = process.env.SITE_INDEXING_ENABLED === "true";
  const sitemap = await (await fetch(`${origin}/sitemap.xml`)).text();
  assert.doesNotMatch(sitemap, /\/admin|\/api\//);
  if (!enabled) assert.doesNotMatch(sitemap, /<loc>/);
  else {
    assert.ok(expectedOrigin);
    assert.equal((sitemap.match(/<loc>/g) || []).length, routes.length);
  }
  for (const route of routes) {
    const html = await (await fetch(origin + route)).text();
    if (expectedOrigin) {
      const canonical = new URL(route, expectedOrigin).href;
      const canonicalTag = html.match(/rel="canonical" href="([^"]+)"/);
      assert.ok(canonicalTag, route);
      assert.equal(new URL(canonicalTag[1]).href, canonical, route);
      const graphUrl = html.match(/property="og:url" content="([^"]+)"/);
      assert.ok(graphUrl, route);
      assert.equal(new URL(graphUrl[1]).href, canonical, route);
      assert.match(html, /property="og:locale" content="en_AU"/);
      assert.match(html, /name="twitter:card" content="summary"/);
    } else assert.doesNotMatch(html, /rel="canonical"|property="og:url"/);
  }
});
