"use client";

import { useEffect, useRef } from "react";
import { customerHeaderOffsetClassName } from "@/components/customer/customer-menu-shell";
import type { MenuCategoryItem } from "@/lib/menu/category-navigation";

interface CategoryStickyNavProps {
  categories: MenuCategoryItem[];
  activeId: string | null;
  visible: boolean;
  onSelect: (id: string) => void;
}

export function CategoryStickyNav({
  categories,
  activeId,
  visible,
  onSelect,
}: CategoryStickyNavProps) {
  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!visible || !activeId || !navRef.current) return;
    const btn = navRef.current.querySelector<HTMLElement>(
      `[data-cat="${activeId}"]`
    );
    btn?.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
  }, [activeId, visible]);

  if (!visible || categories.length <= 1) return null;

  return (
    <div
      className={`sticky ${customerHeaderOffsetClassName} z-20 -mx-4 border-b border-brand-gold/25 bg-brand-surface/98 px-4 py-2 backdrop-blur-sm sm:-mx-6 sm:px-6`}
    >
      <div
        ref={navRef}
        className="no-scrollbar flex min-h-[44px] items-center gap-2 overflow-x-auto"
      >
        {categories.map((cat) => {
          const isActive = cat.id === activeId;
          return (
            <button
              key={cat.id}
              type="button"
              data-cat={cat.id}
              onClick={() => onSelect(cat.id)}
              className={`shrink-0 rounded-full px-3.5 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-brand-orange/30 ${
                isActive
                  ? "bg-brand-orange text-white"
                  : "border border-brand-gold/45 bg-brand-surface text-brand-chocolate hover:border-brand-gold"
              }`}
            >
              {cat.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
