"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  categorySectionId,
  getCategoryScrollOffset,
  MENU_STICKY_HEADER_PX,
  type MenuCategoryItem,
} from "@/lib/menu/category-navigation";
import { CategoryCardGrid } from "@/components/customer/category-card-grid";
import { CategoryStickyNav } from "@/components/customer/category-sticky-nav";

interface MenuCategoryNavigationProps {
  categories: MenuCategoryItem[];
}

export function MenuCategoryNavigation({ categories }: MenuCategoryNavigationProps) {
  const [activeId, setActiveId] = useState<string | null>(
    categories[0]?.id ?? null
  );
  const [stickyVisible, setStickyVisible] = useState(false);
  const gridRef = useRef<HTMLElement>(null);

  const scrollToCategory = useCallback(
    (id: string, stickyNavVisible: boolean) => {
      const el = document.getElementById(categorySectionId(id));
      if (!el) return;

      const offset = getCategoryScrollOffset(stickyNavVisible);
      const top = el.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: "smooth" });
      setActiveId(id);
    },
    []
  );

  useEffect(() => {
    const sections = categories
      .map((c) => document.getElementById(categorySectionId(c.id)))
      .filter((el): el is HTMLElement => el !== null);

    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) {
          setActiveId(visible[0].target.id.replace("category-", ""));
        }
      },
      {
        rootMargin: `-${getCategoryScrollOffset(true)}px 0px -55% 0px`,
        threshold: 0,
      }
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [categories]);

  useEffect(() => {
    const grid = gridRef.current;
    if (!grid || categories.length <= 1) {
      setStickyVisible(false);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        setStickyVisible(!entry.isIntersecting);
      },
      {
        rootMargin: `-${MENU_STICKY_HEADER_PX}px 0px 0px 0px`,
        threshold: 0,
      }
    );

    observer.observe(grid);
    return () => observer.disconnect();
  }, [categories.length]);

  const handleSelect = useCallback(
    (id: string) => {
      scrollToCategory(id, stickyVisible);
    },
    [scrollToCategory, stickyVisible]
  );

  return (
    <>
      <CategoryCardGrid
        categories={categories}
        activeId={activeId}
        onSelect={handleSelect}
        gridRef={gridRef}
      />
      <CategoryStickyNav
        categories={categories}
        activeId={activeId}
        visible={stickyVisible}
        onSelect={handleSelect}
      />
    </>
  );
}
