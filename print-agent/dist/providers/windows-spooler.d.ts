import type { PrintProvider, PrinterStatus, ReceiptPayload } from "./types.js";
export declare class WindowsSpoolerProvider implements PrintProvider {
    private readonly printerName;
    constructor(printerName: string);
    checkStatus(): Promise<PrinterStatus>;
    print(receiptPayload: ReceiptPayload): Promise<void>;
    testPrint(): Promise<void>;
    private printRawText;
}
export declare function listWindowsPrinters(): Promise<string[]>;
export declare function spawnDetachedAgent(): void;
