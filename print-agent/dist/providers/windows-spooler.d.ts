import type { PrintProvider, PrinterStatus, ReceiptPayload } from "./types.js";
export declare class WindowsSpoolerProvider implements PrintProvider {
    private readonly printerName;
    private readonly receiptWidthPx;
    constructor(printerName: string, receiptWidthPx?: number);
    checkStatus(): Promise<PrinterStatus>;
    print(receiptPayload: ReceiptPayload): Promise<void>;
    testPrint(): Promise<void>;
    private printImage;
}
export declare function listWindowsPrinters(): Promise<string[]>;
export declare function spawnDetachedAgent(): void;
