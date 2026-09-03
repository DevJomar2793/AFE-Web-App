"use client";

import Link from "next/link";
import {
  Boxes,
  ClipboardList,
  House,
  LayoutDashboard,
  Menu,
  Plus,
  ReceiptText,
  RotateCcw,
  X,
} from "lucide-react";
import { BrandMark } from "@/components/storefront/brand-mark";

export type InventoryViewName = "overview" | "inventory" | "activity";

type NavigationProps = {
  currentView: InventoryViewName;
  onSelectView: (view: InventoryViewName) => void;
};

type InventorySidebarProps = NavigationProps & {
  isMenuOpen: boolean;
  onCloseMenu: () => void;
};

export function InventorySidebar({
  currentView,
  isMenuOpen,
  onCloseMenu,
  onSelectView,
}: InventorySidebarProps) {
  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-50 hidden w-64 border-r border-[#dfe5dd] bg-white p-5 lg:flex lg:flex-col">
        <BrandLink />
        <InventoryNav
          currentView={currentView}
          onSelectView={onSelectView}
        />
        <div className="mt-auto rounded-2xl bg-[#173b24] p-4 text-white">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.12em] text-[#b9d1bc]">
            <span className="size-2 animate-pulse rounded-full bg-[#82d397]" />
            Local workspace
          </div>
          <p className="mt-2 text-xs leading-5 text-[#d8e6d8]">
            Sales and transaction activity are saved on this device.
          </p>
        </div>
      </aside>

      {isMenuOpen && (
        <div
          className="fixed inset-0 z-50 bg-[#102819]/45 lg:hidden"
          onMouseDown={onCloseMenu}
        >
          <aside
            className="h-full w-72 bg-white p-5 shadow-2xl"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <strong className="text-lg font-black">AFE Inventory</strong>
              <button
                type="button"
                aria-label="Close menu"
                className="grid size-10 place-items-center rounded-xl border border-[#e0e5df]"
                onClick={onCloseMenu}
              >
                <X size={19} />
              </button>
            </div>
            <InventoryNav
              currentView={currentView}
              onSelectView={onSelectView}
              isMobile
            />
            <Link
              href="/"
              className="mt-8 flex items-center gap-3 border-t border-[#e6e9e4] px-3 pt-6 text-sm font-bold text-[#657068]"
            >
              <House size={18} /> Storefront
            </Link>
          </aside>
        </div>
      )}
    </>
  );
}

export function InventoryHeader({
  currentView,
  onOpenMenu,
  onOpenReturn,
  onOpenSale,
}: {
  currentView: InventoryViewName;
  onOpenMenu: () => void;
  onOpenReturn: () => void;
  onOpenSale: () => void;
}) {
  const titles: Record<InventoryViewName, string> = {
    overview: "Operations overview",
    inventory: "Inventory",
    activity: "Transaction activity",
  };

  return (
    <header className="sticky top-0 z-40 border-b border-[#dfe5dd] bg-[#f4f6f1]/90 backdrop-blur-xl">
      <div className="mx-auto flex h-18 max-w-375 items-center gap-3 px-4 sm:px-7 lg:px-10">
        <button
          type="button"
          aria-label="Open navigation"
          className="grid size-10 place-items-center rounded-xl border border-[#d8dfd6] bg-white lg:hidden"
          onClick={onOpenMenu}
        >
          <Menu size={20} />
        </button>
        <div>
          <p className="text-xs font-bold text-[#7d887f]">
            {new Date().toLocaleDateString("en-PH", {
              weekday: "long",
              month: "long",
              day: "numeric",
              timeZone: "Asia/Manila",
            })}
          </p>
          <h1 className="text-lg font-black sm:text-xl">
            {titles[currentView]}
          </h1>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {currentView === "activity" && (
            <button
              type="button"
              aria-label="Record a return"
              onClick={onOpenReturn}
              className="flex h-11 items-center gap-2 rounded-xl border border-[#cfd8cd] bg-white px-3.5 text-sm font-black text-[#173b24] hover:bg-[#f1f3ee] sm:px-5"
            >
              <RotateCcw size={17} aria-hidden="true" />
              <span className="hidden sm:inline">Return</span>
            </button>
          )}
          <button
            type="button"
            onClick={onOpenSale}
            className="flex h-11 items-center gap-2 rounded-xl bg-[#173b24] px-3.5 text-sm font-black text-white shadow-sm hover:bg-[#245334] sm:px-5"
          >
            <Plus size={18} aria-hidden="true" />
            <span className="hidden xs:inline sm:inline">New sale</span>
          </button>
        </div>
      </div>
    </header>
  );
}

export function InventoryBottomNavigation({
  currentView,
  onSelectView,
}: NavigationProps) {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-3 border-t border-[#dce3da] bg-white/95 px-3 pb-[max(.65rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl lg:hidden"
      aria-label="Bottom navigation"
    >
      <BottomNavButton
        active={currentView === "overview"}
        icon={<LayoutDashboard size={20} />}
        label="Overview"
        onClick={() => onSelectView("overview")}
      />
      <BottomNavButton
        active={currentView === "inventory"}
        icon={<Boxes size={20} />}
        label="Inventory"
        onClick={() => onSelectView("inventory")}
      />
      <BottomNavButton
        active={currentView === "activity"}
        icon={<ClipboardList size={20} />}
        label="Activity"
        onClick={() => onSelectView("activity")}
      />
    </nav>
  );
}

function BrandLink() {
  return (
    <Link
      href="/"
      className="flex items-center gap-3"
      aria-label="Adamos Fresh Eggs storefront"
    >
      <span className="grid size-11 place-items-center overflow-hidden rounded-xl border border-[#dce2da]">
        <BrandMark />
      </span>
      <span>
        <strong className="block text-sm font-black">Adamos Fresh Eggs</strong>
        <span className="text-xs font-semibold text-[#818b83]">
          Inventory workspace
        </span>
      </span>
    </Link>
  );
}

function InventoryNav({
  currentView,
  isMobile = false,
  onSelectView,
}: NavigationProps & { isMobile?: boolean }) {
  return (
    <nav
      className={isMobile ? "mt-8 space-y-1" : "mt-10 space-y-1"}
      aria-label={
        isMobile ? "Mobile inventory navigation" : "Inventory navigation"
      }
    >
      <NavButton
        active={currentView === "overview"}
        icon={<LayoutDashboard size={19} />}
        label="Overview"
        onClick={() => onSelectView("overview")}
      />
      <NavButton
        active={currentView === "inventory"}
        icon={<Boxes size={19} />}
        label="Inventory"
        onClick={() => onSelectView("inventory")}
      />
      <NavButton
        active={currentView === "activity"}
        icon={<ReceiptText size={19} />}
        label="Activity"
        onClick={() => onSelectView("activity")}
      />
    </nav>
  );
}

function NavButton({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-bold transition ${
        active
          ? "bg-[#e5eee4] text-[#173b24]"
          : "text-[#68736b] hover:bg-[#f1f3ee] hover:text-[#173b24]"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function BottomNavButton({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center gap-1 py-1 text-[11px] font-black ${active ? "text-[#173b24]" : "text-[#8a938c]"}`}
    >
      {icon}
      {label}
    </button>
  );
}
