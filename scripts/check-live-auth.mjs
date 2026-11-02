import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { resolveSupabaseConfig } from "../src/lib/db/config.ts";

// Read-only HTTP verification. Never accepts or reads a real user's credentials.
if (existsSync(".env.local")) process.loadEnvFile(".env.local");
const config = resolveSupabaseConfig(process.env);
if (!config) throw new Error("Configure the backend in .env.local first.");
const origin = new URL(process.argv[2] || "http://localhost:3000");
if (
  !["http:", "https:"].includes(origin.protocol) ||
  origin.username ||
  origin.password ||
  origin.pathname !== "/" ||
  origin.search ||
  origin.hash
)
  throw new Error("Supply an HTTP(S) origin without credentials or a path.");

const cookieName = `sb-${new URL(config.url).hostname.split(".")[0]}-auth-token`;
const encode = (value) =>
  Buffer.from(JSON.stringify(value)).toString("base64url");
const subject = randomUUID();
const token = `${encode({ alg: "HS256", typ: "JWT" })}.${encode({
  sub: subject,
  role: "authenticated",
  aud: "authenticated",
  exp: Math.floor(Date.now() / 1000) + 3600,
})}.${Buffer.alloc(32).toString("base64url")}`;
const forgedSession = `base64-${encode({
  access_token: token,
  refresh_token: "invalid-verification-refresh-token",
  token_type: "bearer",
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  user: { id: subject, role: "authenticated", app_metadata: { role: "admin" } },
})}`;
const routes = [
  "/admin",
  "/admin/projects",
  `/admin/projects/${randomUUID()}`,
  "/admin/enquiries",
  "/admin/reviews",
  "/admin/enquiries?status=new&page=2",
  "/admin/reviews?status=pending&page=2",
  "/admin/settings",
  "/admin/content",
  "/admin/account",
  "/admin/export",
];
const scenarios = [
  ["anonymous", undefined],
  ["malformed session", `${cookieName}=base64-invalid`],
  ["forged authenticated session", `${cookieName}=${forgedSession}`],
];
let failures = 0;
for (const [name, cookie] of scenarios) {
  let passed = 0;
  for (const route of routes) {
    try {
      const response = await fetch(new URL(route, origin), {
        redirect: "manual",
        headers: cookie ? { Cookie: cookie } : {},
        signal: AbortSignal.timeout(20000),
      });
      assert.equal(response.status, 307);
      const location = new URL(response.headers.get("location") || "", origin);
      assert.equal(location.origin, origin.origin);
      assert.equal(location.pathname, "/login");
      assert.match(response.headers.get("cache-control") || "", /no-store/);
      await response.body?.cancel();
      passed++;
    } catch {
      failures++;
      // Do not print response bodies, cookies or provider errors.
      console.error(
        `FAIL ${name}: ${route} did not safely redirect to sign-in`,
      );
    }
  }
  console.log(`${name}: ${passed}/${routes.length} protected routes passed`);
}
for (const path of [
  "/server/app/admin/page.js",
  "/package.json",
  "/.env.local",
  "/.netlify/state.json",
]) {
  try {
    const response = await fetch(new URL(path, origin), {
      redirect: "manual",
      signal: AbortSignal.timeout(20000),
    });
    assert.equal(response.status, 404);
    await response.body?.cancel();
    console.log(`PASS build/configuration files are not public: ${path}`);
  } catch {
    failures++;
    console.error(
      `FAIL build/configuration path must be inaccessible: ${path}`,
    );
  }
}
for (const path of [
  "/media/not-a-uuid",
  "/media/55555555-5555-4555-8555-555555555555",
]) {
  try {
    const response = await fetch(new URL(path, origin), {
      signal: AbortSignal.timeout(20000),
    });
    assert.equal(response.status, 404);
    assert.match(response.headers.get("cache-control") || "", /private/);
    assert.match(response.headers.get("cache-control") || "", /no-store/);
    assert.equal(response.headers.get("x-content-type-options"), "nosniff");
    await response.body?.cancel();
    console.log(`PASS unavailable media is non-storable: ${path}`);
  } catch {
    failures++;
    console.error(
      `FAIL unavailable media must return a private no-store 404: ${path}`,
    );
  }
}
console.log(
  "Only synthetic invalid cookies were used; no real account was modified.",
);
console.log(
  "Real sign-in, refresh, sign-out, password changes and uploads need separate verification.",
);
process.exitCode = failures ? 1 : 0;
