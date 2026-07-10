import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const FONT_FILES = [
  {
    name: "Cairo-Regular.woff",
    url: "https://raw.githubusercontent.com/fontsource/font-files/main/fonts/google/cairo/files/cairo-arabic-400-normal.woff",
  },
  {
    name: "Cairo-Bold.woff",
    url: "https://raw.githubusercontent.com/fontsource/font-files/main/fonts/google/cairo/files/cairo-arabic-700-normal.woff",
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
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
