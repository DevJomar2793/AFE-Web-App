"use client";

import { ArrowUpRight, RotateCcw } from "lucide-react";
import type { DatabaseSale } from "@/services/sales-api";

type TransactionActivityProps = {
  sales: DatabaseSale[];
  error: string;
  isLoading: boolean;
  onRetry: () => void;
};

export function TransactionActivity({
  sales,
  error,
  isLoading,
  onRetry,
}: TransactionActivityProps) {
  return (
    <section>
      <div>
        <h2 className="text-2xl font-black">Transaction activity</h2>
        <p className="mt-1 text-sm text-[#768178]">
          Sales recorded in the database.
        </p>
      </div>

      {isLoading && (
        <p
          className="mt-5 rounded-xl bg-[#edf2eb] px-4 py-3 text-sm font-semibold text-[#627067]"
          role="status"
        >
          Loading database sales…
        </p>
      )}

      {error && (
        <div
          className="mt-5 flex flex-col gap-3 rounded-xl bg-[#fff0e8] px-4 py-3 text-sm text-[#8f421f] sm:flex-row sm:items-center sm:justify-between"
          role="alert"
        >
          <p className="font-semibold">{error}</p>
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-lg bg-white px-3 font-black shadow-sm"
          >
            <RotateCcw size={15} aria-hidden="true" /> Retry
          </button>
        </div>
      )}

      <article className="mt-6 overflow-hidden rounded-2xl border border-[#e1e6df] bg-white">
        <div className="border-b border-[#e8ece6] px-5 py-4 sm:px-6">
          <h2 className="font-black">Recent activity</h2>
          <p className="mt-1 text-sm text-[#7a857d]">Latest sales</p>
        </div>

        {sales.length ? (
          sales.map((sale) => <SaleActivityRow key={sale.id} sale={sale} />)
        ) : (
          <p className="p-10 text-center text-sm font-semibold text-[#7c867e]">
            No sales have been recorded yet.
          </p>
        )}
      </article>
    </section>
  );
}

function SaleActivityRow({ sale }: { sale: DatabaseSale }) {
  const unitLabel = sale.quantity === 1 ? "Tray" : "Trays";

  return (
    <div className="flex items-center gap-3 border-b border-[#edf0eb] px-4 py-4 last:border-b-0 sm:px-6">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#e7f2e6] text-[#2f7043]">
        <ArrowUpRight size={17} aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-extrabold">
          Sale · {sale.item.name}
        </p>
        <p className="mt-1 truncate text-xs font-semibold text-[#89928b]">
          {sale.customerName}
        </p>
      </div>
      <div className="text-right">
        <p className="text-sm font-black text-[#24362a]">
          −{sale.quantity} <span className="hidden sm:inline">{unitLabel}</span>
        </p>
        <p className="mt-1 text-[11px] font-semibold text-[#929a94]">
          {formatActivityDate(sale.createdAt)}
        </p>
      </div>
    </div>
  );
}

function formatActivityDate(value: string) {
  const date = new Date(value);
  const today = localDateKey(new Date());
  const day = localDateKey(date);
  const prefix =
    day === today
      ? "Today"
      : date.toLocaleDateString("en-PH", {
          month: "short",
          day: "numeric",
        });

  return `${prefix}, ${date.toLocaleTimeString("en-PH", {
    hour: "numeric",
    minute: "2-digit",
  })}`;
}

function localDateKey(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}
