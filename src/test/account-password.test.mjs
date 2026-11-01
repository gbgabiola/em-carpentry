import assert from "node:assert/strict";
import { test } from "node:test";
import { changeOwnPassword } from "../features/account/password.ts";
import { passwordChangeSchema } from "../lib/validation/schemas.ts";
const user = { id: "fixture-owner", email: "owner@example.test" };
const passwords = {
  current_password: "fixture-current-secret",
  new_password: "fixture-new-unique-passphrase",
};
function provider(overrides = {}) {
  const calls = [];
  return {
    calls,
    auth: {
      async signInWithPassword(value) {
        calls.push(["verify", value]);
        return { data: { user: { id: user.id } }, error: null };
      },
      async updateUser(value) {
        calls.push(["update", value]);
        return { error: null };
      },
      async signOut(value) {
        calls.push(["signOut", value]);
        return { error: null };
      },
      ...overrides,
    },
  };
}
test("password changes require matching, different and sufficiently long credentials", () => {
  const valid = { ...passwords, confirm_password: passwords.new_password };
  assert.ok(passwordChangeSchema.safeParse(valid).success);
  for (const change of [
    { current_password: "" },
    { new_password: "short", confirm_password: "short" },
    { new_password: "            ", confirm_password: "            " },
    { confirm_password: "different" },
    {
      new_password: passwords.current_password,
      confirm_password: passwords.current_password,
    },
  ])
    assert.equal(
      passwordChangeSchema.safeParse({ ...valid, ...change }).success,
      false,
    );
  const parsed = passwordChangeSchema.parse({
    ...valid,
    email: "untrusted@example.test",
  });
  assert.equal(parsed.email, undefined);
});
test("incorrect current password cannot reach the password update", async () => {
  const { auth, calls } = provider({
    async signInWithPassword() {
      return {
        data: { user: null },
        error: new Error("private provider detail"),
      };
    },
  });
  const result = await changeOwnPassword(auth, user, passwords);
  assert.ok(result.error);
  assert.equal(calls.length, 0);
  assert.doesNotMatch(
    JSON.stringify(result),
    /private provider detail|fixture-current-secret|fixture-new-unique-passphrase/,
  );
});
test("unexpected reauthentication identity is signed out and cannot be updated", async () => {
  const { auth, calls } = provider({
    async signInWithPassword() {
      return { data: { user: { id: "different-user" } }, error: null };
    },
  });
  const result = await changeOwnPassword(auth, user, passwords);
  assert.ok(result.error);
  assert.deepEqual(calls, [["signOut", { scope: "local" }]]);
});
test("password update follows reauthentication and requests other-session revocation", async () => {
  const { auth, calls } = provider();
  const result = await changeOwnPassword(auth, user, passwords);
  assert.ok(result.success);
  assert.deepEqual(
    calls.map((call) => call[0]),
    ["verify", "update", "signOut"],
  );
  assert.deepEqual(calls[0][1], {
    email: user.email,
    password: passwords.current_password,
  });
  assert.deepEqual(calls[1][1], {
    password: passwords.new_password,
    current_password: passwords.current_password,
  });
  assert.deepEqual(calls[2][1], { scope: "others" });
  assert.doesNotMatch(
    JSON.stringify(result),
    /fixture-current-secret|fixture-new-unique-passphrase/,
  );
});
test("provider rejection does not claim password success or revoke other sessions", async () => {
  const { auth, calls } = provider({
    async updateUser() {
      return { error: new Error("private provider detail") };
    },
  });
  const result = await changeOwnPassword(auth, user, passwords);
  assert.ok(result.error);
  assert.equal(result.success, undefined);
  assert.equal(calls.filter((call) => call[0] === "signOut").length, 0);
  assert.doesNotMatch(JSON.stringify(result), /private provider detail/);
});
test("post-update revocation failure is reported as a partial success", async () => {
  const { auth } = provider({
    async signOut() {
      throw new Error("private failure");
    },
  });
  const result = await changeOwnPassword(auth, user, passwords);
  assert.match(result.success, /Password updated/);
  assert.match(result.success, /could not be confirmed/);
  assert.equal(result.error, undefined);
});
test("network failure before update returns a generic error without secrets", async () => {
  const { auth } = provider({
    async signInWithPassword() {
      throw new Error(passwords.current_password);
    },
  });
  const result = await changeOwnPassword(auth, user, passwords);
  assert.ok(result.error);
  assert.doesNotMatch(JSON.stringify(result), /fixture-current-secret/);
});
