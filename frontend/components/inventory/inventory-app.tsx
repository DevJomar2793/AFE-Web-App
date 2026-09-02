"use client";

import Link from "next/link";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Boxes,
  CircleDollarSign,
  ClipboardList,
  House,
  LayoutDashboard,
  Menu,
  PackagePlus,
  Plus,
  ReceiptText,
  RotateCcw,
  Search,
  ShoppingBag,
  TrendingUp,
  TriangleAlert,
  X,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { BrandMark } from "@/components/storefront/brand-mark";
import {
  INVENTORY_STORAGE_KEY,
  initialInventoryState,
  isInventoryState,
  type InventoryItem,
  type InventoryState,
  type TransactionType,
} from "@/lib/inventory";

type View = "overview" | "inventory" | "activity";
type Action = "sale" | "return" | "restock";

const currency = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  maximumFractionDigits: 0,
});

const compactNumber = new Intl.NumberFormat("en-PH", {
  notation: "compact",
  maximumFractionDigits: 1,
});

const actionCopy: Record<
  Action,
  { title: string; description: string; submit: string }
> = {
  sale: {
    title: "Record new sale",
    description: "Stock is deducted as soon as the transaction is saved.",
    submit: "Save sale",
  },
  return: {
    title: "Record a return",
    description: "Returned units are added back to available inventory.",
    submit: "Save return",
  },
  restock: {
    title: "Add stock",
    description: "Record incoming inventory and update quantities instantly.",
    submit: "Add inventory",
  },
};

