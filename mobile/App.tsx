import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import {
  Image,
  ImageSourcePropType,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar as NativeStatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';

type IconName = keyof typeof Ionicons.glyphMap;

interface InventoryItem {
  id: number;
  name: string;
  category: string;
  price: string;
  stock: string;
  stockLabel: string;
  isLowStock: boolean;
  image: ImageSourcePropType;
}

interface SummaryCardProps {
  icon: IconName;
  iconColor: string;
  iconBackgroundColor: string;
  value: string;
  label: string;
}

interface BottomNavigationItemProps {
  icon: IconName;
  label: string;
  isActive?: boolean;
}

const eggsImage: ImageSourcePropType = require('./assets/inventory-eggs.png');
const palmOilImage: ImageSourcePropType = require('./assets/inventory-palm-oil.png');
const tuyoImage: ImageSourcePropType = require('./assets/inventory-tuyo.png');

const inventoryItems: InventoryItem[] = [
  {
    id: 1,
    name: 'Eggs - Small',
    category: 'Eggs',
    price: '₱190.00',
    stock: '120 trays',
    stockLabel: 'In Stock',
    isLowStock: false,
    image: eggsImage,
  },
  {
    id: 2,
    name: 'Eggs - Medium',
    category: 'Eggs',
    price: '₱205.00',
    stock: '85 trays',
    stockLabel: 'In Stock',
    isLowStock: false,
    image: eggsImage,
  },
  {
    id: 3,
    name: 'Eggs - Large',
    category: 'Eggs',
    price: '₱240.00',
    stock: '12 trays',
    stockLabel: 'Low Stock',
    isLowStock: true,
    image: eggsImage,
  },
  {
    id: 4,
    name: 'Eggs - XLarge',
    category: 'Eggs',
    price: '₱265.00',
    stock: '8 trays',
    stockLabel: 'Low Stock',
    isLowStock: true,
    image: eggsImage,
  },
  {
    id: 5,
    name: 'Palm Oil (1.5L)',
    category: 'Groceries',
    price: '₱130.00',
    stock: '45 pcs',
    stockLabel: 'In Stock',
    isLowStock: false,
    image: palmOilImage,
  },
  {
    id: 6,
    name: 'Tuyo (Bundle of 3)',
    category: 'Groceries',
    price: '₱130.00',
    stock: '67 packs',
    stockLabel: 'In Stock',
    isLowStock: false,
    image: tuyoImage,
  },
];

function SummaryCard({
  icon,
  iconColor,
  iconBackgroundColor,
  value,
  label,
}: SummaryCardProps) {
  return (
    <View style={styles.summaryCard}>
      <View style={[styles.summaryIcon, { backgroundColor: iconBackgroundColor }]}>
        <Ionicons name={icon} size={24} color={iconColor} />
      </View>
      <View style={styles.summaryText}>
        <Text style={styles.summaryValue}>{value}</Text>
        <Text style={styles.summaryLabel}>{label}</Text>
      </View>
    </View>
  );
}

function InventoryRow({ item }: { item: InventoryItem }) {
  const stockColor = item.isLowStock ? '#ef4444' : '#31934f';

  return (
    <View style={styles.inventoryRow}>
      <Image source={item.image} style={styles.productImage} resizeMode="cover" />

      <View style={styles.productDetails}>
        <Text style={styles.productName} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.productCategory}>{item.category}</Text>
        <Text style={styles.productPrice}>{item.price}</Text>
      </View>

      <View style={styles.stockDetails}>
        <Text style={[styles.stockAmount, { color: stockColor }]}>{item.stock}</Text>
        <Text style={styles.stockLabel}>{item.stockLabel}</Text>
      </View>

      <Ionicons name="chevron-forward" size={23} color="#718096" />
    </View>
  );
}

