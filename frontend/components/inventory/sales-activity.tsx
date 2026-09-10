"use client";

import {
  ArrowUpRight,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { useRef, useState } from "react";
import type { TransactionRange } from "@/components/inventory/inventory-navigation";
import type { Sale } from "@/lib/api";

type SalesActivityProps = {
  sales: Sale[];
  error: string;
  isLoading: boolean;
  onEdit: (sale: Sale) => void;
  onAddSale: () => void;
  onRetry: () => void;
  transactionRange: TransactionRange;
  onTransactionRangeChange: (range: TransactionRange) => void;
};

export function SalesActivity({
  sales,
  error,
  isLoading,
  onEdit,
  onAddSale,
  onRetry,
  transactionRange,
  onTransactionRangeChange,
}: SalesActivityProps) {
  const todayKey = manilaDateKey(new Date());
  const [selectedDate, setSelectedDate] = useState(todayKey);
  const [searchQuery, setSearchQuery] = useState("");
  const dateInputRef = useRef<HTMLInputElement>(null);
  const days = buildLastSevenDays(sales, selectedDate);
  const selectedDay = days[0];
  const oldestDay = days[days.length - 1];
  const weeklyDateKeys = new Set(days.map((day) => day.key));
  const normalizedSearchQuery = searchQuery.trim().toLocaleLowerCase("en-PH");
  const selectedSales = sales
    .filter((sale) => {
      const saleDateKey = manilaDateKey(new Date(sale.createdAt));
      const isInSelectedRange =
        transactionRange === "daily"
          ? saleDateKey === selectedDate
          : weeklyDateKeys.has(saleDateKey);

      if (!isInSelectedRange) return false;
      if (!normalizedSearchQuery) return true;

      return [sale.item.name, sale.customerName].some((value) =>
        value.toLocaleLowerCase("en-PH").includes(normalizedSearchQuery),
      );
    })
    .sort(
      (firstSale, secondSale) =>
        new Date(secondSale.createdAt).getTime() -
        new Date(firstSale.createdAt).getTime(),
    );

  const openDatePicker = () => {
    const dateInput = dateInputRef.current;
    if (!dateInput) return;

    if (typeof dateInput.showPicker === "function") {
      dateInput.showPicker();
      return;
    }

    dateInput.click();
  };

  return (
    <section>
      <div
        className="mb-4 grid grid-cols-2 gap-2 sm:hidden"
        aria-label="Transaction date range"
      >
        <button
          type="button"
          aria-pressed={transactionRange === "daily"}
          onClick={() => onTransactionRangeChange("daily")}
          className={`inline-flex h-11 items-center justify-center rounded-xl border px-4 text-sm font-black transition ${
            transactionRange === "daily"
              ? "border-[#173b24] bg-[#173b24] text-white shadow-sm"
              : "border-[#d5ddd3] bg-white text-[#173b24]"
          }`}
        >
          Daily
        </button>
        <button
          type="button"
          aria-pressed={transactionRange === "weekly"}
          onClick={() => onTransactionRangeChange("weekly")}
          className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-black transition ${
            transactionRange === "weekly"
              ? "border-[#173b24] bg-[#173b24] text-white shadow-sm"
              : "border-[#d5ddd3] bg-white text-[#173b24]"
          }`}
        >
          Weekly
        </button>
      </div>

      <article className="rounded-2xl border border-[#dce3da] bg-white p-3 shadow-[0_10px_30px_rgba(23,59,36,0.035)] sm:p-4">
        <h2 className="px-1 text-base font-black sm:text-lg">
          Sales by Date (Last 7 Days)
        </h2>

        <div className="mt-3 flex items-center gap-2">
          <button
            type="button"
            aria-label="Show previous seven days"
            onClick={() => setSelectedDate(shiftDateKey(selectedDate, -7))}
            className="grid size-10 shrink-0 place-items-center rounded-xl border border-[#d5ddd3] bg-white text-[#173b24] transition hover:bg-[#edf4eb]"
          >
            <ChevronLeft size={20} aria-hidden="true" />
          </button>

          <div className="min-w-0 flex-1 overflow-x-auto pb-1">
            <div className="grid min-w-225 grid-cols-7 gap-2">
              {[...days].reverse().map((day) => (
                <button
                  type="button"
                  key={day.key}
                  aria-pressed={day.key === selectedDate}
                  onClick={() => {
                    setSelectedDate(day.key);
                    onTransactionRangeChange("daily");
                  }}
                  className={`rounded-xl border px-3 py-3 text-center ${
                    day.key === selectedDate
                      ? "border-[#4f9a66] bg-[#edf7ec] shadow-[inset_0_0_0_1px_rgba(79,154,102,0.08)]"
                      : "border-[#e1e6df] bg-[#fbfcfa] transition hover:border-[#8eb99a] hover:bg-[#f4f9f3]"
                  }`}
                >
                  <p className="text-sm font-black text-[#17261b]">
                    {day.shortDate}
                  </p>
                  <p className="mt-1 text-xs font-medium text-[#77837a]">
                    {day.weekday}
                  </p>
                  <p className="mt-1 text-xs font-bold text-[#344238]">
                    {day.saleCount} {day.saleCount === 1 ? "sale" : "sales"}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            aria-label="Show next seven days"
            onClick={() => setSelectedDate(shiftDateKey(selectedDate, 7))}
            className="grid size-10 shrink-0 place-items-center rounded-xl border border-[#d5ddd3] bg-white text-[#173b24] transition hover:bg-[#edf4eb]"
          >
            <ChevronRight size={20} aria-hidden="true" />
          </button>
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-[minmax(0,1fr)_12rem_auto]">
          <label className="flex h-12 items-center gap-3 rounded-xl border border-[#e0e6de] bg-[#f7f9f6] px-4 text-[#68746b]">
            <Search className="shrink-0 text-[#173b24]" size={20} />
            <input
              aria-label="Search sales"
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#7f8982]"
              placeholder="Search sales (product, customer, etc.)"
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </label>

          <div className="flex h-12 items-center gap-2 rounded-xl border border-[#d5ddd3] bg-white px-4 text-sm font-black text-[#173b24]">
            <CalendarDays size={18} aria-hidden="true" />
            <button
              type="button"
              onClick={openDatePicker}
              className="min-w-0 flex-1 truncate text-left text-sm font-black"
            >
              {selectedDay.longDate}
            </button>
            <input
              ref={dateInputRef}
              aria-label="Select transaction date"
              className="absolute h-px w-px opacity-0"
              type="date"
              value={selectedDate}
              onChange={(event) => {
                if (event.target.value) setSelectedDate(event.target.value);
              }}
            />
            <button
              type="button"
              aria-label="Reset transaction date to today"
              onClick={() => setSelectedDate(todayKey)}
              className="grid size-7 shrink-0 place-items-center rounded-md hover:bg-[#edf2eb]"
            >
              <X size={17} aria-hidden="true" />
            </button>
          </div>

          <button
            type="button"
            onClick={onAddSale}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#173b24] px-5 text-sm font-black text-white transition hover:bg-[#245334]"
          >
            <Plus size={18} aria-hidden="true" />
            Add sale
          </button>
        </div>
      </article>

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

      <article className="mt-5 overflow-hidden rounded-2xl border border-[#dce3da] bg-white shadow-[0_10px_30px_rgba(23,59,36,0.025)]">
        <div className="flex items-center justify-between gap-4 border-b border-[#e3e8e1] px-5 py-4 sm:px-6">
          <div>
            <h2 className="text-lg font-black">Sales</h2>
            <p className="mt-0.5 text-sm text-[#7a857d]">
              {buildSalesSummary(
                selectedSales.length,
                transactionRange,
                selectedDay,
                oldestDay,
              )}
            </p>
          </div>
          <div className="inline-flex h-10 shrink-0 items-center gap-2 rounded-lg border border-[#d5ddd3] bg-white px-3 text-xs font-black text-[#27382c]">
            <SlidersHorizontal size={15} aria-hidden="true" />
            <span className="hidden min-[420px]:inline">Latest first</span>
            <ChevronDown size={15} aria-hidden="true" />
          </div>
        </div>

        {selectedSales.length ? (
          selectedSales.map((sale) => (
            <SaleActivityRow key={sale.id} sale={sale} onEdit={onEdit} />
          ))
        ) : (
          <p className="p-10 text-center text-sm font-semibold text-[#7c867e]">
            {normalizedSearchQuery
              ? "No sales match your search."
              : transactionRange === "daily"
                ? "No sales were recorded on this date."
                : "No sales were recorded in this seven-day period."}
          </p>
        )}
      </article>
    </section>
  );
}

function SaleActivityRow({
  sale,
  onEdit,
}: {
  sale: Sale;
  onEdit: (sale: Sale) => void;
}) {
  const unitLabel = sale.quantity === 1 ? "Tray" : "Trays";
  const total = sale.price * sale.quantity;

  return (
    <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-3 border-b border-[#e8ede6] px-4 py-4 last:border-b-0 sm:flex sm:items-center sm:px-5">
      <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#e7f2e6] text-[#2f7043]">
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
      <div className="col-start-2 min-w-0 text-left sm:text-right">
        <p className="text-sm font-black text-[#24362a]">
          −{sale.quantity} <span className="hidden sm:inline">{unitLabel}</span>
        </p>
        <p className="mt-1 text-xs font-bold text-[#68736b]">
          {currency.format(sale.price)} each · {currency.format(total)}
        </p>
        <p className="mt-1 text-[11px] font-semibold text-[#929a94]">
          {formatActivityDate(sale.createdAt)}
        </p>
      </div>
      <button
        type="button"
        aria-label={`Edit sale for ${sale.item.name}, ${sale.customerName}`}
        onClick={() => onEdit(sale)}
        className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-[#cfd8cd] bg-white px-3 text-xs font-black text-[#173b24] hover:bg-[#f8faf7]"
      >
        <Pencil size={14} aria-hidden="true" />
        <span className="hidden sm:inline">Edit</span>
      </button>
    </div>
  );
}

const currency = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

function formatActivityDate(value: string) {
  const date = new Date(value);
  const today = manilaDateKey(new Date());
  const day = manilaDateKey(date);
  const prefix =
    day === today
      ? "Today"
      : date.toLocaleDateString("en-PH", {
          month: "short",
          day: "numeric",
          timeZone: "Asia/Manila",
        });

  return `${prefix}, ${date.toLocaleTimeString("en-PH", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Manila",
  })}`;
}

type SalesDay = {
  key: string;
  shortDate: string;
  weekday: string;
  longDate: string;
  fullDate: string;
  saleCount: number;
};

function buildLastSevenDays(sales: Sale[], selectedDate: string): SalesDay[] {
  const selectedDateParts = selectedDate.split("-").map(Number);

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(
      Date.UTC(
        selectedDateParts[0],
        selectedDateParts[1] - 1,
        selectedDateParts[2] - index,
      ),
    );
    const key = date.toISOString().slice(0, 10);
    const saleCount = sales.filter(
      (sale) => manilaDateKey(new Date(sale.createdAt)) === key,
    ).length;

    return {
      key,
      shortDate: date.toLocaleDateString("en-PH", {
        month: "short",
        day: "numeric",
        timeZone: "UTC",
      }),
      weekday: date.toLocaleDateString("en-PH", {
        weekday: "short",
        timeZone: "UTC",
      }),
      longDate: date.toLocaleDateString("en-PH", {
        month: "short",
        day: "numeric",
        year: "numeric",
        timeZone: "UTC",
      }),
      fullDate: date.toLocaleDateString("en-PH", {
        month: "long",
        day: "numeric",
        year: "numeric",
        timeZone: "UTC",
      }),
      saleCount,
    };
  });
}

function buildSalesSummary(
  saleCount: number,
  transactionRange: TransactionRange,
  selectedDay: SalesDay,
  oldestDay: SalesDay,
) {
  const saleLabel = saleCount === 1 ? "sale" : "sales";

  if (transactionRange === "daily") {
    return `${saleCount} ${saleLabel} on ${selectedDay.fullDate}`;
  }

  return `${saleCount} ${saleLabel} from ${oldestDay.longDate} to ${selectedDay.longDate}`;
}

function shiftDateKey(dateKey: string, numberOfDays: number) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const shiftedDate = new Date(Date.UTC(year, month - 1, day + numberOfDays));
  return shiftedDate.toISOString().slice(0, 10);
}

function manilaDateKey(date: Date) {
  const parts = getManilaDateParts(date);
  return [
    parts.year,
    String(parts.month).padStart(2, "0"),
    String(parts.day).padStart(2, "0"),
  ].join("-");
}

function getManilaDateParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    timeZone: "Asia/Manila",
  }).formatToParts(date);

  return {
    year: Number(parts.find((part) => part.type === "year")?.value),
    month: Number(parts.find((part) => part.type === "month")?.value),
    day: Number(parts.find((part) => part.type === "day")?.value),
  };
}
