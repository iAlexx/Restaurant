import type { OrderStatus } from "@/types/database";

export const ORDER_ALERTS_MUTE_KEY = "dashboard:order-alerts-muted";

const URGENT_STATUSES: OrderStatus[] = [
  "NEW",
  "WAITING_WHATSAPP_CONFIRMATION",
];

const DEFAULT_TITLE = "الطلبات — لوحة التحكم";
const ALERTED_IDS_KEY = "dashboard:order-alerts-seen";

export function isUrgentOrderStatus(status: OrderStatus): boolean {
  return URGENT_STATUSES.includes(status);
}

export function getOrderAlertsMuted(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(ORDER_ALERTS_MUTE_KEY) === "1";
}

export function setOrderAlertsMuted(muted: boolean): void {
  if (typeof window === "undefined") return;
  if (muted) {
    localStorage.setItem(ORDER_ALERTS_MUTE_KEY, "1");
  } else {
    localStorage.removeItem(ORDER_ALERTS_MUTE_KEY);
  }
}

function loadAlertedIds(): Set<string> {
  if (typeof sessionStorage === "undefined") return new Set();
  try {
    const raw = sessionStorage.getItem(ALERTED_IDS_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as string[];
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

function saveAlertedIds(ids: Set<string>): void {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.setItem(ALERTED_IDS_KEY, JSON.stringify([...ids]));
}

export function seedAlertedUrgentOrderIds(orderIds: string[]): void {
  const ids = loadAlertedIds();
  for (const id of orderIds) {
    ids.add(id);
  }
  saveAlertedIds(ids);
}

export function collectNewUrgentOrderIds(
  orders: { id: string; status: OrderStatus }[]
): string[] {
  const alerted = loadAlertedIds();
  const fresh: string[] = [];

  for (const order of orders) {
    if (!isUrgentOrderStatus(order.status)) continue;
    if (alerted.has(order.id)) continue;
    fresh.push(order.id);
    alerted.add(order.id);
  }

  if (fresh.length > 0) {
    saveAlertedIds(alerted);
  }

  return fresh;
}

let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioContext) {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctx) return null;
    audioContext = new Ctx();
  }
  return audioContext;
}

export async function playNewOrderAlertSound(): Promise<void> {
  if (getOrderAlertsMuted()) return;

  const ctx = getAudioContext();
  if (!ctx) return;

  if (ctx.state === "suspended") {
    try {
      await ctx.resume();
    } catch {
      return;
    }
  }

  const now = ctx.currentTime;
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();

  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(880, now);
  oscillator.frequency.setValueAtTime(660, now + 0.12);

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.18, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

  oscillator.connect(gain);
  gain.connect(ctx.destination);

  oscillator.start(now);
  oscillator.stop(now + 0.36);
}

let titleFlashTimer: ReturnType<typeof setInterval> | null = null;
let titleFlashStopTimer: ReturnType<typeof setTimeout> | null = null;

export function flashDocumentTitle(urgentCount: number): void {
  if (typeof document === "undefined") return;
  if (urgentCount <= 0) {
    stopDocumentTitleFlash();
    return;
  }

  if (titleFlashTimer) return;

  const badge = `(${urgentCount}) طلب جديد`;
  let showBadge = true;

  titleFlashTimer = setInterval(() => {
    document.title = showBadge ? badge : DEFAULT_TITLE;
    showBadge = !showBadge;
  }, 1000);

  if (titleFlashStopTimer) {
    clearTimeout(titleFlashStopTimer);
  }

  titleFlashStopTimer = setTimeout(() => {
    stopDocumentTitleFlash();
  }, 30000);
}

export function stopDocumentTitleFlash(): void {
  if (titleFlashTimer) {
    clearInterval(titleFlashTimer);
    titleFlashTimer = null;
  }
  if (titleFlashStopTimer) {
    clearTimeout(titleFlashStopTimer);
    titleFlashStopTimer = null;
  }
  if (typeof document !== "undefined") {
    document.title = DEFAULT_TITLE;
  }
}

export function countUrgentOrders(
  orders: { status: OrderStatus }[]
): number {
  return orders.filter((o) => isUrgentOrderStatus(o.status)).length;
}
