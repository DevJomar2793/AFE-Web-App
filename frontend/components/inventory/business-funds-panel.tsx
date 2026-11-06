"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  CircleDollarSign,
  LoaderCircle,
  Plus,
  RotateCcw,
  X,
} from "lucide-react";
import {
  createFundTransaction,
  getBusinessFunds,
  initializeBusinessFunds,
  type BusinessFunds,
} from "@/lib/api";

const currency = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function BusinessFundsPanel({ refreshKey }: { refreshKey: number }) {
  const [funds, setFunds] = useState<BusinessFunds | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [reloadCount, setReloadCount] = useState(0);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadFunds() {
      setIsLoading(true);
      setError("");
      try {
        const fundsResponse = await getBusinessFunds(controller.signal);
        if (controller.signal.aborted) return;
        setFunds(fundsResponse);
      } catch (loadError) {
        if (controller.signal.aborted) return;
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load business funds.",
        );
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }

    void loadFunds();
    return () => controller.abort();
  }, [refreshKey, reloadCount]);

  function handleSaved(message: string) {
    setIsModalOpen(false);
    setSuccessMessage(message);
    setReloadCount((count) => count + 1);
    window.setTimeout(() => setSuccessMessage(""), 4000);
  }

  return (
    <section className="mt-6" aria-labelledby="business-funds-title">
      <div
        className={`rounded-2xl border p-5 shadow-[0_12px_30px_rgba(23,59,36,0.04)] sm:p-6 ${
          funds && funds.currentTotal < 0
            ? "border-[#e8c5bc] bg-[#fff9f7]"
            : "border-[#dce5da] bg-white"
        }`}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#e4f1e4] text-[#2d7042]">
              <CircleDollarSign size={22} aria-hidden="true" />
            </span>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-[#718078]">
                Business funds
              </p>
              <h3
                id="business-funds-title"
                className={`mt-1 text-3xl font-black tracking-tight ${
                  funds && funds.currentTotal < 0
                    ? "text-[#9b431f]"
                    : "text-[#173b24]"
                }`}
              >
                {isLoading && !funds
                  ? "Loading…"
                  : currency.format(funds?.currentTotal ?? 0)}
              </h3>
              <p className="mt-1 text-sm text-[#758078]">
                {funds?.currentTotal !== undefined && funds.currentTotal < 0
                  ? "Expenses are currently higher than the available funds."
                  : "Updated automatically from income and expenses."}
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={isLoading || Boolean(error)}
            onClick={() => setIsModalOpen(true)}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#173b24] px-4 text-sm font-black text-white hover:bg-[#245334] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus size={17} aria-hidden="true" />
            {funds?.isInitialized ? "Add transaction" : "Set current funds"}
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-xl bg-[#fff0e8] p-4 text-sm text-[#8f421f]" role="alert">
            <p className="font-semibold">{error}</p>
            <button
              type="button"
              onClick={() => setReloadCount((count) => count + 1)}
              className="mt-3 inline-flex h-9 items-center gap-2 rounded-lg bg-white px-3 font-black shadow-sm"
            >
              <RotateCcw size={15} aria-hidden="true" /> Retry
            </button>
          </div>
        )}

        {successMessage && (
          <p className="mt-4 rounded-xl bg-[#e9f4e8] px-4 py-3 text-sm font-bold text-[#28643c]" role="status">
            {successMessage}
          </p>
        )}
      </div>

      {isModalOpen && funds && (
        <BusinessFundsModal
          isInitialized={funds.isInitialized}
          onClose={() => setIsModalOpen(false)}
          onSaved={handleSaved}
        />
      )}
    </section>
  );
}

