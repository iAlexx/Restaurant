import { notFound } from "next/navigation";
import { requireStaffPage } from "@/lib/auth/staff-page";
import { getOrderDetailForStaff } from "@/lib/actions/orders";
import { OrderDetailClient } from "@/components/dashboard/order-detail-client";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireStaffPage("/dashboard/orders");
  const { id } = await params;
  const detail = await getOrderDetailForStaff(id);

  if (!detail) {
    notFound();
  }

  return <OrderDetailClient orderId={id} initial={detail} />;
}
