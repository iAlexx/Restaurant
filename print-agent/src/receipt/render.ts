import { existsSync } from "node:fs";
import { join } from "node:path";
import { createCanvas, GlobalFonts, type SKRSContext2D } from "@napi-rs/canvas";
import { getFontsDir } from "../paths.js";
import type { ReceiptPayload } from "../providers/types.js";
import { formatPrice } from "./format.js";

const FONT_REGULAR = "CairoReceipt";
const FONT_BOLD = "CairoReceiptBold";

let fontsRegistered = false;

function ensureFonts(): void {
  if (fontsRegistered) return;

  const fontsDir = getFontsDir();
  const regular = join(fontsDir, "Cairo-Regular.woff");
  const bold = join(fontsDir, "Cairo-Bold.woff");
  const regularTtf = join(fontsDir, "Cairo-Regular.ttf");
  const boldTtf = join(fontsDir, "Cairo-Bold.ttf");

  if (existsSync(regular)) {
    GlobalFonts.registerFromPath(regular, FONT_REGULAR);
  } else if (existsSync(regularTtf)) {
    GlobalFonts.registerFromPath(regularTtf, FONT_REGULAR);
  }
  if (existsSync(bold)) {
    GlobalFonts.registerFromPath(bold, FONT_BOLD);
  } else if (existsSync(boldTtf)) {
    GlobalFonts.registerFromPath(boldTtf, FONT_BOLD);
  }

  fontsRegistered = true;
}

interface LayoutTheme {
  width: number;
  pad: number;
  k: number;
  sizeName: number;
  sizeTitle: number;
  sizeNormal: number;
  sizeSmall: number;
  sizeTotal: number;
  lineGap: number;
}

function makeTheme(width: number): LayoutTheme {
  const k = width / 576;
  return {
    width,
    k,
    pad: Math.round(18 * k),
    sizeName: Math.round(40 * k),
    sizeTitle: Math.round(26 * k),
    sizeNormal: Math.round(26 * k),
    sizeSmall: Math.round(22 * k),
    sizeTotal: Math.round(38 * k),
    lineGap: Math.round(10 * k),
  };
}

function fontString(size: number, bold: boolean): string {
  return `${size}px "${bold ? FONT_BOLD : FONT_REGULAR}"`;
}

/**
 * Single layout routine used for both measuring (draw=false) and painting
 * (draw=true). Returns the total content height in pixels.
 */
