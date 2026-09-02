export type InventoryDatabaseStatus =
  | "in_stock"
  | "low_stock"
  | "out_of_stock";

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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isInventoryStatus(value: unknown): value is InventoryDatabaseStatus {
  return (
    value === "in_stock" ||
    value === "low_stock" ||
    value === "out_of_stock"
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
