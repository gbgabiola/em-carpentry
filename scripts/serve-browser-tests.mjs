import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { servePortfolioFixture } from "./browser-portfolio-fixtures.mjs";
const port = 3107;
// Read-only loopback fixtures. No request reaches a hosted provider.
const backend = createServer((request, response) => {
  const url = new URL(request.url || "/", "http://127.0.0.1");
  if (request.method !== "GET" || url.pathname.startsWith("/auth/")) {
    response.writeHead(401, { "Content-Type": "application/json" });
    response.end(
      JSON.stringify({ message: "Synthetic unauthenticated fixture" }),
    );
    return;
  }
  if (url.searchParams.get("title")?.includes("synthetic-outage")) {
    response.writeHead(503, { "Content-Type": "application/json" });
    response.end(JSON.stringify({ message: "Synthetic unavailable backend" }));
    return;
  }
  if (servePortfolioFixture(request, response, url)) return;
  response.writeHead(200, {
    "Content-Type": "application/json",
    "Content-Range": "*/0",
  });
  response.end(
    JSON.stringify(
      url.pathname === "/rest/v1/business_settings"
        ? {
            id: 1,
            about_text: "Synthetic content for isolated browser checks.",
            service_area: "Geelong, VIC, Australia, and nearby areas",
            phone: "+61497175163",
            email: "emcarpentry.maintenance@gmail.com",
            facebook_url: "https://www.facebook.com/EMscarpentryworks",
          }
        : [],
    ),
  );
});
await new Promise((resolve) => backend.listen(0, "127.0.0.1", resolve));
const address = backend.address();
if (!address || typeof address === "string")
  throw new Error("Fixture address unavailable.");
const child = spawn(
  process.execPath,
  [
    "node_modules/next/dist/bin/next",
    "start",
    "--hostname",
    "127.0.0.1",
    "--port",
    String(port),
  ],
  {
    stdio: "inherit",
    env: {
      ...process.env,
      NODE_ENV: "production",
      NEXT_TELEMETRY_DISABLED: "1",
      SITE_URL: "",
      SITE_INDEXING_ENABLED: "false",
      SUPABASE_URL: `http://127.0.0.1:${address.port}`,
      SUPABASE_PUBLISHABLE_KEY: "sb_publishable_synthetic_browser_fixture",
      INTAKE_ENABLED: "true",
      INTAKE_SECRET: "b".repeat(64),
      INTAKE_ORIGIN: "https://browser-fixture.example.test",
      INTAKE_PLATFORM: "netlify",
    },
  },
);
function shutdown() {
  child.kill("SIGTERM");
  backend.close();
}
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
child.on("error", () => {
  backend.close();
  process.exitCode = 1;
});
child.on("close", (code) => {
  backend.close();
  process.exitCode = code ?? 0;
});
