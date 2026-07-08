import type { PrintProvider, PrinterStatus, ReceiptPayload } from "./types.js";
export declare class EscPosLanProvider implements PrintProvider {
    private readonly host;
    private readonly port;
    constructor(host: string, port: number);
    checkStatus(): Promise<PrinterStatus>;
    print(receiptPayload: ReceiptPayload): Promise<void>;
    testPrint(): Promise<void>;
}
