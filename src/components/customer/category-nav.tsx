"use client";

import { useEffect, useRef, useState } from "react";

interface CategoryNavItem {
  id: string;
  name: string;
}

export function CategoryNav({ categories }: { categories: CategoryNavItem[] }) {
  const [active, setActive] = useState<string | null>(
    categories[0]?.id ?? null
  );
  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sections = categories
      .map((c) => document.getElementById(`category-${c.id}`))
      .filter((el): el is HTMLElement => el !== null);

    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) {
          setActive(visible[0].target.id.replace("category-", ""));
        }
      },
      { rootMargin: "-96px 0px -60% 0px", threshold: 0 }
    );

    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, [categories]);

  useEffect(() => {
    if (!active || !navRef.current) return;
    const btn = navRef.current.querySelector<HTMLElement>(
      `[data-cat="${active}"]`
    );
    btn?.scrollIntoView({ inline: "center", block: "nearest" });
  }, [active]);

  function handleClick(id: string) {
    const el = document.getElementById(`category-${id}`);
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 88;
      window.scrollTo({ top, behavior: "smooth" });
      setActive(id);
    }
  }

  if (categories.length <= 1) return null;

  return (
    <div className="sticky top-[57px] z-10 -mx-4 border-b border-stone-200 bg-stone-50/95 px-4 py-2 backdrop-blur">
      <div ref={navRef} className="no-scrollbar flex gap-2 overflow-x-auto">
        {categories.map((cat) => {
          const isActive = cat.id === active;
          return (
            <button
              key={cat.id}
              type="button"
              data-cat={cat.id}
              onClick={() => handleClick(cat.id)}
              className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                isActive
                  ? "bg-amber-600 text-white"
                  : "bg-white text-stone-600 ring-1 ring-stone-200 hover:text-amber-700"
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
