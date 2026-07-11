export type UserRole = "ADMIN" | "CASHIER";

export type OrderType = "DINE_IN" | "DELIVERY" | "PICKUP";

export type OrderStatus =
  | "NEW"
  | "WAITING_WHATSAPP_CONFIRMATION"
  | "CONFIRMED"
  | "PREPARING"
  | "READY"
  | "COMPLETED"
  | "CANCELLED";

export type PrintJobStatus = "PENDING" | "PRINTING" | "PRINTED" | "FAILED";

export interface Profile {
  id: string;
  role: UserRole;
  display_name: string;
  is_active: boolean;
  created_at: string;
}

export interface RestaurantSettings {
  id: number;
  name: string;
  logo_url: string | null;
  hero_image_url: string | null;
  welcome_message: string | null;
  phone: string | null;
  whatsapp_phone: string | null;
  address: string | null;
  currency_label: string;
  opening_hours: string | null;
  weekly_opening_hours: import("@/lib/hours/types").WeeklyOpeningHours;
  is_temporarily_closed: boolean;
  temporary_closure_message: string | null;
  manual_hours_override: import("@/lib/hours/types").ManualHoursOverride | null;
  manual_hours_override_until: string | null;
  delivery_enabled: boolean;
  pickup_enabled: boolean;
  default_delivery_fee: number;
  min_delivery_order: number;
  receipt_header: string | null;
  receipt_footer: string | null;
  updated_at: string;
}

export interface Table {
  id: string;
  label: string;
  public_token: string;
  is_active: boolean;
  created_at: string;
}

export interface Category {
  id: string;
  name_ar: string;
  image_url: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface Product {
  id: string;
  category_id: string;
  name_ar: string;
  description_ar: string | null;
  image_url: string | null;
  price: number;
  is_available: boolean;
  sort_order: number;
  created_at: string;
}

export interface AddOn {
  id: string;
  name_ar: string;
  extra_price: number;
  is_available: boolean;
  created_at: string;
}

export interface PrintJob {
  id: string;
  order_id: string;
  status: PrintJobStatus;
  is_reprint: boolean;
  device_id: string | null;
  error_message: string | null;
  claimed_at: string | null;
  printed_at: string | null;
  created_at: string;
}

export interface PrintDevice {
  id: string;
  name: string;
  token_hash: string;
  is_active: boolean;
  last_heartbeat_at: string | null;
  last_error: string | null;
  created_at: string;
}

export interface Order {
  id: string;
  order_number: string;
  order_type: OrderType;
  status: OrderStatus;
  table_id: string | null;
  table_label_snapshot: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  customer_address: string | null;
  location_url: string | null;
  pickup_time: string | null;
  notes: string | null;
  subtotal: number;
  delivery_fee: number;
  total: number;
  cancellation_reason: string | null;
  submit_token: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface RestaurantCharge {
  id: string;
  name_ar: string;
  calculation_type: "PERCENTAGE" | "FIXED";
  value: number;
  is_active: boolean;
  applies_to: "ALL" | OrderType;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface OrderCharge {
  id: string;
  order_id: string;
  charge_id: string | null;
  name_snapshot: string;
  calculation_type_snapshot: "PERCENTAGE" | "FIXED";
  value_snapshot: number;
  calculated_amount: number;
  sort_order_snapshot: number;
  created_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name_snapshot: string;
  unit_price_snapshot: number;
  quantity: number;
  line_total: number;
  notes: string | null;
}

export interface OrderItemAddOn {
  id: string;
  order_item_id: string;
  add_on_id: string | null;
  name_snapshot: string;
  price_snapshot: number;
}
