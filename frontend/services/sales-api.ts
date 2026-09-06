export type DatabaseSaleItem = {
  id: number;
  name: string;
};

export type DatabaseSale = {
  id: number;
  inventoryId: number;
  item: DatabaseSaleItem;
  quantity: number;
  price: number;
  customerName: string;
  createdAt: string;
  updatedAt: string;
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

const SALES_API_ROUTE = "http://127.0.0.1:8000/api/v1/sales";

export async function getSales(signal?: AbortSignal): Promise<DatabaseSale[]> {
  const response = await fetch(`${SALES_API_ROUTE}/get-sales`, {
    cache: "no-store",
    signal,
  });
  const responseBody: unknown = await response.json();

  if (!response.ok) {
    throw new Error(getApiErrorMessage(responseBody, "Unable to load sales."));
  }

  return parseSales(responseBody);
}

export async function createSale(input: CreateSaleInput): Promise<DatabaseSale> {
  const response = await fetch(`${SALES_API_ROUTE}/add-sales`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      inventory_id: input.inventoryId,
      quantity: input.quantity,
      customer_name: input.customerName,
    }),
  });
  const responseBody: unknown = await response.json();

  if (!response.ok) {
    throw new Error(
      getApiErrorMessage(responseBody, "The sale could not be saved."),
    );
  }

  return parseSale(responseBody);
}

export async function updateSale(
  saleId: number,
  input: UpdateSaleInput,
): Promise<DatabaseSale> {
  const response = await fetch(`${SALES_API_ROUTE}/${saleId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const responseBody: unknown = await response.json();

  if (!response.ok) {
    throw new Error(
      getApiErrorMessage(responseBody, "The sale could not be updated."),
    );
  }

  return parseSale(responseBody);
}

export function parseSales(value: unknown): DatabaseSale[] {
  if (!Array.isArray(value)) throw new Error("Invalid sales response");
  return value.map(parseSale);
}

function parseSale(value: unknown): DatabaseSale {
  if (!isRecord(value) || !isRecord(value.item)) {
    throw new Error("Invalid sale");
  }

  const price =
    typeof value.price === "string" || typeof value.price === "number"
      ? Number(value.price)
      : Number.NaN;

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
    item: {
      id: value.item.id,
      name: value.item.item,
    },
    quantity: value.quantity,
    price,
    customerName: value.customer_name,
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
