"use client";

import { type FormEvent, useRef, useState } from "react";
import { Plus, RotateCcw, Trash2, X } from "lucide-react";
import { createSaleBatch, type InventoryItem } from "@/lib/api";

type NewSaleModalProps = {
  initialInventoryId?: number;
  inventoryError: string;
  isInventoryLoading: boolean;
  items: InventoryItem[];
  onClose: () => void;
  onCreated: () => void;
  onRetryInventory: () => void;
};

type SaleLine = {
  id: number;
  inventoryId: string;
  quantity: string;
};

const currency = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export function NewSaleModal({
  initialInventoryId,
  inventoryError,
  isInventoryLoading,
  items,
  onClose,
  onCreated,
  onRetryInventory,
}: NewSaleModalProps) {
  const availableItems = items.filter((item) => item.quantity > 0);
  const preferredItem =
    availableItems.find((item) => item.id === initialInventoryId) ??
    availableItems[0];
  const nextSaleLineId = useRef(2);
  const [saleLines, setSaleLines] = useState<SaleLine[]>([
    {
      id: 1,
      inventoryId: initialInventoryId ? String(initialInventoryId) : "",
      quantity: "1",
    },
  ]);
  const [customerName, setCustomerName] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const saleLineDetails = saleLines.map((line, index) => {
    const selectedItem = availableItems.find(
      (item) => item.id === Number(line.inventoryId),
    );
    const item = selectedItem ?? (index === 0 ? preferredItem : undefined);
    const quantity = Number(line.quantity);
    const usesWholesalePrice = Boolean(
      item && quantity >= 6 && item.wholesalePrice !== null,
    );
    const unitPrice = usesWholesalePrice
      ? (item?.wholesalePrice ?? 0)
      : (item?.price ?? 0);
    const total = Number.isFinite(quantity)
      ? unitPrice * Math.max(quantity, 0)
      : 0;

    return { item, quantity, total, unitPrice, usesWholesalePrice };
  });
  const selectedInventoryIds = new Set(
    saleLineDetails.flatMap((line) => (line.item ? [line.item.id] : [])),
  );
  const saleTotal = saleLineDetails.reduce(
    (total, line) => total + line.total,
    0,
  );
  const hasWholesalePrice = saleLineDetails.some(
    (line) => line.usesWholesalePrice,
  );
  const canAddAnotherItem = saleLines.length < availableItems.length;

  const updateSaleLine = (
    lineId: number,
    changes: Partial<Pick<SaleLine, "inventoryId" | "quantity">>,
  ) => {
    setSaleLines((currentLines) =>
      currentLines.map((line) =>
        line.id === lineId ? { ...line, ...changes } : line,
      ),
    );
    setError("");
  };

  const addSaleLine = () => {
    const nextItem = availableItems.find(
      (item) => !selectedInventoryIds.has(item.id),
    );
    if (!nextItem) return;

    setSaleLines((currentLines) => [
      ...currentLines,
      {
        id: nextSaleLineId.current,
        inventoryId: String(nextItem.id),
        quantity: "1",
      },
    ]);
    nextSaleLineId.current += 1;
    setError("");
  };

  const removeSaleLine = (lineId: number) => {
    if (saleLines.length === 1) return;
    setSaleLines((currentLines) =>
      currentLines.filter((line) => line.id !== lineId),
    );
    setError("");
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedCustomerName = customerName.trim();
    const selectedIds = new Set<number>();
    const requestedItems: { inventoryId: number; quantity: number }[] = [];

    for (const [index] of saleLines.entries()) {
      const details = saleLineDetails[index];
      if (!details.item) {
        setError(`Choose an available inventory item for item ${index + 1}.`);
        return;
      }
      if (selectedIds.has(details.item.id)) {
        setError("Each inventory item can only be added once.");
        return;
      }
      if (!Number.isInteger(details.quantity) || details.quantity < 1) {
        setError(
          `Enter a whole quantity of at least one for ${details.item.item}.`,
        );
        return;
      }
      if (details.quantity > details.item.quantity) {
        setError(
          `Only ${details.item.quantity} units of ${details.item.item} are available.`,
        );
        return;
      }

      selectedIds.add(details.item.id);
      requestedItems.push({
        inventoryId: details.item.id,
        quantity: details.quantity,
      });
    }

    if (!normalizedCustomerName) {
      setError("Enter a customer name.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      await createSaleBatch({
        customerName: normalizedCustomerName,
        items: requestedItems,
      });
      onCreated();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "The sale could not be saved.",
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
        aria-labelledby="new-sale-title"
        className="max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl sm:rounded-3xl sm:p-7"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#a85620]">
              Transaction
            </p>
            <h2
              id="new-sale-title"
              className="mt-2 text-2xl font-black text-[#17281b]"
            >
              Record new sale
            </h2>
            <p className="mt-1 text-sm leading-6 text-[#6d776f]">
              Stock is deducted when the sale is saved.
            </p>
          </div>
          <button
            type="button"
            aria-label="Close new sale form"
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
        ) : !preferredItem ? (
          <p className="mt-6 rounded-xl bg-[#fff0e8] px-4 py-4 text-sm font-semibold text-[#8f421f]">
            No inventory items are currently available for sale.
          </p>
        ) : (
          <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-3">
              {saleLines.map((line, index) => {
                const details = saleLineDetails[index];

                return (
                  <div
                    className="rounded-2xl border border-[#dfe4dd] bg-[#fbfcfa] p-4"
                    key={line.id}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-black text-[#283b2c]">
                        Item {index + 1}
                      </p>
                      {saleLines.length > 1 && (
                        <button
                          type="button"
                          aria-label={`Remove item ${index + 1}`}
                          onClick={() => removeSaleLine(line.id)}
                          disabled={isSubmitting}
                          className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2 text-xs font-black text-[#9b431f] hover:bg-[#fff0e8] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <Trash2 size={14} aria-hidden="true" /> Remove
                        </button>
                      )}
                    </div>

                    <div className="mt-3 grid gap-3 sm:grid-cols-[minmax(0,1fr)_7rem]">
                      <label className="block text-sm font-extrabold text-[#283b2c]">
                        Product
                        <select
                          className="inventory-field mt-2"
                          value={details.item ? String(details.item.id) : ""}
                          required
                          disabled={isSubmitting}
                          onChange={(event) =>
                            updateSaleLine(line.id, {
                              inventoryId: event.target.value,
                              quantity: "1",
                            })
                          }
                        >
                          {items.map((item) => {
                            const isSelectedByAnotherLine = saleLines.some(
                              (otherLine) =>
                                otherLine.id !== line.id &&
                                Number(otherLine.inventoryId) === item.id,
                            );

                            return (
                              <option
                                value={item.id}
                                disabled={
                                  item.quantity === 0 || isSelectedByAnotherLine
                                }
                                key={item.id}
                              >
                                {item.item} · {item.quantity} available
                              </option>
                            );
                          })}
                        </select>
                      </label>

                      <label className="block text-sm font-extrabold text-[#283b2c]">
                        Quantity
                        <input
                          className="inventory-field mt-2"
                          type="number"
                          inputMode="numeric"
                          min="1"
                          max={details.item?.quantity}
                          step="1"
                          required
                          disabled={isSubmitting}
                          value={line.quantity}
                          onChange={(event) =>
                            updateSaleLine(line.id, {
                              quantity: event.target.value,
                            })
                          }
                        />
                      </label>
                    </div>

                    {details.item && (
                      <p className="mt-3 text-xs font-semibold text-[#7a857d]">
                        {currency.format(details.unitPrice)} each
                        {details.usesWholesalePrice
                          ? " · Wholesale price applied"
                          : ""}
                        {" · "}
                        {currency.format(details.total)} subtotal
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={addSaleLine}
              disabled={isSubmitting || !canAddAnotherItem}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#b9c8b8] bg-white px-4 text-sm font-black text-[#173b24] transition hover:bg-[#f3f6f1] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus size={17} aria-hidden="true" />
              {canAddAnotherItem ? "Add another item" : "All items added"}
            </button>

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

            <div className="flex items-center justify-between gap-4 rounded-2xl bg-[#f3f6f1] px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-[#68736b]">
                  Sale total
                </p>
                <p className="mt-1 text-xs font-semibold text-[#89928b]">
                  {saleLines.length} {saleLines.length === 1 ? "item" : "items"}
                  {hasWholesalePrice ? " · Wholesale pricing applied" : ""}
                </p>
              </div>
              <strong className="text-lg text-[#173b24]">
                {currency.format(saleTotal)}
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
              disabled={isSubmitting}
              className="flex h-13 w-full items-center justify-center gap-2 rounded-xl bg-[#173b24] px-5 text-sm font-black text-white transition hover:bg-[#245334] disabled:cursor-wait disabled:opacity-70"
            >
              <Plus size={18} aria-hidden="true" />
              {isSubmitting ? "Saving sale..." : "Save sale"}
            </button>
          </form>
        )}
      </section>
    </div>
  );
}
