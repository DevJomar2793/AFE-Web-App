"use client";

import { FormEvent, useState } from "react";
import { Save, X } from "lucide-react";
import {
  updateInventoryItem,
  type InventoryItem,
} from "@/lib/api";

type EditInventoryItemModalProps = {
  item: InventoryItem;
  onClose: () => void;
  onUpdated: () => void;
};

const PRICE_PATTERN = /^\d+(?:\.\d{1,2})?$/;
const MAX_PRICE = 9_999_999_999.99;

export function EditInventoryItemModal({
  item,
  onClose,
  onUpdated,
}: EditInventoryItemModalProps) {
  const [quantity, setQuantity] = useState(String(item.quantity));
  const [price, setPrice] = useState(String(item.price));
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedQuantity = Number(quantity);
    const normalizedPrice = Number(price);

    if (!Number.isInteger(normalizedQuantity) || normalizedQuantity < 0) {
      setError("Quantity must be a whole number of zero or more.");
      return;
    }
    if (
      !PRICE_PATTERN.test(price) ||
      !Number.isFinite(normalizedPrice) ||
      normalizedPrice < 0 ||
      normalizedPrice > MAX_PRICE
    ) {
      setError("Enter a valid price with no more than two decimal places.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      await updateInventoryItem(item.id, {
        quantity: normalizedQuantity,
        price: normalizedPrice,
      });
      onUpdated();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "The inventory item could not be updated.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

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
        aria-labelledby="edit-inventory-item-title"
        className="max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl sm:p-7"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#a85620]">
              Inventory
            </p>
            <h2
              id="edit-inventory-item-title"
              className="mt-2 text-2xl font-black text-[#17281b]"
            >
              Edit item
            </h2>
            <p className="mt-1 text-sm leading-6 text-[#6d776f]">
              Update the current quantity and price for {item.item}.
            </p>
          </div>
          <button
            type="button"
            aria-label="Close edit item form"
            onClick={onClose}
            disabled={isSubmitting}
            className="grid size-10 shrink-0 place-items-center rounded-xl border border-[#dfe4dd] text-[#566159] hover:bg-[#f3f5f1] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X size={19} aria-hidden="true" />
          </button>
        </div>

        <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
          <label className="block text-sm font-extrabold text-[#283b2c]">
            Quantity
            <input
              className="inventory-field mt-2"
              type="number"
              inputMode="numeric"
              min="0"
              step="1"
              required
              autoFocus
              disabled={isSubmitting}
              value={quantity}
              onChange={(event) => {
                setQuantity(event.target.value);
                setError("");
              }}
            />
          </label>

          <label className="block text-sm font-extrabold text-[#283b2c]">
            Price
            <input
              className="inventory-field mt-2"
              type="number"
              inputMode="decimal"
              min="0"
              max={MAX_PRICE}
              step="0.01"
              required
              disabled={isSubmitting}
              value={price}
              onChange={(event) => {
                setPrice(event.target.value);
                setError("");
              }}
            />
          </label>

          {error && (
            <p
              role="alert"
              className="rounded-xl bg-[#fff0e8] px-4 py-3 text-sm font-bold text-[#9b431f]"
            >
              {error}
            </p>
          )}

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex h-13 items-center justify-center rounded-xl border border-[#cfd8cd] bg-white px-5 text-sm font-black text-[#173b24] transition hover:bg-[#f8faf7] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex h-13 items-center justify-center gap-2 rounded-xl bg-[#173b24] px-5 text-sm font-black text-white transition hover:bg-[#245334] disabled:cursor-wait disabled:opacity-70"
            >
              <Save size={18} aria-hidden="true" />
              {isSubmitting ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
