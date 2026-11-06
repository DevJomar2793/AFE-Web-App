import type {
  InventoryRecord,
  InventoryStatus,
  OilSize,
  ProductCategory,
} from "../types/inventory";
import { getAccessToken } from "./auth";

const INVENTORY_PATH = "/api/v1/inventory/get-item";
const ADD_INVENTORY_PATH = "/api/v1/inventory/add-stock";
const SALES_PATH = "/api/v1/sales/get-sales";
const RETURNS_PATH = "/api/v1/returns/get-returns";

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

export type ActivityLogAction = "added" | "edited" | "deleted" | "approved";

export interface ActivityLogRecord {
  id: number;
  action: ActivityLogAction;
  affectedRecord: string;
  adminEmail: string;
  createdAt: string;
}

export interface PendingAccountRecord {
  id: number;
  email: string;
  createdAt: string;
}

export interface BusinessFundsRecord {
  currentTotal: number;
  isInitialized: boolean;
  updatedAt: string;
}

export type FundTransactionType = "opening_balance" | "income" | "expense";

export interface FundTransactionRecord {
  id: number;
  transactionType: FundTransactionType;
  source: string;
  amount: number;
  description: string;
  createdAt: string;
}

export interface CreateInventoryItemInput {
  item: string;
  quantity: number;
  price: number;
  wholesalePrice: number | null;
  purchaseCost: number;
  category: ProductCategory;
  oilSize: OilSize | null;
}

export interface UpdateInventoryItemInput {
  quantity: number;
  price: number;
  wholesalePrice: number | null;
  purchaseCost: number;
  category: ProductCategory;
  oilSize: OilSize | null;
}

export interface CreateSaleBatchInput {
  customerName: string;
  items: { inventoryId: number; quantity: number }[];
}

export interface UpdateSaleInput {
  items: { id: number; quantity: number }[];
}

export interface CreateReturnInput {
  inventoryId: number;
  quantity: number;
  customerName: string;
  reason: string;
}

export async function getInventoryItems(
  signal?: AbortSignal,
): Promise<InventoryRecord[]> {
  const responseBody = await getApiResponse(
    INVENTORY_PATH,
    signal,
    "Inventory could not be loaded. Check the API and try again.",
  );
  if (!Array.isArray(responseBody)) {
    throw new Error("The inventory API returned an invalid response.");
  }

  return responseBody.map(parseInventoryItem);
}

export async function createInventoryItem(
  input: CreateInventoryItemInput,
): Promise<InventoryRecord> {
  const responseBody = await sendApiRequest(
    ADD_INVENTORY_PATH,
    "POST",
    {
      item: input.item,
      quantity: input.quantity,
      price: input.price,
      wholesale_price: input.wholesalePrice,
      purchase_cost: input.purchaseCost,
      category: input.category,
      oil_size: input.oilSize,
    },
    "The inventory item could not be added.",
  );

  return parseInventoryItem(responseBody);
}

export async function updateInventoryItem(
  inventoryId: number,
  input: UpdateInventoryItemInput,
): Promise<InventoryRecord> {
  const responseBody = await sendApiRequest(
    `/api/v1/inventory/${inventoryId}`,
    "PATCH",
    {
      quantity: input.quantity,
      price: input.price,
      wholesale_price: input.wholesalePrice,
      purchase_cost: input.purchaseCost,
      category: input.category,
      oil_size: input.oilSize,
    },
    "The inventory item could not be updated.",
  );

  return parseInventoryItem(responseBody);
}

export async function deleteInventoryItem(inventoryId: number): Promise<void> {
  await deleteApiResource(
    `/api/v1/inventory/${inventoryId}`,
    "The inventory item could not be deleted.",
  );
}

export async function getSales(signal?: AbortSignal): Promise<SaleRecord[]> {
  const responseBody = await getApiResponse(
    SALES_PATH,
    signal,
    "Sales could not be loaded. Check the API and try again.",
  );
  if (!Array.isArray(responseBody)) {
    throw new Error("The sales API returned an invalid response.");
  }

  return responseBody.map(parseSale);
}

export async function createSaleBatch(
  input: CreateSaleBatchInput,
): Promise<SaleRecord> {
  const responseBody = await sendApiRequest(
    "/api/v1/sales/add-sales-batch",
    "POST",
    {
      customer_name: input.customerName,
      items: input.items.map((item) => ({
        inventory_id: item.inventoryId,
        quantity: item.quantity,
      })),
    },
    "The sale could not be saved.",
  );

  return parseSale(responseBody);
}

