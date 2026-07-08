import { z } from "zod";
export declare const printModeSchema: z.ZodEnum<["windows", "lan"]>;
export declare const agentConfigSchema: z.ZodObject<{
    apiBaseUrl: z.ZodString;
    windowsPrinterName: z.ZodString;
    printMode: z.ZodDefault<z.ZodEnum<["windows", "lan"]>>;
    pollIntervalMs: z.ZodDefault<z.ZodNumber>;
    lanHost: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    lanPort: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    apiBaseUrl: string;
    windowsPrinterName: string;
    printMode: "windows" | "lan";
    pollIntervalMs: number;
    lanHost: string;
    lanPort: number;
}, {
    apiBaseUrl: string;
    windowsPrinterName: string;
    printMode?: "windows" | "lan" | undefined;
    pollIntervalMs?: number | undefined;
    lanHost?: string | undefined;
    lanPort?: number | undefined;
}>;
export type AgentConfig = z.infer<typeof agentConfigSchema>;
export type PrintMode = z.infer<typeof printModeSchema>;
export declare const DEFAULT_CONFIG: AgentConfig;
export declare function getConfigDir(): string;
export declare function getConfigPath(): string;
export declare function validateConfig(input: unknown): AgentConfig;
