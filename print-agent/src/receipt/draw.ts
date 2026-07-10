import type { SKRSContext2D } from "@napi-rs/canvas";
import {
  FONT_ARABIC,
  FONT_NUMERIC,
} from "./fonts.js";
import type { MoneyLTR } from "./format.js";

export interface ReceiptDrawer {
  measureArabic(text: string, size: number, bold: boolean): number;
  measureNumeric(text: string, size: number, bold: boolean): number;
  measureMoney(money: MoneyLTR, size: number, bold: boolean): number;
  drawRtlLabel(
    text: string,
    size: number,
    bold: boolean,
    indent?: number
  ): void;
  drawLtrValue(text: string, size: number, bold: boolean, x?: number): number;
  drawMoney(money: MoneyLTR, size: number, bold: boolean, x?: number): number;
  drawRow(
    label: string,
    value: string,
    size: number,
    bold: boolean,
    indent?: number
  ): void;
  drawMoneyRow(
    label: string,
    money: MoneyLTR,
    size: number,
    bold: boolean,
    indent?: number
  ): void;
  drawItemRow(
    name: string,
    quantity: string,
    money: MoneyLTR,
    size: number,
    bold: boolean,
    contentWidth: number,
    indent?: number
  ): void;
  advanceLine(size: number): void;
}

interface DrawerOptions {
  ctx: SKRSContext2D;
  draw: boolean;
  width: number;
  pad: number;
  leftX: number;
  rightX: number;
  lineHeight: (size: number) => number;
  getY: () => number;
  setY: (y: number) => void;
}

function arabicFont(size: number, bold: boolean): string {
  return `${bold ? "bold " : ""}${size}px "${FONT_ARABIC}"`;
}

function numericFont(size: number, bold: boolean): string {
  return `${size}px "${FONT_NUMERIC}"`;
}

export function createReceiptDrawer(options: DrawerOptions): ReceiptDrawer {
  const { ctx, draw, leftX, rightX, lineHeight, getY, setY } = options;

  function measureArabic(text: string, size: number, bold: boolean): number {
    ctx.font = arabicFont(size, bold);
    ctx.direction = "rtl";
    return ctx.measureText(text).width;
  }

  function measureNumeric(text: string, size: number, bold: boolean): number {
    ctx.font = numericFont(size, bold);
    ctx.direction = "ltr";
    return ctx.measureText(text).width;
  }

  function measureMoney(money: MoneyLTR, size: number, bold: boolean): number {
    return (
      measureNumeric(money.amount, size, bold) +
      measureArabic(` ${money.currency}`, size, bold)
    );
  }

  function drawRtlLabel(
    text: string,
    size: number,
    bold: boolean,
    indent = 0
  ): void {
    const h = lineHeight(size);
    if (draw) {
      ctx.font = arabicFont(size, bold);
      ctx.direction = "rtl";
      ctx.textAlign = "right";
      ctx.fillText(text, rightX - indent, getY());
    }
    setY(getY() + h);
  }

  function drawLtrValue(
    text: string,
    size: number,
    bold: boolean,
    x = leftX
  ): number {
    if (draw) {
      ctx.font = numericFont(size, bold);
      ctx.direction = "ltr";
      ctx.textAlign = "left";
      ctx.fillText(text, x, getY());
    }
    return measureNumeric(text, size, bold);
  }

  function drawMoney(
    money: MoneyLTR,
    size: number,
    bold: boolean,
    x = leftX
  ): number {
    const amountWidth = drawLtrValue(money.amount, size, bold, x);
    if (draw) {
      ctx.font = arabicFont(size, bold);
      ctx.direction = "ltr";
      ctx.textAlign = "left";
      ctx.fillText(` ${money.currency}`, x + amountWidth, getY());
    }
    return measureMoney(money, size, bold);
  }

  function drawRow(
    label: string,
    value: string,
    size: number,
    bold: boolean,
    indent = 0
  ): void {
    const h = lineHeight(size);
    if (draw) {
      ctx.font = arabicFont(size, bold);
      ctx.direction = "rtl";
      ctx.textAlign = "right";
      ctx.fillText(label, rightX - indent, getY());

      ctx.font = numericFont(size, bold);
      ctx.direction = "ltr";
      ctx.textAlign = "left";
      ctx.fillText(value, leftX, getY());
    }
    setY(getY() + h);
  }

  function drawMoneyRow(
    label: string,
    money: MoneyLTR,
    size: number,
    bold: boolean,
    indent = 0
  ): void {
    const h = lineHeight(size);
    if (draw) {
      ctx.font = arabicFont(size, bold);
      ctx.direction = "rtl";
      ctx.textAlign = "right";
      ctx.fillText(label, rightX - indent, getY());
      drawMoney(money, size, bold, leftX);
    }
    setY(getY() + h);
  }

  function wrapArabicRight(
    text: string,
    size: number,
    bold: boolean,
    maxWidth: number,
    indent = 0
  ): string[] {
    const words = text.split(/\s+/).filter(Boolean);
    const lines: string[] = [];
    let current = "";

    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word;
      if (measureArabic(candidate, size, bold) <= maxWidth || !current) {
        current = candidate;
      } else {
        lines.push(current);
        current = word;
      }
    }
    if (current) lines.push(current);
    if (lines.length === 0) lines.push(text);
    return lines;
  }

  function drawItemRow(
    name: string,
    quantity: string,
    money: MoneyLTR,
    size: number,
    bold: boolean,
    contentWidth: number,
    indent = 0
  ): void {
    const valueText = `${quantity} x ${money.amount}`;
    const valueWidth =
      measureNumeric(valueText, size, bold) +
      measureArabic(` ${money.currency}`, size, bold);
    const nameMax = contentWidth - valueWidth - 16;
    const lines = wrapArabicRight(name, size, bold, nameMax, indent);

    lines.forEach((line, index) => {
      if (index === 0) {
        const h = lineHeight(size);
        if (draw) {
          ctx.font = arabicFont(size, bold);
          ctx.direction = "rtl";
          ctx.textAlign = "right";
          ctx.fillText(line, rightX - indent, getY());

          let x = leftX;
          x += drawLtrValue(`${quantity} x ${money.amount}`, size, bold, x);
          ctx.font = arabicFont(size, bold);
          ctx.direction = "ltr";
          ctx.textAlign = "left";
          ctx.fillText(` ${money.currency}`, x, getY());
        }
        setY(getY() + h);
      } else {
        drawRtlLabel(line, size, bold, indent);
      }
    });
  }

  function advanceLine(size: number): void {
    setY(getY() + lineHeight(size));
  }

  return {
    measureArabic,
    measureNumeric,
    measureMoney,
    drawRtlLabel,
    drawLtrValue,
    drawMoney,
    drawRow,
    drawMoneyRow,
    drawItemRow,
    advanceLine,
  };
}

export function wrapArabicBlock(
  drawer: ReceiptDrawer,
  prefix: string,
  body: string,
  size: number,
  bold: boolean,
  contentWidth: number,
  indent = 0
): void {
  const text = `${prefix}${body}`;
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (drawer.measureArabic(candidate, size, bold) <= contentWidth || !current) {
      current = candidate;
    } else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  if (lines.length === 0) lines.push(text);

  for (const line of lines) {
    drawer.drawRtlLabel(line, size, bold, indent);
  }
}
