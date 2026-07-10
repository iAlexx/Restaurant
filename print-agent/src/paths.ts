import { existsSync } from "node:fs";
import { copyFile, mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const LEGACY_DIR_NAME = ".restaurant-print";

export function getExecutableDir(): string {
  return dirname(process.execPath);
}

export function isPackagedExecutable(): boolean {
  return typeof (process as NodeJS.Process & { pkg?: unknown }).pkg !== "undefined";
}

export function getConfigDir(): string {
  const localAppData = process.env.LOCALAPPDATA;
  if (localAppData) {
    return join(localAppData, "RestaurantPrint");
  }

  const home = process.env.USERPROFILE ?? process.env.HOME ?? ".";
  return join(home, LEGACY_DIR_NAME);
}

export function getLegacyConfigDir(): string {
  const home = process.env.USERPROFILE ?? process.env.HOME ?? ".";
  return join(home, LEGACY_DIR_NAME);
}

export function getConfigPath(): string {
  return join(getConfigDir(), "config.json");
}

export function getAssetsDir(): string {
  const portableAssets = join(getExecutableDir(), "assets");
  if (existsSync(portableAssets)) {
    return portableAssets;
  }

  if (isPackagedExecutable()) {
    return join(getExecutableDir(), "assets");
  }

  return fileURLToPath(new URL("../assets", import.meta.url));
}

export function getFontsDir(): string {
  const portableFonts = join(getExecutableDir(), "assets", "fonts");
  if (existsSync(portableFonts)) {
    return portableFonts;
  }

  const bundledFonts = join(getAssetsDir(), "fonts");
  if (existsSync(bundledFonts)) {
    return bundledFonts;
  }

  return join(getConfigDir(), "fonts");
}

async function copyIfExists(src: string, dest: string): Promise<void> {
  try {
    await copyFile(src, dest);
  } catch {
    // ignore missing legacy files
  }
}

export async function migrateLegacyConfigDir(): Promise<void> {
  const legacy = getLegacyConfigDir();
  const target = getConfigDir();

  if (legacy === target) return;
  if (!existsSync(legacy)) return;

  await mkdir(target, { recursive: true });

  const files = [
    "config.json",
    "device-token.dpapi",
    "pending-acks.json",
  ];

  for (const file of files) {
    const from = join(legacy, file);
    const to = join(target, file);
    if (existsSync(from) && !existsSync(to)) {
      await copyIfExists(from, to);
    }
  }

  try {
    const legacyEntries = await readdir(legacy);
    for (const entry of legacyEntries) {
      if (entry.endsWith(".log") && !existsSync(join(target, entry))) {
        await copyIfExists(join(legacy, entry), join(target, entry));
      }
    }
  } catch {
    // ignore
  }
}

export async function ensureConfigDir(): Promise<void> {
  await mkdir(getConfigDir(), { recursive: true });
}

export async function writeConfigSnapshot(configJson: string): Promise<void> {
  await ensureConfigDir();
  await writeFile(getConfigPath(), configJson, "utf8");
}

export async function readConfigSnapshot(): Promise<string> {
  return readFile(getConfigPath(), "utf8");
}
