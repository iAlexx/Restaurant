import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { getConfigDir } from "../paths.js";

export type TrayState =
  | "connected"
  | "no_internet"
  | "printer_missing"
  | "invalid_token"
  | "last_print_failed";

export interface AgentStatusSnapshot {
  updatedAt: string;
  agentRunning: boolean;
  trayState: TrayState;
  trayStateLabel: string;
  apiBaseUrl: string;
  printerName: string;
  printMode: "windows" | "lan";
  printerStatus: "ready" | "offline" | "error";
  tokenConfigured: boolean;
  lastHeartbeatAt: string | null;
  lastHeartbeatOk: boolean;
  lastError: string | null;
  lastPrintAt: string | null;
  lastPrintOk: boolean | null;
  pendingAckCount: number;
  dashboardUrl: string;
  printers: string[];
}

const TRAY_STATE_LABELS: Record<TrayState, string> = {
  connected: "متصل",
  no_internet: "لا يوجد إنترنت",
  printer_missing: "الطابعة غير موجودة",
  invalid_token: "التوكن غير صالح",
  last_print_failed: "فشل آخر طلب طباعة",
};

export function getStatusSnapshotPath(): string {
  return join(getConfigDir(), "status.json");
}

export function trayStateLabel(state: TrayState): string {
  return TRAY_STATE_LABELS[state];
}

export async function writeStatusSnapshot(
  snapshot: AgentStatusSnapshot
): Promise<void> {
  await writeFile(getStatusSnapshotPath(), JSON.stringify(snapshot, null, 2), "utf8");
}

export function classifyNetworkError(message: string): TrayState | null {
  const lower = message.toLowerCase();
  if (
    lower.includes("fetch failed") ||
    lower.includes("enotfound") ||
    lower.includes("econnrefused") ||
    lower.includes("etimedout") ||
    lower.includes("network") ||
    lower.includes("getaddrinfo")
  ) {
    return "no_internet";
  }
  if (message.includes("مرفوض") || message.includes("ملغى") || message.includes("401")) {
    return "invalid_token";
  }
  return null;
}

export function resolveTrayState(input: {
  tokenConfigured: boolean;
  lastHeartbeatOk: boolean;
  lastError: string | null;
  printerStatus: "ready" | "offline" | "error";
  printerConfigured: boolean;
  lastPrintOk: boolean | null;
}): TrayState {
  if (!input.tokenConfigured) {
    return "invalid_token";
  }

  if (input.lastError) {
    const network = classifyNetworkError(input.lastError);
    if (network) return network;
    if (input.lastError.includes("مرفوض") || input.lastError.includes("ملغى")) {
      return "invalid_token";
    }
  }

  if (!input.lastHeartbeatOk && input.lastError) {
    const network = classifyNetworkError(input.lastError);
    if (network) return network;
  }

  if (!input.printerConfigured || input.printerStatus !== "ready") {
    return "printer_missing";
  }

  if (input.lastPrintOk === false) {
    return "last_print_failed";
  }

  if (input.lastHeartbeatOk) {
    return "connected";
  }

  return "no_internet";
}
