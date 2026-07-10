import { spawn } from "node:child_process";
import { migrateLegacyConfigDir } from "../paths.js";
import { runCli } from "../cli-app.js";

declare global {
  // eslint-disable-next-line no-var
  var pkg: { entrypoint: string; defaultEntrypoint: string } | undefined;
}

function shouldRunHidden(command: string | undefined): boolean {
  return (
    process.platform === "win32" &&
    command === "start" &&
    process.env.RPA_SHOW_CONSOLE !== "1"
  );
}

function relaunchHiddenStart(): void {
  const args = process.argv.slice(2);
  const child = spawn(process.execPath, args, {
    detached: true,
    stdio: "ignore",
    windowsHide: true,
    env: {
      ...process.env,
      RPA_SHOW_CONSOLE: "1",
    },
  });
  child.unref();
}

async function main(): Promise<void> {
  await migrateLegacyConfigDir();

  const command = process.argv[2];

  if (shouldRunHidden(command)) {
    relaunchHiddenStart();
    return;
  }

  await runCli(command);
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  if (process.env.RPA_SHOW_CONSOLE === "1" || process.argv[2] !== "start") {
    console.error(message);
  }
  process.exit(1);
});
