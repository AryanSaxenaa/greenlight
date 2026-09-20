import { existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const distDir = join(process.cwd(), "dist");
const distAssets = join(distDir, "assets");

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function walk(dir) {
  return readdirSync(dir).flatMap((entry) => {
    const fullPath = join(dir, entry);
    return statSync(fullPath).isDirectory() ? walk(fullPath) : [fullPath];
  });
}

const assetFiles = existsSync(distAssets) ? walk(distAssets) : [];
const rootImages = existsSync(distDir)
  ? readdirSync(distDir)
      .filter((entry) => /\.(jpg|jpeg|png|webp)$/i.test(entry))
      .map((entry) => join(distDir, entry))
  : [];

const files = [...assetFiles, ...rootImages].filter((file) =>
  /\.(js|css|jpg|jpeg|png|svg|webp)$/i.test(file),
);

let total = 0;
const rows = files.map((file) => {
  const size = statSync(file).size;
  total += size;
  return { file: file.replace(process.cwd(), ""), size };
});

rows.sort((a, b) => b.size - a.size);

console.log("Greenlight build asset report");
console.log("----------------------------");
for (const row of rows) {
  console.log(`${formatBytes(row.size).padStart(10)}  ${row.file}`);
}
console.log("----------------------------");
console.log(`Total tracked assets: ${formatBytes(total)}`);

const jsTotal = rows
  .filter((row) => row.file.endsWith(".js"))
  .reduce((sum, row) => sum + row.size, 0);

if (jsTotal > 500 * 1024) {
  console.warn(
    `Warning: JS bundle total is ${formatBytes(jsTotal)} (target under 500 KB).`,
  );
} else {
  console.log(`JS bundle total: ${formatBytes(jsTotal)} (within 500 KB target).`);
}

for (const row of rows.filter((entry) => /\.(jpg|jpeg|png|webp)$/i.test(entry.file))) {
  if (row.size > 350 * 1024) {
    console.warn(
      `Warning: ${row.file} is ${formatBytes(row.size)} (target under 350 KB).`,
    );
  }
}
