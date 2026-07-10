import { describe, expect, it, vi } from "vitest";
import {
  applyOrderSuccessSideEffects,
  buildSuccessHref,
  planOrderSuccessNavigation,
  shouldRedirectEmptyCart,
} from "@/lib/checkout/success-navigation";
import { dineInSuccessPath } from "@/lib/dine-in/paths";

describe("shouldRedirectEmptyCart", () => {
  it("does not redirect before hydration", () => {
    expect(
      shouldRedirectEmptyCart({
        hydrated: false,
        cartLineCount: 0,
        isRedirectingToSuccess: false,
      })
    ).toBe(false);
  });

  it("redirects when hydrated cart is empty", () => {
    expect(
      shouldRedirectEmptyCart({
        hydrated: true,
        cartLineCount: 0,
        isRedirectingToSuccess: false,
      })
    ).toBe(true);
  });

  it("does not redirect while success navigation is in progress", () => {
    expect(
      shouldRedirectEmptyCart({
        hydrated: true,
        cartLineCount: 0,
        isRedirectingToSuccess: true,
      })
    ).toBe(false);
  });

  it("does not redirect when cart still has items", () => {
    expect(
      shouldRedirectEmptyCart({
        hydrated: true,
        cartLineCount: 2,
        isRedirectingToSuccess: false,
      })
    ).toBe(false);
  });
});

describe("buildSuccessHref", () => {
  it("builds external order success URL", () => {
    expect(
      buildSuccessHref({
        orderId: "ord-1",
        successBasePath: "/order/success",
      })
    ).toBe("/order/success/ord-1");
  });

  it("builds legacy dine-in success URL", () => {
    expect(
      buildSuccessHref({
        orderId: "ord-2",
        successBasePath: "/t/tok-abc/success",
      })
    ).toBe("/t/tok-abc/success/ord-2");
  });

  it("builds unified dine-in success URL with table query", () => {
    const token = "a".repeat(32);
    expect(
      buildSuccessHref({
        orderId: "ord-3",
        successBasePath: "/dine-in/success",
        unifiedSuccessPath: (id) =>
          dineInSuccessPath({ flow: "unified", tableToken: token }, id),
      })
    ).toBe(`/dine-in/success/ord-3?table=${encodeURIComponent(token)}`);
  });
});

describe("planOrderSuccessNavigation", () => {
  it("always plans cart clear and submit token reset on success", () => {
    const plan = planOrderSuccessNavigation("ord-99", {
      successBasePath: "/order/success",
    });
    expect(plan).toEqual({
      orderId: "ord-99",
      successHref: "/order/success/ord-99",
      clearCart: true,
      resetSubmitToken: true,
    });
  });
});

describe("applyOrderSuccessSideEffects", () => {
  it("clears cart after navigation via microtask", async () => {
    const clearCart = vi.fn();
    const resetSubmitToken = vi.fn();

    applyOrderSuccessSideEffects(
      planOrderSuccessNavigation("ord-1", {
        successBasePath: "/order/success",
      }),
      { clearCart, resetSubmitToken }
    );

    expect(resetSubmitToken).toHaveBeenCalledTimes(1);
    expect(clearCart).not.toHaveBeenCalled();

    await Promise.resolve();
    expect(clearCart).toHaveBeenCalledTimes(1);
  });

  it("does not clear cart on failed plans", () => {
    const clearCart = vi.fn();
    const resetSubmitToken = vi.fn();

    applyOrderSuccessSideEffects(
      {
        orderId: "ord-1",
        successHref: "/order/success/ord-1",
        clearCart: false,
        resetSubmitToken: false,
      },
      { clearCart, resetSubmitToken }
    );

    expect(clearCart).not.toHaveBeenCalled();
    expect(resetSubmitToken).not.toHaveBeenCalled();
  });
});

describe("checkout regression scenarios", () => {
  it("successful order keeps empty-cart guard disabled during redirect", () => {
    expect(
      shouldRedirectEmptyCart({
        hydrated: true,
        cartLineCount: 0,
        isRedirectingToSuccess: true,
      })
    ).toBe(false);
  });

  it("timeout keeps cart by not planning success navigation", () => {
    const clearCart = vi.fn();
    applyOrderSuccessSideEffects(
      {
        orderId: "",
        successHref: "",
        clearCart: false,
        resetSubmitToken: false,
      },
      { clearCart, resetSubmitToken: vi.fn() }
    );
    expect(clearCart).not.toHaveBeenCalled();
  });

  it("failed order keeps cart by not planning success navigation", () => {
    const clearCart = vi.fn();
    applyOrderSuccessSideEffects(
      {
        orderId: "",
        successHref: "",
        clearCart: false,
        resetSubmitToken: false,
      },
      { clearCart, resetSubmitToken: vi.fn() }
    );
    expect(clearCart).not.toHaveBeenCalled();
  });
});
