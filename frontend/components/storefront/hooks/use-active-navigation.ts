"use client";

import { useEffect, useState, type RefObject } from "react";
import type { NavigationItem } from "@/components/storefront/storefront-data";

const SECTION_SCROLL_GAP_PX = 24;

type SectionTarget = {
  href: string;
  element: HTMLElement;
};

export function useActiveNavigation(
  navigationItems: NavigationItem[],
  headerRef: RefObject<HTMLElement | null>,
) {
  const [activeHref, setActiveHref] = useState<string | null>(null);

  useEffect(() => {
    const sectionTargets = getSectionTargets(navigationItems);
    let animationFrameId: number | null = null;

    const updateActiveLink = () => {
      const headerBottom = headerRef.current?.getBoundingClientRect().bottom ?? 0;
      const nextActiveHref = findActiveHref(sectionTargets, headerBottom);

      setActiveHref((currentHref) =>
        currentHref === nextActiveHref ? currentHref : nextActiveHref,
      );
    };

    // Limit DOM measurements to one update per animation frame while scrolling.
    const scheduleUpdate = () => {
      if (animationFrameId !== null) return;

      animationFrameId = window.requestAnimationFrame(() => {
        animationFrameId = null;
        updateActiveLink();
      });
    };

    scheduleUpdate();
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);

    return () => {
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);

      if (animationFrameId !== null) {
        window.cancelAnimationFrame(animationFrameId);
      }
    };
  }, [headerRef, navigationItems]);

  return activeHref;
}

function getSectionTargets(navigationItems: NavigationItem[]) {
  return navigationItems.flatMap<SectionTarget>((item) => {
    const sectionId = item.href.replace(/^#/, "");
    const element = document.getElementById(sectionId);

    return element ? [{ href: item.href, element }] : [];
  });
}

function findActiveHref(sectionTargets: SectionTarget[], headerBottom: number) {
  let activeHref: string | null = null;
  const activationPoint = headerBottom + SECTION_SCROLL_GAP_PX;

  for (const target of sectionTargets) {
    if (target.element.getBoundingClientRect().top > activationPoint + 1) break;
    activeHref = target.href;
  }

  return activeHref;
}
