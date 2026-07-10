import { appendFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { getConfigDir } from "../paths.js";
import type { AgentLogger } from "../agent/agent.js";

const TOKEN_PATTERN = /(Bearer\s+)[A-Za-z0-9._-]+/gi;

function getLogsDir(): string {
  return join(getConfigDir(), "logs");
}

function logFilePath(): string {
  const day = new Date().toISOString().slice(0, 10);
  return join(getLogsDir(), `agent-${day}.log`);
}

function redact(message: string): string {
  return message.replace(TOKEN_PATTERN, "$1[REDACTED]");
}

export function createFileLogger(
  alsoConsole = false
): AgentLogger & { flush?: () => Promise<void> } {
  return {
    info(message: string) {
      void writeLog("INFO", message, alsoConsole);
    },
    error(message: string) {
      void writeLog("ERROR", message, alsoConsole);
    },
  };
}

async function writeLog(
  level: "INFO" | "ERROR",
  message: string,
  alsoConsole: boolean
): Promise<void> {
  const safe = redact(message);
  const line = `[${new Date().toISOString()}] ${level} ${safe}\n`;

  if (alsoConsole) {
    if (level === "ERROR") {
      console.error(line.trimEnd());
    } else {
      console.log(line.trimEnd());
    }
  }

  try {
    await mkdir(getLogsDir(), { recursive: true });
    await appendFile(logFilePath(), line, "utf8");
  } catch {
    // ignore log write failures
  }
}
