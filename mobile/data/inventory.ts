import type { ImageSourcePropType } from 'react-native';

import type { InventoryItem, InventoryRecord } from '../types/inventory';

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

const statusLabels = {
  in_stock: 'In Stock',
  low_stock: 'Low Stock',
  out_of_stock: 'Out of Stock',
};

export function toMockInventoryItem(record: InventoryRecord): InventoryItem {
  const matchingMockItem = inventoryItems.find(
    (item) => item.name.toLowerCase() === record.item.toLowerCase(),
  );
  const stockUnit = matchingMockItem?.stock.split(' ').slice(1).join(' ') || 'units';

  return {
    id: record.id,
    name: record.item,
    category: matchingMockItem?.category ?? 'Inventory',
    price: formatCurrency(record.price),
    wholesalePrice:
      record.wholesalePrice === null
        ? null
        : formatCurrency(record.wholesalePrice),
    stock: `${record.quantity} ${stockUnit}`,
    stockLabel: statusLabels[record.status],
    isLowStock: record.status !== 'in_stock',
    returnsCount: record.returnsCount,
    image: matchingMockItem?.image ?? eggsImage,
  };
}

function formatCurrency(value: number) {
  return `₱${value.toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
