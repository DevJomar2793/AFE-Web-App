"use client";

import { LoaderCircle, ReceiptText, X } from "lucide-react";
import { useState } from "react";
import {
  OfficialReceiptPreview,
  type OfficialReceiptPreviewData,
} from "@/components/inventory/new-sale-modal";
import {
  getOfficialReceipt,
  type OfficialReceipt,
  type Sale,
} from "@/lib/api";

type SaleDetailsModalProps = {
  sale: Sale;
  onClose: () => void;
};

const currency = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export function SaleDetailsModal({
  sale,
  onClose,
}: SaleDetailsModalProps) {
  const [receipt, setReceipt] = useState<OfficialReceipt | null>(null);
  const [isReceiptLoading, setIsReceiptLoading] = useState(false);
  const [receiptError, setReceiptError] = useState("");
  const total = sale.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  async function openReceipt() {
    if (isReceiptLoading || !sale.hasOfficialReceipt) return;

    setIsReceiptLoading(true);
    setReceiptError("");
    try {
      const savedReceipt = await getOfficialReceipt(sale.id);
      setReceipt(savedReceipt);
    } catch (error) {
      setReceiptError(
        error instanceof Error
          ? error.message
          : "The official receipt could not be opened.",
      );
    } finally {
      setIsReceiptLoading(false);
    }
  }

  const receiptPreview: OfficialReceiptPreviewData | null = receipt
    ? {
        transactionId: receipt.saleId,
        orderDate: new Date(receipt.generatedAt),
        customerName: receipt.customerName,
        customerNumber: receipt.customerNumber,
        customerAddress: receipt.customerAddress,
        customerLandmark: receipt.customerLandmark,
        items: receipt.items.map((item) => ({
          id: item.id,
          itemName: item.itemName,
          itemCategory: item.itemCategory,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
        status: "SAVED",
      }
    : null;

  return (
    <>
      {receiptPreview ? (
        <OfficialReceiptPreview
          onClose={() => setReceipt(null)}
          receipt={receiptPreview}
        />
      ) : null}

      <div
        className="fixed inset-0 z-70 flex items-end justify-center bg-[#0d2417]/55 p-0 backdrop-blur-sm sm:items-center sm:p-6"
        onMouseDown={onClose}
        role="presentation"
      >
        <section
          aria-labelledby="sale-details-title"
          aria-modal="true"
          className="max-h-[92dvh] w-full max-w-2xl overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl sm:p-7"
          onMouseDown={(event) => event.stopPropagation()}
          role="dialog"
        >
          <header className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-[#a85620]">
                Transaction #{sale.id}
              </p>
              <h2
                className="mt-2 text-2xl font-black text-[#17281b]"
                id="sale-details-title"
              >
                Sales details
              </h2>
              <p className="mt-1 text-sm text-[#6d776f]">
                Complete saved order information.
              </p>
            </div>
            <button
              aria-label="Close sales details"
              className="grid size-10 shrink-0 place-items-center rounded-xl border border-[#dfe4dd] text-[#566159] hover:bg-[#f3f5f1]"
              onClick={onClose}
              type="button"
            >
              <X aria-hidden="true" size={19} />
            </button>
          </header>

          <dl className="mt-6 grid gap-3 rounded-2xl bg-[#f3f6f1] p-4 text-sm sm:grid-cols-2">
            <Detail label="Customer Name" value={sale.customerName} />
            <Detail
              label="Contact Number"
              value={sale.customerNumber ?? "Not available"}
            />
            <Detail label="Order Date" value={formatOrderDate(sale.createdAt)} />
            <Detail label="Transaction ID / Sales ID" value={`#${sale.id}`} />
            <Detail label="Payment Details" value="Not available" />
          </dl>

          <div className="mt-5 overflow-hidden rounded-2xl border border-[#dfe4dd]">
            <div className="hidden grid-cols-[minmax(0,1fr)_4rem_6rem_7rem] gap-2 bg-[#e7f2e6] px-4 py-3 text-xs font-black text-[#173b24] sm:grid">
              <span>Item</span>
              <span className="text-center">Qty</span>
              <span className="text-right">Unit Price</span>
              <span className="text-right">Subtotal</span>
            </div>
            {sale.items.map((item) => (
              <div
                className="grid grid-cols-2 gap-x-4 gap-y-2 border-t border-[#e8ede6] px-4 py-4 text-sm first:border-t-0 sm:grid-cols-[minmax(0,1fr)_4rem_6rem_7rem] sm:items-center sm:gap-2 sm:py-3"
                key={item.id}
              >
                <span className="col-span-2 min-w-0 break-words font-bold text-[#283b2c] sm:col-span-1">
                  {item.item.name}
                </span>
                <span className="flex items-center justify-between text-xs sm:block sm:text-center sm:text-sm">
                  <span className="font-bold text-[#89928b] sm:hidden">Quantity</span>
                  {item.quantity}
                </span>
                <span className="flex items-center justify-between text-xs font-semibold text-[#68736b] sm:block sm:text-right">
                  <span className="font-bold text-[#89928b] sm:hidden">Unit price</span>
                  {currency.format(item.price)}
                </span>
                <span className="col-span-2 flex items-center justify-between text-xs font-black text-[#283b2c] sm:col-span-1 sm:block sm:text-right">
                  <span className="font-bold text-[#89928b] sm:hidden">Subtotal</span>
                  {currency.format(item.price * item.quantity)}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between rounded-2xl bg-[#f3f6f1] px-4 py-3">
            <span className="font-bold text-[#68736b]">Total Amount</span>
            <strong className="text-xl text-[#173b24]">
              {currency.format(total)}
            </strong>
          </div>

          {receiptError ? (
            <p
              className="mt-4 rounded-xl bg-[#fff0e8] px-4 py-3 text-sm font-bold text-[#9b431f]"
              role="alert"
            >
              {receiptError}
            </p>
          ) : null}

          {!sale.hasOfficialReceipt ? (
            <p className="mt-4 rounded-xl bg-[#fff6df] px-4 py-3 text-sm font-bold text-[#8a5a16]">
              No saved official receipt is available for this transaction.
            </p>
          ) : null}

          <button
            className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#173b24] px-5 text-sm font-black text-white hover:bg-[#245334] disabled:cursor-wait disabled:opacity-70"
            disabled={isReceiptLoading || !sale.hasOfficialReceipt}
            onClick={() => void openReceipt()}
            type="button"
          >
            {isReceiptLoading ? (
              <LoaderCircle className="animate-spin" size={18} />
            ) : (
              <ReceiptText aria-hidden="true" size={18} />
            )}
            {isReceiptLoading ? "Opening receipt..." : "View Official Receipt"}
          </button>
        </section>
      </div>
    </>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-bold uppercase tracking-wide text-[#89928b]">
        {label}
      </dt>
      <dd className="mt-1 break-words font-extrabold text-[#283b2c]">{value}</dd>
    </div>
  );
}

function formatOrderDate(value: string) {
  return new Date(value).toLocaleString("en-PH", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Manila",
  });
}
