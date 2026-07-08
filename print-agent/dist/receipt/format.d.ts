import type { ReceiptPayload } from "../providers/types.js";
export declare function formatPrice(amount: number, currencyLabel: string): string;
export declare function formatReceiptText(receipt: ReceiptPayload): string;
export declare function buildTestReceipt(): ReceiptPayload;
