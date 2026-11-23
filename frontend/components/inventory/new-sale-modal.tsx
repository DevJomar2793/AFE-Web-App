"use client";

import {
  type FormEvent,
  type KeyboardEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Download,
  LoaderCircle,
  Phone,
  Plus,
  Printer,
  ReceiptText,
  RotateCcw,
  Search,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import { BrandMark } from "@/components/storefront/brand-mark";
import {
  createSaleBatch,
  formatPaymentMethod,
  getAutomaticUnitPrice,
  getCustomerDetails,
  paymentMethodOptions,
  type CustomerDetails,
  type InventoryItem,
  type PaymentMethod,
} from "@/lib/api";

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

type ReceiptPreviewItem = {
  id: number;
  itemName: string;
  itemCategory: "eggs" | "oil";
  quantity: number;
  unitPrice: number;
};

export type OfficialReceiptPreviewData = {
  transactionId: number | null;
  orderDate: Date;
  customerName: string;
  customerNumber: string | null;
  customerAddress: string | null;
  customerLandmark: string | null;
  paymentMethod: PaymentMethod | null;
  items: ReceiptPreviewItem[];
  status: "PREVIEW" | "SAVED";
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
  const customerFieldRef = useRef<HTMLDivElement>(null);
  const customerListRef = useRef<HTMLDivElement>(null);
  const [saleLines, setSaleLines] = useState<SaleLine[]>([
    {
      id: 1,
      inventoryId: initialInventoryId ? String(initialInventoryId) : "",
      quantity: "1",
    },
  ]);
  const [customers, setCustomers] = useState<CustomerDetails[]>([]);
  const [customerQuery, setCustomerQuery] = useState("");
  const [selectedCustomer, setSelectedCustomer] =
    useState<CustomerDetails | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | "">("");
  const [isCustomerListOpen, setIsCustomerListOpen] = useState(false);
  const [activeCustomerIndex, setActiveCustomerIndex] = useState(0);
  const [isCustomerLoading, setIsCustomerLoading] = useState(true);
  const [customerError, setCustomerError] = useState("");
  const [customerRequestVersion, setCustomerRequestVersion] = useState(0);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [receiptGeneratedAt, setReceiptGeneratedAt] = useState<Date | null>(
    null,
  );
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    async function loadCustomers() {
      setIsCustomerLoading(true);
      setCustomerError("");
      try {
        const customerData = await getCustomerDetails(controller.signal);
        setCustomers(customerData);
      } catch (loadError) {
        if (
          loadError instanceof DOMException &&
          loadError.name === "AbortError"
        ) {
          return;
        }
        setCustomerError(
          loadError instanceof Error
            ? loadError.message
            : "Customer information could not be loaded.",
        );
      } finally {
        if (!controller.signal.aborted) setIsCustomerLoading(false);
      }
    }

    void loadCustomers();
    return () => controller.abort();
  }, [customerRequestVersion]);

  const normalizedCustomerQuery = customerQuery.trim().toLowerCase();
  const matchingCustomers = customers.filter((customer) =>
    customer.name.toLowerCase().includes(normalizedCustomerQuery),
  );

  useEffect(() => {
    if (!isCustomerListOpen) return;

    const activeOption = customerListRef.current?.children[activeCustomerIndex];
    if (activeOption instanceof HTMLElement) {
      activeOption.scrollIntoView({ block: "nearest" });
    }
  }, [activeCustomerIndex, customerQuery, isCustomerListOpen]);

  const saleLineDetails = saleLines.map((line, index) => {
    const selectedItem = availableItems.find(
      (item) => item.id === Number(line.inventoryId),
    );
    const item = selectedItem ?? (index === 0 ? preferredItem : undefined);
    const quantity = Number(line.quantity);
    const automaticPrice = item
      ? getAutomaticUnitPrice(item, quantity)
      : { price: 0, usesWholesalePrice: false };
    const usesWholesalePrice = automaticPrice.usesWholesalePrice;
    const unitPrice = automaticPrice.price;
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

  const selectCustomer = (customer: CustomerDetails) => {
    setSelectedCustomer(customer);
    setCustomerQuery(customer.name);
    setIsCustomerListOpen(false);
    setActiveCustomerIndex(0);
    setError("");
  };

  const handleCustomerKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (!isCustomerListOpen || matchingCustomers.length === 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveCustomerIndex((index) =>
        Math.min(index + 1, matchingCustomers.length - 1),
      );
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveCustomerIndex((index) => Math.max(index - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      selectCustomer(matchingCustomers[activeCustomerIndex]);
    } else if (event.key === "Escape") {
      setIsCustomerListOpen(false);
    }
  };

  const openReceiptPreview = () => {
    if (!selectedCustomer) {
      setError("Select an existing customer before viewing the receipt.");
      return;
    }

    const hasInvalidLine = saleLineDetails.some(
      (line) =>
        !line.item ||
        !Number.isInteger(line.quantity) ||
        line.quantity < 1 ||
        line.quantity > line.item.quantity,
    );
    if (hasInvalidLine) {
      setError("Complete the sale items before viewing the receipt.");
      return;
    }
    if (!paymentMethod) {
      setError("Select a payment method before viewing the receipt.");
      return;
    }

    setError("");
    setIsCustomerListOpen(false);
    setReceiptGeneratedAt(new Date());
    setIsReceiptOpen(true);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

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

    if (!selectedCustomer) {
      setError("Select an existing customer from the suggestions.");
      return;
    }
    if (!paymentMethod) {
      setError("Select a payment method before saving the sale.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      await createSaleBatch({
        customerId: selectedCustomer.id,
        customerName: selectedCustomer.name,
        paymentMethod,
        generateOfficialReceipt: true,
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
    <>
      {isReceiptOpen && selectedCustomer && receiptGeneratedAt && (
        <OfficialReceiptPreview
          onClose={() => setIsReceiptOpen(false)}
          receipt={{
            transactionId: null,
            orderDate: receiptGeneratedAt,
            customerName: selectedCustomer.name,
            customerNumber: selectedCustomer.number,
            customerAddress: selectedCustomer.address,
            customerLandmark: selectedCustomer.landmark,
            paymentMethod: paymentMethod || null,
            items: saleLineDetails.flatMap((line) =>
              line.item
                ? [
                    {
                      id: line.item.id,
                      itemName: line.item.item,
                      itemCategory: line.item.category,
                      quantity: line.quantity,
                      unitPrice: line.unitPrice,
                    },
                  ]
                : [],
            ),
            status: "PREVIEW",
          }}
        />
      )}
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
                                    item.quantity === 0 ||
                                    isSelectedByAnotherLine
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

              <div
                ref={customerFieldRef}
                className="relative"
                onBlurCapture={(event) => {
                  if (
                    !event.currentTarget.contains(event.relatedTarget as Node)
                  ) {
                    setIsCustomerListOpen(false);
                  }
                }}
              >
                <label
                  htmlFor="sale-customer-search"
                  className="block text-sm font-extrabold text-[#283b2c]"
                >
                  Customer
                </label>
                <div className="relative mt-2">
                  <Search
                    size={18}
                    aria-hidden="true"
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-[#78837b]"
                  />
                  <input
                    id="sale-customer-search"
                    className="inventory-field"
                    style={{ paddingLeft: "3rem" }}
                    type="text"
                    autoComplete="off"
                    role="combobox"
                    aria-autocomplete="list"
                    aria-controls="sale-customer-suggestions"
                    aria-expanded={isCustomerListOpen}
                    aria-activedescendant={
                      isCustomerListOpen && matchingCustomers.length
                        ? `sale-customer-option-${matchingCustomers[activeCustomerIndex].id}`
                        : undefined
                    }
                    disabled={isSubmitting || isCustomerLoading}
                    value={customerQuery}
                    onFocus={() => setIsCustomerListOpen(true)}
                    onKeyDown={handleCustomerKeyDown}
                    onChange={(event) => {
                      setCustomerQuery(event.target.value);
                      setSelectedCustomer(null);
                      setActiveCustomerIndex(0);
                      setIsCustomerListOpen(true);
                      setError("");
                    }}
                    placeholder={
                      isCustomerLoading
                        ? "Loading customers..."
                        : "Search customer name"
                    }
                  />
                </div>

                {isCustomerListOpen && !isCustomerLoading && !customerError && (
                  <div
                    id="sale-customer-suggestions"
                    ref={customerListRef}
                    role="listbox"
                    className="absolute z-20 mt-2 max-h-36.5 w-full overflow-y-auto rounded-xl border border-[#d7dfd5] bg-white p-1.5 shadow-xl"
                  >
                    {matchingCustomers.length ? (
                      matchingCustomers.map((customer, index) => (
                        <button
                          id={`sale-customer-option-${customer.id}`}
                          key={customer.id}
                          type="button"
                          role="option"
                          aria-selected={selectedCustomer?.id === customer.id}
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => selectCustomer(customer)}
                          className={`flex h-11 w-full items-center justify-between gap-3 rounded-lg px-3 text-left text-sm transition ${
                            index === activeCustomerIndex
                              ? "bg-[#eaf2e9] text-[#173b24]"
                              : "text-[#283b2c] hover:bg-[#f3f6f1]"
                          }`}
                        >
                          <span className="min-w-0 flex-1 truncate font-extrabold">
                            {customer.name}
                          </span>
                          <span className="shrink-0 whitespace-nowrap text-xs font-semibold text-[#748078]">
                            {customer.number}
                          </span>
                        </button>
                      ))
                    ) : (
                      <p className="px-3 py-4 text-center text-sm font-semibold text-[#748078]">
                        No matching customers found.
                      </p>
                    )}
                  </div>
                )}

                {customerError && (
                  <div className="mt-2 flex items-center justify-between gap-3 rounded-xl bg-[#fff0e8] px-3 py-2 text-sm text-[#8f421f]">
                    <span className="font-semibold">{customerError}</span>
                    <button
                      type="button"
                      onClick={() =>
                        setCustomerRequestVersion((version) => version + 1)
                      }
                      className="shrink-0 font-black underline"
                    >
                      Retry
                    </button>
                  </div>
                )}
              </div>

              <label className="block text-sm font-extrabold text-[#283b2c]">
                Contact Number
                <div className="relative mt-2">
                  <Phone
                    size={18}
                    aria-hidden="true"
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-[#78837b]"
                  />
                  <input
                    className="inventory-field bg-[#f3f6f1] text-[#59655d]"
                    style={{ paddingLeft: "3rem" }}
                    type="text"
                    readOnly
                    value={selectedCustomer?.number ?? ""}
                    placeholder="Select a customer first"
                  />
                </div>
              </label>

              <label className="block text-sm font-extrabold text-[#283b2c]">
                Payment Method
                <select
                  className="inventory-field mt-2"
                  disabled={isSubmitting}
                  onChange={(event) => {
                    setPaymentMethod(event.target.value as PaymentMethod | "");
                    setError("");
                  }}
                  required
                  value={paymentMethod}
                >
                  <option value="">Select payment method</option>
                  {paymentMethodOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <div className="flex items-center justify-between gap-4 rounded-2xl bg-[#f3f6f1] px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-[#68736b]">
                    Sale total
                  </p>
                  <p className="mt-1 text-xs font-semibold text-[#89928b]">
                    {saleLines.length}{" "}
                    {saleLines.length === 1 ? "item" : "items"}
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

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={openReceiptPreview}
                  disabled={isSubmitting}
                  className="flex h-13 items-center justify-center gap-2 rounded-xl border border-[#b9c8b8] bg-white px-4 text-sm font-black text-[#173b24] hover:bg-[#f3f6f1] disabled:opacity-50"
                >
                  <ReceiptText size={18} aria-hidden="true" />
                  View OR
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  aria-busy={isSubmitting}
                  className="flex h-13 items-center justify-center gap-2 rounded-xl bg-[#173b24] px-4 text-sm font-black text-white transition hover:bg-[#245334] disabled:cursor-wait disabled:opacity-70"
                >
                  {isSubmitting ? (
                    <LoaderCircle
                      size={18}
                      className="animate-spin"
                      aria-hidden="true"
                    />
                  ) : (
                    <Plus size={18} aria-hidden="true" />
                  )}
                  {isSubmitting ? "Saving..." : "Save sale"}
                </button>
              </div>
            </form>
          )}
        </section>
      </div>
    </>
  );
}

export function OfficialReceiptPreview({
  onClose,
  receipt,
}: {
  onClose: () => void;
  receipt: OfficialReceiptPreviewData;
}) {
  const formattedDate = receipt.orderDate.toLocaleString("en-PH", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
  const customerAddress = receipt.customerAddress
    ? `${receipt.customerAddress}${
        receipt.customerLandmark
          ? ` (Landmark: ${receipt.customerLandmark})`
          : ""
      }`
    : "Not available";
  const total = receipt.items.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0,
  );

  return (
    <div
      className="official-receipt-print-root fixed inset-0 z-90 flex items-start justify-center overflow-y-auto bg-[#0d2417]/60 p-2 backdrop-blur-sm sm:items-center sm:p-4"
      role="presentation"
      onMouseDown={onClose}
    >
      <section
        aria-labelledby="official-receipt-title"
        aria-modal="true"
        className="official-receipt-sheet relative my-auto w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl"
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close official receipt preview"
          className="official-receipt-print-actions absolute right-3 top-3 z-10 grid size-9 place-items-center rounded-xl border border-[#d7dfd5] bg-white text-[#173b24] hover:bg-[#f3f6f1]"
        >
          <X size={18} aria-hidden="true" />
        </button>

        <div className="p-4 text-[#111a14] sm:p-5">
          <header className="border-b border-[#d8dfd5] pb-3 pr-10">
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-xl border border-[#dce2da] bg-white p-1">
                <BrandMark />
              </span>
              <div className="min-w-0">
                <p className="text-lg font-black sm:text-xl">Adamos Fresh Eggs</p>
                <p className="mt-0.5 break-words text-[11px] leading-4 sm:text-xs">
                  Address: Olongapo City | Contact: 0917 123 4567 | Email:
                  adamosfresheggs@gmail.com
                </p>
              </div>
            </div>
          </header>

          <div className="flex flex-col gap-1 border-b border-[#d8dfd5] py-3 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
            <h2
              id="official-receipt-title"
              className="text-2xl font-black tracking-tight text-[#173b24] sm:text-3xl"
            >
              OFFICIAL RECEIPT
            </h2>
            <div className="text-xs font-semibold leading-5 sm:text-right">
              <p>Order/Transaction ID: {receipt.transactionId ?? "Pending"}</p>
              <p>{formattedDate}</p>
            </div>
          </div>

          <section className="border-b border-[#d8dfd5] py-3">
            <div className="mb-2 flex items-center gap-2">
              <span className="grid size-8 place-items-center rounded-lg bg-[#e1eedc] text-[#173b24]">
                <UserRound size={18} aria-hidden="true" />
              </span>
              <h3 className="text-base font-black">CUSTOMER DETAILS</h3>
            </div>
            <dl className="grid gap-x-3 gap-y-1 text-xs sm:grid-cols-[4.5rem_minmax(0,1fr)] sm:text-sm">
              <dt className="font-bold">Name:</dt>
              <dd className="break-words">{receipt.customerName}</dd>
              <dt className="font-bold">Phone:</dt>
              <dd>{receipt.customerNumber ?? "Not available"}</dd>
              <dt className="font-bold">Address:</dt>
              <dd className="break-words">{customerAddress}</dd>
            </dl>
          </section>

          <section className="py-3">
            <h3 className="mb-1 text-base font-black">ITEMS PURCHASED</h3>
            <div className="overflow-x-auto rounded-lg border border-[#173b24]">
              <table className="w-full min-w-136 table-fixed border-collapse text-left text-[10px] sm:text-xs">
                <thead className="bg-[#dcebd8]">
                  <tr>
                    <th className="w-[18%] px-1.5 py-1.5 font-black sm:px-2">
                      ITEM
                    </th>
                    <th className="w-[30%] px-1.5 py-1.5 font-black sm:px-2">
                      ITEM (TYPE/SIZE)
                    </th>
                    <th className="w-[10%] px-1.5 py-1.5 font-black sm:px-2">
                      QTY
                    </th>
                    <th className="w-[20%] px-1.5 py-1.5 text-right font-black sm:px-2">
                      PRICE
                    </th>
                    <th className="w-[22%] px-1.5 py-1.5 text-right font-black sm:px-2">
                      SUBTOTAL
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {receipt.items.map((line) => (
                    <tr className="border-t border-[#78907d]" key={line.id}>
                      <td className="wrap-break-word px-1.5 py-1.5 font-semibold sm:px-2">
                        {line.itemCategory === "eggs"
                          ? "Fresh Eggs"
                          : "Palm Oil"}
                      </td>
                      <td className="wrap-break-word px-1.5 py-1.5 sm:px-2">
                        {line.itemName}
                      </td>
                      <td className="px-1.5 py-1.5 sm:px-2">{line.quantity}</td>
                      <td className="px-1.5 py-1.5 text-right font-semibold sm:px-2">
                        {currency.format(line.unitPrice)}
                      </td>
                      <td className="px-1.5 py-1.5 text-right font-semibold sm:px-2">
                        {currency.format(line.unitPrice * line.quantity)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="ml-auto w-full max-w-xs pb-3 text-xs sm:text-sm">
            <h3 className="mb-1 text-right text-base font-black">
              TRANSACTION SUMMARY
            </h3>
            <dl className="space-y-1">
              <div className="flex justify-between gap-6">
                <dt>Subtotal</dt>
                <dd>{currency.format(total)}</dd>
              </div>
              <div className="flex justify-between gap-6">
                <dt>Delivery Fee</dt>
                <dd>{currency.format(0)}</dd>
              </div>
              <div className="my-1.5 flex justify-between gap-6 rounded-lg bg-[#dcebd8] px-3 py-1.5 text-base font-black">
                <dt>Total Amount:</dt>
                <dd>{currency.format(total)}</dd>
              </div>
              <div className="flex justify-between gap-6">
                <dt>Payment Method:</dt>
                <dd>{formatPaymentMethod(receipt.paymentMethod)}</dd>
              </div>
              <div className="flex items-center justify-between gap-6">
                <dt>Status</dt>
                <dd className="rounded-full bg-[#e4eddf] px-2.5 py-0.5 text-[10px] font-black text-[#173b24]">
                  {receipt.status}
                </dd>
              </div>
            </dl>
          </section>

          <footer className="flex flex-col gap-3 border-t border-[#d8dfd5] pt-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="text-xs">
              <p>Thank you for purchasing at Adamos Fresh Eggs!</p>
              <p className="font-semibold">
                {receipt.status === "PREVIEW"
                  ? "*This is a preview generated by Adamos Inventory System."
                  : "*This receipt was generated by Adamos Inventory System."}
              </p>
            </div>
            <div className="official-receipt-print-actions flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-[#173b24] px-4 text-xs font-black text-white hover:bg-[#245334]"
              >
                <Printer size={17} aria-hidden="true" />
                Print
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                title="Choose Save as PDF in the print dialog"
                className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-[#173b24] bg-white px-4 text-xs font-black text-[#173b24] hover:bg-[#f3f6f1]"
              >
                <Download size={17} aria-hidden="true" />
                Download
              </button>
            </div>
          </footer>
        </div>
      </section>
    </div>
  );
}
