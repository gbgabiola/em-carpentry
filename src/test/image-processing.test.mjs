import assert from "node:assert/strict";
import { test } from "node:test";
import sharp from "sharp";
import {
  MAX_PROJECT_PHOTO_BYTES,
  PROJECT_ACTION_BODY_LIMIT,
} from "../lib/images/limits.ts";
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
    Buffer.alloc(MAX_PROJECT_PHOTO_BYTES + 1),
    Buffer.from(
      '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"></svg>',
    ),
  ])
    await assert.rejects(optimiseProjectPhoto(input));
});

test("an image at the upload boundary is processed and the next byte is rejected", async () => {
  const jpeg = await sharp({
    create: { width: 8, height: 8, channels: 3, background: "white" },
  })
    .jpeg()
    .toBuffer();
  const boundaryImage = Buffer.concat([
    jpeg,
    Buffer.alloc(MAX_PROJECT_PHOTO_BYTES - jpeg.length),
  ]);
  assert.equal(
    (await sharp(await optimiseProjectPhoto(boundaryImage)).metadata()).format,
    "webp",
  );
  await assert.rejects(
    optimiseProjectPhoto(Buffer.concat([boundaryImage, Buffer.alloc(1)])),
    /Photo size is invalid/,
  );
});

test("maximum photo multipart upload leaves room for function transport encoding", async () => {
  const form = new FormData();
  form.set(
    "photo",
    new File([new Uint8Array(MAX_PROJECT_PHOTO_BYTES)], "photo.webp", {
      type: "image/webp",
    }),
  );
  form.set("project_id", "00000000-0000-4000-8000-000000000000");
  form.set("alt", "木".repeat(250));
  form.set("display_order", "999");
  form.set("role", "gallery");
  form.set("rights", "on");
  form.set("$ACTION_ID_fixture", "");
  const body = await new Request("http://localhost/fixture", {
    method: "POST",
    body: form,
  }).arrayBuffer();
  assert.match(PROJECT_ACTION_BODY_LIMIT, /^\d+kb$/);
  const actionBodyBytes = Number.parseInt(PROJECT_ACTION_BODY_LIMIT, 10) * 1024;
  assert.ok(body.byteLength < actionBodyBytes);
  // Conservative decimal 6 MB gateway limit, with 64 KiB event/header reserve.
  assert.ok(Math.ceil(actionBodyBytes / 3) * 4 + 64 * 1024 < 6_000_000);
});
