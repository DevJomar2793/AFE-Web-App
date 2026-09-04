"use client";

import { RotateCcw } from "lucide-react";
import type { DatabaseReturn } from "@/services/returns-api";

type ReturnsViewProps = {
  error: string;
  isLoading: boolean;
  returns: DatabaseReturn[];
  onRetry: () => void;
};

const dateTimeFormatter = new Intl.DateTimeFormat("en-PH", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Manila",
});

export function ReturnsView({
  error,
  isLoading,
  returns,
  onRetry,
}: ReturnsViewProps) {
  return (
    <section>
      <div>
        <h2 className="text-2xl font-black">Product returns</h2>
        <p className="mt-1 text-sm text-[#768178]">
          Return records stored in the database.
        </p>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-[#e0e5de] bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-225 border-collapse text-left">
            <thead className="bg-[#f8f9f6] text-xs font-black uppercase tracking-widest text-[#818b83]">
              <tr>
                <th className="px-5 py-3 sm:px-6">Item</th>
                <th className="px-5 py-3">Quantity</th>
                <th className="px-5 py-3">Customer</th>
                <th className="px-5 py-3">Reason</th>
                <th className="px-5 py-3">Created At</th>
                <th className="px-5 py-3 sm:pr-6">Updated At</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <ReturnsLoadingRows />
              ) : error ? (
                <ReturnsErrorRow error={error} onRetry={onRetry} />
              ) : returns.length ? (
                returns.map((inventoryReturn) => (
                  <ReturnRow
                    inventoryReturn={inventoryReturn}
                    key={inventoryReturn.id}
                  />
                ))
              ) : (
                <tr>
                  <td
                    className="px-5 py-12 text-center text-sm font-semibold text-[#7c867e]"
                    colSpan={6}
                  >
                    No product returns have been recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function ReturnRow({ inventoryReturn }: { inventoryReturn: DatabaseReturn }) {
  return (
    <tr className="border-t border-[#edf0eb] text-sm">
      <td className="px-5 py-4 font-extrabold text-[#26382a] sm:px-6">
        {inventoryReturn.item.name}
      </td>
      <td className="px-5 py-4 font-black">{inventoryReturn.quantity}</td>
      <td className="px-5 py-4 font-semibold text-[#58645b]">
        {inventoryReturn.customerName}
      </td>
      <td className="max-w-70 px-5 py-4 font-semibold text-[#58645b]">
        {inventoryReturn.reason}
      </td>
      <td className="whitespace-nowrap px-5 py-4 text-xs font-semibold text-[#737e76]">
        {dateTimeFormatter.format(new Date(inventoryReturn.createdAt))}
      </td>
      <td className="whitespace-nowrap px-5 py-4 text-xs font-semibold text-[#737e76] sm:pr-6">
        {dateTimeFormatter.format(new Date(inventoryReturn.updatedAt))}
      </td>
    </tr>
  );
}

function ReturnsLoadingRows() {
  return [0, 1, 2].map((placeholder) => (
    <tr className="border-t border-[#edf0eb]" key={placeholder}>
      <td className="px-5 py-4 sm:px-6" colSpan={6}>
        <div className="h-8 animate-pulse rounded-lg bg-[#f0f3ee]" />
      </td>
    </tr>
  ));
}

function ReturnsErrorRow({
  error,
  onRetry,
}: {
  error: string;
  onRetry: () => void;
}) {
  return (
    <tr>
      <td className="px-5 py-12 text-center" colSpan={6}>
        <div role="alert">
          <p className="text-sm font-semibold text-[#9b3f3f]">{error}</p>
          <button
            type="button"
            onClick={onRetry}
            className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl bg-[#173b24] px-4 text-sm font-black text-white hover:bg-[#245334]"
          >
            <RotateCcw size={16} aria-hidden="true" /> Try again
          </button>
        </div>
      </td>
    </tr>
  );
}
