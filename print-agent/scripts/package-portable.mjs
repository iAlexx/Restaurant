import { createWriteStream, existsSync, statSync } from "node:fs";
import { cp, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import archiver from "archiver";

const rootDir = fileURLToPath(new URL("..", import.meta.url));
const releaseDir = join(rootDir, "release");
const portableDir = join(releaseDir, "RestaurantPrintAgent-Portable");
const exePath = join(releaseDir, "RestaurantPrintAgent.exe");
const zipPath = join(releaseDir, "RestaurantPrintAgent-Portable-x64.zip");

async function main() {
  if (!existsSync(exePath)) {
    throw new Error(`Missing ${exePath}. Run npm run build:exe first.`);
  }

  await mkdir(portableDir, { recursive: true });
  await cp(exePath, join(portableDir, "RestaurantPrintAgent.exe"), { force: true });
  await cp(join(rootDir, "assets"), join(portableDir, "assets"), {
    recursive: true,
    force: true,
  });
  await cp(join(rootDir, "PORTABLE-README.txt"), join(portableDir, "README.txt"), {
    force: true,
  });

  await new Promise((resolve, reject) => {
    const output = createWriteStream(zipPath);
    const archive = archiver("zip", { zlib: { level: 9 } });

    output.on("close", resolve);
    archive.on("error", reject);

    archive.pipe(output);
    archive.directory(portableDir, false);
    archive.finalize();
  });

  const sizeMb = (statSync(zipPath).size / (1024 * 1024)).toFixed(2);
  console.log(`Portable ZIP: ${zipPath}`);
  console.log(`ZIP size: ${sizeMb} MB`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
