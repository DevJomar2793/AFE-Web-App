"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  MapPin,
  Pencil,
  Phone,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";

interface Customer {
  id: number;
  name: string;
  number: string;
  address: string;
  landmark: string;
}

interface CustomerFormValues {
  name: string;
  number: string;
  address: string;
  landmark: string;
}

const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 1,
    name: "Juan Dela Cruz",
    number: "0917 123 4567",
    address: "Gordon Heights, Olongapo City",
    landmark: "Near Gordon Heights Elem. School",
  },
  {
    id: 2,
    name: "Maria Santos",
    number: "0928 987 6543",
    address: "New Cabalan, Olongapo City",
    landmark: "Beside 7-Eleven",
  },
  {
    id: 3,
    name: "Carlos Reyes",
    number: "0906 555 7890",
    address: "Barretto, Olongapo City",
    landmark: "In front of Barretto Church",
  },
];

export function CustomerInformation() {
  const [customers, setCustomers] = useState<Customer[]>(INITIAL_CUSTOMERS);
  const [query, setQuery] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [customerToEdit, setCustomerToEdit] = useState<Customer | null>(null);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(
    null,
  );

  const normalizedQuery = query.trim().toLowerCase();
  const visibleCustomers = customers.filter((customer) => {
    if (!normalizedQuery) return true;

    return [
      customer.name,
      customer.number,
      customer.address,
      customer.landmark,
    ].some((value) => value.toLowerCase().includes(normalizedQuery));
  });

  function addCustomer(values: CustomerFormValues) {
    const nextId = Math.max(0, ...customers.map((customer) => customer.id)) + 1;
    setCustomers((currentCustomers) => [
      ...currentCustomers,
      { id: nextId, ...values },
    ]);
    setIsAddModalOpen(false);
  }

  function updateCustomer(values: CustomerFormValues) {
    if (!customerToEdit) return;

    setCustomers((currentCustomers) =>
      currentCustomers.map((customer) =>
        customer.id === customerToEdit.id
          ? { ...customer, ...values }
          : customer,
      ),
    );
    setCustomerToEdit(null);
  }

  function deleteCustomer() {
    if (!customerToDelete) return;

    setCustomers((currentCustomers) =>
      currentCustomers.filter(
        (customer) => customer.id !== customerToDelete.id,
      ),
    );
    setCustomerToDelete(null);
  }

  function refreshCustomers() {
    setCustomers(INITIAL_CUSTOMERS);
    setQuery("");
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-[#dce3da] bg-white shadow-[0_10px_30px_rgba(23,59,36,0.04)]">
      <div className="flex flex-col gap-4 border-b border-[#e4e9e2] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex items-start gap-4">
          <span className="grid size-13 shrink-0 place-items-center rounded-2xl bg-[#e4f2e3] text-[#173b24]">
            <UsersRound size={25} aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-xl font-black text-[#152719]">Customers</h2>
            <p className="mt-1 text-sm leading-6 text-[#6f7971]">
              Manage customer information such as name, number, address, and
              landmark.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#173b24] px-5 text-sm font-black text-white transition hover:bg-[#245334]"
        >
          <Plus size={18} aria-hidden="true" />
          Add Customer
        </button>
      </div>

      <div className="flex flex-col gap-3 border-b border-[#e4e9e2] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <label className="relative block w-full max-w-xl">
          <span className="sr-only">
            Search customers by name, number, address, or landmark
          </span>
          <Search
            size={18}
            aria-hidden="true"
            className="absolute left-4 top-1/2 -translate-y-1/2 text-[#78837b]"
          />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="inventory-field pl-11"
            placeholder="Search by name, number, address, or landmark..."
          />
        </label>

        <button
          type="button"
          onClick={refreshCustomers}
          className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-[#cfd8cd] bg-white px-5 text-sm font-black text-[#273b2c] transition hover:bg-[#f5f8f4]"
        >
          <RotateCcw size={18} aria-hidden="true" />
          Refresh
        </button>
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-225 border-collapse text-left">
          <thead>
            <tr className="bg-[#f6f8f4] text-xs font-black uppercase tracking-wider text-[#69736c]">
              <th className="px-6 py-4">Name</th>
              <th className="px-5 py-4">Number</th>
              <th className="px-5 py-4">Address</th>
              <th className="px-5 py-4">Landmark</th>
              <th className="px-5 py-4 text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {visibleCustomers.map((customer) => (
              <CustomerTableRow
                key={customer.id}
                customer={customer}
                onDelete={() => setCustomerToDelete(customer)}
                onEdit={() => setCustomerToEdit(customer)}
              />
            ))}
          </tbody>
        </table>

        {!visibleCustomers.length && <EmptyCustomers query={query} />}
      </div>

      <div className="space-y-3 p-4 md:hidden">
        {visibleCustomers.map((customer) => (
          <CustomerCard
            key={customer.id}
            customer={customer}
            onDelete={() => setCustomerToDelete(customer)}
            onEdit={() => setCustomerToEdit(customer)}
          />
        ))}

        {!visibleCustomers.length && <EmptyCustomers query={query} />}
      </div>

      {isAddModalOpen && (
        <CustomerFormModal
          key="add-customer"
          mode="add"
          onCancel={() => setIsAddModalOpen(false)}
          onSave={addCustomer}
        />
      )}

      {customerToEdit && (
        <CustomerFormModal
          key={customerToEdit.id}
          mode="edit"
          customer={customerToEdit}
          onCancel={() => setCustomerToEdit(null)}
          onSave={updateCustomer}
        />
      )}

      {customerToDelete && (
        <DeleteCustomerModal
          customer={customerToDelete}
          onCancel={() => setCustomerToDelete(null)}
          onConfirm={deleteCustomer}
        />
      )}
    </section>
  );
}

