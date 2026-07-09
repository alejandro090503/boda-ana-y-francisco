import sharp from "sharp";
import fs from "fs";

const input = "public/sobre.png";
const output = "public/sobre-og.png";

const meta = await sharp(input).metadata();
console.log(`Source: ${meta.width}x${meta.height}`);

// Open Graph standard: 1200x630 (1.905:1)
const TARGET_W = 1200;
const TARGET_H = 630;
const TARGET_RATIO = TARGET_W / TARGET_H;

// Crop a landscape slice centered on the wax seal.
// Seal is roughly at y = 46% of source height. Use full width.
const sealCenterY = Math.round(meta.height * 0.46);
const cropH = Math.round(meta.width / TARGET_RATIO);
const cropY = Math.max(0, sealCenterY - Math.round(cropH / 2));

console.log(`Crop: ${meta.width}x${cropH} from y=${cropY}`);

await sharp(input)
  .extract({ left: 0, top: cropY, width: meta.width, height: cropH })
  .resize(TARGET_W, TARGET_H, { fit: "cover" })
  .png({ quality: 92, compressionLevel: 9 })
  .toFile(output);

const outMeta = await sharp(output).metadata();
const outSize = fs.statSync(output).size;
console.log(`Output: ${outMeta.width}x${outMeta.height} (${(outSize / 1024).toFixed(1)}KB) → ${output}`);
