import { z } from "zod";
export declare const receiptItemSchema: z.ZodObject<{
    name: z.ZodString;
    quantity: z.ZodNumber;
    unit_price: z.ZodNumber;
    line_total: z.ZodNumber;
    notes: z.ZodNullable<z.ZodString>;
    add_ons: z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        price: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        name: string;
        price: number;
    }, {
        name: string;
        price: number;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    name: string;
    quantity: number;
    unit_price: number;
    line_total: number;
    notes: string | null;
    add_ons: {
        name: string;
        price: number;
    }[];
}, {
    name: string;
    quantity: number;
    unit_price: number;
    line_total: number;
    notes: string | null;
    add_ons: {
        name: string;
        price: number;
    }[];
}>;
export declare const receiptPayloadSchema: z.ZodObject<{
    job_id: z.ZodString;
    is_reprint: z.ZodBoolean;
    restaurant_name: z.ZodString;
    receipt_header: z.ZodNullable<z.ZodString>;
    receipt_footer: z.ZodNullable<z.ZodString>;
    currency_label: z.ZodString;
    order_number: z.ZodString;
    order_type: z.ZodEnum<["DINE_IN", "DELIVERY", "PICKUP"]>;
    order_type_label: z.ZodString;
    table_label: z.ZodNullable<z.ZodString>;
    customer_name: z.ZodNullable<z.ZodString>;
    customer_phone: z.ZodNullable<z.ZodString>;
    customer_address: z.ZodNullable<z.ZodString>;
    location_url: z.ZodNullable<z.ZodString>;
    pickup_time: z.ZodNullable<z.ZodString>;
    notes: z.ZodNullable<z.ZodString>;
    items: z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        quantity: z.ZodNumber;
        unit_price: z.ZodNumber;
        line_total: z.ZodNumber;
        notes: z.ZodNullable<z.ZodString>;
        add_ons: z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            price: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            name: string;
            price: number;
        }, {
            name: string;
            price: number;
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        name: string;
        quantity: number;
        unit_price: number;
        line_total: number;
        notes: string | null;
        add_ons: {
            name: string;
            price: number;
        }[];
    }, {
        name: string;
        quantity: number;
        unit_price: number;
        line_total: number;
        notes: string | null;
        add_ons: {
            name: string;
            price: number;
        }[];
    }>, "many">;
    subtotal: z.ZodNumber;
    delivery_fee: z.ZodNumber;
    total: z.ZodNumber;
    created_at: z.ZodString;
}, "strip", z.ZodTypeAny, {
    notes: string | null;
    job_id: string;
    is_reprint: boolean;
    restaurant_name: string;
    receipt_header: string | null;
    receipt_footer: string | null;
    currency_label: string;
    order_number: string;
    order_type: "DINE_IN" | "DELIVERY" | "PICKUP";
    order_type_label: string;
    table_label: string | null;
    customer_name: string | null;
    customer_phone: string | null;
    customer_address: string | null;
    location_url: string | null;
    pickup_time: string | null;
    items: {
        name: string;
        quantity: number;
        unit_price: number;
        line_total: number;
        notes: string | null;
        add_ons: {
            name: string;
            price: number;
        }[];
    }[];
    subtotal: number;
    delivery_fee: number;
    total: number;
    created_at: string;
}, {
    notes: string | null;
    job_id: string;
    is_reprint: boolean;
    restaurant_name: string;
    receipt_header: string | null;
    receipt_footer: string | null;
    currency_label: string;
    order_number: string;
    order_type: "DINE_IN" | "DELIVERY" | "PICKUP";
    order_type_label: string;
    table_label: string | null;
    customer_name: string | null;
    customer_phone: string | null;
    customer_address: string | null;
    location_url: string | null;
    pickup_time: string | null;
    items: {
        name: string;
        quantity: number;
        unit_price: number;
        line_total: number;
        notes: string | null;
        add_ons: {
            name: string;
            price: number;
        }[];
    }[];
    subtotal: number;
    delivery_fee: number;
    total: number;
    created_at: string;
}>;
export type ReceiptPayload = z.infer<typeof receiptPayloadSchema>;
export declare const claimResponseSchema: z.ZodObject<{
    job_id: z.ZodString;
    order_id: z.ZodString;
    is_reprint: z.ZodBoolean;
    receipt: z.ZodObject<{
        job_id: z.ZodString;
        is_reprint: z.ZodBoolean;
        restaurant_name: z.ZodString;
        receipt_header: z.ZodNullable<z.ZodString>;
        receipt_footer: z.ZodNullable<z.ZodString>;
        currency_label: z.ZodString;
        order_number: z.ZodString;
        order_type: z.ZodEnum<["DINE_IN", "DELIVERY", "PICKUP"]>;
        order_type_label: z.ZodString;
        table_label: z.ZodNullable<z.ZodString>;
        customer_name: z.ZodNullable<z.ZodString>;
        customer_phone: z.ZodNullable<z.ZodString>;
        customer_address: z.ZodNullable<z.ZodString>;
        location_url: z.ZodNullable<z.ZodString>;
        pickup_time: z.ZodNullable<z.ZodString>;
        notes: z.ZodNullable<z.ZodString>;
        items: z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            quantity: z.ZodNumber;
            unit_price: z.ZodNumber;
            line_total: z.ZodNumber;
            notes: z.ZodNullable<z.ZodString>;
            add_ons: z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                price: z.ZodNumber;
            }, "strip", z.ZodTypeAny, {
                name: string;
                price: number;
            }, {
                name: string;
                price: number;
            }>, "many">;
        }, "strip", z.ZodTypeAny, {
            name: string;
            quantity: number;
            unit_price: number;
            line_total: number;
            notes: string | null;
            add_ons: {
                name: string;
                price: number;
            }[];
        }, {
            name: string;
            quantity: number;
            unit_price: number;
            line_total: number;
            notes: string | null;
            add_ons: {
                name: string;
                price: number;
            }[];
        }>, "many">;
        subtotal: z.ZodNumber;
        delivery_fee: z.ZodNumber;
        total: z.ZodNumber;
        created_at: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        notes: string | null;
        job_id: string;
        is_reprint: boolean;
        restaurant_name: string;
        receipt_header: string | null;
        receipt_footer: string | null;
        currency_label: string;
        order_number: string;
        order_type: "DINE_IN" | "DELIVERY" | "PICKUP";
        order_type_label: string;
        table_label: string | null;
        customer_name: string | null;
        customer_phone: string | null;
        customer_address: string | null;
        location_url: string | null;
        pickup_time: string | null;
        items: {
            name: string;
            quantity: number;
            unit_price: number;
            line_total: number;
            notes: string | null;
            add_ons: {
                name: string;
                price: number;
            }[];
        }[];
        subtotal: number;
        delivery_fee: number;
        total: number;
        created_at: string;
    }, {
        notes: string | null;
        job_id: string;
        is_reprint: boolean;
        restaurant_name: string;
        receipt_header: string | null;
        receipt_footer: string | null;
        currency_label: string;
        order_number: string;
        order_type: "DINE_IN" | "DELIVERY" | "PICKUP";
        order_type_label: string;
        table_label: string | null;
        customer_name: string | null;
        customer_phone: string | null;
        customer_address: string | null;
        location_url: string | null;
        pickup_time: string | null;
        items: {
            name: string;
            quantity: number;
            unit_price: number;
            line_total: number;
            notes: string | null;
            add_ons: {
                name: string;
                price: number;
            }[];
        }[];
        subtotal: number;
        delivery_fee: number;
        total: number;
        created_at: string;
    }>;
}, "strip", z.ZodTypeAny, {
    job_id: string;
    is_reprint: boolean;
    order_id: string;
    receipt: {
        notes: string | null;
        job_id: string;
        is_reprint: boolean;
        restaurant_name: string;
        receipt_header: string | null;
        receipt_footer: string | null;
        currency_label: string;
        order_number: string;
        order_type: "DINE_IN" | "DELIVERY" | "PICKUP";
        order_type_label: string;
        table_label: string | null;
        customer_name: string | null;
        customer_phone: string | null;
        customer_address: string | null;
        location_url: string | null;
        pickup_time: string | null;
        items: {
            name: string;
            quantity: number;
            unit_price: number;
            line_total: number;
            notes: string | null;
            add_ons: {
                name: string;
                price: number;
            }[];
        }[];
        subtotal: number;
        delivery_fee: number;
        total: number;
        created_at: string;
    };
}, {
    job_id: string;
    is_reprint: boolean;
    order_id: string;
    receipt: {
        notes: string | null;
        job_id: string;
        is_reprint: boolean;
        restaurant_name: string;
        receipt_header: string | null;
        receipt_footer: string | null;
        currency_label: string;
        order_number: string;
        order_type: "DINE_IN" | "DELIVERY" | "PICKUP";
        order_type_label: string;
        table_label: string | null;
        customer_name: string | null;
        customer_phone: string | null;
        customer_address: string | null;
        location_url: string | null;
        pickup_time: string | null;
        items: {
            name: string;
            quantity: number;
            unit_price: number;
            line_total: number;
            notes: string | null;
            add_ons: {
                name: string;
                price: number;
            }[];
        }[];
        subtotal: number;
        delivery_fee: number;
        total: number;
        created_at: string;
    };
}>;
export type ClaimResponse = z.infer<typeof claimResponseSchema>;
export type PrinterStatus = "ready" | "offline" | "error";
export interface PrintProvider {
    print(receiptPayload: ReceiptPayload): Promise<void>;
    testPrint(): Promise<void>;
    checkStatus(): Promise<PrinterStatus>;
}
