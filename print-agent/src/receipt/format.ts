import type { ReceiptPayload } from "../providers/types.js";

export function formatPrice(amount: number, currencyLabel: string): string {
  return `${amount.toLocaleString("ar-SY")} ${currencyLabel}`;
}

export function formatReceiptText(receipt: ReceiptPayload): string {
  const lines: string[] = [];
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
  lines.push(`رقم الطلب: ${receipt.order_number}`);
  lines.push(`النوع: ${receipt.order_type_label}`);

  if (receipt.table_label) {
    lines.push(`الطاولة: ${receipt.table_label}`);
  }

  if (receipt.customer_name) {
    lines.push(`العميل: ${receipt.customer_name}`);
  }
  if (receipt.customer_phone) {
    lines.push(`الهاتف: ${receipt.customer_phone}`);
  }
  if (receipt.customer_address) {
    lines.push(`العنوان: ${receipt.customer_address}`);
  }
  if (receipt.pickup_time) {
    lines.push(`وقت الاستلام: ${receipt.pickup_time}`);
  }
  if (receipt.notes) {
    lines.push(`ملاحظات: ${receipt.notes}`);
  }

  lines.push(divider);

  for (const item of receipt.items) {
    lines.push(`${item.name} x${item.quantity}`);
    for (const addOn of item.add_ons) {
      lines.push(`  + ${addOn.name} (${formatPrice(addOn.price, receipt.currency_label)})`);
    }
    if (item.notes) {
      lines.push(`  ملاحظة: ${item.notes}`);
    }
    lines.push(`  ${formatPrice(item.line_total, receipt.currency_label)}`);
  }

  lines.push(divider);
  lines.push(`المجموع الفرعي: ${formatPrice(receipt.subtotal, receipt.currency_label)}`);

  if (receipt.delivery_fee > 0) {
    lines.push(`رسوم التوصيل: ${formatPrice(receipt.delivery_fee, receipt.currency_label)}`);
  }

  lines.push(`الإجمالي: ${formatPrice(receipt.total, receipt.currency_label)}`);
  lines.push(divider);

  if (receipt.receipt_footer) {
    lines.push(receipt.receipt_footer);
  }

  lines.push("");
  lines.push("");

  return lines.join("\n");
}

export function buildTestReceipt(): ReceiptPayload {
  return {
    job_id: "00000000-0000-4000-8000-000000000001",
    is_reprint: false,
    restaurant_name: "مطعمي",
    receipt_header: "اختبار الطباعة",
    receipt_footer: "شكراً لزيارتكم",
    currency_label: "ل.س",
    order_number: "TEST-001",
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
        quantity: 1,
        unit_price: 1000,
        line_total: 1000,
        notes: null,
        add_ons: [],
      },
    ],
    subtotal: 1000,
    delivery_fee: 0,
    total: 1000,
    created_at: new Date().toISOString(),
  };
}
