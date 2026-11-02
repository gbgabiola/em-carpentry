import assert from "node:assert/strict";
import { test } from "node:test";
import { resolveIntakeConfig } from "../features/intake/config.ts";
import {
  getNetworkKey,
  issueFormToken,
  verifyFormToken,
  MAX_FORM_AGE_MS,
} from "../features/intake/security.ts";
import {
  handleSubmission,
  handleFormToken,
  MAX_INTAKE_BYTES,
} from "../features/intake/handler.ts";
const secret = "a".repeat(64);
const config = { secret, origin: "https://example.test", platform: "netlify" };
const now = Date.parse("2026-11-02T12:00:00Z");
const ip = "203.0.113.12";
const headers = {
  origin: config.origin,
  "content-type": "application/json",
  "x-nf-client-connection-ip": ip,
};
const key = getNetworkKey(new Headers(headers), config);
const data = {
  name: "Synthetic customer",
  contact_method: "email",
  contact_details: "fixture@example.test",
  description: "Synthetic request text",
  suburb: "",
};
const token = () => issueFormToken("enquiry", key, secret, now - 3000);
const request = (value, extra = {}) =>
  new Request(`${config.origin}/api/enquiries`, {
    method: "POST",
    headers: { ...headers, ...extra },
    body: JSON.stringify(value),
  });
