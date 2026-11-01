import assert from "node:assert/strict";
import { test } from "node:test";
import { getComparisonPair } from "../lib/images/comparison.ts";
test("comparison selects exactly one before and after without including gallery photos", () => {
  const before = { id: "before", role: "before" };
  const after = { id: "after", role: "after" };
  assert.deepEqual(
    getComparisonPair([{ id: "gallery", role: "gallery" }, before, after]),
    { before, after },
  );
});
test("missing, ambiguous and duplicate-image comparisons are omitted", () => {
  for (const images of [
    [],
    [{ id: "before", role: "before" }],
    [
      { id: "before", role: "before" },
      { id: "other", role: "before" },
      { id: "after", role: "after" },
    ],
    [
      { id: "same", role: "before" },
      { id: "same", role: "after" },
    ],
  ])
    assert.equal(getComparisonPair(images), null);
});