function layout(
  ctx: SKRSContext2D,
  theme: LayoutTheme,
  receipt: ReceiptPayload,
  draw: boolean
): number {
  const { width, pad, k } = theme;
  const contentWidth = width - pad * 2;
  const rightX = width - pad;
  const leftX = pad;
  let y = pad;

  ctx.textBaseline = "top";
  ctx.fillStyle = "#000000";
  ctx.strokeStyle = "#000000";

  const lineHeight = (size: number) => Math.round(size * 1.35);

  function measureWidth(text: string, size: number, bold: boolean): number {
    ctx.font = fontString(size, bold);
    return ctx.measureText(text).width;
  }

  function drawCenter(text: string, size: number, bold: boolean): void {
    const h = lineHeight(size);
    if (draw) {
      ctx.font = fontString(size, bold);
      ctx.direction = "rtl";
      ctx.textAlign = "center";
      ctx.fillText(text, width / 2, y);
    }
    y += h + theme.lineGap;
  }

  function drawRight(
    text: string,
    size: number,
    bold: boolean,
    indent = 0
  ): void {
    const h = lineHeight(size);
    if (draw) {
      ctx.font = fontString(size, bold);
      ctx.direction = "rtl";
      ctx.textAlign = "right";
      ctx.fillText(text, rightX - indent, y);
    }
    y += h;
  }

  function drawRow(
    rightText: string,
    leftText: string,
    size: number,
    bold: boolean,
    indent = 0
  ): void {
    const h = lineHeight(size);
    if (draw) {
      ctx.font = fontString(size, bold);
      ctx.direction = "rtl";
      ctx.textAlign = "right";
      ctx.fillText(rightText, rightX - indent, y);

      ctx.direction = "ltr";
      ctx.textAlign = "left";
      ctx.fillText(leftText, leftX, y);
    }
    y += h;
  }

  function wrapRight(
    text: string,
    size: number,
    bold: boolean,
    maxWidth: number,
    priceText: string | null,
    indent = 0
  ): void {
    const words = text.split(/\s+/).filter(Boolean);
    const lines: string[] = [];
    let current = "";

    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word;
      if (measureWidth(candidate, size, bold) <= maxWidth || !current) {
        current = candidate;
      } else {
        lines.push(current);
        current = word;
      }
    }
    if (current) lines.push(current);
    if (lines.length === 0) lines.push(text);

    lines.forEach((line, index) => {
      if (index === 0 && priceText) {
        drawRow(line, priceText, size, bold, indent);
      } else {
        drawRight(line, size, bold, indent);
      }
    });
  }

  function separator(): void {
    const h = Math.round(6 * k);
    if (draw) {
      ctx.save();
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = Math.max(1, Math.round(2 * k));
      ctx.setLineDash([Math.round(7 * k), Math.round(5 * k)]);
      ctx.beginPath();
      ctx.moveTo(pad, y + h / 2);
      ctx.lineTo(width - pad, y + h / 2);
      ctx.stroke();
      ctx.restore();
    }
    y += h + theme.lineGap;
  }

  function spacer(px: number): void {
    y += Math.round(px * k);
  }

  // --- Reprint marker ---------------------------------------------------
  if (receipt.is_reprint) {
    const boxH = lineHeight(theme.sizeTitle) + Math.round(10 * k);
    if (draw) {
      ctx.save();
      ctx.lineWidth = Math.max(1, Math.round(2 * k));
      ctx.setLineDash([]);
      ctx.strokeRect(pad, y, contentWidth, boxH);
      ctx.font = fontString(theme.sizeTitle, true);
      ctx.direction = "rtl";
      ctx.textAlign = "center";
      ctx.fillText("*** إعادة طباعة ***", width / 2, y + Math.round(5 * k));
      ctx.restore();
    }
    y += boxH + theme.lineGap;
  }

  // --- Header -----------------------------------------------------------
  drawCenter(receipt.restaurant_name, theme.sizeName, true);
  if (receipt.receipt_header) {
    drawCenter(receipt.receipt_header, theme.sizeTitle, false);
  }

  separator();

  // --- Order info -------------------------------------------------------
  drawRight(`رقم الطلب: ${receipt.order_number}`, theme.sizeNormal, true);
  drawRight(`النوع: ${receipt.order_type_label}`, theme.sizeNormal, false);

  if (receipt.table_label) {
    drawRight(`الطاولة: ${receipt.table_label}`, theme.sizeNormal, false);
  }
  if (receipt.customer_name) {
    drawRight(`العميل: ${receipt.customer_name}`, theme.sizeNormal, false);
  }
  if (receipt.customer_phone) {
    drawRight(`الهاتف: ${receipt.customer_phone}`, theme.sizeSmall, false);
  }
  if (receipt.customer_address) {
    wrapRight(
      `العنوان: ${receipt.customer_address}`,
      theme.sizeSmall,
      false,
      contentWidth,
      null
    );
  }
  if (receipt.pickup_time) {
    drawRight(`وقت الاستلام: ${receipt.pickup_time}`, theme.sizeSmall, false);
  }
  if (receipt.notes) {
    wrapRight(
      `ملاحظات: ${receipt.notes}`,
      theme.sizeSmall,
      false,
      contentWidth,
      null
    );
  }

  separator();

  // --- Items ------------------------------------------------------------
  for (const item of receipt.items) {
    const priceText = formatPrice(item.line_total, receipt.currency_label);
    const nameMax = contentWidth - measureWidth(priceText, theme.sizeNormal, true) - Math.round(16 * k);
    wrapRight(
      `${item.name} × ${item.quantity}`,
      theme.sizeNormal,
      false,
      nameMax,
      priceText
    );

    for (const addOn of item.add_ons) {
      const addPrice = `+${formatPrice(addOn.price, receipt.currency_label)}`;
      drawRow(
        `+ ${addOn.name}`,
        addPrice,
        theme.sizeSmall,
        false,
        Math.round(20 * k)
      );
    }

    if (item.notes) {
      wrapRight(
        `» ${item.notes}`,
        theme.sizeSmall,
        false,
        contentWidth - Math.round(20 * k),
        null,
        Math.round(20 * k)
      );
    }

    spacer(6);
  }

  separator();

  // --- Totals -----------------------------------------------------------
  drawRow(
    "المجموع الفرعي",
    formatPrice(receipt.subtotal, receipt.currency_label),
    theme.sizeNormal,
    false
  );

  if (receipt.delivery_fee > 0) {
    drawRow(
      "رسوم التوصيل",
      formatPrice(receipt.delivery_fee, receipt.currency_label),
      theme.sizeNormal,
      false
    );
  }

  spacer(4);
  drawRow(
    "الإجمالي",
    formatPrice(receipt.total, receipt.currency_label),
    theme.sizeTotal,
    true
  );

  separator();

  // --- Footer -----------------------------------------------------------
  if (receipt.receipt_footer) {
    drawCenter(receipt.receipt_footer, theme.sizeSmall, false);
  }

  spacer(24);

  return Math.ceil(y);
}

export function renderReceiptPng(
  receipt: ReceiptPayload,
  widthPx: number
): Buffer {
  ensureFonts();

  const theme = makeTheme(widthPx);

  const measureCanvas = createCanvas(widthPx, 10);
  const measureCtx = measureCanvas.getContext("2d");
  const height = layout(measureCtx, theme, receipt, false);

  const canvas = createCanvas(widthPx, height);
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, widthPx, height);

  layout(ctx, theme, receipt, true);

  return canvas.toBuffer("image/png");
}
