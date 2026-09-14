"use client";

import { type FormEvent, useState } from "react";
import { Pencil, X } from "lucide-react";
import { updateSale, type Sale } from "@/lib/api";

type EditSaleModalProps = {
  sale: Sale;
  onClose: () => void;
  onUpdated: () => void;
};

type EditableSaleItem = {
  id: number;
  itemName: string;
  price: string;
  quantity: string;
};

const PRICE_PATTERN = /^\d+(?:\.\d{1,2})?$/;
const MAX_PRICE = 9_999_999_999.99;
const currency = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export function EditSaleModal({
  sale,
  onClose,
  onUpdated,
}: EditSaleModalProps) {
  const [saleItems, setSaleItems] = useState<EditableSaleItem[]>(
    sale.items.map((item) => ({
      id: item.id,
      itemName: item.item.name,
      price: String(item.price),
      quantity: String(item.quantity),
    })),
  );
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const saleTotal = saleItems.reduce((total, item) => {
    const price = Number(item.price);
    const quantity = Number(item.quantity);
    if (!Number.isFinite(price) || !Number.isFinite(quantity)) return total;
    return total + Math.max(price, 0) * Math.max(quantity, 0);
  }, 0);

  const updateItem = (
    itemId: number,
    field: "price" | "quantity",
    value: string,
  ) => {
    setSaleItems((currentItems) =>
      currentItems.map((item) =>
        item.id === itemId ? { ...item, [field]: value } : item,
      ),
    );
    setError("");
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const updatedItems: { id: number; price: number; quantity: number }[] = [];

    for (const item of saleItems) {
      const price = Number(item.price);
      const quantity = Number(item.quantity);

      if (
        !PRICE_PATTERN.test(item.price) ||
        !Number.isFinite(price) ||
        price < 0 ||
        price > MAX_PRICE
      ) {
        setError(
          `Enter a valid price with no more than two decimal places for ${item.itemName}.`,
        );
        return;
      }
      if (!Number.isInteger(quantity) || quantity < 1) {
        setError(`Enter a whole quantity of at least one for ${item.itemName}.`);
        return;
      }

      updatedItems.push({ id: item.id, price, quantity });
    }

    setIsSubmitting(true);
    setError("");

    try {
      await updateSale(sale.id, { items: updatedItems });
      onUpdated();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "The sale could not be updated.",
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
        aria-labelledby="edit-sale-title"
        className="max-h-[92dvh] w-full max-w-xl overflow-y-auto rounded-t-3xl bg-white p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl sm:rounded-3xl sm:p-7"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#a85620]">
              Transaction #{sale.id}
            </p>
            <h2
              id="edit-sale-title"
              className="mt-2 text-2xl font-black text-[#17281b]"
            >
              Edit sale
            </h2>
            <p className="mt-1 text-sm leading-6 text-[#6d776f]">
              Inventory adjusts by each item&apos;s quantity difference.
            </p>
          </div>
          <button
            type="button"
            aria-label="Close edit sale form"
            onClick={onClose}
            disabled={isSubmitting}
            className="grid size-10 shrink-0 place-items-center rounded-xl border border-[#dfe4dd] text-[#566159] hover:bg-[#f3f5f1] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X size={19} aria-hidden="true" />
          </button>
        </div>

        <div className="mt-6 rounded-2xl bg-[#f3f6f1] p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-[#89928b]">
            Customer
          </p>
          <p className="mt-1 font-extrabold text-[#283b2c]">
            {sale.customerName}
          </p>
        </div>

        <form className="mt-5 space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-3">
            {saleItems.map((item, index) => (
              <div
                className="rounded-2xl border border-[#dfe4dd] bg-[#fbfcfa] p-4"
                key={item.id}
              >
                <p className="font-black text-[#283b2c]">
                  {item.itemName}
                </p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
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
                      autoFocus={index === 0}
                      disabled={isSubmitting}
                      value={item.price}
                      onChange={(event) =>
                        updateItem(item.id, "price", event.target.value)
                      }
                    />
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
                      value={item.quantity}
                      onChange={(event) =>
                        updateItem(item.id, "quantity", event.target.value)
                      }
                    />
                  </label>
                </div>
                <p className="mt-3 text-right text-xs font-bold text-[#68736b]">
                  Subtotal:{" "}
                  {currency.format(
                    Number(item.price) * Number(item.quantity) || 0,
                  )}
                </p>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between gap-4 rounded-2xl bg-[#f3f6f1] px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-[#68736b]">Sale total</p>
              <p className="mt-1 text-xs font-semibold text-[#89928b]">
                {saleItems.length} {saleItems.length === 1 ? "item" : "items"}
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
            <Pencil size={18} aria-hidden="true" />
            {isSubmitting ? "Updating sale..." : "Update sale"}
          </button>
        </form>
      </section>
    </div>
  );
}
