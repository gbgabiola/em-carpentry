import assert from "node:assert/strict";
import { test } from "node:test";
import sharp from "sharp";
import { optimiseProjectPhoto } from "../lib/images/process.ts";
test("project photos are resized, oriented and stripped of original metadata", async () => {
  const input = await sharp({
    create: { width: 2000, height: 1000, channels: 3, background: "#78551c" },
  })
    .withMetadata({ orientation: 6, density: 300 })
    .jpeg()
    .toBuffer();
  const output = await optimiseProjectPhoto(input);
  const metadata = await sharp(output).metadata();
  assert.equal(metadata.format, "webp");
  assert.ok(metadata.width <= 1600 && metadata.height <= 1600);
  assert.equal(metadata.exif, undefined);
  assert.equal(metadata.orientation, undefined);
  assert.ok(metadata.height > metadata.width);
});
test("malformed, oversized and unsupported images are rejected", async () => {
  for (const input of [
    Buffer.from("not a photo"),
    Buffer.alloc(5 * 1024 * 1024 + 1),
    Buffer.from(
      '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"></svg>',
    ),
  ])
    await assert.rejects(optimiseProjectPhoto(input));
});
