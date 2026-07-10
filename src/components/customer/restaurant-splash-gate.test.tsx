import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import {
  BUNDLED_RESTAURANT_LOGO_PATH,
  RestaurantSplashOverlay,
} from "@/components/customer/restaurant-splash-gate";

vi.mock("next/image", () => ({
  default: ({
    src,
    alt,
    className,
  }: {
    src: string;
    alt: string;
    className?: string;
  }) =>
    React.createElement("img", {
      src,
      alt,
      className,
      "data-testid": "splash-logo",
    }),
}));

describe("RestaurantSplashOverlay", () => {
  it("renders only one logo image inside the overlay", () => {
    const html = renderToStaticMarkup(
      <RestaurantSplashOverlay logoSrc={BUNDLED_RESTAURANT_LOGO_PATH} />
    );

    expect(html.match(/<img\b/g)?.length).toBe(1);
    expect(html).toContain('class="splash-overlay"');
    expect(html).toContain('class="splash-logo"');
  });

  it("has no restaurant name, accent, or decorative markup", () => {
    const html = renderToStaticMarkup(
      <RestaurantSplashOverlay logoSrc={BUNDLED_RESTAURANT_LOGO_PATH} />
    );

    expect(html).not.toMatch(/rounded-full|ring-|border|shadow|bg-brand/);
    expect(html).not.toContain("<p");
    expect(html).not.toContain("<h1");
    expect(html).not.toContain("<span");
    expect(html).not.toContain("brand-orange");
    expect(html).not.toContain("شيخ");
    expect(html).not.toContain("النكهة");
  });

  it("applies fade-out modifier class when requested", () => {
    const html = renderToStaticMarkup(
      <RestaurantSplashOverlay
        logoSrc={BUNDLED_RESTAURANT_LOGO_PATH}
        fadeOut
      />
    );

    expect(html).toContain("splash-overlay--fade-out");
  });
});
