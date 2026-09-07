import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
  Image,
  ImageSourcePropType,
  Modal,
  Platform,
  Pressable,
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

interface SuccessNotice {
  title: string;
  message: string;
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

function InventoryRow({
  item,
  onPress,
}: {
  item: InventoryItem;
  onPress: () => void;
}) {
  const stockColor = item.isLowStock ? '#ef4444' : '#31934f';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Edit ${item.name}`}
      onPress={onPress}
      style={styles.inventoryRow}
    >
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
    </Pressable>
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

function AddStockModal({
  onClose,
  onComplete,
}: {
  onClose: () => void;
  onComplete: () => void;
}) {
  return (
    <Modal transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable
          accessibilityViewIsModal
          style={styles.modalCard}
          onPress={() => undefined}
        >
          <View style={styles.modalHeader}>
            <View style={styles.modalTitleGroup}>
              <View style={styles.modalIconBox}>
                <Ionicons name="cube-outline" size={37} color="#258143" />
                <View style={styles.modalIconPlus}>
                  <Ionicons name="add" size={16} color="#ffffff" />
                </View>
              </View>
              <View style={styles.modalTitleText}>
                <Text style={styles.modalTitle}>Add Stock</Text>
                <Text style={styles.modalSubtitle}>
                  Add new stock to your inventory item
                </Text>
              </View>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close add stock modal"
              hitSlop={10}
              onPress={onClose}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={31} color="#657082" />
            </Pressable>
          </View>

          <View style={styles.modalProductRow}>
            <Image
              source={eggsImage}
              style={styles.modalProductImage}
              resizeMode="cover"
            />
            <View>
              <Text style={styles.modalProductName}>Eggs - Medium</Text>
              <Text style={styles.modalProductCategory}>Eggs</Text>
              <Text style={styles.modalProductPrice}>₱205.00</Text>
            </View>
          </View>

          <Text style={styles.modalLabel}>Quantity to Add</Text>
          <View style={styles.quantityRow}>
            <View style={styles.quantityControl}>
              <View style={styles.quantityIconMuted}>
                <Ionicons name="remove" size={25} color="#7e8995" />
              </View>
              <Text style={styles.quantityValue}>10</Text>
              <View style={styles.quantityIconActive}>
                <Ionicons name="add" size={28} color="#258143" />
              </View>
            </View>
            <View style={styles.unitField}>
              <Text style={styles.unitFieldText}>trays</Text>
            </View>
          </View>

          <Text style={styles.modalLabel}>
            Unit Cost <Text style={styles.optionalText}>(Optional)</Text>
          </Text>
          <View style={styles.textField}>
            <Text style={styles.currencySymbol}>₱</Text>
            <Text style={styles.fieldPlaceholder}>0.00</Text>
          </View>

          <Text style={styles.modalLabel}>
            Notes <Text style={styles.optionalText}>(Optional)</Text>
          </Text>
          <View style={styles.notesField}>
            <Text style={styles.notesPlaceholder}>
              e.g. Received new delivery, supplier, etc.
            </Text>
            <Text style={styles.characterCount}>0/200</Text>
          </View>

          <View style={styles.modalActions}>
            <Pressable
              accessibilityRole="button"
              onPress={onClose}
              style={[styles.modalActionButton, styles.cancelButton]}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={onComplete}
              style={[styles.modalActionButton, styles.addStockButton]}
            >
              <Text style={styles.addStockButtonText}>Add Stock</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function EditItemModal({
  item,
  onClose,
  onSave,
}: {
  item: InventoryItem;
  onClose: () => void;
  onSave: () => void;
}) {
  const [stockAmount, stockUnit = 'units'] = item.stock.split(' ');
  const reorderThreshold = item.isLowStock ? '10' : '20';
  const note = item.category === 'Eggs'
    ? 'Fresh eggs from local supplier.'
    : 'Regular inventory item.';

  return (
    <Modal transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable
          accessibilityViewIsModal
          style={styles.editModalCard}
          onPress={() => undefined}
        >
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleGroup}>
                <View style={styles.modalIconBox}>
                  <Ionicons name="cube-outline" size={37} color="#258143" />
                </View>
                <View style={styles.modalTitleText}>
                  <Text style={styles.modalTitle}>Edit Item</Text>
                  <Text style={styles.modalSubtitle}>Update the item details</Text>
                </View>
              </View>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close edit item modal"
                hitSlop={10}
                onPress={onClose}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={31} color="#657082" />
              </Pressable>
            </View>

            <View style={styles.editImageContainer}>
              <Image source={item.image} style={styles.editProductImage} resizeMode="cover" />
              <View style={styles.cameraBadge}>
                <Ionicons name="camera-outline" size={21} color="#344255" />
              </View>
            </View>

            <Text style={styles.editFieldLabel}>Item Name</Text>
            <View style={styles.editTextField}>
              <Text style={styles.editFieldValue}>{item.name}</Text>
            </View>

            <Text style={styles.editFieldLabel}>Category</Text>
            <View style={styles.editTextField}>
              <Text style={styles.editFieldValue}>{item.category}</Text>
              <Ionicons name="chevron-down" size={21} color="#657082" />
            </View>

            <Text style={styles.editFieldLabel}>Price (₱)</Text>
            <View style={styles.editTextField}>
              <Text style={styles.editFieldValue}>{item.price.replace('₱', '')}</Text>
            </View>

            <Text style={styles.editFieldLabel}>Current Stock</Text>
            <View style={styles.editSplitRow}>
              <View style={[styles.editTextField, styles.editStockValueField]}>
                <Text style={styles.editFieldValue}>{stockAmount}</Text>
              </View>
              <View style={[styles.editTextField, styles.editUnitField]}>
                <Text style={styles.editFieldValue}>{stockUnit}</Text>
                <Ionicons name="chevron-down" size={21} color="#657082" />
              </View>
            </View>

            <Text style={styles.editFieldLabel}>Reorder Threshold</Text>
            <View style={styles.editSplitRow}>
              <View style={[styles.editTextField, styles.editStockValueField]}>
                <Text style={styles.editFieldValue}>{reorderThreshold}</Text>
              </View>
              <View style={[styles.editTextField, styles.editUnitField]}>
                <Text style={styles.editFieldValue}>{stockUnit}</Text>
                <Ionicons name="chevron-down" size={21} color="#657082" />
              </View>
            </View>

            <Text style={styles.editFieldLabel}>Notes (Optional)</Text>
            <View style={styles.editNotesField}>
              <Text style={styles.editNotesText}>{note}</Text>
              <Text style={styles.editCharacterCount}>{note.length}/200</Text>
            </View>

            <View style={styles.editActions}>
              <View style={[styles.editActionButton, styles.deleteButton]}>
                <Ionicons name="trash-outline" size={22} color="#e53935" />
                <Text style={styles.deleteButtonText}>Delete</Text>
              </View>
              <Pressable
                accessibilityRole="button"
                onPress={onSave}
                style={[styles.editActionButton, styles.saveButton]}
              >
                <Text style={styles.saveButtonText}>Save Changes</Text>
              </Pressable>
            </View>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function SuccessModal({
  notice,
  onClose,
}: {
  notice: SuccessNotice;
  onClose: () => void;
}) {
  return (
    <Modal transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.successOverlay}>
        <View accessibilityViewIsModal style={styles.successCard}>
          <View style={styles.successIllustration}>
            <View style={[styles.confetti, styles.confettiTopLeft]} />
            <View style={[styles.confetti, styles.confettiTopRight]} />
            <View style={[styles.confetti, styles.confettiMiddleLeft]} />
            <View style={[styles.confetti, styles.confettiMiddleRight]} />
            <View style={[styles.confetti, styles.confettiBottomLeft]} />
            <View style={[styles.confetti, styles.confettiBottomRight]} />
            <View style={styles.successCheckCircle}>
              <Ionicons name="checkmark" size={68} color="#258143" />
            </View>
          </View>

          <Text style={styles.successTitle}>{notice.title}</Text>
          <Text style={styles.successMessage}>{notice.message}</Text>

          <Pressable
            accessibilityRole="button"
            onPress={onClose}
            style={styles.doneButton}
          >
            <Text style={styles.doneButtonText}>Done</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

export default function App() {
  const [isAddStockModalVisible, setIsAddStockModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [successNotice, setSuccessNotice] = useState<SuccessNotice | null>(null);

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

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Add item"
            onPress={() => setIsAddStockModalVisible(true)}
            style={styles.addButton}
          >
            <Ionicons name="add" size={25} color="#ffffff" />
            <Text style={styles.addButtonText}>Add Item</Text>
          </Pressable>
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
            <InventoryRow
              key={item.id}
              item={item}
              onPress={() => setEditingItem(item)}
            />
          ))}
        </ScrollView>

        <View style={styles.bottomNavigation}>
          <BottomNavigationItem icon="home-outline" label="Home" />
          <BottomNavigationItem icon="cube" label="Inventory" isActive />
          <BottomNavigationItem icon="receipt-outline" label="Orders" />
          <BottomNavigationItem icon="bar-chart-outline" label="Reports" />
          <BottomNavigationItem icon="person-outline" label="Profile" />
        </View>

        {isAddStockModalVisible && (
          <AddStockModal
            onClose={() => setIsAddStockModalVisible(false)}
            onComplete={() => {
              setIsAddStockModalVisible(false);
              setSuccessNotice({
                title: 'Stock Added!',
                message: '10 trays of Eggs - Medium\nhas been added to your inventory.',
              });
            }}
          />
        )}

        {editingItem && (
          <EditItemModal
            item={editingItem}
            onClose={() => setEditingItem(null)}
            onSave={() => {
              setEditingItem(null);
              setSuccessNotice({
                title: 'Changes Saved!',
                message: `${editingItem.name} details have been updated.`,
              });
            }}
          />
        )}

        {successNotice && (
          <SuccessModal
            notice={successNotice}
            onClose={() => setSuccessNotice(null)}
          />
        )}
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
  modalOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(16, 24, 32, 0.65)',
    padding: 18,
  },
  modalCard: {
    width: '100%',
    maxWidth: 430,
    borderRadius: 26,
    backgroundColor: '#ffffff',
    padding: 22,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.24,
    shadowRadius: 28,
    elevation: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalTitleGroup: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  modalIconBox: {
    width: 74,
    height: 74,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: '#e4f5e9',
  },
  modalIconPlus: {
    position: 'absolute',
    right: 8,
    bottom: 9,
    width: 25,
    height: 25,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 13,
    backgroundColor: '#258143',
  },
  modalTitleText: {
    flex: 1,
  },
  modalTitle: {
    color: '#111827',
    fontSize: 29,
    fontWeight: '700',
  },
  modalSubtitle: {
    color: '#718096',
    fontSize: 15,
    lineHeight: 21,
    marginTop: 3,
  },
  closeButton: {
    paddingTop: 1,
  },
  modalProductRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: 22,
  },
  modalProductImage: {
    width: 96,
    height: 96,
    borderRadius: 13,
  },
  modalProductName: {
    color: '#121820',
    fontSize: 20,
    fontWeight: '700',
  },
  modalProductCategory: {
    color: '#718096',
    fontSize: 16,
    marginTop: 4,
  },
  modalProductPrice: {
    color: '#258143',
    fontSize: 19,
    fontWeight: '700',
    marginTop: 6,
  },
  modalLabel: {
    color: '#2f3b49',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 22,
  },
  optionalText: {
    fontWeight: '400',
  },
  quantityRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 9,
  },
  quantityControl: {
    flex: 1,
    height: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#d7dee6',
    borderRadius: 13,
    backgroundColor: '#ffffff',
    paddingHorizontal: 8,
  },
  quantityIconMuted: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: '#f0f3f5',
  },
  quantityValue: {
    color: '#121820',
    fontSize: 21,
    fontWeight: '700',
  },
  quantityIconActive: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: '#e4f5e9',
  },
  unitField: {
    width: 116,
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#d7dee6',
    borderRadius: 13,
    backgroundColor: '#f3f6f8',
  },
  unitFieldText: {
    color: '#2f3b49',
    fontSize: 17,
  },
  textField: {
    height: 58,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderWidth: 1,
    borderColor: '#d7dee6',
    borderRadius: 13,
    backgroundColor: '#ffffff',
    marginTop: 9,
    paddingHorizontal: 18,
  },
  currencySymbol: {
    color: '#2f3b49',
    fontSize: 20,
    fontWeight: '600',
  },
  fieldPlaceholder: {
    color: '#99a3b0',
    fontSize: 18,
  },
  notesField: {
    height: 126,
    borderWidth: 1,
    borderColor: '#d7dee6',
    borderRadius: 13,
    backgroundColor: '#ffffff',
    marginTop: 9,
    padding: 16,
  },
  notesPlaceholder: {
    color: '#99a3b0',
    fontSize: 16,
    lineHeight: 21,
  },
  characterCount: {
    position: 'absolute',
    right: 15,
    bottom: 12,
    color: '#8994a1',
    fontSize: 14,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 14,
    marginTop: 24,
  },
  modalActionButton: {
    flex: 1,
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 13,
  },
  cancelButton: {
    backgroundColor: '#eef2f5',
  },
  cancelButtonText: {
    color: '#536171',
    fontSize: 18,
    fontWeight: '700',
  },
  addStockButton: {
    backgroundColor: '#258143',
  },
  addStockButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  editModalCard: {
    width: '100%',
    maxWidth: 430,
    maxHeight: '90%',
    borderRadius: 26,
    backgroundColor: '#ffffff',
    padding: 22,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.24,
    shadowRadius: 28,
    elevation: 12,
  },
  editImageContainer: {
    width: 138,
    height: 138,
    marginTop: 20,
  },
  editProductImage: {
    width: 138,
    height: 138,
    borderRadius: 14,
  },
  cameraBadge: {
    position: 'absolute',
    right: -4,
    bottom: -4,
    width: 43,
    height: 43,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#dce3e9',
    borderRadius: 12,
    backgroundColor: '#ffffff',
  },
  editFieldLabel: {
    color: '#2f3b49',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 20,
  },
  editTextField: {
    height: 53,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#d7dee6',
    borderRadius: 12,
    backgroundColor: '#ffffff',
    marginTop: 9,
    paddingHorizontal: 16,
  },
  editFieldValue: {
    color: '#27313d',
    fontSize: 17,
  },
  editSplitRow: {
    flexDirection: 'row',
    gap: 12,
  },
  editStockValueField: {
    flex: 1,
  },
  editUnitField: {
    flex: 1,
  },
  editNotesField: {
    height: 111,
    borderWidth: 1,
    borderColor: '#d7dee6',
    borderRadius: 12,
    backgroundColor: '#ffffff',
    marginTop: 9,
    padding: 15,
  },
  editNotesText: {
    color: '#7c8a9c',
    fontSize: 16,
    lineHeight: 21,
  },
  editCharacterCount: {
    position: 'absolute',
    right: 14,
    bottom: 11,
    color: '#7c8a9c',
    fontSize: 14,
  },
  editActions: {
    flexDirection: 'row',
    gap: 14,
    marginTop: 25,
    paddingBottom: 2,
  },
  editActionButton: {
    flex: 1,
    height: 59,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    borderRadius: 13,
  },
  deleteButton: {
    backgroundColor: '#f0f3f5',
  },
  deleteButtonText: {
    color: '#e53935',
    fontSize: 17,
    fontWeight: '700',
  },
  saveButton: {
    backgroundColor: '#258143',
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '700',
  },
  successOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(16, 24, 32, 0.65)',
    padding: 18,
  },
  successCard: {
    width: '100%',
    maxWidth: 430,
    borderRadius: 26,
    backgroundColor: '#ffffff',
    paddingHorizontal: 26,
    paddingTop: 42,
    paddingBottom: 34,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.24,
    shadowRadius: 28,
    elevation: 12,
  },
  successIllustration: {
    width: 180,
    height: 180,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successCheckCircle: {
    width: 130,
    height: 130,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 65,
    backgroundColor: '#e2f5e9',
  },
  confetti: {
    position: 'absolute',
    width: 13,
    height: 27,
    borderRadius: 8,
  },
  confettiTopLeft: {
    top: 18,
    left: 36,
    backgroundColor: '#31934f',
    transform: [{ rotate: '-32deg' }],
  },
  confettiTopRight: {
    top: 11,
    right: 36,
    backgroundColor: '#f6c847',
    transform: [{ rotate: '42deg' }],
  },
  confettiMiddleLeft: {
    top: 82,
    left: 0,
    backgroundColor: '#f6c847',
    transform: [{ rotate: '-34deg' }],
  },
  confettiMiddleRight: {
    top: 80,
    right: 0,
    backgroundColor: '#4ebc6d',
    transform: [{ rotate: '50deg' }],
  },
  confettiBottomLeft: {
    bottom: 18,
    left: 22,
    backgroundColor: '#5ac17a',
    transform: [{ rotate: '-46deg' }],
  },
  confettiBottomRight: {
    right: 25,
    bottom: 17,
    backgroundColor: '#f6c847',
    transform: [{ rotate: '-38deg' }],
  },
  successTitle: {
    color: '#111827',
    fontSize: 31,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 15,
  },
  successMessage: {
    color: '#687789',
    fontSize: 18,
    lineHeight: 27,
    textAlign: 'center',
    marginTop: 22,
  },
  doneButton: {
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: '#258143',
    marginTop: 42,
  },
  doneButtonText: {
    color: '#ffffff',
    fontSize: 19,
    fontWeight: '700',
  },
});
