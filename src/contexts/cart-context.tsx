"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  cartLineKey,
  createEmptyCart,
  type CartLine,
  type CartState,
  type OrderMode,
} from "@/types/cart";
import type { AddOn, Product } from "@/types/database";

interface CartContextValue {
  cart: CartState;
  addLine: (line: Omit<CartLine, "key">) => void;
  updateQuantity: (key: string, quantity: number) => void;
  removeLine: (key: string) => void;
  setOrderNotes: (notes: string) => void;
  clearCart: () => void;
  itemCount: number;
  getSubmitToken: () => string;
  resetSubmitToken: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

function storageKey(mode: OrderMode, tableToken?: string) {
  return mode === "dine_in"
    ? `restaurant-cart-dine-${tableToken}`
    : "restaurant-cart-external";
}

function submitTokenKey(mode: OrderMode, tableToken?: string) {
  return `${storageKey(mode, tableToken)}-submit`;
}

export function CartProvider({
  children,
  mode,
  tableToken,
}: {
  children: ReactNode;
  mode: OrderMode;
  tableToken?: string;
}) {
  const key = storageKey(mode, tableToken);

  const [cart, setCart] = useState<CartState>(createEmptyCart);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) setCart(JSON.parse(raw) as CartState);
    } catch {
      setCart(createEmptyCart());
    }
    setHydrated(true);
  }, [key]);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(key, JSON.stringify(cart));
  }, [cart, key, hydrated]);

  const addLine = useCallback((line: Omit<CartLine, "key">) => {
    const newKey = cartLineKey(line.productId, line.addOnIds, line.notes);
    setCart((prev) => {
      const existing = prev.lines.find((l) => l.key === newKey);
      if (existing) {
        return {
          ...prev,
          lines: prev.lines.map((l) =>
            l.key === newKey
              ? { ...l, quantity: l.quantity + line.quantity }
              : l
          ),
        };
      }
      return {
        ...prev,
        lines: [...prev.lines, { ...line, key: newKey }],
      };
    });
  }, []);

  const updateQuantity = useCallback((lineKey: string, quantity: number) => {
    setCart((prev) => {
      if (quantity <= 0) {
        return { ...prev, lines: prev.lines.filter((l) => l.key !== lineKey) };
      }
      return {
        ...prev,
        lines: prev.lines.map((l) =>
          l.key === lineKey ? { ...l, quantity } : l
        ),
      };
    });
  }, []);

  const removeLine = useCallback((lineKey: string) => {
    setCart((prev) => ({
      ...prev,
      lines: prev.lines.filter((l) => l.key !== lineKey),
    }));
  }, []);

  const setOrderNotes = useCallback((notes: string) => {
    setCart((prev) => ({ ...prev, orderNotes: notes }));
  }, []);

  const clearCart = useCallback(() => {
    setCart(createEmptyCart());
    localStorage.removeItem(key);
    localStorage.removeItem(submitTokenKey(mode, tableToken));
  }, [key, mode, tableToken]);

  const getSubmitToken = useCallback(() => {
    const sKey = submitTokenKey(mode, tableToken);
    let token = sessionStorage.getItem(sKey);
    if (!token) {
      token = crypto.randomUUID();
      sessionStorage.setItem(sKey, token);
    }
    return token;
  }, [mode, tableToken]);

  const resetSubmitToken = useCallback(() => {
    sessionStorage.removeItem(submitTokenKey(mode, tableToken));
  }, [mode, tableToken]);

  const itemCount = useMemo(
    () => cart.lines.reduce((sum, l) => sum + l.quantity, 0),
    [cart.lines]
  );

  const value = useMemo(
    () => ({
      cart,
      addLine,
      updateQuantity,
      removeLine,
      setOrderNotes,
      clearCart,
      itemCount,
      getSubmitToken,
      resetSubmitToken,
    }),
    [
      cart,
      addLine,
      updateQuantity,
      removeLine,
      setOrderNotes,
      clearCart,
      itemCount,
      getSubmitToken,
      resetSubmitToken,
    ]
  );

  if (!hydrated) {
    return null;
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}

export function estimateCartTotal(
  lines: CartLine[],
  products: Product[],
  addOns: AddOn[]
): number {
  const productMap = new Map(products.map((p) => [p.id, p]));
  const addOnMap = new Map(addOns.map((a) => [a.id, a]));

  return lines.reduce((sum, line) => {
    const product = productMap.get(line.productId);
    if (!product) return sum;
    const addOnTotal = line.addOnIds.reduce((s, id) => {
      return s + (addOnMap.get(id)?.extra_price ?? 0);
    }, 0);
    return sum + (product.price + addOnTotal) * line.quantity;
  }, 0);
}
