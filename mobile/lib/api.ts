import type {
  InventoryRecord,
  InventoryStatus,
} from '../types/inventory';

const INVENTORY_PATH = '/api/v1/inventory/get-item';

export async function getInventoryItems(
  signal?: AbortSignal,
): Promise<InventoryRecord[]> {
  const apiBaseUrl = process.env.EXPO_PUBLIC_BACKEND_API_URL?.replace(/\/+$/, '');

  if (!apiBaseUrl) {
    throw new Error(
      'The mobile API URL is not configured. Add EXPO_PUBLIC_BACKEND_API_URL to mobile/.env.',
    );
  }

  const response = await fetch(`${apiBaseUrl}${INVENTORY_PATH}`, {
    headers: { Accept: 'application/json' },
    signal,
  });
  const responseBody: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(getApiErrorMessage(responseBody));
  }
  if (!Array.isArray(responseBody)) {
    throw new Error('The inventory API returned an invalid response.');
  }

  return responseBody.map(parseInventoryItem);
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

function getApiErrorMessage(value: unknown) {
  if (isRecord(value) && typeof value.detail === 'string') {
    return value.detail;
  }

  return 'Inventory could not be loaded. Check the API and try again.';
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
