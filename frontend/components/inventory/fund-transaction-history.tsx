"use client";

import { useEffect, useState } from "react";
import { ArrowDownLeft, ArrowUpRight, RotateCcw } from "lucide-react";
import {
  getFundTransactions,
  type FundTransaction,
} from "@/lib/api";

const currency = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function FundTransactionHistory({
  refreshKey,
}: {
  refreshKey: number;
}) {
  const [transactions, setTransactions] = useState<FundTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadCount, setReloadCount] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function loadTransactions() {
      setIsLoading(true);
      setError("");
      try {
        const response = await getFundTransactions(controller.signal);
        if (!controller.signal.aborted) setTransactions(response);
      } catch (loadError) {
        if (controller.signal.aborted) return;
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load fund transactions.",
        );
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }

    void loadTransactions();
    return () => controller.abort();
  }, [refreshKey, reloadCount]);

  return (
    <article className="mt-5 overflow-hidden rounded-2xl border border-[#e0e5de] bg-white">
      <div className="border-b border-[#e7ebe5] bg-[#f8f9f6] px-5 py-4">
        <h2 className="font-black text-[#18251a]">Fund transaction history</h2>
        <p className="mt-1 text-sm text-[#768178]">
          Income and expenses are shown newest first.
        </p>
      </div>

      {isLoading ? (
        <div
          className="space-y-3 p-5"
          role="status"
          aria-label="Loading fund transactions"
        >
          {[0, 1, 2].map((item) => (
            <div
              className="h-14 animate-pulse rounded-xl bg-[#f0f3ee]"
              key={item}
            />
          ))}
        </div>
      ) : error ? (
        <div className="p-5 text-sm text-[#8f421f]" role="alert">
          <p className="font-semibold">{error}</p>
          <button
            type="button"
            onClick={() => setReloadCount((count) => count + 1)}
            className="mt-3 inline-flex h-9 items-center gap-2 rounded-lg bg-[#fff0e8] px-3 font-black"
          >
            <RotateCcw size={15} aria-hidden="true" /> Retry
          </button>
        </div>
      ) : transactions.length ? (
        <>
          <div className="hidden grid-cols-[.7fr_.8fr_1.5fr_.8fr_.7fr] gap-4 border-b border-[#e7ebe5] bg-[#fbfcfa] px-5 py-3 text-xs font-black uppercase tracking-widest text-[#818b83] md:grid">
            <span>Type</span>
            <span>Amount</span>
            <span>Description</span>
            <span>Date</span>
            <span>Time</span>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {transactions.map((transaction) => (
              <TransactionRow transaction={transaction} key={transaction.id} />
            ))}
          </div>
        </>
      ) : (
        <p className="p-8 text-center text-sm font-semibold text-[#7c867e]">
          No fund transactions have been recorded yet.
        </p>
      )}
    </article>
  );
}

function TransactionRow({ transaction }: { transaction: FundTransaction }) {
  const createdAt = new Date(transaction.createdAt);
  const isExpense = transaction.transactionType === "expense";
  const typeLabel =
    transaction.transactionType === "opening_balance"
      ? "Opening balance"
      : isExpense
        ? "Expense"
        : "Income";

  return (
    <div className="grid gap-3 border-b border-[#edf0eb] p-5 last:border-b-0 md:grid-cols-[.7fr_.8fr_1.5fr_.8fr_.7fr] md:items-center md:gap-4">
      <span
        className={`inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-extrabold ${
          isExpense
            ? "bg-[#fff0e8] text-[#9b431f]"
            : "bg-[#e9f4e8] text-[#28643c]"
        }`}
      >
        {isExpense ? (
          <ArrowDownLeft size={14} aria-hidden="true" />
        ) : (
          <ArrowUpRight size={14} aria-hidden="true" />
        )}
        {typeLabel}
      </span>
      <strong className={isExpense ? "text-[#9b431f]" : "text-[#28643c]"}>
        {isExpense ? "−" : "+"}
        {currency.format(transaction.amount)}
      </strong>
      <p className="text-sm font-semibold text-[#35453a]">
        {transaction.description}
      </p>
      <span className="text-sm text-[#6f7a72]">
        {createdAt.toLocaleDateString("en-PH", {
          month: "short",
          day: "numeric",
          year: "numeric",
          timeZone: "Asia/Manila",
        })}
      </span>
      <span className="text-sm text-[#6f7a72]">
        {createdAt.toLocaleTimeString("en-PH", {
          hour: "numeric",
          minute: "2-digit",
          timeZone: "Asia/Manila",
        })}
      </span>
    </div>
  );
}
