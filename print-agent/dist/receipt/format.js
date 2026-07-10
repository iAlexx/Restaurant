/** ASCII digits and common numeric punctuation only — no bidi marks. */
const ASCII_NUMERIC = /^[\d,.\-+:/ ]*$/;
const ARABIC_INDIC = /[\u0660-\u0669\u06F0-\u06F9]/;
const BIDI_MARKS = /[\u200E\u200F\u202A-\u202E\u2066-\u2069]/g;
export function toAsciiDigits(value) {
    const raw = String(value);
    const converted = raw
        .replace(/[\u0660-\u0669]/g, (digit) => String(digit.charCodeAt(0) - 0x0660))
        .replace(/[\u06F0-\u06F9]/g, (digit) => String(digit.charCodeAt(0) - 0x06f0));
    return converted.replace(BIDI_MARKS, "");
}
export function assertAsciiNumeric(value, label) {
    const normalized = toAsciiDigits(value);
    if (!ASCII_NUMERIC.test(normalized)) {
        throw new Error(`${label} contains non-ASCII numeric characters: ${value}`);
    }
    if (ARABIC_INDIC.test(normalized) || BIDI_MARKS.test(normalized)) {
        throw new Error(`${label} contains forbidden digit or bidi marks: ${value}`);
    }
    return normalized;
}
export function formatOrderNumberLTR(orderNumber) {
    return assertAsciiNumeric(orderNumber.trim(), "order number");
}
export function formatQuantityLTR(quantity) {
    return assertAsciiNumeric(String(Math.trunc(quantity)), "quantity");
}
export function formatMoneyLTR(amount, currencyLabel) {
    return {
        amount: assertAsciiNumeric(Math.trunc(amount).toLocaleString("en-US"), "money amount"),
        currency: currencyLabel.trim(),
    };
}
export function formatMoneyDisplay(money) {
    return `${money.amount} ${money.currency}`;
}
export function formatPricePlain(amount, currencyLabel) {
    return formatMoneyDisplay(formatMoneyLTR(amount, currencyLabel));
}
/** @deprecated Text receipts use plain ASCII numbers without bidi isolation. */
export function ltrIsolate(value) {
    return toAsciiDigits(value);
}
export function formatPrice(amount, currencyLabel) {
    return formatPricePlain(amount, currencyLabel);
}
export function formatReceiptText(receipt) {
    const lines = [];
    const divider = "--------------------------------";
    if (receipt.is_reprint) {
        lines.push("*** إعادة طباعة ***");
        lines.push("");
    }
    lines.push(receipt.restaurant_name);
    if (receipt.receipt_header) {
        lines.push(receipt.receipt_header);
    }
    lines.push(divider);
    lines.push(`رقم الطلب: ${formatOrderNumberLTR(receipt.order_number)}`);
    lines.push(`النوع: ${receipt.order_type_label}`);
    if (receipt.table_label) {
        lines.push(`الطاولة: ${receipt.table_label}`);
    }
    if (receipt.customer_name) {
        lines.push(`العميل: ${receipt.customer_name}`);
    }
    if (receipt.customer_phone) {
        lines.push(`الهاتف: ${formatOrderNumberLTR(receipt.customer_phone)}`);
    }
    if (receipt.customer_address) {
        lines.push(`العنوان: ${receipt.customer_address}`);
    }
    if (receipt.pickup_time) {
        lines.push(`وقت الاستلام: ${formatOrderNumberLTR(receipt.pickup_time)}`);
    }
    if (receipt.notes) {
        lines.push(`ملاحظات: ${receipt.notes}`);
    }
    lines.push(divider);
    for (const item of receipt.items) {
        const money = formatMoneyLTR(item.line_total, receipt.currency_label);
        lines.push(`${item.name} x${formatQuantityLTR(item.quantity)}  ${formatMoneyDisplay(money)}`);
        for (const addOn of item.add_ons) {
            lines.push(`  + ${addOn.name} (${formatPrice(addOn.price, receipt.currency_label)})`);
        }
        if (item.notes) {
            lines.push(`  ملاحظة: ${item.notes}`);
        }
    }
    lines.push(divider);
    lines.push(`المجموع الفرعي: ${formatMoneyDisplay(formatMoneyLTR(receipt.subtotal, receipt.currency_label))}`);
    if (receipt.delivery_fee > 0) {
        lines.push(`رسوم التوصيل: ${formatMoneyDisplay(formatMoneyLTR(receipt.delivery_fee, receipt.currency_label))}`);
    }
    lines.push(`الإجمالي: ${formatMoneyDisplay(formatMoneyLTR(receipt.total, receipt.currency_label))}`);
    lines.push(divider);
    if (receipt.receipt_footer) {
        lines.push(receipt.receipt_footer);
    }
    lines.push("");
    lines.push("");
    return lines.join("\n");
}
export function buildTestReceipt() {
    return {
        job_id: "00000000-0000-4000-8000-000000000001",
        is_reprint: false,
        restaurant_name: "مطعمي",
        receipt_header: "اختبار الطباعة",
        receipt_footer: "شكراً لزيارتكم",
        currency_label: "ل.س",
        order_number: "100726-010",
        order_type: "DINE_IN",
        order_type_label: "داخل المطعم",
        table_label: "طاولة 1",
        customer_name: null,
        customer_phone: null,
        customer_address: null,
        location_url: null,
        pickup_time: null,
        notes: null,
        items: [
            {
                name: "برجر",
                quantity: 2,
                unit_price: 1233,
                line_total: 2466,
                notes: null,
                add_ons: [],
            },
        ],
        subtotal: 2466,
        delivery_fee: 9868,
        total: 12334,
        created_at: new Date().toISOString(),
    };
}
