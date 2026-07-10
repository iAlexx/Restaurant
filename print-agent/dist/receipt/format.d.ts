import type { ReceiptPayload } from "../providers/types.js";
export declare function toAsciiDigits(value: string | number): string;
export declare function assertAsciiNumeric(value: string, label: string): string;
export declare function formatOrderNumberLTR(orderNumber: string): string;
export declare function formatQuantityLTR(quantity: number): string;
export interface MoneyLTR {
    amount: string;
    currency: string;
}
export declare function formatMoneyLTR(amount: number, currencyLabel: string): MoneyLTR;
export declare function formatMoneyDisplay(money: MoneyLTR): string;
export declare function formatPricePlain(amount: number, currencyLabel: string): string;
/** @deprecated Text receipts use plain ASCII numbers without bidi isolation. */
export declare function ltrIsolate(value: string | number): string;
export declare function formatPrice(amount: number, currencyLabel: string): string;
export declare function formatReceiptText(receipt: ReceiptPayload): string;
export declare function buildTestReceipt(): ReceiptPayload;
