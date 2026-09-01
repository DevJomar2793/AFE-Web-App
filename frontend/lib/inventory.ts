export type InventoryItem = {
  id: string;
  name: string;
  sku: string;
  category: string;
  unit: string;
  price: number;
  cost: number;
  quantity: number;
  reorderLevel: number;
};

export type TransactionType = "sale" | "return" | "restock";

export type InventoryTransaction = {
  id: string;
  type: TransactionType;
  itemId: string;
  quantity: number;
  amount: number;
  createdAt: string;
  customer?: string;
  note?: string;
};

export type InventoryState = {
  items: InventoryItem[];
  transactions: InventoryTransaction[];
};

export const INVENTORY_STORAGE_KEY = "afe-inventory-v1";

export const initialInventoryState: InventoryState = {
  items: [
    {
      id: "egg-small",
      name: "Small Retail Eggs",
      sku: "EGG-S-R30",
      category: "Eggs",
      unit: "tray",
      price: 245,
      cost: 195,
      quantity: 18,
      reorderLevel: 10,
    },
    {
      id: "egg-medium",
      name: "Medium Retail Eggs",
      sku: "EGG-M-R30",
      category: "Eggs",
      unit: "tray",
      price: 270,
      cost: 215,
      quantity: 7,
      reorderLevel: 10,
    },
    {
      id: "egg-xl",
      name: "Extra Large Retail Eggs",
      sku: "EGG-XL-R30",
      category: "Eggs",
      unit: "tray",
      price: 315,
      cost: 250,
      quantity: 14,
      reorderLevel: 8,
    },
    {
      id: "palm-oil-15",
      name: "Palm Oil 1.5 L",
      sku: "OIL-P-1500",
      category: "Pantry",
      unit: "bottle",
      price: 185,
      cost: 142,
      quantity: 22,
      reorderLevel: 8,
    },
    {
      id: "tuyo-bataan",
      name: "Bataan Special Tuyo",
      sku: "TUYO-B-250",
      category: "Pantry",
      unit: "pack",
      price: 120,
      cost: 82,
      quantity: 5,
      reorderLevel: 6,
    },
  ],
  transactions: [
    {
      id: "seed-sale-1",
      type: "sale",
      itemId: "egg-xl",
      quantity: 3,
      amount: 945,
      customer: "Ginalyn Store",
      createdAt: "2026-09-01T08:42:00+08:00",
    },
    {
      id: "seed-sale-2",
      type: "sale",
      itemId: "egg-medium",
      quantity: 4,
      amount: 1080,
      customer: "Keisha Carpio",
      createdAt: "2026-09-01T07:18:00+08:00",
    },
    {
      id: "seed-return-1",
      type: "return",
      itemId: "egg-small",
      quantity: 1,
      amount: 245,
      customer: "Walk-in customer",
      note: "Damaged tray",
      createdAt: "2026-08-31T15:05:00+08:00",
    },
    {
      id: "seed-sale-3",
      type: "sale",
      itemId: "palm-oil-15",
      quantity: 2,
      amount: 370,
      customer: "Noemie De Ag",
      createdAt: "2026-08-30T11:26:00+08:00",
    },
    {
      id: "seed-restock-1",
      type: "restock",
      itemId: "egg-small",
      quantity: 12,
      amount: 2340,
      note: "Morning delivery",
      createdAt: "2026-08-29T06:50:00+08:00",
    },
  ],
};

export function isInventoryState(value: unknown): value is InventoryState {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<InventoryState>;
  return Array.isArray(candidate.items) && Array.isArray(candidate.transactions);
}
