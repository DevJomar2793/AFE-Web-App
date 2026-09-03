"use client";

import {
  ArrowDownLeft,
  ArrowUpRight,
  PackagePlus,
  Plus,
  RotateCcw,
} from "lucide-react";
import type {
  InventoryTransaction,
  LocalInventoryState,
  TransactionType,
} from "@/lib/local-inventory";
import type { TransactionAction } from "@/components/inventory/transaction-sheet";

type InventoryActivityProps = {
  state: LocalInventoryState;
  onOpenAction: (action: TransactionAction) => void;
};

type ActivityListProps = {
  state: LocalInventoryState;
  limit?: number;
  onViewAll?: () => void;
};

export function InventoryActivity({
  state,
  onOpenAction,
}: InventoryActivityProps) {
  return (
    <section>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-black">Transaction activity</h2>
          <p className="mt-1 text-sm text-[#768178]">
            A chronological record of sales, returns, and restocks.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onOpenAction("return")}
            className="flex h-11 items-center gap-2 rounded-xl border border-[#cfd8cd] bg-white px-4 text-sm font-black"
          >
            <RotateCcw size={17} /> Return
          </button>
          <button
            type="button"
            onClick={() => onOpenAction("sale")}
            className="flex h-11 items-center gap-2 rounded-xl bg-[#173b24] px-4 text-sm font-black text-white"
          >
            <Plus size={17} /> Sale
          </button>
        </div>
      </div>
      <div className="mt-6">
        <ActivityList state={state} />
      </div>
    </section>
  );
}

export function ActivityList({
  state,
  limit,
  onViewAll,
}: ActivityListProps) {
  const transactions =
    typeof limit === "number"
      ? state.transactions.slice(0, limit)
      : state.transactions;

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
        {transactions.length ? (
          transactions.map((transaction) => (
            <ActivityRow
              key={transaction.id}
              state={state}
              transaction={transaction}
            />
          ))
        ) : (
          <p className="p-10 text-center text-sm font-semibold text-[#7c867e]">
            No inventory activity has been recorded yet.
          </p>
        )}
      </div>
    </article>
  );
}

function ActivityRow({
  state,
  transaction,
}: {
  state: LocalInventoryState;
  transaction: InventoryTransaction;
}) {
  const item = state.items.find(
    (candidate) => candidate.id === transaction.itemId,
  );
  const positive = transaction.type !== "sale";

  return (
    <div className="flex items-center gap-3 border-b border-[#edf0eb] px-4 py-4 last:border-b-0 sm:px-6">
      <span
        className={`grid size-10 shrink-0 place-items-center rounded-xl ${transaction.type === "sale" ? "bg-[#e7f2e6] text-[#2f7043]" : transaction.type === "return" ? "bg-[#fff0e5] text-[#ad5927]" : "bg-[#e9eef8] text-[#4d6796]"}`}
      >
        <ActivityIcon type={transaction.type} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-extrabold">
          {transaction.type === "sale"
            ? "Sale"
            : transaction.type === "return"
              ? "Return"
              : "Restock"}{" "}
          · {item?.name ?? "Unknown item"}
        </p>
        <p className="mt-1 truncate text-xs font-semibold text-[#89928b]">
          {transaction.customer ||
            transaction.note ||
            formatActivityDate(transaction.createdAt)}
        </p>
      </div>
      <div className="text-right">
        <p
          className={`text-sm font-black ${positive ? "text-[#3f7650]" : "text-[#24362a]"}`}
        >
          {positive ? "+" : "−"}
          {transaction.quantity}{" "}
          <span className="hidden sm:inline">
            {item?.unit}
            {transaction.quantity === 1 ? "" : "s"}
          </span>
        </p>
        <p className="mt-1 text-[11px] font-semibold text-[#929a94]">
          {formatActivityDate(transaction.createdAt)}
        </p>
      </div>
    </div>
  );
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
