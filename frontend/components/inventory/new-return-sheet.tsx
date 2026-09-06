"use client";

import { FormEvent, useState } from "react";
import { Plus, RotateCcw, X } from "lucide-react";
import type { DatabaseInventoryItem } from "@/services/inventory-api";
import { createReturn } from "@/services/returns-api";

type NewReturnSheetProps = {
  inventoryError: string;
  isInventoryLoading: boolean;
  items: DatabaseInventoryItem[];
  onClose: () => void;
  onCreated: () => void;
  onRetryInventory: () => void;
};

export function NewReturnSheet({
  inventoryError,
  isInventoryLoading,
  items,
  onClose,
  onCreated,
  onRetryInventory,
}: NewReturnSheetProps) {
  const [selectedInventoryId, setSelectedInventoryId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [customerName, setCustomerName] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const selectedItem =
    items.find((item) => item.id === Number(selectedInventoryId)) ?? items[0];

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedQuantity = Number(quantity);
    const normalizedCustomerName = customerName.trim();
    const normalizedReason = reason.trim();

    if (!selectedItem) {
      setError("Choose an inventory item.");
      return;
    }
    if (!Number.isInteger(normalizedQuantity) || normalizedQuantity < 1) {
      setError("Enter a whole quantity of at least one.");
      return;
    }
    if (!normalizedCustomerName) {
      setError("Enter a customer name.");
      return;
    }
    if (!normalizedReason) {
      setError("Enter a reason for the return.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      await createReturn({
        inventoryId: selectedItem.id,
        quantity: normalizedQuantity,
        customerName: normalizedCustomerName,
        reason: normalizedReason,
      });
      onCreated();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "The return could not be saved.",
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
        aria-labelledby="new-return-title"
        className="max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl sm:p-7"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#a85620]">
              Transaction
            </p>
            <h2
              id="new-return-title"
              className="mt-2 text-2xl font-black text-[#17281b]"
            >
              Record product return
            </h2>
            <p className="mt-1 text-sm leading-6 text-[#6d776f]">
              Inventory is restored when the return is saved.
            </p>
          </div>
          <button
            type="button"
            aria-label="Close return form"
            onClick={onClose}
            disabled={isSubmitting}
            className="grid size-10 shrink-0 place-items-center rounded-xl border border-[#dfe4dd] text-[#566159] hover:bg-[#f3f5f1] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X size={19} aria-hidden="true" />
          </button>
        </div>

        {isInventoryLoading ? (
          <p
            className="mt-6 rounded-xl bg-[#edf2eb] px-4 py-4 text-sm font-semibold text-[#627067]"
            role="status"
          >
            Loading inventory…
          </p>
        ) : inventoryError ? (
          <div
            className="mt-6 rounded-xl bg-[#fff0e8] px-4 py-4 text-sm text-[#8f421f]"
            role="alert"
          >
            <p className="font-semibold">{inventoryError}</p>
            <button
              type="button"
              onClick={onRetryInventory}
              className="mt-3 inline-flex h-9 items-center gap-2 rounded-lg bg-white px-3 font-black shadow-sm"
            >
              <RotateCcw size={15} aria-hidden="true" /> Retry
            </button>
          </div>
        ) : !items.length ? (
          <p className="mt-6 rounded-xl bg-[#fff0e8] px-4 py-4 text-sm font-semibold text-[#8f421f]">
            No inventory items are currently available.
          </p>
        ) : (
          <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
            <label className="block text-sm font-extrabold text-[#283b2c]">
              Item
              <select
                className="inventory-field mt-2"
                value={selectedInventoryId || String(items[0].id)}
                disabled={isSubmitting}
                onChange={(event) => {
                  setSelectedInventoryId(event.target.value);
                  setError("");
                }}
              >
                {items.map((item) => (
                  <option value={item.id} key={item.id}>
                    {item.item} · {item.quantity} available
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm font-extrabold text-[#283b2c]">
              Quantity
              <input
                className="inventory-field mt-2"
                type="number"
                inputMode="numeric"
                min="1"
                step="1"
                required
                disabled={isSubmitting}
                value={quantity}
                onChange={(event) => {
                  setQuantity(event.target.value);
                  setError("");
                }}
              />
            </label>

            <label className="block text-sm font-extrabold text-[#283b2c]">
              Customer
              <input
                className="inventory-field mt-2"
                type="text"
                maxLength={255}
                required
                disabled={isSubmitting}
                value={customerName}
                onChange={(event) => {
                  setCustomerName(event.target.value);
                  setError("");
                }}
                placeholder="Customer or business name"
              />
            </label>

            <label className="block text-sm font-extrabold text-[#283b2c]">
              Reason
              <textarea
                className="inventory-field mt-2 min-h-24 resize-y"
                maxLength={255}
                required
                disabled={isSubmitting}
                value={reason}
                onChange={(event) => {
                  setReason(event.target.value);
                  setError("");
                }}
                placeholder="Damaged tray, wrong item, or changed mind"
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
              {isSubmitting ? "Saving return..." : "Save return"}
            </button>
          </form>
        )}
      </section>
    </div>
  );
}
