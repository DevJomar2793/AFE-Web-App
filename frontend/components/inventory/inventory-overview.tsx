"use client";

import {
  CircleDollarSign,
  PackagePlus,
  RotateCcw,
  ShoppingBag,
  TrendingUp,
  TriangleAlert,
} from "lucide-react";
import { useMemo } from "react";
import { ActivityList } from "@/components/inventory/inventory-activity";
import type { TransactionAction } from "@/components/inventory/transaction-sheet";
import type { LocalInventoryState } from "@/lib/local-inventory";

type InventoryOverviewProps = {
  state: LocalInventoryState;
  onOpenAction: (action: TransactionAction, itemId?: string) => void;
  onViewActivity: () => void;
};

const currency = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  maximumFractionDigits: 0,
});

const compactNumber = new Intl.NumberFormat("en-PH", {
  notation: "compact",
  maximumFractionDigits: 1,
});

export function InventoryOverview({
  state,
  onOpenAction,
  onViewActivity,
}: InventoryOverviewProps) {
  const today = localDateKey(new Date());
  const metrics = useMemo(() => calculateMetrics(state, today), [state, today]);
  const chartDays = useMemo(() => calculateChartDays(state), [state]);
  const chartMax = Math.max(...chartDays.map((day) => day.total), 1);

  return (
    <>
      <section
        className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-5"
        aria-label="Today's summary"
      >
        <MetricCard
          label="Net sales today"
          value={currency.format(metrics.netSales)}
          detail={`${metrics.saleCount} completed sale${metrics.saleCount === 1 ? "" : "s"}`}
          accent="bg-[#e4f1e4] text-[#2d7042]"
          icon={<CircleDollarSign size={20} />}
        />
        <MetricCard
          label="Units on hand"
          value={compactNumber.format(metrics.units)}
          detail={`${state.items.length} active items`}
          accent="bg-[#e8edf9] text-[#4566a0]"
          icon={<ShoppingBag size={20} />}
        />
        <MetricCard
          label="Returns today"
          value={String(metrics.returnCount)}
          detail="Stock restored instantly"
          accent="bg-[#fff0e5] text-[#b15b26]"
          icon={<RotateCcw size={20} />}
        />
        <MetricCard
          label="Inventory value"
          value={currency.format(metrics.inventoryValue)}
          detail="Based on current unit cost"
          accent="bg-[#f1e9f5] text-[#7b5391]"
          icon={<TrendingUp size={20} />}
        />
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-[1.45fr_1fr]">
        <SalesChart days={chartDays} maximum={chartMax} />
        <article className="rounded-2xl border border-[#e1e6df] bg-white p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-black">Stock attention</h2>
              <p className="mt-1 text-sm text-[#7a857d]">
                Items at or below reorder level
              </p>
            </div>
            <span className="grid size-10 place-items-center rounded-xl bg-[#fff0e5] text-[#b15b26]">
              <TriangleAlert size={20} />
            </span>
          </div>
          <div className="mt-5 space-y-3">
            {metrics.lowStock.length ? (
              metrics.lowStock.map((item) => (
                <div
                  className="flex items-center gap-3 rounded-xl border border-[#edf0eb] p-3"
                  key={item.id}
                >
                  <div className="grid size-10 place-items-center rounded-lg bg-[#f4f6f1] text-sm font-black text-[#173b24]">
                    {item.quantity}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-extrabold">
                      {item.name}
                    </p>
                    <p className="text-xs text-[#828c84]">
                      Reorder at {item.reorderLevel} {item.unit}s
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onOpenAction("restock", item.id)}
                    className="text-xs font-black text-[#a85620] hover:underline"
                  >
                    Restock
                  </button>
                </div>
              ))
            ) : (
              <p className="rounded-xl bg-[#eef6ed] p-4 text-sm font-bold text-[#39704a]">
                All items are above their reorder levels.
              </p>
            )}
          </div>
        </article>
      </section>

      <section className="mt-5 grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        <ActivityList state={state} limit={5} onViewAll={onViewActivity} />
        <article className="rounded-2xl bg-[#173b24] p-5 text-white sm:p-6">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-[#acd0b4]">
            Quick actions
          </p>
          <h2 className="mt-2 text-xl font-black">Keep records current</h2>
          <p className="mt-2 text-sm leading-6 text-[#d0dfd2]">
            Every transaction updates quantities and dashboard totals
            immediately.
          </p>
          <div className="mt-5 grid gap-2">
            <button
              type="button"
              onClick={() => onOpenAction("sale")}
              className="flex items-center gap-3 rounded-xl bg-white px-4 py-3 text-left text-sm font-black text-[#173b24]"
            >
              <CircleDollarSign size={18} /> Record a sale
            </button>
            <button
              type="button"
              onClick={() => onOpenAction("return")}
              className="flex items-center gap-3 rounded-xl border border-white/20 px-4 py-3 text-left text-sm font-black text-white hover:bg-white/10"
            >
              <RotateCcw size={18} /> Record a return
            </button>
            <button
              type="button"
              onClick={() => onOpenAction("restock")}
              className="flex items-center gap-3 rounded-xl border border-white/20 px-4 py-3 text-left text-sm font-black text-white hover:bg-white/10"
            >
              <PackagePlus size={18} /> Add stock
            </button>
          </div>
        </article>
      </section>
    </>
  );
}

