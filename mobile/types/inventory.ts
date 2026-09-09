import type { ImageSourcePropType } from 'react-native';

export type InventoryStatus = 'in_stock' | 'low_stock' | 'out_of_stock';

export interface InventoryRecord {
  id: number;
  item: string;
  quantity: number;
  returnsCount: number;
  price: number;
  wholesalePrice: number | null;
  status: InventoryStatus;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryItem {
  id: number;
  name: string;
  category: string;
  price: string;
  wholesalePrice: string | null;
  stock: string;
  stockLabel: string;
  isLowStock: boolean;
  returnsCount: number;
  image: ImageSourcePropType;
}

export interface SuccessNotice {
  title: string;
  message: string;
}
