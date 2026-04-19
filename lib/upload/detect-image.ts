// Hand-rolled image-format sniff.
//
// Replaces the `file-type` npm package, which was ESM-only + node>=22
// and crashed Vercel server actions (the client saw
// `undefined is not an object (evaluating 'a.ok')` because the action
// returned nothing). A tiny magic-byte check for the formats we
// actually accept is more reliable and drops the dependency.
//
// Callers decide which of the detected formats to allow — e.g. admin
// option-image uploads accept {jpeg,png,webp,gif,svg}; customer gift
// uploads additionally accept {heic,heif}.

export type DetectedImage = {
  mime:
    | 'image/jpeg'
    | 'image/png'
    | 'image/webp'
    | 'image/gif'
    | 'image/svg+xml'
    | 'image/heic'
    | 'image/heif';
  ext: 'jpg' | 'png' | 'webp' | 'gif' | 'svg' | 'heic' | 'heif';
};

export function detectImage(bytes: Uint8Array): DetectedImage | null {
  // JPEG: FF D8 FF
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return { mime: 'image/jpeg', ext: 'jpg' };
  }
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 &&
    bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a
  ) {
    return { mime: 'image/png', ext: 'png' };
  }
  // GIF: "GIF87a" or "GIF89a"
  if (
    bytes.length >= 6 && bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38 &&
    (bytes[4] === 0x37 || bytes[4] === 0x39) && bytes[5] === 0x61
  ) {
    return { mime: 'image/gif', ext: 'gif' };
  }
  // WEBP: "RIFF" ???? "WEBP"
  if (
    bytes.length >= 12 && bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
    bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50
  ) {
    return { mime: 'image/webp', ext: 'webp' };
  }
  // ISO BMFF container (HEIC / HEIF / AVIF / MP4-ish). Bytes 4-7 = "ftyp",
  // bytes 8-11 = brand. We match HEIC/HEIF brands — the ones iPhones send.
  if (
    bytes.length >= 12 && bytes[4] === 0x66 && bytes[5] === 0x74 && bytes[6] === 0x79 && bytes[7] === 0x70
  ) {
    const brand = String.fromCharCode(bytes[8], bytes[9], bytes[10], bytes[11]);
    // HEIC brands
    if (['heic', 'heix', 'hevc', 'hevx', 'heim', 'heis'].includes(brand)) {
      return { mime: 'image/heic', ext: 'heic' };
    }
    // HEIF brands
    if (['mif1', 'msf1', 'heif'].includes(brand)) {
      return { mime: 'image/heif', ext: 'heif' };
    }
  }
  // SVG: search first 1 KB for `<svg` after XML prolog / BOM
  const head = new TextDecoder('utf-8', { fatal: false }).decode(bytes.subarray(0, 1024)).toLowerCase();
  if (/<svg[\s>]/.test(head)) {
    return { mime: 'image/svg+xml', ext: 'svg' };
  }
  return null;
}