function CustomerTableRow({
  customer,
  onDelete,
  onEdit,
}: {
  customer: Customer;
  onDelete: () => void;
  onEdit: () => void;
}) {
  return (
    <tr className="border-t border-[#e7ebe5] text-sm text-[#1c2920]">
      <td className="px-6 py-4 font-black">
        <span className="flex items-center gap-3">
          <UserRound size={19} aria-hidden="true" />
          {customer.name}
        </span>
      </td>
      <td className="px-5 py-4">
        <span className="flex items-center gap-3 whitespace-nowrap">
          <Phone size={18} aria-hidden="true" />
          {customer.number}
        </span>
      </td>
      <td className="px-5 py-4">
        <span className="flex items-start gap-3">
          <MapPin size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
          {customer.address}
        </span>
      </td>
      <td className="px-5 py-4">
        <span className="flex items-start gap-3">
          <MapPin size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
          {customer.landmark}
        </span>
      </td>
      <td className="px-5 py-3">
        <CustomerActions
          customerName={customer.name}
          onDelete={onDelete}
          onEdit={onEdit}
        />
      </td>
    </tr>
  );
}

function CustomerCard({
  customer,
  onDelete,
  onEdit,
}: {
  customer: Customer;
  onDelete: () => void;
  onEdit: () => void;
}) {
  return (
    <article className="rounded-2xl border border-[#e0e6de] bg-[#fbfcfa] p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#e4f2e3] text-[#173b24]">
            <UserRound size={20} aria-hidden="true" />
          </span>
          <h3 className="truncate font-black text-[#17281b]">
            {customer.name}
          </h3>
        </div>
        <CustomerActions
          customerName={customer.name}
          onDelete={onDelete}
          onEdit={onEdit}
        />
      </div>

      <dl className="mt-4 space-y-3 text-sm">
        <CustomerDetail icon={<Phone size={17} />} label="Number">
          {customer.number}
        </CustomerDetail>
        <CustomerDetail icon={<MapPin size={17} />} label="Address">
          {customer.address}
        </CustomerDetail>
        <CustomerDetail icon={<MapPin size={17} />} label="Landmark">
          {customer.landmark}
        </CustomerDetail>
      </dl>
    </article>
  );
}

function CustomerDetail({
  children,
  icon,
  label,
}: {
  children: React.ReactNode;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <div className="grid grid-cols-[1.25rem_5rem_1fr] gap-2">
      <span className="mt-0.5 text-[#637068]" aria-hidden="true">
        {icon}
      </span>
      <dt className="font-bold text-[#69736c]">{label}</dt>
      <dd className="min-w-0 text-[#243229]">{children}</dd>
    </div>
  );
}

