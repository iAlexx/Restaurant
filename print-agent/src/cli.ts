#!/usr/bin/env node

import { migrateLegacyConfigDir } from "./paths.js";
import { runCli } from "./cli-app.js";

async function main(): Promise<void> {
  await migrateLegacyConfigDir();
  await runCli();
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