function localDateKey(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function transactionDateKey(value: string) {
  return localDateKey(new Date(value));
}

function formatActivityDate(value: string) {
  const date = new Date(value);
  const today = localDateKey(new Date());
  const day = transactionDateKey(value);
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

function getItem(state: InventoryState, itemId: string) {
  return state.items.find((item) => item.id === itemId);
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

function StockBadge({ item }: { item: InventoryItem }) {
  const isLow = item.quantity <= item.reorderLevel;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-extrabold ${
        isLow ? "bg-[#fff0e5] text-[#a44f1f]" : "bg-[#e9f4e8] text-[#28643c]"
      }`}
    >
      <span
        className={`size-1.5 rounded-full ${isLow ? "bg-[#d46c2c]" : "bg-[#3d8a53]"}`}
      />
      {isLow ? "Low stock" : "In stock"}
    </span>
  );
}

function ActionSheet({
  action,
  initialItemId,
  items,
  onClose,
  onSave,
}: {
  action: Action;
  initialItemId?: string;
  items: InventoryItem[];
  onClose: () => void;
  onSave: (values: {
    itemId: string;
    quantity: number;
    customer: string;
    note: string;
  }) => string | null;
}) {
  const [itemId, setItemId] = useState(initialItemId ?? items[0]?.id ?? "");
  const [quantity, setQuantity] = useState(1);
  const [customer, setCustomer] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const item = items.find((candidate) => candidate.id === itemId);
  const estimatedAmount = item
    ? (action === "restock" ? item.cost : item.price) * quantity
    : 0;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const saveError = onSave({ itemId, quantity, customer, note });
    if (saveError) {
      setError(saveError);
      return;
    }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-70 flex items-end justify-center bg-[#0d2417]/55 p-0 backdrop-blur-sm sm:items-center sm:p-6"
      role="presentation"
      onMouseDown={onClose}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="transaction-title"
        className="max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl sm:p-7"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#a85620]">
              Quick transaction
            </p>
            <h2
              id="transaction-title"
              className="mt-2 text-2xl font-black text-[#17281b]"
            >
              {actionCopy[action].title}
            </h2>
            <p className="mt-1 text-sm leading-6 text-[#6d776f]">
              {actionCopy[action].description}
            </p>
          </div>
          <button
            type="button"
            aria-label="Close transaction form"
            onClick={onClose}
            className="grid size-10 shrink-0 place-items-center rounded-xl border border-[#dfe4dd] text-[#566159] hover:bg-[#f3f5f1]"
          >
            <X size={19} aria-hidden="true" />
          </button>
        </div>

        <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
          <label className="block text-sm font-extrabold text-[#283b2c]">
            Item
            <select
              className="inventory-field mt-2"
              value={itemId}
              onChange={(event) => {
                setItemId(event.target.value);
                setError("");
              }}
            >
              {items.map((candidate) => (
                <option value={candidate.id} key={candidate.id}>
                  {candidate.name} · {candidate.quantity} available
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm font-extrabold text-[#283b2c]">
            Quantity ({item?.unit ?? "unit"}s)
            <input
              className="inventory-field mt-2"
              type="number"
              inputMode="numeric"
              min="1"
              step="1"
              required
              value={quantity}
              onChange={(event) => {
                setQuantity(Math.max(1, Number(event.target.value)));
                setError("");
              }}
            />
          </label>

          {action !== "restock" && (
            <label className="block text-sm font-extrabold text-[#283b2c]">
              Customer{" "}
              <span className="font-medium text-[#89928b]">(optional)</span>
              <input
                className="inventory-field mt-2"
                type="text"
                value={customer}
                onChange={(event) => setCustomer(event.target.value)}
                placeholder="Customer or business name"
              />
            </label>
          )}

          {action !== "sale" && (
            <label className="block text-sm font-extrabold text-[#283b2c]">
              Note{" "}
              <span className="font-medium text-[#89928b]">(optional)</span>
              <input
                className="inventory-field mt-2"
                type="text"
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder={
                  action === "return"
                    ? "Reason for return"
                    : "Supplier or delivery note"
                }
              />
            </label>
          )}

          <div className="flex items-center justify-between rounded-2xl bg-[#f3f6f1] px-4 py-3">
            <span className="text-sm font-semibold text-[#68736b]">
              {action === "restock"
                ? "Estimated cost"
                : action === "return"
                  ? "Refund value"
                  : "Sale total"}
            </span>
            <strong className="text-lg text-[#173b24]">
              {currency.format(estimatedAmount)}
            </strong>
          </div>

          {error && (
            <p
              role="alert"
              className="rounded-xl bg-[#fff0e8] px-4 py-3 text-sm font-bold text-[#9b431f]"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            className="flex h-13 w-full items-center justify-center gap-2 rounded-xl bg-[#173b24] px-5 text-sm font-black text-white transition hover:bg-[#245334]"
          >
            <Plus size={18} aria-hidden="true" />
            {actionCopy[action].submit}
          </button>
        </form>
      </section>
    </div>
  );
}

export function InventoryApp() {
  const [state, setState] = useState<InventoryState>(initialInventoryState);
  const [view, setView] = useState<View>("overview");
  const [action, setAction] = useState<Action | null>(null);
  const [actionItemId, setActionItemId] = useState<string>();
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const loadSavedState = () => {
      try {
        const saved = window.localStorage.getItem(INVENTORY_STORAGE_KEY);
        if (saved) {
          const parsed: unknown = JSON.parse(saved);
          if (isInventoryState(parsed)) setState(parsed);
        }
      } catch {
        setNotice("Saved data could not be loaded. Showing starter inventory.");
      } finally {
        setHydrated(true);
      }
    };

    const animationFrame = window.requestAnimationFrame(loadSavedState);

    const syncAcrossTabs = (event: StorageEvent) => {
      if (event.key !== INVENTORY_STORAGE_KEY || !event.newValue) return;
      try {
        const parsed: unknown = JSON.parse(event.newValue);
        if (isInventoryState(parsed)) setState(parsed);
      } catch {
        // Ignore malformed values written outside the application.
      }
    };

    window.addEventListener("storage", syncAcrossTabs);
    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("storage", syncAcrossTabs);
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(state));
  }, [hydrated, state]);

  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(""), 4000);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  const today = localDateKey(new Date());
  const metrics = useMemo(() => {
    const todayTransactions = state.transactions.filter(
      (transaction) => transactionDateKey(transaction.createdAt) === today,
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
  }, [state, today]);

  const chartDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - index));
      const key = localDateKey(date);
      const total = state.transactions
        .filter(
          (transaction) => transactionDateKey(transaction.createdAt) === key,
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
  }, [state]);
  const chartMax = Math.max(...chartDays.map((day) => day.total), 1);

  const filteredItems = state.items.filter((item) => {
    const search = query.trim().toLowerCase();
    return (
      !search ||
      `${item.name} ${item.sku} ${item.category}`.toLowerCase().includes(search)
    );
  });

  const saveTransaction = ({
    itemId,
    quantity,
    customer,
    note,
  }: {
    itemId: string;
    quantity: number;
    customer: string;
    note: string;
  }) => {
    if (!action) return "Choose a transaction type.";
    const item = getItem(state, itemId);
    if (!item) return "Choose a valid inventory item.";
    if (!Number.isInteger(quantity) || quantity < 1)
      return "Enter a whole quantity of at least one.";
    if (action === "sale" && quantity > item.quantity) {
      return `Only ${item.quantity} ${item.unit}${item.quantity === 1 ? "" : "s"} available.`;
    }

    const type: TransactionType = action;
    const amount = (type === "restock" ? item.cost : item.price) * quantity;
    const direction = type === "sale" ? -1 : 1;
    const transaction = {
      id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${itemId}`,
      type,
      itemId,
      quantity,
      amount,
      customer: customer.trim() || undefined,
      note: note.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    setState((current) => ({
      items: current.items.map((candidate) =>
        candidate.id === itemId
          ? {
              ...candidate,
              quantity: candidate.quantity + direction * quantity,
            }
          : candidate,
      ),
      transactions: [transaction, ...current.transactions],
    }));
    setNotice(
      type === "sale"
        ? "Sale saved and inventory updated."
        : type === "return"
          ? "Return saved and stock restored."
          : "New stock added to inventory.",
    );
    return null;
  };

  const selectView = (nextView: View) => {
    setView(nextView);
    setMenuOpen(false);
  };

  const openAction = (nextAction: Action, itemId?: string) => {
    setActionItemId(itemId);
    setAction(nextAction);
  };

  const closeAction = () => {
    setAction(null);
    setActionItemId(undefined);
  };

  const activityIcon = (type: TransactionType) => {
    if (type === "sale") return <ArrowUpRight size={17} aria-hidden="true" />;
    if (type === "return")
      return <ArrowDownLeft size={17} aria-hidden="true" />;
    return <PackagePlus size={17} aria-hidden="true" />;
  };

  return (
    <div className="min-h-dvh bg-[#f4f6f1] text-[#18251a]">
      <aside className="fixed inset-y-0 left-0 z-50 hidden w-64 border-r border-[#dfe5dd] bg-white p-5 lg:flex lg:flex-col">
        <Link
          href="/"
          className="flex items-center gap-3"
          aria-label="Adamos Fresh Eggs storefront"
        >
          <span className="grid size-11 place-items-center overflow-hidden rounded-xl border border-[#dce2da]">
            <BrandMark />
          </span>
          <span>
            <strong className="block text-sm font-black">
              Adamos Fresh Eggs
            </strong>
            <span className="text-xs font-semibold text-[#818b83]">
              Inventory workspace
            </span>
          </span>
        </Link>

        <nav className="mt-10 space-y-1" aria-label="Inventory navigation">
          <NavButton
            active={view === "overview"}
            icon={<LayoutDashboard size={19} />}
            label="Overview"
            onClick={() => selectView("overview")}
          />
          <NavButton
            active={view === "inventory"}
            icon={<Boxes size={19} />}
            label="Inventory"
            onClick={() => selectView("inventory")}
          />
          <NavButton
            active={view === "activity"}
            icon={<ReceiptText size={19} />}
            label="Activity"
            onClick={() => selectView("activity")}
          />
        </nav>

        <div className="mt-auto rounded-2xl bg-[#173b24] p-4 text-white">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.12em] text-[#b9d1bc]">
            <span className="size-2 animate-pulse rounded-full bg-[#82d397]" />
            Live workspace
          </div>
          <p className="mt-2 text-xs leading-5 text-[#d8e6d8]">
            Changes save on this device and sync across open tabs.
          </p>
        </div>
      </aside>

      {menuOpen && (
        <div
          className="fixed inset-0 z-50 bg-[#102819]/45 lg:hidden"
          onMouseDown={() => setMenuOpen(false)}
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
                onClick={() => setMenuOpen(false)}
              >
                <X size={19} />
              </button>
            </div>
            <nav
              className="mt-8 space-y-1"
              aria-label="Mobile inventory navigation"
            >
              <NavButton
                active={view === "overview"}
                icon={<LayoutDashboard size={19} />}
                label="Overview"
                onClick={() => selectView("overview")}
              />
              <NavButton
                active={view === "inventory"}
                icon={<Boxes size={19} />}
                label="Inventory"
                onClick={() => selectView("inventory")}
              />
              <NavButton
                active={view === "activity"}
                icon={<ReceiptText size={19} />}
                label="Activity"
                onClick={() => selectView("activity")}
              />
            </nav>
            <Link
              href="/"
              className="mt-8 flex items-center gap-3 border-t border-[#e6e9e4] px-3 pt-6 text-sm font-bold text-[#657068]"
            >
              <House size={18} /> Storefront
            </Link>
          </aside>
        </div>
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-40 border-b border-[#dfe5dd] bg-[#f4f6f1]/90 backdrop-blur-xl">
          <div className="mx-auto flex h-18 max-w-375 items-center gap-3 px-4 sm:px-7 lg:px-10">
            <button
              type="button"
              aria-label="Open navigation"
              className="grid size-10 place-items-center rounded-xl border border-[#d8dfd6] bg-white lg:hidden"
              onClick={() => setMenuOpen(true)}
            >
              <Menu size={20} />
            </button>
            <div>
              <p className="text-xs font-bold text-[#7d887f]">
                {new Date().toLocaleDateString("en-PH", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}
              </p>
              <h1 className="text-lg font-black sm:text-xl">
                {view === "overview"
                  ? "Operations overview"
                  : view === "inventory"
                    ? "Inventory"
                    : "Transaction activity"}
              </h1>
            </div>
            <button
              type="button"
              onClick={() => openAction("sale")}
              className="ml-auto flex h-11 items-center gap-2 rounded-xl bg-[#173b24] px-3.5 text-sm font-black text-white shadow-sm hover:bg-[#245334] sm:px-5"
            >
              <Plus size={18} />
              <span className="hidden xs:inline sm:inline">New sale</span>
            </button>
          </div>
        </header>

        <main className="mx-auto max-w-375 px-4 pb-28 pt-6 sm:px-7 lg:px-10 lg:pb-12 lg:pt-8">
          {view === "overview" && (
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
                    {chartDays.map((day) => (
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
                              height: `${Math.max(day.total ? 12 : 0, (day.total / chartMax) * 100)}%`,
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
                            onClick={() => openAction("restock", item.id)}
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
                <ActivityList
                  state={state}
                  limit={5}
                  onViewAll={() => selectView("activity")}
                  activityIcon={activityIcon}
                />
                <article className="rounded-2xl bg-[#173b24] p-5 text-white sm:p-6">
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-[#acd0b4]">
                    Quick actions
                  </p>
                  <h2 className="mt-2 text-xl font-black">
                    Keep records current
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-[#d0dfd2]">
                    Every transaction updates quantities and dashboard totals
                    immediately.
                  </p>
                  <div className="mt-5 grid gap-2">
                    <button
                      type="button"
                      onClick={() => openAction("sale")}
                      className="flex items-center gap-3 rounded-xl bg-white px-4 py-3 text-left text-sm font-black text-[#173b24]"
                    >
                      <CircleDollarSign size={18} /> Record a sale
                    </button>
                    <button
                      type="button"
                      onClick={() => openAction("return")}
                      className="flex items-center gap-3 rounded-xl border border-white/20 px-4 py-3 text-left text-sm font-black text-white hover:bg-white/10"
                    >
                      <RotateCcw size={18} /> Record a return
                    </button>
                    <button
                      type="button"
                      onClick={() => openAction("restock")}
                      className="flex items-center gap-3 rounded-xl border border-white/20 px-4 py-3 text-left text-sm font-black text-white hover:bg-white/10"
                    >
                      <PackagePlus size={18} /> Add stock
                    </button>
                  </div>
                </article>
              </section>
            </>
          )}

          {view === "inventory" && (
            <section>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-2xl font-black">All inventory</h2>
                  <p className="mt-1 text-sm text-[#768178]">
                    Monitor available quantities and reorder points.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => openAction("restock")}
                  className="flex h-11 items-center justify-center gap-2 rounded-xl border border-[#cfd8cd] bg-white px-4 text-sm font-black text-[#173b24]"
                >
                  <PackagePlus size={18} /> Add stock
                </button>
              </div>
              <div className="relative mt-6 max-w-md">
                <Search
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-[#839087]"
                  size={18}
                />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  className="inventory-field pl-11"
                  placeholder="Search item, SKU, or category"
                  aria-label="Search inventory"
                />
              </div>
              <div className="mt-5 overflow-hidden rounded-2xl border border-[#e0e5de] bg-white">
                <div className="hidden grid-cols-[1.7fr_.7fr_.7fr_.8fr] gap-4 border-b border-[#e7ebe5] bg-[#f8f9f6] px-5 py-3 text-xs font-black uppercase tracking-widest text-[#818b83] md:grid">
                  <span>Item</span>
                  <span>Available</span>
                  <span>Price</span>
                  <span>Status</span>
                </div>
                {filteredItems.map((item) => (
                  <div
                    className="grid gap-3 border-b border-[#edf0eb] p-5 last:border-b-0 md:grid-cols-[1.7fr_.7fr_.7fr_.8fr] md:items-center md:gap-4"
                    key={item.id}
                  >
                    <div>
                      <p className="font-extrabold">{item.name}</p>
                      <p className="mt-1 text-xs font-semibold text-[#89928b]">
                        {item.sku} · {item.category}
                      </p>
                    </div>
                    <div className="flex items-baseline justify-between md:block">
                      <span className="text-xs font-bold uppercase text-[#929a94] md:hidden">
                        Available
                      </span>
                      <span className="text-lg font-black">
                        {item.quantity}{" "}
                        <small className="text-xs font-semibold text-[#838d85]">
                          {item.unit}s
                        </small>
                      </span>
                    </div>
                    <div className="flex items-center justify-between md:block">
                      <span className="text-xs font-bold uppercase text-[#929a94] md:hidden">
                        Price
                      </span>
                      <span className="text-sm font-extrabold">
                        {currency.format(item.price)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <StockBadge item={item} />
                      <button
                        type="button"
                        onClick={() => openAction("restock", item.id)}
                        className="text-xs font-black text-[#a85620] hover:underline"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                ))}
                {!filteredItems.length && (
                  <p className="p-10 text-center text-sm font-semibold text-[#7c867e]">
                    No inventory items match “{query}”.
                  </p>
                )}
              </div>
            </section>
          )}

          {view === "activity" && (
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
                    onClick={() => openAction("return")}
                    className="flex h-11 items-center gap-2 rounded-xl border border-[#cfd8cd] bg-white px-4 text-sm font-black"
                  >
                    <RotateCcw size={17} /> Return
                  </button>
                  <button
                    type="button"
                    onClick={() => openAction("sale")}
                    className="flex h-11 items-center gap-2 rounded-xl bg-[#173b24] px-4 text-sm font-black text-white"
                  >
                    <Plus size={17} /> Sale
                  </button>
                </div>
              </div>
              <div className="mt-6">
                <ActivityList state={state} activityIcon={activityIcon} />
              </div>
            </section>
          )}
        </main>
      </div>

      <nav
        className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-3 border-t border-[#dce3da] bg-white/95 px-3 pb-[max(.65rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl lg:hidden"
        aria-label="Bottom navigation"
      >
        <button
          type="button"
          onClick={() => selectView("overview")}
          className={`flex flex-col items-center gap-1 py-1 text-[11px] font-black ${view === "overview" ? "text-[#173b24]" : "text-[#8a938c]"}`}
        >
          <LayoutDashboard size={20} />
          Overview
        </button>
        <button
          type="button"
          onClick={() => selectView("inventory")}
          className={`flex flex-col items-center gap-1 py-1 text-[11px] font-black ${view === "inventory" ? "text-[#173b24]" : "text-[#8a938c]"}`}
        >
          <Boxes size={20} />
          Inventory
        </button>
        <button
          type="button"
          onClick={() => selectView("activity")}
          className={`flex flex-col items-center gap-1 py-1 text-[11px] font-black ${view === "activity" ? "text-[#173b24]" : "text-[#8a938c]"}`}
        >
          <ClipboardList size={20} />
          Activity
        </button>
      </nav>

      {notice && (
        <div
          role="status"
          className="fixed left-1/2 top-20 z-80 w-[min(90vw,28rem)] -translate-x-1/2 rounded-xl bg-[#173b24] px-4 py-3 text-center text-sm font-bold text-white shadow-xl"
        >
          {notice}
        </div>
      )}
      {action && (
        <ActionSheet
          action={action}
          initialItemId={actionItemId}
          items={state.items}
          onClose={closeAction}
          onSave={saveTransaction}
        />
      )}
    </div>
  );
}

function ActivityList({
  state,
  limit,
  onViewAll,
  activityIcon,
}: {
  state: InventoryState;
  limit?: number;
  onViewAll?: () => void;
  activityIcon: (type: TransactionType) => React.ReactNode;
}) {
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
        {transactions.map((transaction) => {
          const item = getItem(state, transaction.itemId);
          const positive = transaction.type !== "sale";
          return (
            <div
              className="flex items-center gap-3 border-b border-[#edf0eb] px-4 py-4 last:border-b-0 sm:px-6"
              key={transaction.id}
            >
              <span
                className={`grid size-10 shrink-0 place-items-center rounded-xl ${transaction.type === "sale" ? "bg-[#e7f2e6] text-[#2f7043]" : transaction.type === "return" ? "bg-[#fff0e5] text-[#ad5927]" : "bg-[#e9eef8] text-[#4d6796]"}`}
              >
                {activityIcon(transaction.type)}
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
        })}
      </div>
    </article>
  );
}
