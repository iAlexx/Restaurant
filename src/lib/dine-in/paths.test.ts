import { describe, expect, it } from "vitest";
import {
  dineInCartHref,
  dineInMenuHref,
  parseUnifiedTableParam,
  unifiedDineInHref,
} from "@/lib/dine-in/paths";
import { generateSecureToken } from "@/lib/tokens";

describe("unified dine-in paths", () => {
  const token = generateSecureToken();

  it("builds menu/cart/checkout URLs with table query param", () => {
    expect(unifiedDineInHref("menu", token)).toBe(
      `/dine-in/menu?table=${encodeURIComponent(token)}`
    );
    expect(unifiedDineInHref("cart", token)).toContain("/dine-in/cart?table=");
    expect(unifiedDineInHref("checkout", token)).toContain(
      "/dine-in/checkout?table="
    );
  });

  it("legacy menu href stays /t/{token}", () => {
    expect(
      dineInMenuHref({ flow: "legacy", tableToken: token })
    ).toBe(`/t/${token}`);
  });

  it("unified cart href includes encoded token", () => {
    const href = dineInCartHref({ flow: "unified", tableToken: token });
    expect(href).toBe(`/dine-in/cart?table=${encodeURIComponent(token)}`);
  });

  it("parseUnifiedTableParam rejects short values", () => {
    expect(parseUnifiedTableParam("abc")).toBeNull();
    expect(parseUnifiedTableParam(token)).toBe(token);
  });
});
