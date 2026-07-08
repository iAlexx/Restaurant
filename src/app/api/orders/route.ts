import { NextResponse } from "next/server";
import { createOrderSchema } from "@/lib/validations/order";
import {
  createCustomerOrder,
  OrderValidationError,
} from "@/lib/orders/create-order";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rate = checkRateLimit(`order:${ip}`);

  if (!rate.allowed) {
    return NextResponse.json(
      { error: "طلبات كثيرة. حاول مرة أخرى بعد قليل." },
      {
        status: 429,
        headers: { "Retry-After": String(rate.retryAfterSec ?? 60) },
      }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "بيانات غير صالحة" }, { status: 400 });
  }

  const parsed = createOrderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "بيانات غير صالحة" },
      { status: 400 }
    );
  }

  try {
    const result = await createCustomerOrder(parsed.data);
    return NextResponse.json(result, {
      status: result.existing ? 200 : 201,
    });
  } catch (error) {
    if (error instanceof OrderValidationError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }
    console.error("Order creation failed:", error);
    return NextResponse.json(
      { error: "تعذر إنشاء الطلب" },
      { status: 500 }
    );
  }
}
