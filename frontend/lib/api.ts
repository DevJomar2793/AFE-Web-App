export type InventoryStatus = "in_stock" | "low_stock" | "out_of_stock";

export type InventoryItem = {
  id: number;
  item: string;
  quantity: number;
  returnsCount: number;
  price: number;
  wholesalePrice: number | null;
  status: InventoryStatus;
  createdAt: string;
  updatedAt: string;
};

export type Sale = {
  id: number;
  inventoryId: number;
  item: { id: number; name: string };
  quantity: number;
  price: number;
  customerName: string;
  createdAt: string;
  updatedAt: string;
};

export type InventoryReturn = {
  id: number;
  inventoryId: number;
  item: { id: number; name: string };
  quantity: number;
  customerName: string;
  reason: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateInventoryItemInput = {
  item: string;
  quantity: number;
  price: number;
  wholesalePrice: number | null;
};

export type UpdateInventoryItemInput = {
  quantity: number;
  price: number;
  wholesalePrice: number | null;
};

export type CreateSaleInput = {
  inventoryId: number;
  quantity: number;
  customerName: string;
};

export type UpdateSaleInput = {
  price: number;
  quantity: number;
};

export type CreateReturnInput = {
  inventoryId: number;
  quantity: number;
  customerName: string;
  reason: string;
};

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_BACKEND_API_URL ?? "http://127.0.0.1:8000"
).replace(/\/+$/, "");

export async function getInventoryItems(
  signal?: AbortSignal,
): Promise<InventoryItem[]> {
  const response = await apiRequest(
    "/api/v1/inventory/get-item",
    { signal },
    "Unable to load inventory.",
  );
  if (!Array.isArray(response)) throw new Error("Invalid inventory response");
  return response.map(parseInventoryItem);
}

export async function createInventoryItem(
  input: CreateInventoryItemInput,
): Promise<InventoryItem> {
  const response = await apiRequest(
    "/api/v1/inventory/add-stock",
    {
      method: "POST",
      body: JSON.stringify({
        item: input.item,
        quantity: input.quantity,
        price: input.price,
        wholesale_price: input.wholesalePrice,
      }),
    },
    "The inventory item could not be added.",
  );
  return parseInventoryItem(response);
}

export async function updateInventoryItem(
  inventoryId: number,
  input: UpdateInventoryItemInput,
): Promise<InventoryItem> {
  const response = await apiRequest(
    `/api/v1/inventory/${inventoryId}`,
    {
      method: "PATCH",
      body: JSON.stringify({
        quantity: input.quantity,
        price: input.price,
        wholesale_price: input.wholesalePrice,
      }),
    },
    "The inventory item could not be updated.",
  );
  return parseInventoryItem(response);
}

export async function getSales(signal?: AbortSignal): Promise<Sale[]> {
  const response = await apiRequest(
    "/api/v1/sales/get-sales",
    { signal },
    "Unable to load sales.",
  );
  if (!Array.isArray(response)) throw new Error("Invalid sales response");
  return response.map(parseSale);
}

export async function createSale(input: CreateSaleInput): Promise<Sale> {
  const response = await apiRequest(
    "/api/v1/sales/add-sales",
    {
      method: "POST",
      body: JSON.stringify({
        inventory_id: input.inventoryId,
        quantity: input.quantity,
        customer_name: input.customerName,
      }),
    },
    "The sale could not be saved.",
  );
  return parseSale(response);
}

export async function updateSale(
  saleId: number,
  input: UpdateSaleInput,
): Promise<Sale> {
  const response = await apiRequest(
    `/api/v1/sales/${saleId}`,
    { method: "PATCH", body: JSON.stringify(input) },
    "The sale could not be updated.",
  );
  return parseSale(response);
}

export async function getReturns(
  signal?: AbortSignal,
): Promise<InventoryReturn[]> {
  const response = await apiRequest(
    "/api/v1/returns/get-returns",
    { signal },
    "Unable to load returns.",
  );
  if (!Array.isArray(response)) throw new Error("Invalid returns response");
  return response.map(parseReturn);
}

export async function createReturn(
  input: CreateReturnInput,
): Promise<InventoryReturn> {
  const response = await apiRequest(
    "/api/v1/returns/add-returns",
    {
      method: "POST",
      body: JSON.stringify({
        inventory_id: input.inventoryId,
        quantity: input.quantity,
        customer_name: input.customerName,
        reason: input.reason,
      }),
    },
    "The return could not be saved.",
  );
  return parseReturn(response);
}

