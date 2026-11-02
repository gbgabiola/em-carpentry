import assert from "node:assert/strict";
import { test } from "node:test";
import { loadInboxSummary } from "../features/intake/summary.ts";
function client(enquiries, reviews) {
  return {
    from(table) {
      return {
        select(_columns, options) {
          assert.equal(options.head, true);
          assert.equal(options.count, "exact");
          return {
            eq(_column, _value) {
              return {
                abortSignal() {
                  const value = table === "enquiries" ? enquiries : reviews;
                  return value instanceof Error
                    ? Promise.reject(value)
                    : Promise.resolve(value);
                },
              };
            },
          };
        },
      };
    },
  };
}
test("inbox summary distinguishes known zero from positive counts", async () => {
  assert.deepEqual(
    await loadInboxSummary(
      client({ count: 0, error: null }, { count: 21, error: null }),
    ),
    { newEnquiries: 0, pendingReviews: 21 },
  );
});
test("a failed count stays unknown without hiding the other inbox", async () => {
  assert.deepEqual(
    await loadInboxSummary(
      client(new Error("private provider detail"), { count: 4, error: null }),
    ),
    { newEnquiries: null, pendingReviews: 4 },
  );
  assert.deepEqual(
    await loadInboxSummary(
      client(
        { count: 0, error: { message: "private provider detail" } },
        { count: 0, error: null },
      ),
    ),
    { newEnquiries: null, pendingReviews: 0 },
  );
});
test("missing or malformed counts are never presented as an empty inbox", async () => {
  for (const count of [
    null,
    undefined,
    -1,
    1.5,
    Number.POSITIVE_INFINITY,
    "0",
  ]) {
    assert.equal(
      (
        await loadInboxSummary(
          client({ count, error: null }, { count: 1, error: null }),
        )
      ).newEnquiries,
      null,
    );
  }
});