function MetricCard({
  accent,
  icon,
  label,
  value,
  detail,
}: {
  accent: string;
  icon: React.ReactNode;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <article className="rounded-2xl border border-[#e1e6df] bg-white p-5 shadow-[0_12px_30px_rgba(23,59,36,0.04)]">
      <div className="flex items-start justify-between gap-4">
        <p className="text-sm font-semibold text-[#758078]">{label}</p>
        <span className={`grid size-10 place-items-center rounded-xl ${accent}`}>
          {icon}
        </span>
      </div>
      <p className="mt-3 text-2xl font-black tracking-tight text-[#18251a] sm:text-3xl">
        {value}
      </p>
      <p className="mt-1 text-xs font-semibold text-[#849087]">{detail}</p>
    </article>
  );
}

function SalesChart({
  days,
  maximum,
}: {
  days: { key: string; label: string; total: number }[];
  maximum: number;
}) {
  return (
    <article className="rounded-2xl border border-[#e1e6df] bg-white p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-black">7-day sales pulse</h2>
          <p className="mt-1 text-sm text-[#7a857d]">
            Net revenue after recorded returns
          </p>
        </div>
        <span className="rounded-full bg-[#e9f4e8] px-3 py-1 text-xs font-black text-[#2d7042]">
          Live
        </span>
      </div>
      <div
        className="mt-8 flex h-48 items-end gap-2 sm:gap-4"
        aria-label="Seven day net sales chart"
      >
        {days.map((day) => (
          <div
            className="flex h-full flex-1 flex-col items-center justify-end gap-2"
            key={day.key}
            title={`${day.label}: ${currency.format(day.total)}`}
          >
            <span className="text-[10px] font-bold text-[#718078] sm:text-xs">
              {day.total ? compactNumber.format(day.total) : "—"}
            </span>
            <div className="relative h-[75%] w-full max-w-12 overflow-hidden rounded-t-lg bg-[#edf1eb]">
              <div
                className="absolute inset-x-0 bottom-0 rounded-t-lg bg-[#3f8152] transition-[height]"
                style={{
                  height: `${Math.max(day.total ? 12 : 0, (day.total / maximum) * 100)}%`,
                }}
              />
            </div>
            <span className="text-[11px] font-extrabold uppercase text-[#8a938c]">
              {day.label}
            </span>
          </div>
        ))}
      </div>
    </article>
  );
}

function calculateMetrics(state: LocalInventoryState, today: string) {
  const todayTransactions = state.transactions.filter(
    (transaction) => localDateKey(new Date(transaction.createdAt)) === today,
  );
  const sales = todayTransactions.filter(
    (transaction) => transaction.type === "sale",
  );
  const returns = todayTransactions.filter(
    (transaction) => transaction.type === "return",
  );
  const grossSales = sales.reduce(
    (sum, transaction) => sum + transaction.amount,
    0,
  );
  const refunds = returns.reduce(
    (sum, transaction) => sum + transaction.amount,
    0,
  );
  const units = state.items.reduce((sum, item) => sum + item.quantity, 0);
  const inventoryValue = state.items.reduce(
    (sum, item) => sum + item.quantity * item.cost,
    0,
  );

  return {
    netSales: grossSales - refunds,
    saleCount: sales.length,
    returnCount: returns.length,
    units,
    inventoryValue,
    lowStock: state.items.filter(
      (item) => item.quantity <= item.reorderLevel,
    ),
  };
}

function calculateChartDays(state: LocalInventoryState) {
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    const key = localDateKey(date);
    const total = state.transactions
      .filter(
        (transaction) =>
          localDateKey(new Date(transaction.createdAt)) === key,
      )
      .reduce((sum, transaction) => {
        if (transaction.type === "sale") return sum + transaction.amount;
        if (transaction.type === "return") return sum - transaction.amount;
        return sum;
      }, 0);

    return {
      key,
      label: date.toLocaleDateString("en-PH", { weekday: "short" }),
      total: Math.max(0, total),
    };
  });
}

function localDateKey(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}
