"use client";

import { ArrowRight, Mail, Menu, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { BrandMark } from "@/components/storefront/brand-mark";
import type { NavigationItem } from "@/components/storefront/storefront-data";

export function SiteHeader({ navigationItems }: { navigationItems: NavigationItem[] }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 8);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!isMenuOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    menuRef.current?.querySelector<HTMLAnchorElement>("a")?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setIsMenuOpen(false);
      menuButtonRef.current?.focus();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMenuOpen]);

  const closeMenu = () => setIsMenuOpen(false);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 border-b transition duration-300 ${
        isScrolled
          ? "border-[#d9d5c7] bg-[#f9f7f0]/96 shadow-[0_10px_30px_rgba(25,40,27,0.08)] backdrop-blur-xl"
          : "border-transparent bg-[#f9f7f0]"
      }`}
    >
      <div className="mx-auto flex h-18 max-w-7xl items-center gap-4 px-5 sm:px-8">
        <a
          href="#top"
          className="group flex min-w-0 items-center gap-3"
          aria-label="Adamos Fresh Eggs home"
        >
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#173b24] text-[#fff8e8]">
            <BrandMark />
          </span>
          <span className="truncate font-black uppercase tracking-[0.12em] text-[#18331f] sm:text-lg">
            Adamos <span className="hidden text-[#8a744a] sm:inline">Fresh Eggs</span>
          </span>
        </a>

        <nav
          className="ml-auto hidden items-center gap-7 text-sm font-bold text-[#405142] lg:flex"
          aria-label="Primary navigation"
        >
          {navigationItems.map((item) => (
            <a className="nav-link hover:text-[#a85620]" href={item.href} key={item.href}>
              {item.label}
            </a>
          ))}
        </nav>

        <a className="button-secondary ml-auto hidden sm:inline-flex lg:ml-3" href="#contact">
          <Mail aria-hidden="true" size={17} />
          Contact
        </a>
        <button
          ref={menuButtonRef}
          type="button"
          className="icon-button ml-auto inline-flex lg:hidden"
          aria-label={isMenuOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={isMenuOpen}
          aria-controls="mobile-navigation"
          onClick={() => setIsMenuOpen((open) => !open)}
        >
          {isMenuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
        </button>
      </div>

      {isMenuOpen && (
        <div
          className="fixed inset-0 top-18 z-50 bg-[#173b24]/40 backdrop-blur-sm lg:hidden"
          onMouseDown={closeMenu}
        >
          <div
            id="mobile-navigation"
            ref={menuRef}
            className="ml-auto flex h-full w-full max-w-sm flex-col bg-[#f9f7f0] p-6 shadow-2xl"
            aria-label="Mobile navigation"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <nav className="flex flex-col" aria-label="Mobile navigation links">
              {navigationItems.map((item) => (
                <a
                  className="flex min-h-15 items-center justify-between border-b border-[#ded9ca] text-lg font-black text-[#213622]"
                  href={item.href}
                  key={item.href}
                  onClick={closeMenu}
                >
                  {item.label}
                  <ArrowRight aria-hidden="true" size={18} />
                </a>
              ))}
            </nav>
            <a className="button-primary mt-8 w-full" href="#contact" onClick={closeMenu}>
              <Mail aria-hidden="true" size={18} />
              Write to the farm
            </a>
            <p className="mt-auto border-t border-[#ded9ca] pt-6 text-sm leading-6 text-[#687066]">
              Pasture-raised eggs, gathered and packed with care for nearby tables.
            </p>
          </div>
        </div>
      )}
    </header>
  );
}
