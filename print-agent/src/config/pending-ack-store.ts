import { join } from "node:path";
import { readFile, writeFile } from "node:fs/promises";
import { ensureConfigDir, getConfigDir } from "../paths.js";

const PENDING_ACKS_FILE = "pending-acks.json";

function pendingAcksPath(): string {
  return join(getConfigDir(), PENDING_ACKS_FILE);
}

async function readPendingAcks(): Promise<string[]> {
  try {
    const raw = await readFile(pendingAcksPath(), "utf8");
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id): id is string => typeof id === "string" && id.length > 0);
  } catch {
    return [];
  }
}

async function writePendingAcks(jobIds: string[]): Promise<void> {
  const unique = [...new Set(jobIds)];
  await ensureConfigDir();
  await writeFile(pendingAcksPath(), JSON.stringify(unique, null, 2), "utf8");
}

export async function loadPendingAcks(): Promise<string[]> {
  return readPendingAcks();
}

export async function savePendingAck(jobId: string): Promise<void> {
  const current = await readPendingAcks();
  if (!current.includes(jobId)) {
    current.push(jobId);
  }
  await writePendingAcks(current);
}

export async function clearPendingAck(jobId: string): Promise<void> {
  const current = await readPendingAcks();
  const next = current.filter((id) => id !== jobId);
  if (next.length === current.length) return;
  await writePendingAcks(next);
}
