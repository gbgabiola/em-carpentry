import assert from "node:assert/strict";
import { test } from "node:test";
import {
  parseInboxFilters,
  inboxPageHref,
  sliceInboxPage,
} from "../lib/utils/inbox.ts";
const statuses = ["new", "reviewed", "closed"];
test("inbox filters accept only the selected inbox statuses and reject repeated query values", () => {
  assert.equal(parseInboxFilters({ status: "new" }, statuses).status, "new");
  for (const status of [
    "approved",
    "NEW",
    "eq.new",
    ["new", "closed"],
    undefined,
  ]) {
    assert.equal(parseInboxFilters({ status }, statuses).status, "");
  }
});
test("inbox page ranges are bounded, one-based and request one lookahead record", () => {
  assert.deepEqual(parseInboxFilters({}, statuses), {
    status: "",
    page: 1,
    from: 0,
    to: 20,
  });
  assert.deepEqual(
    parseInboxFilters({ status: "closed", page: "3" }, statuses),
    { status: "closed", page: 3, from: 40, to: 60 },
  );
  for (const page of [
    "0",
    "-1",
    "1.5",
    "2abc",
    "1e3",
    "Infinity",
    "",
    ["2", "3"],
    undefined,
    "9".repeat(300),
  ]) {
    assert.equal(parseInboxFilters({ page }, statuses).page, 1);
  }
  assert.equal(parseInboxFilters({ page: "99999" }, statuses).page, 10000);
});
test("inbox navigation retains only status and page, never submission fields", () => {
  assert.equal(
    inboxPageHref("/admin/enquiries", "new", 2),
    "/admin/enquiries?status=new&page=2",
  );
  assert.equal(inboxPageHref("/admin/reviews", "", 1), "/admin/reviews?page=1");
});
test("lookahead rows do not leak into the rendered page and empty pages have no next link", () => {
  for (const count of [0, 19, 20, 21]) {
    const rows = Array.from({ length: count }, (_, id) => ({ id }));
    const page = sliceInboxPage(rows);
    assert.equal(page.records.length, Math.min(count, 20));
    assert.equal(page.hasNext, count > 20);
    assert.equal(rows.length, count);
  }
});
