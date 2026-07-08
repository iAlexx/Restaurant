import { createServiceClient } from "@/lib/supabase/service";
import type { CreateOrderInput } from "@/lib/validations/order";
import {
  parseCreateOrderRpcResult,
  type CreateOrderRpcResult,
  type TrustedOrderPayload,
} from "@/lib/orders/rpc-payload";
import {
  OrderValidationError,
  validateAndBuildTrustedPayload,
} from "@/lib/orders/validate-order";

export interface CreateOrderResult {
  id: string;
  order_number: string;
  order_type: CreateOrderInput["order_type"];
  status: string;
  subtotal: number;
  delivery_fee: number;
  total: number;
  currency_label: string;
  existing?: boolean;
}

export { OrderValidationError } from "@/lib/orders/validate-order";

export async function invokeCreateCustomerOrderRpc(
  supabase: ReturnType<typeof createServiceClient>,
  trustedPayload: TrustedOrderPayload
): Promise<CreateOrderRpcResult> {
  const { data, error } = await supabase.rpc("create_customer_order", {
    p_payload: trustedPayload,
  });

  if (error) {
    throw new OrderValidationError("تعذر حفظ الطلب", 500);
  }

  try {
    return parseCreateOrderRpcResult(data);
  } catch {
    throw new OrderValidationError("استجابة غير متوقعة من قاعدة البيانات", 500);
  }
}

export function rpcResultToCreateOrderResult(
  rpc: CreateOrderRpcResult,
  currencyLabel: string
): CreateOrderResult {
  return {
    id: rpc.id,
    order_number: rpc.order_number,
    order_type: rpc.order_type,
    status: rpc.status,
    subtotal: rpc.subtotal,
    delivery_fee: rpc.delivery_fee,
    total: rpc.total,
    currency_label: currencyLabel,
    ...(rpc.existing ? { existing: true as const } : {}),
  };
}

export async function createCustomerOrder(
  input: CreateOrderInput
): Promise<CreateOrderResult> {
  const supabase = createServiceClient();

  const { currency_label, trustedPayload } =
    await validateAndBuildTrustedPayload(supabase, input);

  const rpcResult = await invokeCreateCustomerOrderRpc(
    supabase,
    trustedPayload
  );

  return rpcResultToCreateOrderResult(rpcResult, currency_label);
}

export async function fetchOrderForWhatsApp(orderId: string) {
  const supabase = createServiceClient();

  const { data: order, error } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .single();

  if (error || !order) return null;

  const { data: items } = await supabase
    .from("order_items")
    .select("id, product_name_snapshot, unit_price_snapshot, quantity, line_total, notes")
    .eq("order_id", orderId);

  const itemIds = ((items ?? []) as { id: string }[]).map((i) => i.id);

  const { data: addOns } = itemIds.length
    ? await supabase
        .from("order_item_add_ons")
        .select("order_item_id, name_snapshot, price_snapshot")
        .in("order_item_id", itemIds)
    : { data: [] };

  const { data: settings } = await supabase
    .from("restaurant_settings")
    .select("whatsapp_phone, currency_label")
    .eq("id", 1)
    .single();

  return {
    order,
    items: items ?? [],
    addOns: addOns ?? [],
    settings: settings as {
      whatsapp_phone: string | null;
      currency_label: string;
    } | null,
  };
}
