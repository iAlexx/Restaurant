import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = fileURLToPath(new URL("..", import.meta.url));
const entry = join(rootDir, "dist", "runtime", "agent-main.js");
const releaseDir = join(rootDir, "release");
const outputExe = join(releaseDir, "RestaurantPrintAgent.exe");

function run(command, args, options = {}) {
  execFileSync(command, args, {
    cwd: rootDir,
    stdio: "inherit",
    ...options,
  });
}

async function trySeaBuild() {
  const seaConfigPath = join(rootDir, "sea-config.json");
  const seaBlobPath = join(releaseDir, "sea-prep.blob");
  const nodePath = process.execPath;

  await mkdir(releaseDir, { recursive: true });
  await writeFile(
    seaConfigPath,
    JSON.stringify(
      {
        main: entry,
        output: seaBlobPath,
        disableExperimentalSEAWarning: true,
      },
      null,
      2
    )
  );

  console.log("\n[SEA] Attempting Node.js Single Executable Application build...");
  try {
    run(nodePath, ["--experimental-sea-config", seaConfigPath]);
    console.log(
      "[SEA] Blob prepared, but native addons (@napi-rs/canvas) still require external .node binaries."
    );
    console.log(
      "[SEA] Result: not suitable as the primary packaging method for this agent."
    );
    return false;
  } catch (error) {
    console.log("[SEA] Failed:", error instanceof Error ? error.message : error);
    return false;
  }
}

async function ensurePkgBaseBinary() {
  const pkgFetchBin = join(
    rootDir,
    "node_modules",
    "@yao-pkg",
    "pkg-fetch",
    "lib-es5",
    "bin.js"
  );

  console.log("[PKG] Ensuring patched Node base binary is cached...");
  run(process.execPath, [pkgFetchBin, "-n", "node26", "-p", "win", "-a", "x64"]);
}

async function buildWithPkg() {
  if (!existsSync(entry)) {
    throw new Error(`Missing compiled entry: ${entry}. Run npm run build first.`);
  }

  await ensurePkgBaseBinary();
  await mkdir(releaseDir, { recursive: true });

  const pkgBin = join(
    rootDir,
    "node_modules",
    "@yao-pkg",
    "pkg",
    "lib-es5",
    "bin.js"
  );

  run(process.execPath, [
    pkgBin,
    entry,
    "--targets",
    "node26.4.0-win-x64",
    "--output",
    outputExe,
    "--compress",
    "GZip",
  ]);

  if (!existsSync(outputExe)) {
    throw new Error(`PKG build did not produce ${outputExe}`);
  }

  console.log(`\n[PKG] Built ${outputExe}`);
  return true;
}

async function main() {
  console.log("Phase 0 packaging build");
  console.log(`Root: ${rootDir}`);

  await trySeaBuild();
  const pkgOk = await buildWithPkg();

  if (!pkgOk) {
    process.exit(1);
  }

  const { statSync } = await import("node:fs");
  const sizeMb = (statSync(outputExe).size / (1024 * 1024)).toFixed(2);
  console.log(`Executable size: ${sizeMb} MB`);
  console.log(`Output: ${outputExe}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
