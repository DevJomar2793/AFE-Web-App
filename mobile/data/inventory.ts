import type { ImageSourcePropType } from 'react-native';

import type { InventoryItem } from '../types/inventory';

export const eggsImage: ImageSourcePropType = require('../assets/inventory-eggs.png');
const palmOilImage: ImageSourcePropType = require('../assets/inventory-palm-oil.png');
const tuyoImage: ImageSourcePropType = require('../assets/inventory-tuyo.png');

export const inventoryItems: InventoryItem[] = [
  { id: 1, name: 'Eggs - Small', category: 'Eggs', price: '₱190.00', stock: '120 trays', stockLabel: 'In Stock', isLowStock: false, returnsCount: 1, image: eggsImage },
  { id: 2, name: 'Eggs - Medium', category: 'Eggs', price: '₱205.00', stock: '85 trays', stockLabel: 'In Stock', isLowStock: false, returnsCount: 16, image: eggsImage },
  { id: 3, name: 'Eggs - Large', category: 'Eggs', price: '₱240.00', stock: '12 trays', stockLabel: 'Low Stock', isLowStock: true, returnsCount: 9, image: eggsImage },
  { id: 4, name: 'Eggs - XLarge', category: 'Eggs', price: '₱265.00', stock: '8 trays', stockLabel: 'Low Stock', isLowStock: true, returnsCount: 0, image: eggsImage },
  { id: 5, name: 'Palm Oil (1.5L)', category: 'Groceries', price: '₱130.00', stock: '45 pcs', stockLabel: 'In Stock', isLowStock: false, returnsCount: 0, image: palmOilImage },
  { id: 6, name: 'Tuyo (Bundle of 3)', category: 'Groceries', price: '₱130.00', stock: '67 packs', stockLabel: 'In Stock', isLowStock: false, returnsCount: 0, image: tuyoImage },
];
