import { type ClaimResponse } from "../providers/types.js";
export declare class PrintAgentApiClient {
    private readonly apiBaseUrl;
    private readonly deviceToken;
    constructor(apiBaseUrl: string, deviceToken: string);
    private headers;
    private url;
    heartbeat(): Promise<void>;
    claim(): Promise<ClaimResponse | null>;
    markSuccess(jobId: string): Promise<void>;
    markFail(jobId: string, errorMessage: string): Promise<void>;
}