test("intake defaults off and requires an exact origin, strong private credential and trusted platform", () => {
  assert.equal(resolveIntakeConfig({}), null);
  const env = {
    INTAKE_ENABLED: "true",
    INTAKE_SECRET: secret,
    INTAKE_ORIGIN: config.origin,
    INTAKE_PLATFORM: "netlify",
    NODE_ENV: "production",
  };
  assert.deepEqual(resolveIntakeConfig(env), config);
  for (const extra of [
    { INTAKE_ENABLED: "yes" },
    { INTAKE_SECRET: "short" },
    { INTAKE_ORIGIN: "http://example.test" },
    { INTAKE_ORIGIN: "https://user:password@example.test" },
    { INTAKE_ORIGIN: "https://example.test/path" },
    { INTAKE_ORIGIN: "https://example.test?x=1" },
    { INTAKE_PLATFORM: "local" },
  ])
    assert.throws(() => resolveIntakeConfig({ ...env, ...extra }));
  assert.equal(
    resolveIntakeConfig({
      ...env,
      INTAKE_PLATFORM: "local",
      INTAKE_ORIGIN: "http://localhost:3000",
      NODE_ENV: "development",
    }).platform,
    "local",
  );
});
test("network identity uses only the provider header, never caller-controlled forwarding fallbacks", () => {
  assert.equal(
    getNetworkKey(
      new Headers({
        ...headers,
        "x-forwarded-for": "192.0.2.1",
        "client-ip": "192.0.2.2",
      }),
      config,
    ),
    key,
  );
  for (const value of ["", "203.0.113.12, 192.0.2.1", "not-an-ip"])
    assert.throws(
      () =>
        getNetworkKey(
          new Headers({
            "x-nf-client-connection-ip": value,
            "x-forwarded-for": ip,
          }),
          config,
        ),
      /unavailable/,
    );
  assert.doesNotMatch(key, /203\.0\.113/);
});
test("tokens enforce signature, request kind, network binding, minimum age and expiry", () => {
  const signed = token();
  assert.match(
    verifyFormToken(signed, "enquiry", key, secret, now),
    /^[a-f0-9-]{36}$/,
  );
  for (const [value, kind, network, credential, at] of [
    [signed, "review", key, secret, now],
    [signed, "enquiry", "b".repeat(64), secret, now],
    [signed, "enquiry", key, "c".repeat(64), now],
    [
      signed.slice(0, -1) + (signed.endsWith("0") ? "1" : "0"),
      "enquiry",
      key,
      secret,
      now,
    ],
    [signed, "enquiry", key, secret, now - 3001],
    [signed, "enquiry", key, secret, now + MAX_FORM_AGE_MS],
  ])
    assert.equal(verifyFormToken(value, kind, network, credential, at), null);
  assert.equal(verifyFormToken("invalid", "enquiry", key, secret, now), null);
});
test("token responses are private and contain no raw network identity or server credential", async () => {
  const result = handleFormToken(
    new Request(`${config.origin}/api/intake/token?kind=enquiry`, { headers }),
    config,
    now,
  );
  assert.equal(result.status, 200);
  assert.match(result.headers.get("cache-control"), /no-store/);
  const text = await result.text();
  assert.doesNotMatch(text, new RegExp(ip));
  assert.ok(!text.includes(secret));
  assert.equal(
    handleFormToken(
      new Request(`${config.origin}/api/intake/token?kind=enquiry`, {
        headers: { origin: "https://other.test" },
      }),
      config,
    ).status,
    403,
  );
  assert.equal(
    handleFormToken(
      new Request(`${config.origin}/api/intake/token?kind=enquiry`),
      null,
    ).status,
    503,
  );
});
test("disabled, foreign-origin, invalid-media, honeypot and malformed requests never reach persistence", async () => {
  let writes = 0;
  const deps = {
    config,
    now: () => now,
    submit: async () => {
      writes++;
      return "accepted";
    },
  };
  for (const [req, settings, status] of [
    [request({ token: token(), data }), { ...deps, config: null }, 503],
    [
      request({ token: token(), data }, { origin: "https://other.test" }),
      deps,
      403,
    ],
    [
      request({ token: token(), data }, { "content-type": "text/plain" }),
      deps,
      415,
    ],
    [request({ token: token(), data, website: "spam" }), deps, 400],
    [request({ token: "forged", data }), deps, 400],
    [
      request({
        token: token(),
        data: { ...data, contact_details: "invalid" },
      }),
      deps,
      422,
    ],
    [
      request({ token: token(), data: { ...data, status: "closed" } }),
      deps,
      422,
    ],
  ]) {
    const result = await handleSubmission(req, "enquiry", settings);
    assert.equal(result.status, status);
    assert.match(result.headers.get("cache-control"), /no-store/);
  }
  assert.equal(writes, 0);
});
test("actual streamed byte limits and invalid UTF-8 are rejected before persistence", async () => {
  const deps = {
    config,
    now: () => now,
    submit: async () => assert.fail("Unexpected persistence"),
  };
  const make = (bytes) =>
    new Request(`${config.origin}/api/enquiries`, {
      method: "POST",
      headers,
      duplex: "half",
      body: new ReadableStream({
        start(controller) {
          controller.enqueue(bytes);
          controller.close();
        },
      }),
    });
  assert.equal(
    (
      await handleSubmission(
        make(new Uint8Array(MAX_INTAKE_BYTES + 1)),
        "enquiry",
        deps,
      )
    ).status,
    413,
  );
  assert.equal(
    (await handleSubmission(make(new Uint8Array([0xff])), "enquiry", deps))
      .status,
    400,
  );
});
test("successful retries use the same idempotency identity and safe failures never echo provider errors", async () => {
  const calls = [];
  const deps = {
    config,
    now: () => now,
    submit: async (value) => {
      calls.push(value);
      return calls.length === 1 ? "accepted" : "duplicate";
    },
  };
  const envelope = { token: token(), data };
  assert.equal(
    (await handleSubmission(request(envelope), "enquiry", deps)).status,
    201,
  );
  assert.equal(
    (await handleSubmission(request(envelope), "enquiry", deps)).status,
    200,
  );
  assert.equal(calls[0].requestId, calls[1].requestId);
  assert.deepEqual(calls[0].data, data);
  const limited = await handleSubmission(request(envelope), "enquiry", {
    ...deps,
    submit: async () => "rate_limited",
  });
  assert.equal(limited.status, 429);
  assert.equal(limited.headers.get("retry-after"), "3600");
  const failed = await handleSubmission(request(envelope), "enquiry", {
    ...deps,
    submit: async () => {
      throw new Error("PRIVATE-PROVIDER-DETAILS fixture@example.test");
    },
  });
  assert.equal(failed.status, 503);
  assert.doesNotMatch(await failed.text(), /PRIVATE-PROVIDER|fixture@example/);
});
