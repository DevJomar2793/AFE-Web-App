import type {
  InventoryRecord,
  InventoryStatus,
} from '../types/inventory';

const INVENTORY_PATH = '/api/v1/inventory/get-item';
const SALES_PATH = '/api/v1/sales/get-sales';
const RETURNS_PATH = '/api/v1/returns/get-returns';

export interface SaleRecord {
  id: number;
  customerName: string;
  items: SaleItemRecord[];
  createdAt: string;
  updatedAt: string;
}

export interface SaleItemRecord {
  id: number;
  inventoryId: number;
  item: { id: number; name: string };
  quantity: number;
  price: number;
}

export interface ReturnRecord {
  id: number;
  inventoryId: number;
  item: { id: number; name: string };
  quantity: number;
  customerName: string;
  reason: string;
  createdAt: string;
  updatedAt: string;
}

export async function getInventoryItems(
  signal?: AbortSignal,
): Promise<InventoryRecord[]> {
  const responseBody = await getApiResponse(
    INVENTORY_PATH,
    signal,
    'Inventory could not be loaded. Check the API and try again.',
  );
  if (!Array.isArray(responseBody)) {
    throw new Error('The inventory API returned an invalid response.');
  }

  return responseBody.map(parseInventoryItem);
}

export async function getSales(signal?: AbortSignal): Promise<SaleRecord[]> {
  const responseBody = await getApiResponse(
    SALES_PATH,
    signal,
    'Sales could not be loaded. Check the API and try again.',
  );
  if (!Array.isArray(responseBody)) {
    throw new Error('The sales API returned an invalid response.');
  }

  return responseBody.map(parseSale);
}

export async function getReturns(signal?: AbortSignal): Promise<ReturnRecord[]> {
  const responseBody = await getApiResponse(
    RETURNS_PATH,
    signal,
    'Returns could not be loaded. Check the API and try again.',
  );
  if (!Array.isArray(responseBody)) {
    throw new Error('The returns API returned an invalid response.');
  }

  return responseBody.map(parseReturn);
}

async function getApiResponse(
  path: string,
  signal: AbortSignal | undefined,
  fallbackMessage: string,
): Promise<unknown> {
  const apiBaseUrl = process.env.EXPO_PUBLIC_BACKEND_API_URL?.replace(/\/+$/, '');

  if (!apiBaseUrl) {
    throw new Error(
      'The mobile API URL is not configured. Add EXPO_PUBLIC_BACKEND_API_URL to mobile/.env.',
    );
  }

  const response = await fetch(`${apiBaseUrl}${path}`, {
    headers: { Accept: 'application/json' },
    signal,
  });
  const responseBody: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(getApiErrorMessage(responseBody, fallbackMessage));
  }

  return responseBody;
}

function parseInventoryItem(value: unknown): InventoryRecord {
  if (!isRecord(value)) {
    throw new Error('The inventory API returned an invalid item.');
  }

  const price = parsePrice(value.price);
  const wholesalePrice =
    value.wholesale_price === null
      ? null
      : parsePrice(value.wholesale_price);

  if (
    !isPositiveInteger(value.id) ||
    typeof value.item !== 'string' ||
    !value.item.trim() ||
    !isNonNegativeInteger(value.quantity) ||
    !isNonNegativeInteger(value.returns_count) ||
    price === null ||
    (value.wholesale_price !== null && wholesalePrice === null) ||
    !isInventoryStatus(value.status) ||
    !isValidDate(value.created_at) ||
    !isValidDate(value.updated_at)
  ) {
    throw new Error('The inventory API returned an invalid item.');
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

function parseSale(value: unknown): SaleRecord {
  if (!isRecord(value) || !Array.isArray(value.items)) {
    throw new Error('The sales API returned an invalid sale.');
  }

  if (
    !isPositiveInteger(value.id) ||
    typeof value.customer_name !== 'string' ||
    !value.customer_name.trim() ||
    !isValidDate(value.created_at) ||
    !isValidDate(value.updated_at)
  ) {
    throw new Error('The sales API returned an invalid sale.');
  }

  return {
    id: value.id,
    customerName: value.customer_name,
    items: value.items.map(parseSaleItem),
    createdAt: value.created_at,
    updatedAt: value.updated_at,
  };
}

function parseSaleItem(value: unknown): SaleItemRecord {
  if (!isRecord(value) || !isRecord(value.item)) {
    throw new Error('The sales API returned an invalid sale item.');
  }

  const price = parsePrice(value.price);
  if (
    !isPositiveInteger(value.id) ||
    !isPositiveInteger(value.inventory_id) ||
    !isPositiveInteger(value.item.id) ||
    typeof value.item.item !== 'string' ||
    !value.item.item.trim() ||
    !isPositiveInteger(value.quantity) ||
    price === null
  ) {
    throw new Error('The sales API returned an invalid sale item.');
  }

  return {
    id: value.id,
    inventoryId: value.inventory_id,
    item: { id: value.item.id, name: value.item.item },
    quantity: value.quantity,
    price,
  };
}

function parseReturn(value: unknown): ReturnRecord {
  if (!isRecord(value) || !isRecord(value.item)) {
    throw new Error('The returns API returned an invalid return.');
  }

  if (
    !isPositiveInteger(value.id) ||
    !isPositiveInteger(value.inventory_id) ||
    !isPositiveInteger(value.item.id) ||
    typeof value.item.item !== 'string' ||
    !value.item.item.trim() ||
    !isPositiveInteger(value.quantity) ||
    typeof value.customer_name !== 'string' ||
    !value.customer_name.trim() ||
    typeof value.reason !== 'string' ||
    !value.reason.trim() ||
    !isValidDate(value.created_at) ||
    !isValidDate(value.updated_at)
  ) {
    throw new Error('The returns API returned an invalid return.');
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

function getApiErrorMessage(value: unknown, fallbackMessage: string) {
  if (isRecord(value) && typeof value.detail === 'string') {
    return value.detail;
  }

  return fallbackMessage;
}

function parsePrice(value: unknown): number | null {
  if (typeof value !== 'number' && typeof value !== 'string') {
    return null;
  }

  const parsedPrice = Number(value);
  return Number.isFinite(parsedPrice) && parsedPrice >= 0 ? parsedPrice : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isPositiveInteger(value: unknown): value is number {
  return Number.isInteger(value) && Number(value) > 0;
}

function isNonNegativeInteger(value: unknown): value is number {
  return Number.isInteger(value) && Number(value) >= 0;
}

function isInventoryStatus(value: unknown): value is InventoryStatus {
  return (
    value === 'in_stock' ||
    value === 'low_stock' ||
    value === 'out_of_stock'
  );
}

function isValidDate(value: unknown): value is string {
  return typeof value === 'string' && !Number.isNaN(Date.parse(value));
}
