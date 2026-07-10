import { readFile } from "node:fs/promises";
import type { AgentConfig } from "../config/config.js";
import { hasDeviceToken } from "../config/credential-store.js";
import { loadPendingAcks } from "../config/pending-ack-store.js";
import { createPrintProvider } from "../providers/index.js";
import { listWindowsPrinters } from "../providers/windows-spooler.js";
import {
  getStatusSnapshotPath,
  resolveTrayState,
  trayStateLabel,
  type AgentStatusSnapshot,
  writeStatusSnapshot,
} from "../runtime/status-store.js";

export async function readStatusSnapshot(): Promise<AgentStatusSnapshot | null> {
  try {
    const raw = await readFile(getStatusSnapshotPath(), "utf8");
    return JSON.parse(raw) as AgentStatusSnapshot;
  } catch {
    return null;
  }
}

export async function collectStatusSnapshot(
  config: AgentConfig,
  overrides?: Partial<AgentStatusSnapshot>
): Promise<AgentStatusSnapshot> {
  const tokenConfigured = await hasDeviceToken();
  const provider = createPrintProvider(config);
  const printerStatus = await provider.checkStatus().catch(() => "error" as const);

  let printers: string[] = [];
  if (process.platform === "win32") {
    try {
      printers = await listWindowsPrinters();
    } catch {
      printers = [];
    }
  }

  const printerConfigured = printers.includes(config.windowsPrinterName);
  const pending = await loadPendingAcks();

  const lastHeartbeatOk = overrides?.lastHeartbeatOk ?? false;
  const lastError = overrides?.lastError ?? null;
  const lastPrintOk = overrides?.lastPrintOk ?? null;

  const trayState = resolveTrayState({
    tokenConfigured,
    lastHeartbeatOk,
    lastError,
    printerStatus,
    printerConfigured,
    lastPrintOk,
  });

  const snapshot: AgentStatusSnapshot = {
    updatedAt: new Date().toISOString(),
    agentRunning: overrides?.agentRunning ?? false,
    trayState,
    trayStateLabel: trayStateLabel(trayState),
    apiBaseUrl: config.apiBaseUrl,
    printerName: config.windowsPrinterName,
    printMode: config.printMode,
    printerStatus,
    tokenConfigured,
    lastHeartbeatAt: overrides?.lastHeartbeatAt ?? null,
    lastHeartbeatOk,
    lastError,
    lastPrintAt: overrides?.lastPrintAt ?? null,
    lastPrintOk,
    pendingAckCount: pending.length,
    dashboardUrl: `${config.apiBaseUrl.replace(/\/$/, "")}/dashboard/orders`,
    printers,
  };

  return snapshot;
}

export async function publishStatusSnapshot(
  config: AgentConfig,
  overrides?: Partial<AgentStatusSnapshot>
): Promise<AgentStatusSnapshot> {
  const snapshot = await collectStatusSnapshot(config, overrides);
  await writeStatusSnapshot(snapshot);
  return snapshot;
}