function CustomerActions({
  customerName,
  onDelete,
  onEdit,
}: {
  customerName: string;
  onDelete: () => void;
  onEdit: () => void;
}) {
  return (
    <div className="flex items-center justify-center gap-2">
      <button
        type="button"
        onClick={onEdit}
        aria-label={`Edit ${customerName}`}
        title={`Edit ${customerName}`}
        className="grid size-9 place-items-center rounded-xl border border-[#dce3da] bg-[#f8faf7] text-[#173b24] transition hover:bg-[#eaf2e9]"
      >
        <Pencil size={16} aria-hidden="true" />
      </button>
      <button
        type="button"
        onClick={onDelete}
        aria-label={`Delete ${customerName}`}
        title={`Delete ${customerName}`}
        className="grid size-9 place-items-center rounded-xl bg-[#fde8e8] text-[#d42f2f] transition hover:bg-[#fbdada]"
      >
        <Trash2 size={16} aria-hidden="true" />
      </button>
    </div>
  );
}

function EmptyCustomers({ query }: { query: string }) {
  return (
    <div className="p-10 text-center text-sm font-semibold text-[#748078]">
      {query.trim()
        ? `No customers match “${query.trim()}”.`
        : "No customer information is available."}
    </div>
  );
}

function CustomerFormModal({
  customer,
  mode,
  onCancel,
  onSave,
}: {
  customer?: Customer;
  mode: "add" | "edit";
  onCancel: () => void;
  onSave: (values: CustomerFormValues) => void;
}) {
  const [name, setName] = useState(customer?.name ?? "");
  const [number, setNumber] = useState(customer?.number ?? "");
  const [address, setAddress] = useState(customer?.address ?? "");
  const [landmark, setLandmark] = useState(customer?.landmark ?? "");
  const [error, setError] = useState("");

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") onCancel();
    }

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onCancel]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const values: CustomerFormValues = {
      name: name.trim(),
      number: number.trim(),
      address: address.trim(),
      landmark: landmark.trim(),
    };

    if (Object.values(values).some((value) => !value)) {
      setError("Complete all customer information fields.");
      return;
    }

    onSave(values);
  }

  const isEditing = mode === "edit";

  return (
    <div
      className="fixed inset-0 z-70 flex items-end justify-center bg-[#0d2417]/55 p-0 backdrop-blur-sm sm:items-center sm:p-6"
      role="presentation"
      onMouseDown={onCancel}
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
              setName(value);
              setError("");
            }}
          />
          <CustomerInput
            label="Number"
            placeholder="09XX XXX XXXX"
            type="tel"
            value={number}
            onChange={(value) => {
              setNumber(value);
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
          <CustomerInput
            label="Landmark"
            placeholder="Nearby landmark"
            value={landmark}
            onChange={(value) => {
              setLandmark(value);
              setError("");
            }}
          />

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
              className="h-12 rounded-xl border border-[#cfd8cd] bg-white px-4 text-sm font-black text-[#173b24] hover:bg-[#f8faf7]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="h-12 rounded-xl bg-[#173b24] px-4 text-sm font-black text-white hover:bg-[#245334]"
            >
              Save
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
  onChange,
  placeholder,
  type = "text",
  value,
}: {
  autoFocus?: boolean;
  label: string;
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
        maxLength={255}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required
        type={type}
        value={value}
      />
    </label>
  );
}

function DeleteCustomerModal({
  customer,
  onCancel,
  onConfirm,
}: {
  customer: Customer;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") onCancel();
    }

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onCancel]);

  return (
    <div
      className="fixed inset-0 z-70 flex items-end justify-center bg-[#0d2417]/55 p-0 backdrop-blur-sm sm:items-center sm:p-6"
      role="presentation"
      onMouseDown={onCancel}
    >
      <section
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-customer-title"
        aria-describedby="delete-customer-description"
        className="w-full max-w-md rounded-t-3xl bg-white p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl sm:rounded-3xl sm:p-7"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <span className="grid size-12 place-items-center rounded-2xl bg-[#fde8e8] text-[#c83131]">
          <Trash2 size={21} aria-hidden="true" />
        </span>
        <h2
          id="delete-customer-title"
          className="mt-5 text-2xl font-black text-[#17281b]"
        >
          Delete {customer.name}?
        </h2>
        <p
          id="delete-customer-description"
          className="mt-2 text-sm leading-6 text-[#6d776f]"
        >
          This removes the customer from the temporary list. Refreshing the
          page will restore the original sample data.
        </p>

        <div className="mt-7 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="h-12 rounded-xl border border-[#cfd8cd] bg-white px-4 text-sm font-black text-[#173b24] hover:bg-[#f8faf7]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#a33d22] px-4 text-sm font-black text-white hover:bg-[#852f19]"
          >
            <Trash2 size={17} aria-hidden="true" />
            Delete
          </button>
        </div>
      </section>
    </div>
  );
}
