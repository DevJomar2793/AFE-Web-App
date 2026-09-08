import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { inventoryItems } from '../data/inventory';
import type { InventoryItem } from '../types/inventory';

interface InventoryScreenProps {
  onAddItem: () => void;
  onEditItem: (item: InventoryItem) => void;
  onReturn: () => void;
}

interface ProductPriceCardProps {
  item: InventoryItem;
  displayName: string;
}

const productPriceCards = [
  { item: inventoryItems[0], displayName: 'Small Eggs' },
  { item: inventoryItems[1], displayName: 'Medium Eggs' },
  { item: inventoryItems[2], displayName: 'Large Eggs' },
  { item: inventoryItems[4], displayName: '1.5L Palm Oil' },
];

function ProductPriceCard({ item, displayName }: ProductPriceCardProps) {
  return (
    <View style={styles.priceCard}>
      <View style={styles.priceCardHeader}>
        <Text style={styles.priceCardName} numberOfLines={1}>
          {displayName}
        </Text>
        <View style={styles.priceIcon}>
          <Text style={styles.pesoIcon}>₱</Text>
        </View>
      </View>
      <Text style={styles.priceValue}>{item.price}</Text>
    </View>
  );
}

function InventoryTableRow({ item, onPress }: { item: InventoryItem; onPress: () => void }) {
  return (
    <View style={styles.tableRow}>
      <Text style={styles.itemCell} numberOfLines={2}>
        {item.name.replace('Eggs - ', '')}
      </Text>
      <Text style={styles.quantityCell} numberOfLines={1}>
        {item.stock}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Edit ${item.name}`}
        onPress={onPress}
        style={styles.editButton}
      >
        <Ionicons name="pencil-outline" size={16} color="#ffffff" />
        <Text style={styles.editButtonText}>Edit</Text>
      </Pressable>
    </View>
  );
}

export function InventoryScreen({
  onAddItem,
  onEditItem,
  onReturn,
}: InventoryScreenProps) {
  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.title}>All inventory</Text>
            <Text style={styles.subtitle}>Live inventory records from the database.</Text>
          </View>

          <View style={styles.headerActions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Add stock"
              onPress={onAddItem}
              style={styles.addStockButton}
            >
              <Ionicons name="cube-outline" size={20} color="#1d4c2d" />
              <Text style={styles.addStockText}>Add stock</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Return items"
              onPress={onReturn}
              style={styles.returnButton}
            >
              <Ionicons name="return-up-back-outline" size={20} color="#ffffff" />
              <Text style={styles.returnButtonText}>Return</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Product prices</Text>
          <Text style={styles.sectionSubtitle}>Current prices for all inventory products.</Text>
        </View>

        <View style={styles.priceGrid}>
          {productPriceCards.map(({ item, displayName }) => (
            <ProductPriceCard key={item.id} item={item} displayName={displayName} />
          ))}
        </View>

        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={24} color="#4d6256" />
          <Text style={styles.searchPlaceholder}>Search item...</Text>
        </View>

        <Text style={styles.inventoryLabel}>Inventory items</Text>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeading, styles.headerItemCell]}>Item</Text>
            <Text style={[styles.tableHeading, styles.headerQuantityCell]}>Qty</Text>
            <Text style={[styles.tableHeading, styles.actionHeading]}>Action</Text>
          </View>

          {inventoryItems.map((item) => (
            <InventoryTableRow
              key={item.id}
              item={item}
              onPress={() => onEditItem(item)}
            />
          ))}
        </View>
      </ScrollView>

    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    backgroundColor: '#f8faf8',
  },
  content: {
    padding: 20,
    paddingTop: 18,
    paddingBottom: 28,
  },
  header: {
    gap: 16,
  },
  headerText: {
    gap: 4,
  },
  title: {
    color: '#121a15',
    fontSize: 31,
    fontWeight: '700',
  },
  subtitle: {
    color: '#74808a',
    fontSize: 16,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 10,
  },
  addStockButton: {
    flex: 1,
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    borderWidth: 1,
    borderColor: '#dce3dd',
    borderRadius: 14,
    backgroundColor: '#ffffff',
  },
  addStockText: {
    color: '#1d4c2d',
    fontSize: 16,
    fontWeight: '700',
  },
  returnButton: {
    flex: 1,
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    borderRadius: 14,
    backgroundColor: '#173f28',
  },
  returnButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  sectionHeader: {
    marginTop: 34,
    marginBottom: 18,
  },
  sectionTitle: {
    color: '#121a15',
    fontSize: 22,
    fontWeight: '700',
  },
  sectionSubtitle: {
    color: '#74808a',
    fontSize: 16,
    marginTop: 4,
  },
  priceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  priceCard: {
    width: '48%',
    minHeight: 122,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#dce3dd',
    borderRadius: 15,
    backgroundColor: '#ffffff',
    padding: 16,
  },
  priceCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  priceCardName: {
    flex: 1,
    color: '#17231b',
    fontSize: 16,
    fontWeight: '700',
  },
  priceIcon: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: '#eef7ee',
  },
  pesoIcon: {
    color: '#24663a',
    fontSize: 22,
    fontWeight: '700',
  },
  priceValue: {
    color: '#173f28',
    fontSize: 28,
    fontWeight: '700',
  },
  searchBox: {
    height: 58,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#dce3dd',
    borderRadius: 15,
    backgroundColor: '#ffffff',
    marginTop: 24,
    paddingHorizontal: 18,
  },
  searchPlaceholder: {
    color: '#8b969e',
    fontSize: 16,
  },
  inventoryLabel: {
    color: '#17231b',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 24,
  },
  table: {
    borderWidth: 1,
    borderColor: '#dce3dd',
    borderRadius: 16,
    backgroundColor: '#ffffff',
    marginTop: 12,
    overflow: 'hidden',
  },
  tableHeader: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e8ece8',
    gap: 12,
    paddingHorizontal: 14,
  },
  tableRow: {
    minHeight: 84,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e8ece8',
    gap: 12,
    paddingHorizontal: 14,
  },
  tableHeading: {
    color: '#879198',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  headerItemCell: {
    flex: 1,
  },
  headerQuantityCell: {
    width: 78,
    textAlign: 'center',
  },
  itemCell: {
    flex: 1,
    color: '#17231b',
    fontSize: 14,
    fontWeight: '700',
    paddingRight: 5,
  },
  quantityCell: {
    width: 78,
    color: '#17231b',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  actionHeading: {
    width: 72,
    textAlign: 'center',
  },
  editButton: {
    width: 72,
    minHeight: 38,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderRadius: 9,
    backgroundColor: '#173f28',
  },
  editButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
});
