"use client";

import { FormEvent, useState } from "react";
import { Pencil, X } from "lucide-react";
import { updateSale, type DatabaseSale } from "@/services/sales-api";

type EditSaleSheetProps = {
  sale: DatabaseSale;
  onClose: () => void;
  onUpdated: () => void;
};

const PRICE_PATTERN = /^\d+(?:\.\d{1,2})?$/;
const MAX_PRICE = 9_999_999_999.99;
const currency = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export function EditSaleSheet({
  sale,
  onClose,
  onUpdated,
}: EditSaleSheetProps) {
  const [price, setPrice] = useState(String(sale.price));
  const [quantity, setQuantity] = useState(String(sale.quantity));
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const normalizedPrice = Number(price);
  const normalizedQuantity = Number(quantity);
  const saleTotal =
    Number.isFinite(normalizedPrice) && Number.isFinite(normalizedQuantity)
      ? Math.max(normalizedPrice, 0) * Math.max(normalizedQuantity, 0)
      : 0;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (
      !PRICE_PATTERN.test(price) ||
      !Number.isFinite(normalizedPrice) ||
      normalizedPrice < 0 ||
      normalizedPrice > MAX_PRICE
    ) {
      setError("Enter a valid price with no more than two decimal places.");
      return;
    }
    if (!Number.isInteger(normalizedQuantity) || normalizedQuantity < 1) {
      setError("Enter a whole quantity of at least one.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      await updateSale(sale.id, {
        price: normalizedPrice,
        quantity: normalizedQuantity,
      });
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
        className="max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl sm:p-7"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#a85620]">
              Transaction
            </p>
            <h2
              id="edit-sale-title"
              className="mt-2 text-2xl font-black text-[#17281b]"
            >
              Edit sale
            </h2>
            <p className="mt-1 text-sm leading-6 text-[#6d776f]">
              Inventory adjusts by the difference in quantity.
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

        <div className="mt-6 grid gap-3 rounded-2xl bg-[#f3f6f1] p-4 sm:grid-cols-2">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#89928b]">
              Item
            </p>
            <p className="mt-1 font-extrabold text-[#283b2c]">
              {sale.item.name}
            </p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#89928b]">
              Customer
            </p>
            <p className="mt-1 font-extrabold text-[#283b2c]">
              {sale.customerName}
            </p>
          </div>
        </div>

        <form className="mt-5 space-y-5" onSubmit={handleSubmit}>
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
              autoFocus
              disabled={isSubmitting}
              value={price}
              onChange={(event) => {
                setPrice(event.target.value);
                setError("");
              }}
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
              value={quantity}
              onChange={(event) => {
                setQuantity(event.target.value);
                setError("");
              }}
            />
          </label>

          <div className="flex items-center justify-between gap-4 rounded-2xl bg-[#f3f6f1] px-4 py-3">
            <p className="text-sm font-semibold text-[#68736b]">Sale total</p>
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
