import sharp from "sharp";

// Native server-only processing; do not import this module from Client Components.
export async function optimiseProjectPhoto(input: Buffer) {
  if (input.length === 0 || input.length > 5 * 1024 * 1024)
    throw new Error("Photo size is invalid.");
  const metadata = await sharp(input, {
    limitInputPixels: 24000000,
  }).metadata();
  if (
    !["jpeg", "png", "webp"].includes(metadata.format || "") ||
    (metadata.pages || 1) > 1
  )
    throw new Error("Unsupported photo format.");
  // Auto-orient then re-encode without original EXIF/GPS metadata.
  const output = await sharp(input, { limitInputPixels: 24000000 })
    .rotate()
    .resize({
      width: 1600,
      height: 1600,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: 82 })
    .toBuffer();
  if (output.length > 5 * 1024 * 1024)
    throw new Error("Optimised photo is too large.");
  return output;
}
