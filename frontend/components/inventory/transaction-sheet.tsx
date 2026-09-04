"use client";

import { FormEvent, useState } from "react";
import { Plus, X } from "lucide-react";
import type { LocalInventoryItem } from "@/lib/local-inventory";

export type TransactionAction = "restock";

export type TransactionFormValues = {
  itemId: string;
  quantity: number;
  note: string;
};

type TransactionSheetProps = {
  action: TransactionAction;
  initialItemId?: string;
  items: LocalInventoryItem[];
  onClose: () => void;
  onSave: (values: TransactionFormValues) => string | null;
};

const currency = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  maximumFractionDigits: 0,
});

const ACTION_COPY: Record<
  TransactionAction,
  { title: string; description: string; submit: string }
> = {
  restock: {
    title: "Add stock",
    description: "Record incoming inventory and update quantities instantly.",
    submit: "Add inventory",
  },
};

export function TransactionSheet({
  action,
  initialItemId,
  items,
  onClose,
  onSave,
}: TransactionSheetProps) {
  const [itemId, setItemId] = useState(initialItemId ?? items[0]?.id ?? "");
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const item = items.find((candidate) => candidate.id === itemId);
  const estimatedAmount = item ? item.cost * quantity : 0;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const saveError = onSave({ itemId, quantity, note });

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
              {ACTION_COPY[action].title}
            </h2>
            <p className="mt-1 text-sm leading-6 text-[#6d776f]">
              {ACTION_COPY[action].description}
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

          <label className="block text-sm font-extrabold text-[#283b2c]">
            Note <span className="font-medium text-[#89928b]">(optional)</span>
            <input
              className="inventory-field mt-2"
              type="text"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Supplier or delivery note"
            />
          </label>

          <div className="flex items-center justify-between rounded-2xl bg-[#f3f6f1] px-4 py-3">
            <span className="text-sm font-semibold text-[#68736b]">
              Estimated cost
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
            {ACTION_COPY[action].submit}
          </button>
        </form>
      </section>
    </div>
  );
}