export async function updateSale(
  saleId: number,
  input: UpdateSaleInput,
): Promise<SaleRecord> {
  const responseBody = await sendApiRequest(
    `/api/v1/sales/${saleId}`,
    "PATCH",
    { items: input.items },
    "The sale could not be updated.",
  );

  return parseSale(responseBody);
}

export async function deleteSale(saleId: number): Promise<void> {
  await deleteApiResource(
    `/api/v1/sales/${saleId}`,
    "The sale could not be removed.",
  );
}

export async function createReturn(
  input: CreateReturnInput,
): Promise<ReturnRecord> {
  const responseBody = await sendApiRequest(
    "/api/v1/returns/add-returns",
    "POST",
    {
      inventory_id: input.inventoryId,
      quantity: input.quantity,
      customer_name: input.customerName,
      reason: input.reason,
    },
    "The return could not be saved.",
  );
  return parseReturn(responseBody);
}

export async function getBusinessFunds(
  signal?: AbortSignal,
): Promise<BusinessFundsRecord> {
  return parseBusinessFunds(
    await getApiResponse(
      "/api/v1/business-funds",
      signal,
      "Unable to load business funds.",
    ),
  );
}

export async function initializeBusinessFunds(
  amount: number,
): Promise<BusinessFundsRecord> {
  return parseBusinessFunds(
    await sendApiRequest(
      "/api/v1/business-funds/initialize",
      "POST",
      { amount },
      "Unable to set the current business funds.",
    ),
  );
}

export async function createFundTransaction(input: {
  transactionType: "income" | "expense";
  amount: number;
  description: string;
}): Promise<FundTransactionRecord> {
  return parseFundTransaction(
    await sendApiRequest(
      "/api/v1/business-funds/transactions",
      "POST",
      {
        transaction_type: input.transactionType,
        amount: input.amount,
        description: input.description,
      },
      "Unable to save the fund transaction.",
    ),
  );
}

export async function getFundTransactions(
  signal?: AbortSignal,
): Promise<FundTransactionRecord[]> {
  const responseBody = await getApiResponse(
    "/api/v1/business-funds/transactions",
    signal,
    "Unable to load fund transactions.",
  );
  if (!Array.isArray(responseBody)) {
    throw new Error("The fund transaction API returned an invalid response.");
  }
  return responseBody.map(parseFundTransaction);
}

export async function getActivityLogs(
  signal?: AbortSignal,
): Promise<ActivityLogRecord[]> {
  const responseBody = await getApiResponse(
    "/api/v1/activity-logs",
    signal,
    "Activity logs could not be loaded.",
  );
  if (!Array.isArray(responseBody)) {
    throw new Error("The activity log API returned an invalid response.");
  }
  return responseBody.map(parseActivityLog);
}

export async function getPendingAccounts(
  signal?: AbortSignal,
): Promise<PendingAccountRecord[]> {
  const responseBody = await getApiResponse(
    "/api/v1/users/pending",
    signal,
    "Unable to load pending accounts.",
  );
  if (!Array.isArray(responseBody)) {
    throw new Error("The pending account API returned an invalid response.");
  }
  return responseBody.map(parsePendingAccount);
}

export async function approveAccount(userId: number): Promise<void> {
  const responseBody = await sendApiRequest(
    `/api/v1/users/${userId}/approve`,
    "PATCH",
    {},
    "The account could not be approved.",
  );
  if (!isRecord(responseBody) || responseBody.id !== userId || responseBody.is_active !== true) {
    throw new Error("The account approval API returned an invalid response.");
  }
}

export async function getReturns(
  signal?: AbortSignal,
): Promise<ReturnRecord[]> {
  const responseBody = await getApiResponse(
    RETURNS_PATH,
    signal,
    "Returns could not be loaded. Check the API and try again.",
  );
  if (!Array.isArray(responseBody)) {
    throw new Error("The returns API returned an invalid response.");
  }

  return responseBody.map(parseReturn);
}

