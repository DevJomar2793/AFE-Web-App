export type InventoryDatabaseStatus = "in_stock" | "low_stock" | "out_of_stock";

export type DatabaseInventoryItem = {
  id: number;
  item: string;
  quantity: number;
  price: number;
  status: InventoryDatabaseStatus;
  createdAt: string;
  updatedAt: string;
};

export type CreateInventoryItemInput = {
  item: string;
  quantity: number;
  price: number;
};

const INVENTORY_API_ROUTE = "http://127.0.0.1:8000/api/v1/inventory";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isInventoryStatus(value: unknown): value is InventoryDatabaseStatus {
  return (
    value === "in_stock" || value === "low_stock" || value === "out_of_stock"
  );
}

export function parseInventoryItem(value: unknown): DatabaseInventoryItem {
  if (!isRecord(value)) throw new Error("Invalid inventory item");

  const price =
    typeof value.price === "string" || typeof value.price === "number"
      ? Number(value.price)
      : Number.NaN;

  if (
    !Number.isInteger(value.id) ||
    Number(value.id) < 1 ||
    typeof value.item !== "string" ||
    !value.item.trim() ||
    !Number.isInteger(value.quantity) ||
    Number(value.quantity) < 0 ||
    !Number.isFinite(price) ||
    price < 0 ||
    !isInventoryStatus(value.status) ||
    typeof value.created_at !== "string" ||
    typeof value.updated_at !== "string"
  ) {
    throw new Error("Invalid inventory item");
  }

  return {
    id: Number(value.id),
    item: value.item,
    quantity: Number(value.quantity),
    price,
    status: value.status,
    createdAt: value.created_at,
    updatedAt: value.updated_at,
  };
}

export function parseInventoryItems(value: unknown): DatabaseInventoryItem[] {
  if (!Array.isArray(value)) throw new Error("Invalid inventory response");
  return value.map(parseInventoryItem);
}

export async function getInventoryItems(
  signal?: AbortSignal,
): Promise<DatabaseInventoryItem[]> {
  const response = await fetch(`${INVENTORY_API_ROUTE}/get-item`, {
    cache: "no-store",
    signal,
  });
  const responseBody: unknown = await response.json();

  if (!response.ok) {
    throw new Error(
      getApiErrorMessage(responseBody, "Unable to load inventory."),
    );
  }

  return parseInventoryItems(responseBody);
}

export async function createInventoryItem(
  input: CreateInventoryItemInput,
): Promise<DatabaseInventoryItem> {
  const response = await fetch(`${INVENTORY_API_ROUTE}/add-stock`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const responseBody: unknown = await response.json();

  if (!response.ok) {
    throw new Error(
      getApiErrorMessage(
        responseBody,
        "The inventory item could not be added.",
      ),
    );
  }

  return parseInventoryItem(responseBody);
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
