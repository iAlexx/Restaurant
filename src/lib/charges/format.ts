import { basisPointsToPercentLabel } from "@/lib/charges/calculate";
import type { ChargeAppliesTo, ChargeCalculationType } from "@/lib/charges/types";
import { formatPrice } from "@/lib/money";

export function chargeValueLabel(
  charge: {
    calculation_type: ChargeCalculationType;
    value: number;
  },
  currencyLabel = "ل.س"
): string {
  if (charge.calculation_type === "PERCENTAGE") {
    return `${basisPointsToPercentLabel(charge.value)}%`;
  }
  return formatPrice(charge.value, currencyLabel);
}

export function chargeTypeLabel(calculationType: ChargeCalculationType): string {
  return calculationType === "PERCENTAGE" ? "نسبة مئوية" : "مبلغ ثابت";
}

export function chargeAppliesToLabel(appliesTo: ChargeAppliesTo): string {
  const labels = {
    ALL: "جميع الطلبات",
    DINE_IN: "داخل المطعم",
    DELIVERY: "توصيل",
    PICKUP: "استلام",
  } as const;

  return labels[appliesTo];
}
