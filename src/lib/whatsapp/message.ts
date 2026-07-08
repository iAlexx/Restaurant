import { formatPrice } from "@/lib/money";

type OrderType = "DINE_IN" | "DELIVERY" | "PICKUP";

interface WhatsAppOrderItem {
  id: string;
  product_name_snapshot: string;
  unit_price_snapshot: number;
  quantity: number;
  line_total: number;
  notes: string | null;
}

interface WhatsAppOrderAddOn {
  order_item_id: string;
  name_snapshot: string;
  price_snapshot: number;
}

interface WhatsAppOrder {
  order_number: string;
  order_type: OrderType;
  customer_name: string | null;
  customer_phone: string | null;
  customer_address: string | null;
  location_url: string | null;
  pickup_time: string | null;
  notes: string | null;
  subtotal: number;
  delivery_fee: number;
  total: number;
  table_label_snapshot: string | null;
}

const orderTypeLabels: Record<OrderType, string> = {
  DINE_IN: "داخل المطعم",
  DELIVERY: "توصيل",
  PICKUP: "استلام",
};

export function buildWhatsAppMessage(
  order: WhatsAppOrder,
  items: WhatsAppOrderItem[],
  addOns: WhatsAppOrderAddOn[],
  currencyLabel: string
): string {
  const addOnsByItem = new Map<string, WhatsAppOrderAddOn[]>();
  for (const addOn of addOns) {
    const list = addOnsByItem.get(addOn.order_item_id) ?? [];
    list.push(addOn);
    addOnsByItem.set(addOn.order_item_id, list);
  }

  const lines: string[] = [
    "طلب جديد من الموقع",
    `رقم الطلب: ${order.order_number}`,
    `النوع: ${orderTypeLabels[order.order_type]}`,
  ];

  if (order.customer_name) {
    lines.push(`الاسم: ${order.customer_name}`);
  }
  if (order.customer_phone) {
    lines.push(`الهاتف: ${order.customer_phone}`);
  }
  if (order.order_type === "DELIVERY" && order.customer_address) {
    lines.push(`العنوان: ${order.customer_address}`);
  }
  if (order.location_url) {
    lines.push(`الموقع: ${order.location_url}`);
  }
  if (order.pickup_time) {
    lines.push(`وقت الاستلام: ${order.pickup_time}`);
  }

  lines.push("", "المنتجات:");

  for (const item of items) {
    lines.push(
      `• ${item.product_name_snapshot} × ${item.quantity} — ${formatPrice(item.line_total, currencyLabel)}`
    );
    const itemAddOns = addOnsByItem.get(item.id) ?? [];
    for (const addOn of itemAddOns) {
      const price =
        addOn.price_snapshot > 0
          ? ` (+${formatPrice(addOn.price_snapshot, currencyLabel)})`
          : "";
      lines.push(`  - ${addOn.name_snapshot}${price}`);
    }
    if (item.notes) {
      lines.push(`  ملاحظة: ${item.notes}`);
    }
  }

  if (order.notes) {
    lines.push("", `ملاحظات الطلب: ${order.notes}`);
  }

  lines.push("");
  lines.push(`المجموع الفرعي: ${formatPrice(order.subtotal, currencyLabel)}`);

  if (order.delivery_fee > 0) {
    lines.push(`رسوم التوصيل: ${formatPrice(order.delivery_fee, currencyLabel)}`);
  }

  lines.push(`الإجمالي: ${formatPrice(order.total, currencyLabel)}`);

  return lines.join("\n");
}

export function buildWhatsAppUrl(phone: string, message: string): string {
  const digits = phone.replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
