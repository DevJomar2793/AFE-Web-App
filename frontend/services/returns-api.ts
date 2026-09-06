export type DatabaseReturnItem = {
  id: number;
  name: string;
};

export type DatabaseReturn = {
  id: number;
  inventoryId: number;
  item: DatabaseReturnItem;
  quantity: number;
  customerName: string;
  reason: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateReturnInput = {
  inventoryId: number;
  quantity: number;
  customerName: string;
  reason: string;
};

const RETURNS_API_ROUTE =
  "http://127.0.0.1:8000/api/v1/returns/get-returns";

export async function getReturns(
  signal?: AbortSignal,
): Promise<DatabaseReturn[]> {
  const response = await fetch(RETURNS_API_ROUTE, {
    cache: "no-store",
    signal,
  });
  const responseBody: unknown = await response.json();

  if (!response.ok) {
    throw new Error(
      getApiErrorMessage(responseBody, "Unable to load returns."),
    );
  }

  return parseReturns(responseBody);
}

export async function createReturn(
  input: CreateReturnInput,
): Promise<DatabaseReturn> {
  const response = await fetch("/api/v1/returns", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      inventory_id: input.inventoryId,
      quantity: input.quantity,
      customer_name: input.customerName,
      reason: input.reason,
    }),
  });
  const responseBody: unknown = await response.json();

  if (!response.ok) {
    throw new Error(
      getApiErrorMessage(responseBody, "The return could not be saved."),
    );
  }

  return parseReturn(responseBody);
}

export function parseReturns(value: unknown): DatabaseReturn[] {
  if (!Array.isArray(value)) throw new Error("Invalid returns response");
  return value.map(parseReturn);
}

function parseReturn(value: unknown): DatabaseReturn {
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
    item: {
      id: value.item.id,
      name: value.item.item,
    },
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
