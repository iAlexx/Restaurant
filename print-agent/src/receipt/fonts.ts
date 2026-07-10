import { existsSync } from "node:fs";
import { join } from "node:path";
import { createCanvas, GlobalFonts } from "@napi-rs/canvas";
import { getFontsDir } from "../paths.js";

export const FONT_ARABIC = "ReceiptCairo";
export const FONT_NUMERIC = "ReceiptNumeric";

export interface FontRegistrationStatus {
  ok: boolean;
  arabic: boolean;
  numeric: boolean;
  paths: {
    arabic: string | null;
    numeric: string | null;
  };
  errors: string[];
  warnings: string[];
}

let registrationStatus: FontRegistrationStatus | null = null;

function logFont(message: string): void {
  console.log(`[receipt-fonts] ${message}`);
}

function registerFontFile(
  filePath: string,
  family: string,
  errors: string[]
): boolean {
  if (!existsSync(filePath)) {
    errors.push(`Missing font file: ${filePath}`);
    return false;
  }

  try {
    const registered = GlobalFonts.registerFromPath(filePath, family);
    if (!registered) {
      errors.push(`registerFromPath returned false for ${filePath} (${family})`);
      return false;
    }
    if (!GlobalFonts.has(family)) {
      errors.push(`Family not listed after registration: ${family}`);
      return false;
    }
    logFont(`Registered ${family} from ${filePath}`);
    return true;
  } catch (error) {
    errors.push(
      `Failed to register ${filePath}: ${error instanceof Error ? error.message : String(error)}`
    );
    return false;
  }
}

function probeFontWidth(
  family: string,
  text: string,
  size = 24,
  bold = false
): number {
  const canvas = createCanvas(240, 80);
  const ctx = canvas.getContext("2d");
  ctx.font = `${bold ? "bold " : ""}${size}px "${family}"`;
  ctx.direction = family === FONT_NUMERIC ? "ltr" : "rtl";
  ctx.textAlign = "left";
  return ctx.measureText(text).width;
}

function verifyFontRenders(
  family: string,
  probe: string,
  errors: string[],
  label: string,
  bold = false
): boolean {
  const width = probeFontWidth(family, probe, 24, bold);
  if (width <= 0) {
    errors.push(`${label} probe "${probe}" measured width ${width}`);
    return false;
  }
  return true;
}

function resolveFontPath(fontsDir: string, names: string[]): string | null {
  for (const name of names) {
    const candidate = join(fontsDir, name);
    if (existsSync(candidate)) return candidate;
  }
  return null;
}

function resolveWindowsArial(): string | null {
  const candidates = [
    join(process.env.WINDIR ?? "C:\\Windows", "Fonts", "arial.ttf"),
    join(process.env.WINDIR ?? "C:\\Windows", "Fonts", "Arial.ttf"),
  ];
  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate;
  }
  return null;
}

export function registerReceiptFonts(): FontRegistrationStatus {
  if (registrationStatus) return registrationStatus;

  const errors: string[] = [];
  const warnings: string[] = [];
  const fontsDir = getFontsDir();

  const arabicPath = resolveFontPath(fontsDir, [
    "Cairo-Variable.ttf",
    "Cairo-Regular.ttf",
  ]);
  let numericPath = resolveFontPath(fontsDir, [
    "Numeric-Regular.ttf",
    "DejaVuSans.ttf",
  ]);

  if (!numericPath) {
    numericPath = resolveWindowsArial();
    if (numericPath) {
      warnings.push(`Using system Arial fallback: ${numericPath}`);
    }
  }

  const arabic =
    arabicPath !== null &&
    registerFontFile(arabicPath, FONT_ARABIC, errors) &&
    verifyFontRenders(FONT_ARABIC, "مطعم", errors, "Arabic") &&
    verifyFontRenders(FONT_ARABIC, "مطعم", errors, "Arabic bold", true);

  const numeric =
    numericPath !== null &&
    registerFontFile(numericPath, FONT_NUMERIC, errors) &&
    verifyFontRenders(FONT_NUMERIC, "0123456789", errors, "Numeric") &&
    verifyFontRenders(FONT_NUMERIC, "1,234.56", errors, "Numeric money");

  const status: FontRegistrationStatus = {
    ok: arabic && numeric,
    arabic,
    numeric,
    paths: {
      arabic: arabicPath,
      numeric: numericPath,
    },
    errors,
    warnings,
  };

  registrationStatus = status;

  if (status.ok) {
    logFont("All receipt fonts registered successfully");
  } else {
    const message = `Receipt font registration failed: ${errors.join("; ")}`;
    if (process.env.VITEST === "true" || process.env.RPA_RECEIPT_FONT_STRICT === "1") {
      throw new Error(message);
    }
    console.error(`[receipt-fonts] ${message}`);
  }

  for (const warning of warnings) {
    console.warn(`[receipt-fonts] ${warning}`);
  }

  return status;
}

export function getFontRegistrationStatus(): FontRegistrationStatus {
  return registrationStatus ?? registerReceiptFonts();
}

export function renderFontDiagnosticPng(): Buffer {
  registerReceiptFonts();
  const status = getFontRegistrationStatus();

  const width = 576;
  const height = 420;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = "#000000";
  ctx.textBaseline = "top";

  let y = 20;
  const line = (
    text: string,
    family: string,
    size: number,
    bold = false,
    rtl = false
  ) => {
    ctx.font = `${bold ? "bold " : ""}${size}px "${family}"`;
    ctx.direction = rtl ? "rtl" : "ltr";
    ctx.textAlign = "left";
    ctx.fillText(text, 20, y);
    y += Math.round(size * 1.5);
  };

  line("Font diagnostic / تشخيص الخطوط", FONT_ARABIC, 28, true, true);
  y += 8;

  line(`Arabic: ${status.arabic ? "OK" : "FAIL"}`, FONT_ARABIC, 22, false, true);
  line(`Numeric: ${status.numeric ? "OK" : "FAIL"}`, FONT_ARABIC, 22, false, true);
  y += 8;

  line("Arabic sample: مطعمي — داخل المطعم", FONT_ARABIC, 24, false, true);
  line("Digits: 0123456789", FONT_NUMERIC, 30);
  line("Order: 100726-010", FONT_NUMERIC, 28);
  line("Money amount: 12,334", FONT_NUMERIC, 28);
  line("Currency label: ل.س", FONT_ARABIC, 24, false, true);

  return canvas.toBuffer("image/png");
}
