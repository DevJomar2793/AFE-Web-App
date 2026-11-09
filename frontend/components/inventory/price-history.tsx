"use client";

import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Clock3,
  History,
  Minus,
  RotateCcw,
} from "lucide-react";
import { useState } from "react";
import type {
  InventoryPriceHistory,
  PriceChangeDirection,
} from "@/lib/api";

type PriceHistoryProps = {
  records: InventoryPriceHistory[];
  error: string;
  isLoading: boolean;
  onBack: () => void;
  onRetry: () => void;
};

const currency = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const dateTimeFormatter = new Intl.DateTimeFormat("en-PH", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Manila",
});

const eventLabels = {
  initial: "Initial price",
  stock_added: "Stock added",
  price_update: "Price update",
};

export function PriceHistory({
  records,
  error,
  isLoading,
  onBack,
  onRetry,
}: PriceHistoryProps) {
  const [page, setPage] = useState(0);
  const pageSize = 10;
  const pageCount = Math.max(1, Math.ceil(records.length / pageSize));
  const currentPage = Math.min(page, pageCount - 1);
  const visibleRecords = records.slice(
    currentPage * pageSize,
    (currentPage + 1) * pageSize,
  );

  return (
    <section className="pb-4">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#e7f2e6] text-[#2f7043]">
            <History size={20} aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-2xl font-black">Price History</h2>
            <p className="mt-1 text-sm text-[#768178]">
              Compare purchase costs recorded for your inventory.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#cfd8cd] bg-white px-4 text-sm font-black text-[#173b24] hover:bg-[#f8faf7]"
        >
          <ArrowLeft size={17} aria-hidden="true" /> Back to Inventory
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[#e0e5de] bg-white">
        <div className="hidden grid-cols-[1.3fr_.75fr_.85fr_.85fr_1fr_1.1fr] gap-3 border-b border-[#e7ebe5] bg-[#f8f9f6] px-5 py-3 text-xs font-black uppercase tracking-wider text-[#818b83] lg:grid">
          <span>Product</span>
          <span>Quantity</span>
          <span>Previous</span>
          <span>New price</span>
          <span>Change</span>
          <span>Purchase date</span>
        </div>

        {isLoading ? (
          <PriceHistoryLoading />
        ) : error ? (
          <div className="p-10 text-center" role="alert">
            <p className="text-sm font-semibold text-[#9b3f3f]">{error}</p>
            <button
              type="button"
              onClick={onRetry}
              className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl bg-[#173b24] px-4 text-sm font-black text-white"
            >
              <RotateCcw size={16} aria-hidden="true" /> Try again
            </button>
          </div>
        ) : visibleRecords.length ? (
          visibleRecords.map((record) => (
            <PriceHistoryRow key={record.id} record={record} />
          ))
        ) : (
          <div className="px-6 py-16 text-center">
            <History className="mx-auto text-[#718078]" size={32} />
            <h3 className="mt-3 font-black">No price history yet</h3>
            <p className="mt-1 text-sm text-[#7c867e]">
              Initial stock and future purchase-price changes will appear here.
            </p>
          </div>
        )}
      </div>

      {!isLoading && !error && pageCount > 1 && (
        <div className="mt-3 flex items-center justify-between text-sm">
          <span>Page {currentPage + 1} of {pageCount}</span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={currentPage === 0}
              onClick={() => setPage(currentPage - 1)}
              className="rounded-lg border bg-white px-3 py-1.5 font-bold disabled:opacity-40"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={currentPage + 1 === pageCount}
              onClick={() => setPage(currentPage + 1)}
              className="rounded-lg border bg-white px-3 py-1.5 font-bold disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

function PriceHistoryRow({ record }: { record: InventoryPriceHistory }) {
  return (
    <article className="grid gap-4 border-b border-[#edf0eb] p-5 last:border-b-0 lg:grid-cols-[1.3fr_.75fr_.85fr_.85fr_1fr_1.1fr] lg:items-center lg:gap-3">
      <div>
        <p className="font-extrabold text-[#24362a]">{record.productName}</p>
        <p className="mt-1 text-xs font-bold text-[#7c867e]">
          {record.category === "eggs" ? "Eggs" : `Oil · ${record.oilSize}`}
          {" · "}{eventLabels[record.eventType]}
        </p>
      </div>
      <HistoryValue label="Quantity" value={String(record.quantity)} />
      <HistoryValue
        label="Previous"
        value={
          record.previousPurchaseCost === null
            ? "—"
            : currency.format(record.previousPurchaseCost)
        }
      />
      <HistoryValue label="New price" value={currency.format(record.newPurchaseCost)} />
      <div>
        <p className="mb-1 text-[11px] font-black uppercase tracking-wide text-[#8a938c] lg:hidden">
          Change
        </p>
        <ChangeBadge record={record} />
      </div>
      <div>
        <p className="mb-1 text-[11px] font-black uppercase tracking-wide text-[#8a938c] lg:hidden">
          Purchase date
        </p>
        <p className="flex items-center gap-2 text-sm font-semibold text-[#5f6d63]">
          <Clock3 size={15} aria-hidden="true" />
          <time dateTime={record.purchaseDate}>
            {dateTimeFormatter.format(new Date(record.purchaseDate))}
          </time>
        </p>
      </div>
    </article>
  );
}

function HistoryValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between lg:block">
      <span className="text-[11px] font-black uppercase tracking-wide text-[#8a938c] lg:hidden">
        {label}
      </span>
      <span className="text-sm font-extrabold text-[#33473a]">{value}</span>
    </div>
  );
}

function ChangeBadge({ record }: { record: InventoryPriceHistory }) {
  const styles: Record<PriceChangeDirection, string> = {
    initial: "bg-[#edf1ed] text-[#637068]",
    increased: "bg-[#fff0e8] text-[#a34820]",
    decreased: "bg-[#e9f4e8] text-[#28643c]",
    unchanged: "bg-[#edf1ed] text-[#637068]",
  };
  const icons = {
    initial: <Minus size={13} />,
    increased: <ArrowUp size={13} />,
    decreased: <ArrowDown size={13} />,
    unchanged: <Minus size={13} />,
  };

  if (record.priceDifference === null) {
    return (
      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-black ${styles.initial}`}>
        Initial
      </span>
    );
  }

  const sign = record.priceDifference > 0 ? "+" : "";
  const percentage =
    record.percentageChange === null
      ? "N/A"
      : `${record.percentageChange > 0 ? "+" : ""}${record.percentageChange.toFixed(2)}%`;

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-black ${styles[record.changeDirection]}`}>
      {icons[record.changeDirection]}
      {sign}{currency.format(record.priceDifference)} · {percentage}
    </span>
  );
}

function PriceHistoryLoading() {
  return (
    <div className="space-y-3 p-5" role="status" aria-label="Loading price history">
      {[0, 1, 2].map((placeholder) => (
        <div className="h-16 animate-pulse rounded-xl bg-[#f0f3ee]" key={placeholder} />
      ))}
    </div>
  );
}