function BottomNavigationItem({
  icon,
  label,
  isActive = false,
}: BottomNavigationItemProps) {
  const color = isActive ? '#31934f' : '#718096';

  return (
    <View style={styles.navigationItem}>
      <Ionicons name={icon} size={27} color={color} />
      <Text style={[styles.navigationLabel, { color }]}>{label}</Text>
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />

      <View style={styles.screen}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.title}>Inventory</Text>
            <Text style={styles.subtitle} numberOfLines={1}>
              Manage your products and stock
            </Text>
          </View>

          <View style={styles.addButton}>
            <Ionicons name="add" size={25} color="#ffffff" />
            <Text style={styles.addButtonText}>Add Item</Text>
          </View>
        </View>

        <View style={styles.summaryRow}>
          <SummaryCard
            icon="cube-outline"
            iconColor="#31934f"
            iconBackgroundColor="#e2f5e9"
            value="5"
            label="Total Items"
          />
          <SummaryCard
            icon="bar-chart-outline"
            iconColor="#4f86ed"
            iconBackgroundColor="#eaf1ff"
            value="312"
            label="Total Stock"
          />
          <SummaryCard
            icon="warning-outline"
            iconColor="#ef4444"
            iconBackgroundColor="#fdebec"
            value="2"
            label="Low Stock"
          />
        </View>

        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <Ionicons name="search-outline" size={23} color="#7b8794" />
            <Text style={styles.searchPlaceholder}>Search items...</Text>
          </View>
          <View style={styles.filterButton}>
            <Ionicons name="options-outline" size={24} color="#18212c" />
          </View>
        </View>

        <View style={styles.categoryRow}>
          <View style={[styles.categoryChip, styles.activeCategoryChip]}>
            <Text style={[styles.categoryText, styles.activeCategoryText]}>All</Text>
          </View>
          <View style={styles.categoryChip}>
            <Text style={styles.categoryText}>Eggs</Text>
          </View>
          <View style={[styles.categoryChip, styles.wideCategoryChip]}>
            <Text style={styles.categoryText}>Groceries</Text>
          </View>
          <View style={styles.categoryChip}>
            <Text style={styles.categoryText}>Others</Text>
          </View>
        </View>

        <ScrollView
          style={styles.inventoryList}
          contentContainerStyle={styles.inventoryListContent}
          showsVerticalScrollIndicator={false}
        >
          {inventoryItems.map((item) => (
            <InventoryRow key={item.id} item={item} />
          ))}
        </ScrollView>

        <View style={styles.bottomNavigation}>
          <BottomNavigationItem icon="home-outline" label="Home" />
          <BottomNavigationItem icon="cube" label="Inventory" isActive />
          <BottomNavigationItem icon="receipt-outline" label="Orders" />
          <BottomNavigationItem icon="bar-chart-outline" label="Reports" />
          <BottomNavigationItem icon="person-outline" label="Profile" />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#eef2f5',
    paddingTop: Platform.OS === 'android' ? NativeStatusBar.currentHeight : 0,
  },
  screen: {
    flex: 1,
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    backgroundColor: '#f7f9fb',
    paddingTop: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    marginBottom: 18,
  },
  headerText: {
    flex: 1,
    minWidth: 0,
    paddingRight: 8,
  },
  title: {
    color: '#131a23',
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 34,
  },
  subtitle: {
    color: '#718096',
    fontSize: 15,
    marginTop: 2,
  },
  addButton: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    borderRadius: 14,
    backgroundColor: '#31934f',
    paddingHorizontal: 16,
    shadowColor: '#256f3c',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 9,
    elevation: 4,
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 9,
    paddingHorizontal: 18,
    marginBottom: 18,
  },
  summaryCard: {
    flex: 1,
    minWidth: 0,
    minHeight: 80,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 15,
    backgroundColor: '#ffffff',
    paddingHorizontal: 10,
    shadowColor: '#778394',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
  },
  summaryIcon: {
    width: 42,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 13,
  },
  summaryText: {
    flex: 1,
    minWidth: 0,
  },
  summaryValue: {
    color: '#151b24',
    fontSize: 22,
    fontWeight: '700',
  },
  summaryLabel: {
    color: '#718096',
    fontSize: 12,
    marginTop: 2,
  },
  searchRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 18,
    marginBottom: 13,
  },
  searchBox: {
    flex: 1,
    height: 49,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#d7dee6',
    borderRadius: 14,
    backgroundColor: '#f9fbfc',
    paddingHorizontal: 15,
  },
  searchPlaceholder: {
    color: '#7b8794',
    fontSize: 15,
  },
  filterButton: {
    width: 50,
    height: 49,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: '#ffffff',
    shadowColor: '#778394',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 9,
    elevation: 3,
  },
  categoryRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 18,
    marginBottom: 14,
  },
  categoryChip: {
    flex: 1,
    minWidth: 0,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: '#edf0f3',
    paddingHorizontal: 6,
  },
  wideCategoryChip: {
    flex: 1.35,
  },
  activeCategoryChip: {
    backgroundColor: '#31934f',
  },
  categoryText: {
    color: '#28323e',
    fontSize: 14,
  },
  activeCategoryText: {
    color: '#ffffff',
  },
  inventoryList: {
    flex: 1,
    paddingHorizontal: 18,
  },
  inventoryListContent: {
    gap: 9,
    paddingBottom: 14,
  },
  inventoryRow: {
    minHeight: 91,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    borderRadius: 15,
    backgroundColor: '#ffffff',
    padding: 10,
    shadowColor: '#778394',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 2,
  },
  productImage: {
    width: 66,
    height: 66,
    borderRadius: 10,
    backgroundColor: '#edf0f3',
  },
  productDetails: {
    flex: 1,
    minWidth: 0,
  },
  productName: {
    color: '#151b24',
    fontSize: 16,
    fontWeight: '700',
  },
  productCategory: {
    color: '#718096',
    fontSize: 13,
    marginTop: 3,
  },
  productPrice: {
    color: '#31934f',
    fontSize: 15,
    fontWeight: '700',
    marginTop: 3,
  },
  stockDetails: {
    width: 82,
    alignItems: 'flex-start',
  },
  stockAmount: {
    fontSize: 14,
    fontWeight: '700',
  },
  stockLabel: {
    color: '#718096',
    fontSize: 12,
    marginTop: 4,
  },
  bottomNavigation: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: '#e5e9ee',
    backgroundColor: '#ffffff',
    paddingHorizontal: 7,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'android' ? 10 : 6,
    shadowColor: '#5f6b78',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 9,
    elevation: 8,
  },
  navigationItem: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  navigationLabel: {
    fontSize: 11,
  },
});