async function getApiResponse(
  path: string,
  signal: AbortSignal | undefined,
  fallbackMessage: string,
): Promise<unknown> {
  const apiBaseUrl = process.env.EXPO_PUBLIC_BACKEND_API_URL?.replace(
    /\/+$/,
    "",
  );

  if (!apiBaseUrl) {
    throw new Error(
      "The mobile API URL is not configured. Add EXPO_PUBLIC_BACKEND_API_URL to mobile/.env.",
    );
  }

  const response = await fetch(`${apiBaseUrl}${path}`, {
    headers: await getApiHeaders(),
    signal,
  });
  const responseBody: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(getApiErrorMessage(responseBody, fallbackMessage));
  }

  return responseBody;
}

async function sendApiRequest(
  path: string,
  method: "POST" | "PATCH",
  body: Record<string, unknown>,
  fallbackMessage: string,
): Promise<unknown> {
  const apiBaseUrl = process.env.EXPO_PUBLIC_BACKEND_API_URL?.replace(
    /\/+$/,
    "",
  );

  if (!apiBaseUrl) {
    throw new Error(
      "The mobile API URL is not configured. Add EXPO_PUBLIC_BACKEND_API_URL to mobile/.env.",
    );
  }

  const response = await fetch(`${apiBaseUrl}${path}`, {
    method,
    headers: {
      ...(await getApiHeaders()),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const responseBody: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(getApiErrorMessage(responseBody, fallbackMessage));
  }

  return responseBody;
}

async function deleteApiResource(path: string, fallbackMessage: string) {
  const apiBaseUrl = process.env.EXPO_PUBLIC_BACKEND_API_URL?.replace(/\/+$/, "");
  if (!apiBaseUrl) {
    throw new Error(
      "The mobile API URL is not configured. Add EXPO_PUBLIC_BACKEND_API_URL to mobile/.env.",
    );
  }
  const response = await fetch(`${apiBaseUrl}${path}`, {
    method: "DELETE",
    headers: await getApiHeaders(),
  });
  if (!response.ok) {
    const responseBody: unknown = await response.json().catch(() => null);
    throw new Error(getApiErrorMessage(responseBody, fallbackMessage));
  }
}

async function getApiHeaders() {
  const accessToken = await getAccessToken();

  return {
    Accept: "application/json",
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
  };
}

function parseInventoryItem(value: unknown): InventoryRecord {
  if (!isRecord(value)) {
    throw new Error("The inventory API returned an invalid item.");
  }

  const price = parsePrice(value.price);
  const wholesalePrice =
    value.wholesale_price === null ? null : parsePrice(value.wholesale_price);
  const purchaseCost = parsePrice(value.purchase_cost);

  if (
    !isPositiveInteger(value.id) ||
    typeof value.item !== "string" ||
    !value.item.trim() ||
    !isNonNegativeInteger(value.quantity) ||
    !isNonNegativeInteger(value.returns_count) ||
    price === null ||
    (value.wholesale_price !== null && wholesalePrice === null) ||
    purchaseCost === null ||
    !isProductCategory(value.category) ||
    !isValidOilSize(value.category, value.oil_size) ||
    !isInventoryStatus(value.status) ||
    !isValidDate(value.created_at) ||
    !isValidDate(value.updated_at)
  ) {
    throw new Error("The inventory API returned an invalid item.");
  }

  return {
    id: value.id,
    item: value.item,
    quantity: value.quantity,
    returnsCount: value.returns_count,
    price,
    wholesalePrice,
    purchaseCost,
    category: value.category,
    oilSize: value.oil_size,
    status: value.status,
    createdAt: value.created_at,
    updatedAt: value.updated_at,
  };
}

function parseBusinessFunds(value: unknown): BusinessFundsRecord {
  if (!isRecord(value)) throw new Error("Invalid business funds response.");
  const currentTotal = parseSignedPrice(value.current_total);
  if (
    currentTotal === null ||
    typeof value.is_initialized !== "boolean" ||
    !isValidDate(value.updated_at)
  ) {
    throw new Error("Invalid business funds response.");
  }
  return {
    currentTotal,
    isInitialized: value.is_initialized,
    updatedAt: value.updated_at,
  };
}

function parseFundTransaction(value: unknown): FundTransactionRecord {
  if (!isRecord(value)) throw new Error("Invalid fund transaction response.");
  const amount = parsePrice(value.amount);
  if (
    !isPositiveInteger(value.id) ||
    !isFundTransactionType(value.transaction_type) ||
    typeof value.source !== "string" ||
    amount === null ||
    typeof value.description !== "string" ||
    !value.description.trim() ||
    !isValidDate(value.created_at)
  ) {
    throw new Error("Invalid fund transaction response.");
  }
  return {
    id: value.id,
    transactionType: value.transaction_type,
    source: value.source,
    amount,
    description: value.description,
    createdAt: value.created_at,
  };
}

function parseActivityLog(value: unknown): ActivityLogRecord {
  if (
    !isRecord(value) ||
    !isPositiveInteger(value.id) ||
    !isActivityLogAction(value.action) ||
    typeof value.affected_record !== "string" ||
    typeof value.admin_email !== "string" ||
    !isValidDate(value.created_at)
  ) {
    throw new Error("Invalid activity log response.");
  }
  return {
    id: value.id,
    action: value.action,
    affectedRecord: value.affected_record,
    adminEmail: value.admin_email,
    createdAt: value.created_at,
  };
}

function parsePendingAccount(value: unknown): PendingAccountRecord {
  if (
    !isRecord(value) ||
    !isPositiveInteger(value.id) ||
    typeof value.email !== "string" ||
    !value.email.trim() ||
    !isValidDate(value.created_at)
  ) {
    throw new Error("Invalid pending account response.");
  }
  return { id: value.id, email: value.email, createdAt: value.created_at };
}

function parseSale(value: unknown): SaleRecord {
  if (!isRecord(value) || !Array.isArray(value.items)) {
    throw new Error("The sales API returned an invalid sale.");
  }

  if (
    !isPositiveInteger(value.id) ||
    typeof value.customer_name !== "string" ||
    !value.customer_name.trim() ||
    !isValidDate(value.created_at) ||
    !isValidDate(value.updated_at)
  ) {
    throw new Error("The sales API returned an invalid sale.");
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
    throw new Error("The sales API returned an invalid sale item.");
  }

  const price = parsePrice(value.price);
  if (
    !isPositiveInteger(value.id) ||
    !isPositiveInteger(value.inventory_id) ||
    !isPositiveInteger(value.item.id) ||
    typeof value.item.item !== "string" ||
    !value.item.item.trim() ||
    !isPositiveInteger(value.quantity) ||
    price === null
  ) {
    throw new Error("The sales API returned an invalid sale item.");
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
    throw new Error("The returns API returned an invalid return.");
  }

  if (
    !isPositiveInteger(value.id) ||
    !isPositiveInteger(value.inventory_id) ||
    !isPositiveInteger(value.item.id) ||
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
    throw new Error("The returns API returned an invalid return.");
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
  if (isRecord(value) && typeof value.detail === "string") {
    return value.detail;
  }

  return fallbackMessage;
}

function parsePrice(value: unknown): number | null {
  if (typeof value !== "number" && typeof value !== "string") {
    return null;
  }

  const parsedPrice = Number(value);
  return Number.isFinite(parsedPrice) && parsedPrice >= 0 ? parsedPrice : null;
}

function parseSignedPrice(value: unknown): number | null {
  if (typeof value !== "number" && typeof value !== "string") return null;
  const parsedPrice = Number(value);
  return Number.isFinite(parsedPrice) ? parsedPrice : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isPositiveInteger(value: unknown): value is number {
  return Number.isInteger(value) && Number(value) > 0;
}

function isNonNegativeInteger(value: unknown): value is number {
  return Number.isInteger(value) && Number(value) >= 0;
}

function isInventoryStatus(value: unknown): value is InventoryStatus {
  return (
    value === "in_stock" || value === "low_stock" || value === "out_of_stock"
  );
}

function isProductCategory(value: unknown): value is ProductCategory {
  return value === "eggs" || value === "oil";
}

function isActivityLogAction(value: unknown): value is ActivityLogAction {
  return value === "added" || value === "edited" || value === "deleted" || value === "approved";
}

function isFundTransactionType(value: unknown): value is FundTransactionType {
  return value === "opening_balance" || value === "income" || value === "expense";
}

function isValidOilSize(
  category: unknown,
  oilSize: unknown,
): oilSize is OilSize | null {
  return category === "eggs"
    ? oilSize === null
    : oilSize === "1.5L" || oilSize === "350ml";
}

function isValidDate(value: unknown): value is string {
  return typeof value === "string" && !Number.isNaN(Date.parse(value));
}
