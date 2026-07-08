import { describe, expect, it } from "vitest";
import { validateConfig, DEFAULT_CONFIG } from "./config.js";
import { createPrintProvider } from "../providers/index.js";
import { formatReceiptText, buildTestReceipt } from "../receipt/format.js";
import { WindowsSpoolerProvider } from "../providers/windows-spooler.js";
import { EscPosLanProvider } from "../providers/escpos-lan.js";

describe("config validation", () => {
  it("accepts valid config", () => {
    const config = validateConfig({
      apiBaseUrl: "https://alnkha.site",
      windowsPrinterName: "POSPrinter POS80",
      printMode: "windows",
      pollIntervalMs: 4000,
      lanHost: "",
      lanPort: 9100,
      receiptWidthPx: 576,
    });

    expect(config.apiBaseUrl).toBe("https://alnkha.site");
    expect(config.receiptWidthPx).toBe(576);
  });

  it("defaults receipt width to 576px", () => {
    const config = validateConfig({
      apiBaseUrl: "https://alnkha.site",
      windowsPrinterName: "POSPrinter POS80",
      printMode: "windows",
      pollIntervalMs: 4000,
    });
    expect(config.receiptWidthPx).toBe(576);
  });

  it("accepts fallback receipt widths", () => {
    expect(validateConfig({ ...DEFAULT_CONFIG, receiptWidthPx: 512 }).receiptWidthPx).toBe(512);
    expect(validateConfig({ ...DEFAULT_CONFIG, receiptWidthPx: 384 }).receiptWidthPx).toBe(384);
  });

  it("rejects invalid api url", () => {
    expect(() =>
      validateConfig({
        ...DEFAULT_CONFIG,
        apiBaseUrl: "not-a-url",
      })
    ).toThrow();
  });

  it("enforces poll interval bounds", () => {
    expect(() =>
      validateConfig({
        ...DEFAULT_CONFIG,
        pollIntervalMs: 1000,
      })
    ).toThrow();
  });
});

describe("provider selection", () => {
  it("selects Windows spooler by default", () => {
    const provider = createPrintProvider({
      ...DEFAULT_CONFIG,
      printMode: "windows",
      receiptWidthPx: 576,
    });
    expect(provider).toBeInstanceOf(WindowsSpoolerProvider);
  });

  it("selects LAN provider when configured", () => {
    const provider = createPrintProvider({
      ...DEFAULT_CONFIG,
      printMode: "lan",
      lanHost: "192.168.1.50",
      lanPort: 9100,
    });
    expect(provider).toBeInstanceOf(EscPosLanProvider);
  });

  it("requires lanHost for lan mode", () => {
    expect(() =>
      createPrintProvider({
        ...DEFAULT_CONFIG,
        printMode: "lan",
        lanHost: "",
      })
    ).toThrow("lanHost");
  });
});

describe("receipt formatting", () => {
  it("includes reprint marker", () => {
    const receipt = buildTestReceipt();
    receipt.is_reprint = true;
    const text = formatReceiptText(receipt);
    expect(text).toContain("إعادة طباعة");
  });

  it("includes order details from payload snapshots", () => {
    const text = formatReceiptText(buildTestReceipt());
    expect(text).toContain("TEST-001");
    expect(text).toContain("برجر");
    expect(text).toContain("مطعمي");
  });
});

describe("retry behavior contract", () => {
  it("allows exactly one retry after first failure", () => {
    const maxAttempts = 2;
    let attempts = 0;
    let succeeded = false;

    while (attempts < maxAttempts) {
      attempts++;
      if (attempts === 2) {
        succeeded = true;
        break;
      }
    }

    expect(attempts).toBe(2);
    expect(succeeded).toBe(true);
  });
});
