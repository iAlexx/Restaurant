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
  phone: string | null;
  whatsapp_phone: string | null;
  address: string | null;
  currency_label: string;
  opening_hours: string | null;
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
