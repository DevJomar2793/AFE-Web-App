"use client";

import { PackagePlus, RotateCcw, Search } from "lucide-react";
import type {
  DatabaseInventoryItem,
  InventoryDatabaseStatus,
} from "@/services/inventory-api";

type InventoryViewProps = {
  error: string;
  isLoading: boolean;
  items: DatabaseInventoryItem[];
  query: string;
  onAddItem: () => void;
  onQueryChange: (query: string) => void;
  onRetry: () => void;
};

const STATUS_LABELS: Record<InventoryDatabaseStatus, string> = {
  in_stock: "In stock",
  low_stock: "Low stock",
  out_of_stock: "Out of stock",
};

const STATUS_CLASSES: Record<InventoryDatabaseStatus, string> = {
  in_stock: "bg-[#e9f4e8] text-[#28643c]",
  low_stock: "bg-[#fff0e5] text-[#a44f1f]",
  out_of_stock: "bg-[#f8e8e8] text-[#9b3f3f]",
};

const STATUS_DOT_CLASSES: Record<InventoryDatabaseStatus, string> = {
  in_stock: "bg-[#3d8a53]",
  low_stock: "bg-[#d46c2c]",
  out_of_stock: "bg-[#bf5555]",
};

export function InventoryView({
  error,
  isLoading,
  items,
  query,
  onAddItem,
  onQueryChange,
  onRetry,
}: InventoryViewProps) {
  const search = query.trim().toLowerCase();
  const filteredItems = items.filter(
    (item) => !search || item.item.toLowerCase().includes(search),
  );

  return (
    <section>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-black">All inventory</h2>
          <p className="mt-1 text-sm text-[#768178]">
            Live inventory records from the database.
          </p>
        </div>
        <button
          type="button"
          onClick={onAddItem}
          className="flex h-11 items-center justify-center gap-2 rounded-xl border border-[#cfd8cd] bg-white px-4 text-sm font-black text-[#173b24]"
        >
          <PackagePlus size={18} /> Add item
        </button>
      </div>

      <div className="relative mt-6 max-w-md">
        <Search
          className="absolute left-4 top-1/2 -translate-y-1/2 text-[#839087]"
          size={18}
        />
        <input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          className="inventory-field pl-11"
          placeholder="Search item"
          aria-label="Search inventory"
        />
      </div>

      <div className="mt-5 overflow-hidden rounded-2xl border border-[#e0e5de] bg-white">
        <div className="hidden grid-cols-[1.7fr_.7fr_.8fr] gap-4 border-b border-[#e7ebe5] bg-[#f8f9f6] px-5 py-3 text-xs font-black uppercase tracking-widest text-[#818b83] md:grid">
          <span>Item</span>
          <span>Available</span>
          <span>Status</span>
        </div>

        {isLoading ? (
          <InventoryLoadingState />
        ) : error ? (
          <InventoryErrorState error={error} onRetry={onRetry} />
        ) : (
          <InventoryRows
            items={filteredItems}
            query={query}
            total={items.length}
          />
        )}
      </div>
    </section>
  );
}

function InventoryLoadingState() {
  return (
    <div
      className="space-y-3 p-5"
      role="status"
      aria-label="Loading inventory"
    >
      {[0, 1, 2].map((placeholder) => (
        <div
          className="h-14 animate-pulse rounded-xl bg-[#f0f3ee]"
          key={placeholder}
        />
      ))}
    </div>
  );
}

function InventoryErrorState({
  error,
  onRetry,
}: {
  error: string;
  onRetry: () => void;
}) {
  return (
    <div className="p-10 text-center" role="alert">
      <p className="text-sm font-semibold text-[#9b3f3f]">{error}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl bg-[#173b24] px-4 text-sm font-black text-white hover:bg-[#245334]"
      >
        <RotateCcw size={16} aria-hidden="true" /> Try again
      </button>
    </div>
  );
}

function InventoryRows({
  items,
  query,
  total,
}: {
  items: DatabaseInventoryItem[];
  query: string;
  total: number;
}) {
  if (!items.length) {
    return (
      <p className="p-10 text-center text-sm font-semibold text-[#7c867e]">
        {total
          ? `No inventory items match “${query}”.`
          : "No inventory items are stored in the database."}
      </p>
    );
  }

  return items.map((item) => (
    <div
      className="grid gap-3 border-b border-[#edf0eb] p-5 last:border-b-0 md:grid-cols-[1.7fr_.7fr_.8fr] md:items-center md:gap-4"
      key={item.id}
    >
      <p className="font-extrabold">{item.item}</p>
      <div className="flex items-baseline justify-between md:block">
        <span className="text-xs font-bold uppercase text-[#929a94] md:hidden">
          Available
        </span>
        <span className="text-lg font-black">{item.quantity}</span>
      </div>
      <InventoryStatusBadge status={item.status} />
    </div>
  ));
}

function InventoryStatusBadge({ status }: { status: InventoryDatabaseStatus }) {
  return (
    <span
      className={`inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-extrabold ${STATUS_CLASSES[status]}`}
    >
      <span className={`size-1.5 rounded-full ${STATUS_DOT_CLASSES[status]}`} />
      {STATUS_LABELS[status]}
    </span>
  );
}