async function apiRequest(
  path: string,
  options: RequestInit,
  fallbackMessage: string,
): Promise<unknown> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    cache: "no-store",
    headers: {
      Accept: "application/json",
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
  });
  const responseBody: unknown = await response.json();

  if (!response.ok) {
    throw new Error(getApiErrorMessage(responseBody, fallbackMessage));
  }

  return responseBody;
}

function parseInventoryItem(value: unknown): InventoryItem {
  if (!isRecord(value)) throw new Error("Invalid inventory item");
  const price = parsePrice(value.price);
  const wholesalePrice = parseNullablePrice(value.wholesale_price);

  if (
    !isPositiveInteger(value.id) ||
    typeof value.item !== "string" ||
    !value.item.trim() ||
    !isNonNegativeInteger(value.quantity) ||
    !isNonNegativeInteger(value.returns_count) ||
    !Number.isFinite(price) ||
    price < 0 ||
    (wholesalePrice !== null &&
      (!Number.isFinite(wholesalePrice) || wholesalePrice < 0)) ||
    !isInventoryStatus(value.status) ||
    typeof value.created_at !== "string" ||
    typeof value.updated_at !== "string"
  ) {
    throw new Error("Invalid inventory item");
  }

  return {
    id: value.id,
    item: value.item,
    quantity: value.quantity,
    returnsCount: value.returns_count,
    price,
    wholesalePrice,
    status: value.status,
    createdAt: value.created_at,
    updatedAt: value.updated_at,
  };
}

function parseSale(value: unknown): Sale {
  if (!isRecord(value) || !isRecord(value.item)) {
    throw new Error("Invalid sale");
  }
  const price = parsePrice(value.price);

  if (
    !isPositiveInteger(value.id) ||
    !isPositiveInteger(value.inventory_id) ||
    !isPositiveInteger(value.item.id) ||
    value.item.id !== value.inventory_id ||
    typeof value.item.item !== "string" ||
    !value.item.item.trim() ||
    !isPositiveInteger(value.quantity) ||
    !Number.isFinite(price) ||
    price < 0 ||
    typeof value.customer_name !== "string" ||
    !value.customer_name.trim() ||
    !isValidDate(value.created_at) ||
    !isValidDate(value.updated_at)
  ) {
    throw new Error("Invalid sale");
  }

  return {
    id: value.id,
    inventoryId: value.inventory_id,
    item: { id: value.item.id, name: value.item.item },
    quantity: value.quantity,
    price,
    customerName: value.customer_name,
    createdAt: value.created_at,
    updatedAt: value.updated_at,
  };
}

function parseReturn(value: unknown): InventoryReturn {
  if (!isRecord(value) || !isRecord(value.item)) {
    throw new Error("Invalid return");
  }

  if (
    !isPositiveInteger(value.id) ||
    !isPositiveInteger(value.inventory_id) ||
    !isPositiveInteger(value.item.id) ||
    value.item.id !== value.inventory_id ||
    typeof value.item.item !== "string" ||
    !value.item.item.trim() ||
    !isPositiveInteger(value.quantity) ||
    typeof value.customer_name !== "string" ||
    !value.customer_name.trim() ||
    typeof value.reason !== "string" ||
    !value.reason.trim() ||
    !isValidDate(value.created_at) ||
    !isValidDate(value.updated_at)
  ) {
    throw new Error("Invalid return");
  }

  return {
    id: value.id,
    inventoryId: value.inventory_id,
    item: { id: value.item.id, name: value.item.item },
    quantity: value.quantity,
    customerName: value.customer_name,
    reason: value.reason,
    createdAt: value.created_at,
    updatedAt: value.updated_at,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isPositiveInteger(value: unknown): value is number {
  return Number.isInteger(value) && Number(value) > 0;
}

function isNonNegativeInteger(value: unknown): value is number {
  return Number.isInteger(value) && Number(value) >= 0;
}

function parsePrice(value: unknown) {
  return typeof value === "string" || typeof value === "number"
    ? Number(value)
    : Number.NaN;
}

function parseNullablePrice(value: unknown) {
  return value === null ? null : parsePrice(value);
}

function isInventoryStatus(value: unknown): value is InventoryStatus {
  return (
    value === "in_stock" || value === "low_stock" || value === "out_of_stock"
  );
}

function isValidDate(value: unknown): value is string {
  return typeof value === "string" && Number.isFinite(Date.parse(value));
}

function getApiErrorMessage(responseBody: unknown, fallback: string) {
  if (
    isRecord(responseBody) &&
    typeof responseBody.detail === "string" &&
    responseBody.detail.trim()
  ) {
    return responseBody.detail;
  }
  return fallback;
}
