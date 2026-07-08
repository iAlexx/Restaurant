"use client";

import { useEffect } from "react";
import { writeCachedDineInTable } from "@/lib/dine-in/session-table";

/** Keeps sessionStorage cache in sync with URL-validated table (convenience only). */
export function DineInTableCacheSync({
  tableToken,
  tableLabel,
}: {
  tableToken: string;
  tableLabel: string;
}) {
  useEffect(() => {
    writeCachedDineInTable({ publicToken: tableToken, label: tableLabel });
  }, [tableToken, tableLabel]);

  return null;
}
