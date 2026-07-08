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
export const DEFAULT_CONFIG = {
    apiBaseUrl: "https://alnkha.site",
    windowsPrinterName: "POSPrinter POS80",
    printMode: "windows",
    pollIntervalMs: 4000,
    lanHost: "",
    lanPort: 9100,
};
export function getConfigDir() {
    const home = process.env.USERPROFILE ?? process.env.HOME ?? ".";
    return `${home}\\.restaurant-print`;
}
export function getConfigPath() {
    return `${getConfigDir()}\\config.json`;
}
export function validateConfig(input) {
    return agentConfigSchema.parse(input);
}
