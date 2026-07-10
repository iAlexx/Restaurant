import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const FONT_FILES = [
  {
    name: "Cairo-Variable.ttf",
    url: "https://raw.githubusercontent.com/google/fonts/main/ofl/cairo/Cairo%5Bslnt%2Cwght%5D.ttf",
  },
  {
    name: "Numeric-Regular.ttf",
    url: "https://cdn.jsdelivr.net/fontsource/fonts/noto-sans@5.2.7/latin-400-normal.ttf",
  },
];

const assetsDir = fileURLToPath(new URL("../assets/fonts", import.meta.url));

async function download(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download font: ${url} (${response.status})`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

async function main() {
  await mkdir(assetsDir, { recursive: true });

  for (const font of FONT_FILES) {
    const target = join(assetsDir, font.name);
    const bytes = await download(font.url);
    await writeFile(target, bytes);
    console.log(`Downloaded ${font.name} (${bytes.length} bytes)`);
  }

  console.log(
    "Receipt fonts ready (TTF only — Cairo for Arabic, Noto Sans Latin for digits)"
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
