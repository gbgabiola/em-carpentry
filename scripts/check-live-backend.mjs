import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { resolveSupabaseConfig } from "../src/lib/db/config.ts";
if (existsSync(".env.local")) process.loadEnvFile(".env.local");
const config = resolveSupabaseConfig(process.env);
if (!config) throw new Error("Configure the backend in .env.local first.");
const client = createClient(config.url, config.key, {
  auth: { persistSession: false, autoRefreshToken: false },
  global: {
    fetch: (input, init) =>
      fetch(input, {
        ...init,
        signal: AbortSignal.timeout(15000),
        cache: "no-store",
      }),
  },
});
let failed = 0;
async function check(name, work) {
  try {
    await work();
    console.log(`PASS ${name}`);
  } catch {
    failed++;
    console.log(
      `FAIL ${name} (check project availability, migrations and access policies)`,
    );
  }
}
for (const table of ["projects", "reviews", "services", "faqs"])
  await check(
    `anonymous ${table} reads expose published rows only`,
    async () => {
      const result = await client
        .from(table)
        .select(
          table === "projects"
            ? "id,status"
            : table === "reviews"
              ? "id,status,consent"
              : "id,status,publication_confirmed",
        )
        .limit(100);
      assert.equal(result.error, null);
      assert.ok(
        result.data.every((row) =>
          table === "reviews"
            ? row.status === "approved" && row.consent
            : row.status === "published" &&
              (table === "projects" || row.publication_confirmed),
        ),
      );
    },
  );
await check("verified business information is readable", async () => {
  const result = await client
    .from("business_settings")
    .select("id")
    .eq("id", 1)
    .single();
  assert.equal(result.error, null);
  assert.equal(result.data.id, 1);
});
await check("anonymous callers cannot read private enquiries", async () => {
  const result = await client.from("enquiries").select("id").limit(0);
  assert.ok(result.error);
  assert.equal(result.error.code, "42501");
});
await check(
  "owner membership schema is not exposed through the Data API",
  async () => {
    const result = await client
      .schema("private")
      .from("admin_users")
      .select("user_id", { head: true });
    assert.ok(result.error);
  },
);
await check("anonymous callers do not have owner access", async () => {
  const result = await client.rpc("is_admin");
  assert.equal(result.error, null);
  assert.equal(result.data, false);
});
await check("missing private photos are not downloadable", async () => {
  const result = await client.storage
    .from("project-images")
    .download("missing-security-probe.webp");
  assert.ok(result.error);
});
let signupDisabled = false;
try {
  const response = await fetch(`${config.url}/auth/v1/settings`, {
    headers: { apikey: config.key },
    signal: AbortSignal.timeout(15000),
  });
  assert.ok(response.ok);
  const settings = await response.json();
  signupDisabled = settings.disable_signup === true;
  console.log(
    signupDisabled
      ? "PASS provider public sign-ups are disabled"
      : "ACTION REQUIRED disable new user sign-ups in Supabase Auth settings",
  );
} catch {
  failed++;
  console.log("FAIL unable to verify public Auth settings");
}
console.log(
  "Read-only checks complete. No users, records or files were created or changed.",
);
process.exitCode = failed ? 1 : signupDisabled ? 0 : 2;
