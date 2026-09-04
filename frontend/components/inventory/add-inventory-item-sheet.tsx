"use client";

import { FormEvent, useState } from "react";
import { Plus, X } from "lucide-react";
import {
  createInventoryItem,
  type CreateInventoryItemInput,
} from "@/services/inventory-api";

const PRICE_PATTERN = /^\d+(?:\.\d{1,2})?$/;

export function AddInventoryItemSheet({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [item, setItem] = useState("");
  const [quantity, setQuantity] = useState("0");
  const [price, setPrice] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedItem = item.trim();
    const normalizedQuantity = Number(quantity);
    const normalizedPrice = Number(price);

    if (!normalizedItem) {
      setError("Enter an item name.");
      return;
    }
    if (!Number.isInteger(normalizedQuantity) || normalizedQuantity < 0) {
      setError("Starting quantity must be a whole number of zero or more.");
      return;
    }
    if (
      !PRICE_PATTERN.test(price) ||
      !Number.isFinite(normalizedPrice) ||
      normalizedPrice < 0 ||
      normalizedPrice > 9_999_999_999.99
    ) {
      setError("Enter a valid price with no more than two decimal places.");
      return;
    }

    const payload: CreateInventoryItemInput = {
      item: normalizedItem,
      quantity: normalizedQuantity,
      price: normalizedPrice,
    };

    setIsSubmitting(true);
    setError("");

    try {
      await createInventoryItem(payload);
      onCreated();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "The inventory item could not be added.",
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
        aria-labelledby="add-inventory-item-title"
        className="max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl sm:p-7"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#a85620]">
              Inventory
            </p>
            <h2
              id="add-inventory-item-title"
              className="mt-2 text-2xl font-black text-[#17281b]"
            >
              Add item
            </h2>
            <p className="mt-1 text-sm leading-6 text-[#6d776f]">
              Create a new item in the inventory database.
            </p>
          </div>
          <button
            type="button"
            aria-label="Close add item form"
            onClick={onClose}
            disabled={isSubmitting}
            className="grid size-10 shrink-0 place-items-center rounded-xl border border-[#dfe4dd] text-[#566159] hover:bg-[#f3f5f1] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X size={19} aria-hidden="true" />
          </button>
        </div>

        <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
          <label className="block text-sm font-extrabold text-[#283b2c]">
            Item name
            <input
              className="inventory-field mt-2"
              type="text"
              maxLength={255}
              required
              autoFocus
              value={item}
              onChange={(event) => {
                setItem(event.target.value);
                setError("");
              }}
              placeholder="Large eggs"
            />
          </label>

          <label className="block text-sm font-extrabold text-[#283b2c]">
            Starting quantity
            <input
              className="inventory-field mt-2"
              type="number"
              inputMode="numeric"
              min="0"
              step="1"
              required
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
              max="9999999999.99"
              step="0.01"
              required
              value={price}
              onChange={(event) => {
                setPrice(event.target.value);
                setError("");
              }}
              placeholder="250.00"
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

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex h-13 w-full items-center justify-center gap-2 rounded-xl bg-[#173b24] px-5 text-sm font-black text-white transition hover:bg-[#245334] disabled:cursor-wait disabled:opacity-70"
          >
            <Plus size={18} aria-hidden="true" />
            {isSubmitting ? "Adding item..." : "Add item"}
          </button>
        </form>
      </section>
    </div>
  );
}
