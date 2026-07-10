import { createCanvas } from "@napi-rs/canvas";
import { createReceiptDrawer, wrapArabicBlock } from "./draw.js";
import { formatMoneyLTR, formatOrderNumberLTR, formatQuantityLTR, } from "./format.js";
import { registerReceiptFonts, FONT_ARABIC } from "./fonts.js";
function makeTheme(width) {
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
function fontString(size, bold) {
    return `${bold ? "bold " : ""}${size}px "${FONT_ARABIC}"`;
}
function layout(ctx, theme, receipt, draw) {
    registerReceiptFonts();
    const { width, pad, k } = theme;
    const contentWidth = width - pad * 2;
    const rightX = width - pad;
    const leftX = pad;
    let y = pad;
    ctx.textBaseline = "top";
    ctx.fillStyle = "#000000";
    ctx.strokeStyle = "#000000";
    const lineHeight = (size) => Math.round(size * 1.35);
    const drawer = createReceiptDrawer({
        ctx,
        draw,
        width,
        pad,
        leftX,
        rightX,
        lineHeight,
        getY: () => y,
        setY: (next) => {
            y = next;
        },
    });
    function drawCenter(text, size, bold) {
        const h = lineHeight(size);
        if (draw) {
            ctx.font = fontString(size, bold);
            ctx.direction = "rtl";
            ctx.textAlign = "center";
            ctx.fillText(text, width / 2, y);
        }
        y += h + theme.lineGap;
    }
    function separator() {
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
    function spacer(px) {
        y += Math.round(px * k);
    }
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
    drawCenter(receipt.restaurant_name, theme.sizeName, true);
    if (receipt.receipt_header) {
        drawCenter(receipt.receipt_header, theme.sizeTitle, false);
    }
    separator();
    drawer.drawRow("رقم الطلب", formatOrderNumberLTR(receipt.order_number), theme.sizeNormal, true);
    drawer.drawRtlLabel(`النوع: ${receipt.order_type_label}`, theme.sizeNormal, false);
    if (receipt.table_label) {
        drawer.drawRtlLabel(`الطاولة: ${receipt.table_label}`, theme.sizeNormal, false);
    }
    if (receipt.customer_name) {
        drawer.drawRtlLabel(`العميل: ${receipt.customer_name}`, theme.sizeNormal, false);
    }
    if (receipt.customer_phone) {
        drawer.drawRow("الهاتف", formatOrderNumberLTR(receipt.customer_phone), theme.sizeSmall, false);
    }
    if (receipt.customer_address) {
        wrapArabicBlock(drawer, "العنوان: ", receipt.customer_address, theme.sizeSmall, false, contentWidth);
    }
    if (receipt.pickup_time) {
        drawer.drawRow("وقت الاستلام", formatOrderNumberLTR(receipt.pickup_time), theme.sizeSmall, false);
    }
    if (receipt.notes) {
        wrapArabicBlock(drawer, "ملاحظات: ", receipt.notes, theme.sizeSmall, false, contentWidth);
    }
    separator();
    for (const item of receipt.items) {
        drawer.drawItemRow(item.name, formatQuantityLTR(item.quantity), formatMoneyLTR(item.line_total, receipt.currency_label), theme.sizeNormal, false, contentWidth);
        for (const addOn of item.add_ons) {
            const addMoney = formatMoneyLTR(addOn.price, receipt.currency_label);
            const prefix = `+ ${addOn.name}`;
            const h = lineHeight(theme.sizeSmall);
            if (draw) {
                ctx.font = fontString(theme.sizeSmall, false);
                ctx.direction = "rtl";
                ctx.textAlign = "right";
                ctx.fillText(prefix, rightX - Math.round(20 * k), y);
                let x = leftX;
                x += drawer.drawLtrValue(`+${addMoney.amount}`, theme.sizeSmall, false, x);
                ctx.font = fontString(theme.sizeSmall, false);
                ctx.direction = "ltr";
                ctx.textAlign = "left";
                ctx.fillText(` ${addMoney.currency}`, x, y);
            }
            y += h;
        }
        if (item.notes) {
            wrapArabicBlock(drawer, "» ", item.notes, theme.sizeSmall, false, contentWidth - Math.round(20 * k), Math.round(20 * k));
        }
        spacer(6);
    }
    separator();
    drawer.drawMoneyRow("المجموع الفرعي", formatMoneyLTR(receipt.subtotal, receipt.currency_label), theme.sizeNormal, false);
    if (receipt.delivery_fee > 0) {
        drawer.drawMoneyRow("رسوم التوصيل", formatMoneyLTR(receipt.delivery_fee, receipt.currency_label), theme.sizeNormal, false);
    }
    spacer(4);
    drawer.drawMoneyRow("الإجمالي", formatMoneyLTR(receipt.total, receipt.currency_label), theme.sizeTotal, true);
    separator();
    if (receipt.receipt_footer) {
        drawCenter(receipt.receipt_footer, theme.sizeSmall, false);
    }
    spacer(24);
    return Math.ceil(y);
}
export function renderReceiptPng(receipt, widthPx) {
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
