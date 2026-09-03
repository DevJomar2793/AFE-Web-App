"use client";

import {
  ArrowDownLeft,
  ArrowUpRight,
  PackagePlus,
  RotateCcw,
} from "lucide-react";
import type {
  LocalInventoryState,
  TransactionType,
} from "@/lib/local-inventory";
import type { DatabaseSale } from "@/services/sales-api";

type InventoryActivityProps = {
  databaseSales: DatabaseSale[];
  error: string;
  isLoading: boolean;
  onRetry: () => void;
};

type ActivityListProps = {
  state: LocalInventoryState;
  limit?: number;
  onViewAll?: () => void;
};

type ActivityEntry = {
  key: string;
  type: TransactionType;
  itemName: string;
  quantity: number;
  createdAt: string;
  customer?: string;
  note?: string;
  unit: string;
};

export function InventoryActivity({
  databaseSales,
  error,
  isLoading,
  onRetry,
}: InventoryActivityProps) {
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

      <div className="mt-6">
        <ActivityCard entries={buildDatabaseSaleEntries(databaseSales)} />
      </div>
    </section>
  );
}

export function ActivityList({
  state,
  limit,
  onViewAll,
}: ActivityListProps) {
  const allEntries = buildLocalActivityEntries(state);
  const entries =
    typeof limit === "number" ? allEntries.slice(0, limit) : allEntries;

  return <ActivityCard entries={entries} onViewAll={onViewAll} />;
}

function ActivityCard({
  entries,
  onViewAll,
}: {
  entries: ActivityEntry[];
  onViewAll?: () => void;
}) {
  return (
    <article className="overflow-hidden rounded-2xl border border-[#e1e6df] bg-white">
      <div className="flex items-center justify-between gap-3 border-b border-[#e8ece6] px-5 py-4 sm:px-6">
        <div>
          <h2 className="font-black">Recent activity</h2>
          <p className="mt-1 text-sm text-[#7a857d]">
            Latest inventory movements
          </p>
        </div>
        {onViewAll && (
          <button
            type="button"
            onClick={onViewAll}
            className="text-xs font-black text-[#a85620] hover:underline"
          >
            View all
          </button>
        )}
      </div>
      <div>
        {entries.length ? (
          entries.map((entry) => <ActivityRow key={entry.key} entry={entry} />)
        ) : (
          <p className="p-10 text-center text-sm font-semibold text-[#7c867e]">
            No inventory activity has been recorded yet.
          </p>
        )}
      </div>
    </article>
  );
}

function ActivityRow({ entry }: { entry: ActivityEntry }) {
  const positive = entry.type !== "sale";
  const unitLabel = entry.quantity === 1 ? entry.unit : `${entry.unit}s`;

  return (
    <div className="flex items-center gap-3 border-b border-[#edf0eb] px-4 py-4 last:border-b-0 sm:px-6">
      <span
        className={`grid size-10 shrink-0 place-items-center rounded-xl ${entry.type === "sale" ? "bg-[#e7f2e6] text-[#2f7043]" : entry.type === "return" ? "bg-[#fff0e5] text-[#ad5927]" : "bg-[#e9eef8] text-[#4d6796]"}`}
      >
        <ActivityIcon type={entry.type} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-extrabold">
          {getActivityLabel(entry.type)} · {entry.itemName}
        </p>
        <p className="mt-1 truncate text-xs font-semibold text-[#89928b]">
          {entry.customer || entry.note || formatActivityDate(entry.createdAt)}
        </p>
      </div>
      <div className="text-right">
        <p
          className={`text-sm font-black ${positive ? "text-[#3f7650]" : "text-[#24362a]"}`}
        >
          {positive ? "+" : "−"}
          {entry.quantity}{" "}
          <span className="hidden sm:inline">{unitLabel}</span>
        </p>
        <p className="mt-1 text-[11px] font-semibold text-[#929a94]">
          {formatActivityDate(entry.createdAt)}
        </p>
      </div>
    </div>
  );
}

function buildLocalActivityEntries(state: LocalInventoryState) {
  return state.transactions.map((transaction): ActivityEntry => {
    const item = state.items.find(
      (candidate) => candidate.id === transaction.itemId,
    );

    return {
      key: `local-${transaction.id}`,
      type: transaction.type,
      itemName: item?.name ?? "Unknown item",
      quantity: transaction.quantity,
      createdAt: transaction.createdAt,
      customer: transaction.customer,
      note: transaction.note,
      unit: item?.unit ?? "unit",
    };
  });
}

function buildDatabaseSaleEntries(databaseSales: DatabaseSale[]) {
  return databaseSales.map((sale): ActivityEntry => ({
    key: `database-sale-${sale.id}`,
    type: "sale",
    itemName: sale.item.name,
    quantity: sale.quantity,
    createdAt: sale.createdAt,
    customer: sale.customerName,
    unit: "unit",
  }));
}

function ActivityIcon({ type }: { type: TransactionType }) {
  if (type === "sale") {
    return <ArrowUpRight size={17} aria-hidden="true" />;
  }
  if (type === "return") {
    return <ArrowDownLeft size={17} aria-hidden="true" />;
  }
  return <PackagePlus size={17} aria-hidden="true" />;
}

function getActivityLabel(type: TransactionType) {
  if (type === "sale") return "Sale";
  if (type === "return") return "Return";
  return "Restock";
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
