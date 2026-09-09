import type { ImageSourcePropType } from 'react-native';

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
