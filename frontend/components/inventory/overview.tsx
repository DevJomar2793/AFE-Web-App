"use client";

import {
  ArrowDownLeft,
  ArrowUpRight,
  CircleDollarSign,
  RotateCcw,
  ShoppingBag,
  TrendingUp,
  TriangleAlert,
} from "lucide-react";
import { useMemo } from "react";
import type { InventoryItem, InventoryReturn, Sale } from "@/lib/api";

type InventoryOverviewProps = {
  items: InventoryItem[];
  sales: Sale[];
  returns: InventoryReturn[];
  isLoading: boolean;
  error: string;
  onRetry: () => void;
  onOpenInventory: () => void;
  onOpenReturns: () => void;
  onOpenSale: () => void;
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
  items,
  sales,
  returns,
  isLoading,
  error,
  onRetry,
  onOpenInventory,
  onViewActivity,
}: InventoryOverviewProps) {
  const today = localDateKey(new Date());
  const metrics = useMemo(
    () => calculateMetrics(items, sales, returns, today),
    [items, sales, returns, today],
  );
  const chartDays = useMemo(() => calculateChartDays(sales), [sales]);
  const chartMax = Math.max(...chartDays.map((day) => day.total), 1);
  const recentActivity = useMemo(
    () => buildRecentActivity(sales, returns),
    [sales, returns],
  );

  if (isLoading) {
    return <OverviewLoadingState />;
  }

  if (error) {
    return <OverviewErrorState error={error} onRetry={onRetry} />;
  }

  return (
    <>
      <section
        className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-5"
        aria-label="Today's summary"
      >
        <MetricCard
          label="Sales today"
          value={currency.format(metrics.salesToday)}
          detail={`${metrics.saleCount} completed sale${metrics.saleCount === 1 ? "" : "s"}`}
          accent="bg-[#e4f1e4] text-[#2d7042]"
          icon={<CircleDollarSign size={20} />}
        />
        <MetricCard
          label="Units on hand"
          value={compactNumber.format(metrics.units)}
          detail={`${items.length} inventory item${items.length === 1 ? "" : "s"}`}
          accent="bg-[#e8edf9] text-[#4566a0]"
          icon={<ShoppingBag size={20} />}
        />
        <MetricCard
          label="Returns today"
          value={String(metrics.returnedUnits)}
          detail={`${metrics.returnCount} return record${metrics.returnCount === 1 ? "" : "s"}`}
          accent="bg-[#fff0e5] text-[#b15b26]"
          icon={<RotateCcw size={20} />}
        />
        <MetricCard
          label="Inventory value"
          value={currency.format(metrics.inventoryValue)}
          detail="Based on regular prices"
          accent="bg-[#f1e9f5] text-[#7b5391]"
          icon={<TrendingUp size={20} />}
        />
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-[1.45fr_1fr]">
        <SalesChart days={chartDays} maximum={chartMax} />
        <StockAttention
          items={metrics.stockAttention}
          onOpenInventory={onOpenInventory}
        />
      </section>

      <section className="mt-5">
        <RecentDatabaseActivity
          activity={recentActivity}
          onViewAll={onViewActivity}
        />
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
        <span
          className={`grid size-10 place-items-center rounded-xl ${accent}`}
        >
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
          <h2 className="font-black">7-day sales</h2>
          <p className="mt-1 text-sm text-[#7a857d]">Gross sales revenue</p>
        </div>
        <span className="rounded-full bg-[#e9f4e8] px-3 py-1 text-xs font-black text-[#2d7042]">
          Live
        </span>
      </div>
      <div
        className="mt-8 flex h-48 items-end gap-2 sm:gap-4"
        aria-label="Seven day sales chart"
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

function StockAttention({
  items,
  onOpenInventory,
}: {
  items: InventoryItem[];
  onOpenInventory: () => void;
}) {
  return (
    <article className="rounded-2xl border border-[#e1e6df] bg-white p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-black">Stock attention</h2>
          <p className="mt-1 text-sm text-[#7a857d]">
            Low and out-of-stock items
          </p>
        </div>
        <span className="grid size-10 place-items-center rounded-xl bg-[#fff0e5] text-[#b15b26]">
          <TriangleAlert size={20} />
        </span>
      </div>
      <div className="mt-5 space-y-3">
        {items.length ? (
          items.map((item) => (
            <div
              className="flex items-center gap-3 rounded-xl border border-[#edf0eb] p-3"
              key={item.id}
            >
              <div className="grid size-10 place-items-center rounded-lg bg-[#f4f6f1] text-sm font-black text-[#173b24]">
                {item.quantity}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-extrabold">{item.item}</p>
                <p className="text-xs capitalize text-[#828c84]">
                  {item.status.replaceAll("_", " ")}
                </p>
              </div>
              <button
                type="button"
                onClick={onOpenInventory}
                className="text-xs font-black text-[#a85620] hover:underline"
              >
                Manage
              </button>
            </div>
          ))
        ) : (
          <p className="rounded-xl bg-[#eef6ed] p-4 text-sm font-bold text-[#39704a]">
            All items are currently in stock.
          </p>
        )}
      </div>
    </article>
  );
}

type ActivityItem = {
  id: string;
  type: "sale" | "return";
  itemName: string;
  customerName: string;
  quantity: number;
  detail: string;
  createdAt: string;
};

function RecentDatabaseActivity({
  activity,
  onViewAll,
}: {
  activity: ActivityItem[];
  onViewAll: () => void;
}) {
  return (
    <article className="overflow-hidden rounded-2xl border border-[#e1e6df] bg-white">
      <div className="flex items-center justify-between gap-4 border-b border-[#e8ece6] px-5 py-4 sm:px-6">
        <div>
          <h2 className="font-black">Recent database activity</h2>
          <p className="mt-1 text-sm text-[#7a857d]">
            Latest sales and returns
          </p>
        </div>
        <button
          type="button"
          onClick={onViewAll}
          className="text-xs font-black text-[#2d7042] hover:underline"
        >
          View sales
        </button>
      </div>
      {activity.length ? (
        activity.map((entry) => (
          <div
            className="flex items-center gap-3 border-b border-[#edf0eb] px-4 py-4 last:border-b-0 sm:px-6"
            key={entry.id}
          >
            <span
              className={`grid size-10 shrink-0 place-items-center rounded-xl ${entry.type === "sale" ? "bg-[#e7f2e6] text-[#2f7043]" : "bg-[#fff0e5] text-[#b15b26]"}`}
            >
              {entry.type === "sale" ? (
                <ArrowUpRight size={17} />
              ) : (
                <ArrowDownLeft size={17} />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-extrabold capitalize">
                {entry.type} · {entry.itemName}
              </p>
              <p className="mt-1 truncate text-xs font-semibold text-[#89928b]">
                {entry.customerName}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-black text-[#24362a]">
                {entry.type === "sale" ? "−" : "+"}
                {entry.quantity}
              </p>
              <p className="mt-1 max-w-40 truncate text-xs font-bold text-[#68736b]">
                {entry.detail}
              </p>
              <p className="mt-1 text-[11px] font-semibold text-[#929a94]">
                {formatActivityDate(entry.createdAt)}
              </p>
            </div>
          </div>
        ))
      ) : (
        <p className="p-10 text-center text-sm font-semibold text-[#7c867e]">
          No sales or returns have been recorded yet.
        </p>
      )}
    </article>
  );
}

function OverviewLoadingState() {
  return (
    <div
      className="grid gap-5"
      role="status"
      aria-label="Loading dashboard data"
    >
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[0, 1, 2, 3].map((item) => (
          <div
            className="h-36 animate-pulse rounded-2xl bg-[#e9ede7]"
            key={item}
          />
        ))}
      </div>
      <div className="h-80 animate-pulse rounded-2xl bg-[#e9ede7]" />
    </div>
  );
}

function OverviewErrorState({
  error,
  onRetry,
}: {
  error: string;
  onRetry: () => void;
}) {
  return (
    <div
      className="rounded-2xl bg-[#fff0e8] p-6 text-center text-[#8f421f]"
      role="alert"
    >
      <p className="font-bold">{error}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl bg-white px-4 text-sm font-black shadow-sm"
      >
        <RotateCcw size={16} /> Retry dashboard
      </button>
    </div>
  );
}

function calculateMetrics(
  items: InventoryItem[],
  sales: Sale[],
  returns: InventoryReturn[],
  today: string,
) {
  const todaySales = sales.filter(
    (sale) => localDateKey(new Date(sale.createdAt)) === today,
  );
  const todayReturns = returns.filter(
    (itemReturn) => localDateKey(new Date(itemReturn.createdAt)) === today,
  );

  return {
    salesToday: todaySales.reduce(
      (sum, sale) => sum + sale.price * sale.quantity,
      0,
    ),
    saleCount: todaySales.length,
    returnedUnits: todayReturns.reduce(
      (sum, itemReturn) => sum + itemReturn.quantity,
      0,
    ),
    returnCount: todayReturns.length,
    units: items.reduce((sum, item) => sum + item.quantity, 0),
    inventoryValue: items.reduce(
      (sum, item) => sum + item.quantity * item.price,
      0,
    ),
    stockAttention: items.filter((item) => item.status !== "in_stock"),
  };
}

function calculateChartDays(sales: Sale[]) {
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    const key = localDateKey(date);
    const total = sales
      .filter((sale) => localDateKey(new Date(sale.createdAt)) === key)
      .reduce((sum, sale) => sum + sale.price * sale.quantity, 0);
    return {
      key,
      label: date.toLocaleDateString("en-PH", { weekday: "short" }),
      total,
    };
  });
}

function buildRecentActivity(
  sales: Sale[],
  returns: InventoryReturn[],
): ActivityItem[] {
  const saleActivity = sales.map((sale) => ({
    id: `sale-${sale.id}`,
    type: "sale" as const,
    itemName: sale.item.name,
    customerName: sale.customerName,
    quantity: sale.quantity,
    detail: currency.format(sale.price * sale.quantity),
    createdAt: sale.createdAt,
  }));
  const returnActivity = returns.map((itemReturn) => ({
    id: `return-${itemReturn.id}`,
    type: "return" as const,
    itemName: itemReturn.item.name,
    customerName: itemReturn.customerName,
    quantity: itemReturn.quantity,
    detail: itemReturn.reason,
    createdAt: itemReturn.createdAt,
  }));
  return [...saleActivity, ...returnActivity]
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .slice(0, 5);
}

function formatActivityDate(value: string) {
  return new Date(value).toLocaleString("en-PH", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function localDateKey(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}
