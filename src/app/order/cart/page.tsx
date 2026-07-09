import Link from "next/link";
import { fetchPublicMenu } from "@/lib/menu/public-menu";
import { ExternalCartClient } from "@/components/customer/external-order-client";

interface PageProps {
  searchParams: Promise<{ type?: string }>;
}

export default async function ExternalCartPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const menu = await fetchPublicMenu();

  if (params.type !== "DELIVERY" && params.type !== "PICKUP") {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <Link href="/order" className="text-brand-orange underline">
          اختر نوع الطلب
        </Link>
      </div>
    );
  }

  if (params.type === "DELIVERY" && !menu.settings.delivery_enabled) {
    return <Disabled message="التوصيل غير متاح" />;
  }
  if (params.type === "PICKUP" && !menu.settings.pickup_enabled) {
    return <Disabled message="الاستلام غير متاح" />;
  }

  return <ExternalCartClient menu={menu} orderType={params.type} />;
}

function Disabled({ message }: { message: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="text-center">
        <p className="text-brand-muted">{message}</p>
        <Link href="/order" className="mt-4 inline-block text-brand-orange underline">
          العودة
        </Link>
      </div>
    </div>
  );
}
