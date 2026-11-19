"use client";

import { FormEvent, useEffect, useState } from "react";
import { X } from "lucide-react";
import {
  formatCustomerName,
  sanitizeCustomerNumber,
} from "@/lib/customer-format";

export interface CustomerFormValues {
  name: string;
  number: string;
  address: string;
  landmark: string;
}

interface AddCustomerModalProps {
  customer?: CustomerFormValues;
  onCancel: () => void;
  onSave: (values: CustomerFormValues) => Promise<void> | void;
}

export function AddCustomerModal({
  customer,
  onCancel,
  onSave,
}: AddCustomerModalProps) {
  const [name, setName] = useState(customer?.name.toUpperCase() ?? "");
  const [number, setNumber] = useState(customer?.number ?? "");
  const [address, setAddress] = useState(customer?.address ?? "");
  const [landmark, setLandmark] = useState(customer?.landmark ?? "");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && !isSubmitting) onCancel();
    }

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [isSubmitting, onCancel]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const values: CustomerFormValues = {
      name: formatCustomerName(name),
      number: number.trim(),
      address: address.trim(),
      landmark: landmark.trim(),
    };

    if (Object.values(values).some((value) => !value)) {
      setError("Complete all customer information fields.");
      return;
    }

    if (!/^\d{11}$/.test(values.number)) {
      setError("Enter a complete 11-digit customer number.");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave(values);
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "The customer could not be saved.",
      );
      setIsSubmitting(false);
    }
  }

  const isEditing = customer !== undefined;

  return (
    <div
      className="fixed inset-0 z-70 flex items-end justify-center bg-[#0d2417]/55 p-0 backdrop-blur-sm sm:items-center sm:p-6"
      role="presentation"
      onMouseDown={() => {
        if (!isSubmitting) onCancel();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="customer-form-title"
        className="max-h-[92dvh] w-full max-w-xl overflow-y-auto rounded-t-3xl bg-white p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl sm:rounded-3xl sm:p-7"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#a85620]">
              Customer Information
            </p>
            <h2
              id="customer-form-title"
              className="mt-2 text-2xl font-black text-[#17281b]"
            >
              {isEditing ? "Edit customer" : "Add customer"}
            </h2>
            <p className="mt-1 text-sm leading-6 text-[#6d776f]">
              {isEditing
                ? "Update the selected customer information."
                : "Enter the new customer's contact and delivery details."}
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            aria-label="Close customer form"
            className="grid size-10 shrink-0 place-items-center rounded-xl border border-[#dfe4dd] text-[#566159] hover:bg-[#f3f5f1]"
          >
            <X size={19} aria-hidden="true" />
          </button>
        </div>

        <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
          <CustomerInput
            autoFocus
            label="Name"
            placeholder="Customer name"
            value={name}
            onChange={(value) => {
              setName(value.toUpperCase());
              setError("");
            }}
          />
          <CustomerInput
            label="Number"
            inputMode="numeric"
            maxLength={11}
            placeholder="09XXXXXXXXX"
            type="tel"
            value={number}
            onChange={(value) => {
              setNumber(sanitizeCustomerNumber(value));
              setError("");
            }}
          />
          <CustomerInput
            label="Address"
            placeholder="Complete delivery address"
            value={address}
            onChange={(value) => {
              setAddress(value);
              setError("");
            }}
          />
          <label className="block text-sm font-extrabold text-[#283b2c]">
            Landmark
            <textarea
              className="inventory-field mt-2 min-h-24 resize-y py-3"
              maxLength={500}
              onChange={(event) => {
                setLandmark(event.target.value);
                setError("");
              }}
              placeholder="Nearby landmark"
              required
              rows={3}
              value={landmark}
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

          <div className="grid grid-cols-2 gap-3 pt-1">
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="h-12 rounded-xl border border-[#cfd8cd] bg-white px-4 text-sm font-black text-[#173b24] hover:bg-[#f8faf7]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="h-12 rounded-xl bg-[#173b24] px-4 text-sm font-black text-white hover:bg-[#245334]"
            >
              {isSubmitting ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function CustomerInput({
  autoFocus = false,
  label,
  inputMode,
  maxLength = 255,
  onChange,
  placeholder,
  type = "text",
  value,
}: {
  autoFocus?: boolean;
  label: string;
  inputMode?: "numeric";
  maxLength?: number;
  onChange: (value: string) => void;
  placeholder: string;
  type?: "text" | "tel";
  value: string;
}) {
  return (
    <label className="block text-sm font-extrabold text-[#283b2c]">
      {label}
      <input
        autoFocus={autoFocus}
        className="inventory-field mt-2"
        inputMode={inputMode}
        maxLength={maxLength}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required
        type={type}
        value={value}
      />
    </label>
  );
}
