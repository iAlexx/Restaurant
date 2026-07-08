import type { AgentConfig } from "../config/config.js";
import type { ClaimResponse } from "../providers/types.js";
export interface AgentLogger {
    info(message: string): void;
    error(message: string): void;
}
export declare class PrintAgent {
    private readonly config;
    private readonly token;
    private readonly logger;
    private running;
    private printing;
    private currentJobId;
    private shutdownRequested;
    constructor(config: AgentConfig, token: string, logger?: AgentLogger);
    requestShutdown(): void;
    isRunning(): boolean;
    start(): Promise<void>;
    private processJob;
}
export declare function runSinglePrintAttempt(config: AgentConfig, token: string, claim: ClaimResponse): Promise<"success" | "failed">;
