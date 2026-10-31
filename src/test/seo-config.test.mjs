import assert from "node:assert/strict";
import { test } from "node:test";
import { resolveSeoConfig } from "../lib/seo/config.ts";

test("local and preview environments default to no indexing", () => {
  assert.deepEqual(resolveSeoConfig({}), {
    origin: undefined,
    indexingEnabled: false,
  });
  assert.deepEqual(
    resolveSeoConfig({ SITE_URL: " https://business.example/ " }),
    { origin: "https://business.example", indexingEnabled: false },
  );
});

test("indexing needs explicit opt-in and an approved origin", () => {
  assert.throws(
    () => resolveSeoConfig({ SITE_INDEXING_ENABLED: "true" }),
    /SITE_URL/,
  );
  assert.deepEqual(
    resolveSeoConfig({
      SITE_INDEXING_ENABLED: "true",
      SITE_URL: "https://business.example",
    }),
    { origin: "https://business.example", indexingEnabled: true },
  );
  assert.throws(
    () => resolveSeoConfig({ SITE_INDEXING_ENABLED: "yes" }),
    /true or false/,
  );
});

test("malformed, local, insecure or non-origin URLs cannot enter SEO output", () => {
  for (const value of [
    "example.com",
    "http://business.example",
    "https://localhost",
    "https://app.localhost",
    "https://127.0.0.1",
    "https://[::1]",
    "https://business.example/path",
    "https://business.example/?q=x",
    "https://business.example/#section",
    "https://user:password@business.example",
    "https://business.example:8443",
    "javascript:alert(1)",
  ]) {
    assert.throws(
      () => resolveSeoConfig({ SITE_URL: value }),
      undefined,
      value,
    );
  }
});
