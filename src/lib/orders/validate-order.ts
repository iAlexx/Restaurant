import type { SupabaseClient } from "@supabase/supabase-js";
import type { CreateOrderInput } from "@/lib/validations/order";
import { assertRestaurantAcceptsCustomerOrders } from "@/lib/hours/order-guard";
import {
  buildOrderChargeTotals,
  fetchActiveRestaurantCharges,
} from "@/lib/charges/resolve";
import {
  getInitialOrderStatus,
  type ResolvedLineSnapshot,
} from "@/lib/orders/calculations";
import {
  buildTrustedOrderPayloadFromCustomerInput,
  type TrustedOrderPayload,
} from "@/lib/orders/rpc-payload";

export class OrderValidationError extends Error {
  constructor(
    message: string,
    public statusCode = 400
  ) {
    super(message);
    this.name = "OrderValidationError";
  }
}

interface DbProduct {
  id: string;
  name_ar: string;
  price: number;
  is_available: boolean;
  category_id: string;
}

interface DbAddOn {
  id: string;
  name_ar: string;
  extra_price: number;
  is_available: boolean;
}

interface DbSettings {
  currency_label: string;
  delivery_enabled: boolean;
  pickup_enabled: boolean;
  default_delivery_fee: number;
  min_delivery_order: number;
}

export interface ValidatedOrderContext {
  currency_label: string;
  trustedPayload: TrustedOrderPayload;
}

export async function validateAndBuildTrustedPayload(
  supabase: SupabaseClient,
  input: CreateOrderInput
): Promise<ValidatedOrderContext> {
  await assertRestaurantAcceptsCustomerOrders(supabase);

  const { data: settings, error: settingsError } = await supabase
    .from("restaurant_settings")
    .select(
      "currency_label, delivery_enabled, pickup_enabled, default_delivery_fee, min_delivery_order"
    )
    .eq("id", 1)
    .single();

  if (settingsError || !settings) {
    throw new OrderValidationError("تعذر تحميل إعدادات المطعم", 500);
  }

  const restaurant = settings as DbSettings;

  let tableId: string | null = null;
  let tableLabelSnapshot: string | null = null;

  if (input.order_type === "DINE_IN") {
    const { data: table } = await supabase
      .from("tables")
      .select("id, label, is_active")
      .eq("public_token", input.table_token)
      .maybeSingle();

    if (!table || !(table as { is_active: boolean }).is_active) {
      throw new OrderValidationError("الطاولة غير صالحة أو غير مفعّلة");
    }

    tableId = (table as { id: string }).id;
    tableLabelSnapshot = (table as { label: string }).label;
  } else if (input.order_type === "DELIVERY") {
    if (!restaurant.delivery_enabled) {
      throw new OrderValidationError("التوصيل غير متاح حالياً");
    }
  } else if (input.order_type === "PICKUP") {
    if (!restaurant.pickup_enabled) {
      throw new OrderValidationError("الاستلام من المطعم غير متاح حالياً");
    }
  }

  const productIds = [...new Set(input.items.map((i) => i.product_id))];
  const { data: products } = await supabase
    .from("products")
    .select("id, name_ar, price, is_available, category_id")
    .in("id", productIds);

  const productMap = new Map(
    ((products ?? []) as DbProduct[]).map((p) => [p.id, p])
  );

  const allAddOnIds = [...new Set(input.items.flatMap((i) => i.add_on_ids ?? []))];

  const { data: addOns } = allAddOnIds.length
    ? await supabase
        .from("add_ons")
        .select("id, name_ar, extra_price, is_available")
        .in("id", allAddOnIds)
    : { data: [] };

  const addOnMap = new Map(
    ((addOns ?? []) as DbAddOn[]).map((a) => [a.id, a])
  );

  const { data: productAddOnLinks } = await supabase
    .from("product_add_ons")
    .select("product_id, add_on_id")
    .in("product_id", productIds);

  const allowedAddOns = new Map<string, Set<string>>();
  for (const link of productAddOnLinks ?? []) {
    const row = link as { product_id: string; add_on_id: string };
    const set = allowedAddOns.get(row.product_id) ?? new Set();
    set.add(row.add_on_id);
    allowedAddOns.set(row.product_id, set);
  }

  const lines: ResolvedLineSnapshot[] = [];

  for (const item of input.items) {
    const product = productMap.get(item.product_id);
    if (!product) {
      throw new OrderValidationError("منتج غير موجود في القائمة");
    }
    if (!product.is_available) {
      throw new OrderValidationError(`المنتج «${product.name_ar}» لم يعد متاحاً`);
    }

    const permitted = allowedAddOns.get(item.product_id) ?? new Set();
    const resolvedAddOns: ResolvedLineSnapshot["add_ons"] = [];

    for (const addOnId of item.add_on_ids ?? []) {
      if (!permitted.has(addOnId)) {
        throw new OrderValidationError("إضافة غير مسموحة لهذا المنتج");
      }
      const addOn = addOnMap.get(addOnId);
      if (!addOn) {
        throw new OrderValidationError("إضافة غير موجودة");
      }
      if (!addOn.is_available) {
        throw new OrderValidationError(`الإضافة «${addOn.name_ar}» لم تعد متاحة`);
      }
      resolvedAddOns.push({
        add_on_id: addOnId,
        name_snapshot: addOn.name_ar,
        price_snapshot: addOn.extra_price,
      });
    }

    const addOnTotal = resolvedAddOns.reduce((s, a) => s + a.price_snapshot, 0);
    const lineTotal = (product.price + addOnTotal) * item.quantity;

    lines.push({
      product_id: product.id,
      product_name_snapshot: product.name_ar,
      unit_price_snapshot: product.price,
      quantity: item.quantity,
      line_total: lineTotal,
      notes: item.notes ?? null,
      add_ons: resolvedAddOns,
    });
  }

  const deliveryFee =
    input.order_type === "DELIVERY" ? restaurant.default_delivery_fee : 0;

  const itemSubtotal = lines.reduce((sum, line) => sum + line.line_total, 0);

  if (
    input.order_type === "DELIVERY" &&
    itemSubtotal < restaurant.min_delivery_order
  ) {
    throw new OrderValidationError(
      `الحد الأدنى للتوصيل هو ${restaurant.min_delivery_order} ${restaurant.currency_label}`
    );
  }

  const activeCharges = await fetchActiveRestaurantCharges(supabase);
  const totals = buildOrderChargeTotals(
    itemSubtotal,
    deliveryFee,
    input.order_type,
    activeCharges
  );

  const status = getInitialOrderStatus(input.order_type);

  const trustedPayload = buildTrustedOrderPayloadFromCustomerInput({
    input,
    status,
    tableId,
    tableLabelSnapshot,
    lines,
    subtotal: totals.subtotal,
    deliveryFee: totals.delivery_fee,
    charges: totals.charges,
    total: totals.total,
  });

  return {
    currency_label: restaurant.currency_label,
    trustedPayload,
  };
}
