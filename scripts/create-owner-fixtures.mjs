import assert from "node:assert/strict";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { resolve, join } from "node:path";
import sharp from "sharp";
import { MAX_PROJECT_PHOTO_BYTES } from "../src/lib/images/limits.ts";
import { optimiseProjectPhoto } from "../src/lib/images/process.ts";

// Synthetic technical fixtures only; never use customer photos for this check.
const root = resolve(".verification");
await mkdir(root, { recursive: true });
const directory = await mkdtemp(join(root, "owner-upload-"));
const svg =
  Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800">
<rect width="1200" height="800" fill="#f4eadc"/>
<rect x="70" y="70" width="1060" height="660" rx="24" fill="#4b3026"/>
<g text-anchor="middle" font-family="sans-serif" fill="#f4eadc">
<text x="600" y="290" font-size="64">WEBSITE UPLOAD TEST</text>
<text x="600" y="420" font-size="36">Synthetic verification image</text>
<text x="600" y="490" font-size="36">Not a completed customer project</text>
</g></svg>`);
const small = await sharp(svg)
  .withMetadata({ density: 300, orientation: 1 })
  .jpeg({ quality: 85 })
  .toBuffer();
assert.ok(small.length < MAX_PROJECT_PHOTO_BYTES);
// JPEG decoders ignore trailing bytes; padding tests transport without huge decoded pixels.
const valid = Buffer.concat([
  small,
  Buffer.alloc(MAX_PROJECT_PHOTO_BYTES - small.length),
]);
const oversized = Buffer.concat([valid, Buffer.alloc(1)]);
const processed = await optimiseProjectPhoto(valid);
const metadata = await sharp(processed).metadata();
assert.equal(metadata.format, "webp");
assert.equal(metadata.exif, undefined);
assert.ok(metadata.width <= 1600 && metadata.height <= 1600);
await assert.rejects(optimiseProjectPhoto(oversized), /Photo size is invalid/);
for (const [name, bytes] of [
  ["upload-test-small.jpg", small],
  ["upload-test-4mib.jpg", valid],
  ["upload-test-too-large.jpg", oversized],
]) {
  const path = join(directory, name);
  await writeFile(path, bytes, { flag: "wx" });
  console.log(`${path} (${bytes.length} bytes)`);
}
console.log(
  "PASS local format, size-boundary and metadata-removal checks. Hosted uploads are not yet verified.",
);
