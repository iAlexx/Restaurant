import { z } from "zod";

export const printModeSchema = z.enum(["windows", "lan"]);

export const agentConfigSchema = z.object({
  apiBaseUrl: z.string().url(),
  windowsPrinterName: z.string().min(1),
  printMode: printModeSchema.default("windows"),
  pollIntervalMs: z.number().int().min(3000).max(10000).default(4000),
  lanHost: z.string().optional().default(""),
  lanPort: z.number().int().min(1).max(65535).default(9100),
});

export type AgentConfig = z.infer<typeof agentConfigSchema>;
export type PrintMode = z.infer<typeof printModeSchema>;

export const DEFAULT_CONFIG: AgentConfig = {
  apiBaseUrl: "https://alnkha.site",
  windowsPrinterName: "POSPrinter POS80",
  printMode: "windows",
  pollIntervalMs: 4000,
  lanHost: "",
  lanPort: 9100,
};

export function getConfigDir(): string {
  const home = process.env.USERPROFILE ?? process.env.HOME ?? ".";
  return `${home}\\.restaurant-print`;
}

export function getConfigPath(): string {
  return `${getConfigDir()}\\config.json`;
}

export function validateConfig(input: unknown): AgentConfig {
  return agentConfigSchema.parse(input);
}