function BusinessFundsModal({
  isInitialized,
  onClose,
  onSaved,
}: {
  isInitialized: boolean;
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const [transactionType, setTransactionType] = useState<"income" | "expense">("income");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedAmount = Number(amount);
    if (!/^\d+(?:\.\d{1,2})?$/.test(amount) || !Number.isFinite(normalizedAmount)) {
      setError("Enter a valid amount with no more than two decimal places.");
      return;
    }
    if (isInitialized && normalizedAmount <= 0) {
      setError("Enter an amount greater than zero.");
      return;
    }
    if (!isInitialized && normalizedAmount < 0) {
      setError("The current funds cannot be negative during setup.");
      return;
    }
    if (isInitialized && !description.trim()) {
      setError("Enter a description for this transaction.");
      return;
    }

    setIsSubmitting(true);
    setError("");
    try {
      if (isInitialized) {
        await createFundTransaction({
          transactionType,
          amount: normalizedAmount,
          description: description.trim(),
        });
        onSaved("Fund transaction saved successfully.");
      } else {
        await initializeBusinessFunds(normalizedAmount);
        onSaved("Current business funds saved successfully.");
      }
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "The business funds could not be saved.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-70 flex items-end justify-center bg-[#0d2417]/55 p-0 backdrop-blur-sm sm:items-center sm:p-6"
      role="presentation"
      onMouseDown={() => {
        if (!isSubmitting) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="business-funds-modal-title"
        className="max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl sm:rounded-3xl sm:p-7"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#a85620]">
              Business funds
            </p>
            <h2 id="business-funds-modal-title" className="mt-2 text-2xl font-black text-[#17281b]">
              {isInitialized ? "Add fund transaction" : "Set current funds"}
            </h2>
            <p className="mt-1 text-sm leading-6 text-[#6d776f]">
              {isInitialized
                ? "Record money earned or spent by the business."
                : "Enter the business money currently available. This can only be set once."}
            </p>
          </div>
          <button
            type="button"
            aria-label="Close business funds form"
            disabled={isSubmitting}
            onClick={onClose}
            className="grid size-10 shrink-0 place-items-center rounded-xl border border-[#dfe4dd] text-[#566159] hover:bg-[#f3f5f1] disabled:opacity-50"
          >
            <X size={19} aria-hidden="true" />
          </button>
        </div>

        <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
          {isInitialized && (
            <div>
              <p className="text-sm font-extrabold text-[#283b2c]">Transaction type</p>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {(["income", "expense"] as const).map((type) => (
                  <button
                    type="button"
                    aria-pressed={transactionType === type}
                    disabled={isSubmitting}
                    onClick={() => setTransactionType(type)}
                    className={`h-11 rounded-xl border text-sm font-black capitalize ${
                      transactionType === type
                        ? "border-[#173b24] bg-[#173b24] text-white"
                        : "border-[#d5ddd3] bg-white text-[#173b24]"
                    }`}
                    key={type}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
          )}

          <label className="block text-sm font-extrabold text-[#283b2c]">
            {isInitialized ? "Amount" : "Current total business money"}
            <input
              className="inventory-field mt-2"
              type="number"
              inputMode="decimal"
              min={isInitialized ? "0.01" : "0"}
              max="999999999999.99"
              step="0.01"
              required
              autoFocus
              disabled={isSubmitting}
              value={amount}
              onChange={(event) => {
                setAmount(event.target.value);
                setError("");
              }}
              placeholder="0.00"
            />
          </label>

          {isInitialized && (
            <label className="block text-sm font-extrabold text-[#283b2c]">
              Description
              <textarea
                className="inventory-field mt-2 min-h-24 resize-y"
                maxLength={255}
                required
                disabled={isSubmitting}
                value={description}
                onChange={(event) => {
                  setDescription(event.target.value);
                  setError("");
                }}
                placeholder="Customer payment, supplier purchase, or other reason"
              />
            </label>
          )}

          {error && (
            <p role="alert" className="rounded-xl bg-[#fff0e8] px-4 py-3 text-sm font-bold text-[#9b431f]">
              {error}
            </p>
          )}

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="h-12 rounded-xl border border-[#cfd8cd] bg-white px-4 text-sm font-black text-[#173b24] disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#173b24] px-4 text-sm font-black text-white hover:bg-[#245334] disabled:cursor-wait disabled:opacity-70"
            >
              {isSubmitting && <LoaderCircle size={17} className="animate-spin" />}
              {isSubmitting ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
