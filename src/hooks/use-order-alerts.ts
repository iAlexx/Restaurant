"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { OrderListRow } from "@/lib/orders/dashboard";
import {
  collectNewUrgentOrderIds,
  countUrgentOrders,
  flashDocumentTitle,
  getOrderAlertsMuted,
  playNewOrderAlertSound,
  seedAlertedUrgentOrderIds,
  setOrderAlertsMuted,
  stopDocumentTitleFlash,
} from "@/lib/dashboard/order-alerts";

export function useOrderAlerts(orders: OrderListRow[]) {
  const [muted, setMuted] = useState(false);
  const seededRef = useRef(false);
  const prevUrgentCountRef = useRef(0);

  useEffect(() => {
    setMuted(getOrderAlertsMuted());
  }, []);

  const handleOrdersUpdate = useCallback((nextOrders: OrderListRow[]) => {
    if (!seededRef.current) {
      seedAlertedUrgentOrderIds(
        nextOrders
          .filter(
            (o) =>
              o.status === "NEW" ||
              o.status === "WAITING_WHATSAPP_CONFIRMATION"
          )
          .map((o) => o.id)
      );
      seededRef.current = true;
      prevUrgentCountRef.current = countUrgentOrders(nextOrders);
      return;
    }

    const newUrgentIds = collectNewUrgentOrderIds(nextOrders);
    if (newUrgentIds.length > 0 && !getOrderAlertsMuted()) {
      void playNewOrderAlertSound();
    }

    const urgentCount = countUrgentOrders(nextOrders);
    if (urgentCount > 0) {
      flashDocumentTitle(urgentCount);
    } else {
      stopDocumentTitleFlash();
    }
    prevUrgentCountRef.current = urgentCount;
  }, []);

  useEffect(() => {
    handleOrdersUpdate(orders);
  }, [orders, handleOrdersUpdate]);

  useEffect(() => {
    return () => {
      stopDocumentTitleFlash();
    };
  }, []);

  function toggleMute() {
    const next = !muted;
    setMuted(next);
    setOrderAlertsMuted(next);
    if (next) {
      stopDocumentTitleFlash();
    }
  }

  const urgentCount = countUrgentOrders(orders);

  return { muted, toggleMute, urgentCount };
}
