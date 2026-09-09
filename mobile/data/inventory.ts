import type { ImageSourcePropType } from 'react-native';

import type { InventoryItem } from '../types/inventory';

export const eggsImage: ImageSourcePropType = require('../assets/inventory-eggs.png');
const palmOilImage: ImageSourcePropType = require('../assets/inventory-palm-oil.png');
const tuyoImage: ImageSourcePropType = require('../assets/inventory-tuyo.png');

export const inventoryItems: InventoryItem[] = [
  { id: 1, name: 'Small Eggs', category: 'Eggs', price: '₱210.00', wholesalePrice: '₱205.00', stock: '120 trays', stockLabel: 'In Stock', isLowStock: false, returnsCount: 1, image: eggsImage },
  { id: 2, name: 'Medium Eggs', category: 'Eggs', price: '₱230.00', wholesalePrice: '₱220.00', stock: '85 trays', stockLabel: 'In Stock', isLowStock: false, returnsCount: 16, image: eggsImage },
  { id: 3, name: 'Large Eggs', category: 'Eggs', price: '₱255.00', wholesalePrice: '₱240.00', stock: '12 trays', stockLabel: 'Low Stock', isLowStock: true, returnsCount: 9, image: eggsImage },
  { id: 4, name: 'Eggs - XLarge', category: 'Eggs', price: '₱265.00', wholesalePrice: null, stock: '8 trays', stockLabel: 'Low Stock', isLowStock: true, returnsCount: 0, image: eggsImage },
  { id: 5, name: '1.5L BJ Oil', category: 'Groceries', price: '₱150.00', wholesalePrice: '₱300.00', stock: '45 pcs', stockLabel: 'In Stock', isLowStock: false, returnsCount: 0, image: palmOilImage },
  { id: 6, name: 'Tuyo (Bundle of 3)', category: 'Groceries', price: '₱130.00', wholesalePrice: null, stock: '67 packs', stockLabel: 'In Stock', isLowStock: false, returnsCount: 0, image: tuyoImage },
];
