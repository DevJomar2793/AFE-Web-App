import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";

import { toMockInventoryItem } from "../data/inventory";
import { getInventoryItems } from "../lib/api";
import type { InventoryItem, InventoryRecord } from "../types/inventory";

interface InventoryScreenProps {
  onAddItem: () => void;
  onEditItem: (item: InventoryItem) => void;
  onReturn: () => void;
}

interface ProductPriceCardProps {
  item: InventoryRecord;
  isTablet: boolean;
}

const currency = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

function ProductPriceCard({
  item,
  isTablet,
}: ProductPriceCardProps) {
  return (
    <View style={[styles.priceCard, isTablet && styles.tabletPriceCard]}>
      <View style={styles.priceCardHeader}>
        <Text style={styles.priceCardName} numberOfLines={1}>
          {item.item}
        </Text>
        <View style={styles.priceIcon}>
          <Text style={styles.pesoIcon}>₱</Text>
        </View>
      </View>
      <Text style={styles.priceValue}>{currency.format(item.price)}</Text>
      {item.wholesalePrice !== null && (
        <View style={styles.wholesalePriceSection}>
          <Text style={styles.wholesalePriceLabel}>Wholesale/Batch Price</Text>
          <Text style={styles.wholesalePriceValue}>
            {currency.format(item.wholesalePrice)}
          </Text>
        </View>
      )}
    </View>
  );
}

function InventoryTableRow({
  isLast,
  item,
  onPress,
}: {
  isLast: boolean;
  item: InventoryRecord;
  onPress: () => void;
}) {
  return (
    <View style={[styles.tableRow, isLast && styles.lastTableRow]}>
      <Text style={styles.itemCell} numberOfLines={2}>
        {item.item.replace("Eggs - ", "")}
      </Text>
      <Text style={styles.quantityCell} numberOfLines={1}>
        {item.quantity}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Edit ${item.item}`}
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
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const [items, setItems] = useState<InventoryRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  const loadInventory = useCallback(
    async (signal?: AbortSignal, refresh = false) => {
      if (refresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError("");

      try {
        const inventoryItems = await getInventoryItems(signal);
        setItems(inventoryItems);
      } catch (loadError) {
        if (signal?.aborted) return;

        setError(
          loadError instanceof Error
            ? loadError.message
            : "Inventory could not be loaded. Check the API and try again.",
        );
      } finally {
        if (!signal?.aborted) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    },
    [],
  );

  useEffect(() => {
    const controller = new AbortController();
    void loadInventory(controller.signal);

    return () => controller.abort();
  }, [loadInventory]);

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return items;

    return items.filter((item) =>
      item.item.toLowerCase().includes(normalizedQuery),
    );
  }, [items, query]);

  return (
    <View style={[styles.screen, isTablet && styles.tabletScreen]}>
      <FlatList
        data={filteredItems}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={[styles.content, isTablet && styles.tabletContent]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => void loadInventory(undefined, true)}
            tintColor="#258143"
            colors={["#258143"]}
          />
        }
        ListHeaderComponent={
          <>
            <View style={[styles.header, isTablet && styles.tabletHeader]}>
              <View style={styles.headerText}>
                <Text style={styles.title}>All inventory</Text>
                <Text style={styles.subtitle}>
                  Live inventory records from the database.
                </Text>
              </View>

              <View
                style={[
                  styles.headerActions,
                  isTablet && styles.tabletHeaderActions,
                ]}
              >
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
                  <Ionicons
                    name="return-up-back-outline"
                    size={20}
                    color="#ffffff"
                  />
                  <Text style={styles.returnButtonText}>Return</Text>
                </Pressable>
              </View>
            </View>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Product prices</Text>
              <Text style={styles.sectionSubtitle}>
                Current prices for all inventory products.
              </Text>
            </View>

            <View style={styles.priceGrid}>
              {items.map((item) => (
                <ProductPriceCard
                  key={item.id}
                  item={item}
                  isTablet={isTablet}
                />
              ))}
            </View>

            {isLoading && !items.length && (
              <View style={styles.loadingState}>
                <ActivityIndicator size="small" color="#258143" />
                <Text style={styles.loadingText}>Loading inventory...</Text>
              </View>
            )}

            {error && (
              <View style={styles.errorState}>
                <Text style={styles.errorText}>{error}</Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Retry loading inventory"
                  onPress={() => void loadInventory()}
                  style={styles.retryButton}
                >
                  <Ionicons
                    name="refresh-outline"
                    size={18}
                    color="#ffffff"
                  />
                  <Text style={styles.retryButtonText}>Retry</Text>
                </Pressable>
              </View>
            )}

            <View style={styles.searchBox}>
              <Ionicons name="search-outline" size={24} color="#4d6256" />
              <TextInput
                accessibilityLabel="Search inventory"
                autoCapitalize="none"
                autoCorrect={false}
                onChangeText={setQuery}
                placeholder="Search item..."
                placeholderTextColor="#8b969e"
                style={styles.searchInput}
                value={query}
              />
            </View>

            <Text style={styles.inventoryLabel}>Inventory items</Text>

            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeading, styles.headerItemCell]}>
                Item
              </Text>
              <Text style={[styles.tableHeading, styles.headerQuantityCell]}>
                Qty
              </Text>
              <Text style={[styles.tableHeading, styles.actionHeading]}>
                Action
              </Text>
            </View>
          </>
        }
        renderItem={({ index, item }) => (
          <InventoryTableRow
            isLast={index === filteredItems.length - 1}
            item={item}
            onPress={() => onEditItem(toMockInventoryItem(item))}
          />
        )}
        ListEmptyComponent={
          !isLoading && !error ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>
                {items.length
                  ? `No inventory items match “${query}”.`
                  : "No inventory items are stored in the database."}
              </Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    width: "100%",
    maxWidth: 520,
    alignSelf: "center",
    backgroundColor: "#f8faf8",
  },
  tabletScreen: {
    maxWidth: 1120,
  },
  content: {
    padding: 20,
    paddingTop: 18,
    paddingBottom: 28,
  },
  tabletContent: {
    padding: 28,
    paddingBottom: 36,
  },
  header: {
    gap: 16,
  },
  tabletHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerText: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  title: {
    color: "#121a15",
    fontSize: 31,
    fontWeight: "700",
  },
  subtitle: {
    color: "#74808a",
    fontSize: 16,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: 10,
  },
  tabletHeaderActions: {
    width: 320,
  },
  addStockButton: {
    flex: 1,
    height: 54,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    borderWidth: 1,
    borderColor: "#dce3dd",
    borderRadius: 14,
    backgroundColor: "#ffffff",
  },
  addStockText: {
    color: "#1d4c2d",
    fontSize: 16,
    fontWeight: "700",
  },
  returnButton: {
    flex: 1,
    height: 54,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    borderRadius: 14,
    backgroundColor: "#173f28",
  },
  returnButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
  sectionHeader: {
    marginTop: 34,
    marginBottom: 18,
  },
  sectionTitle: {
    color: "#121a15",
    fontSize: 22,
    fontWeight: "700",
  },
  sectionSubtitle: {
    color: "#74808a",
    fontSize: 16,
    marginTop: 4,
  },
  priceGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  loadingState: {
    minHeight: 96,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginTop: 16,
  },
  loadingText: {
    color: "#66736c",
    fontSize: 15,
    fontWeight: "600",
  },
  errorState: {
    alignItems: "center",
    gap: 12,
    borderRadius: 14,
    backgroundColor: "#fff0e8",
    marginTop: 18,
    padding: 16,
  },
  errorText: {
    color: "#8f421f",
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 21,
    textAlign: "center",
  },
  retryButton: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    borderRadius: 11,
    backgroundColor: "#173f28",
    paddingHorizontal: 18,
  },
  retryButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
  },
  priceCard: {
    width: "48%",
    minHeight: 174,
    borderWidth: 1,
    borderColor: "#dce3dd",
    borderRadius: 15,
    backgroundColor: "#ffffff",
    padding: 16,
  },
  tabletPriceCard: {
    width: "23.5%",
  },
  priceCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  priceCardName: {
    flex: 1,
    color: "#17231b",
    fontSize: 16,
    fontWeight: "700",
  },
  priceIcon: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: "#eef7ee",
  },
  pesoIcon: {
    color: "#24663a",
    fontSize: 22,
    fontWeight: "700",
  },
  priceValue: {
    color: "#173f28",
    fontSize: 28,
    fontWeight: "700",
    marginTop: 12,
  },
  wholesalePriceSection: {
    borderTopWidth: 1,
    borderTopColor: "#e4e9e4",
    marginTop: 12,
    paddingTop: 10,
  },
  wholesalePriceLabel: {
    color: "#74808a",
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 0.35,
    textTransform: "uppercase",
  },
  wholesalePriceValue: {
    color: "#258143",
    fontSize: 20,
    fontWeight: "700",
    marginTop: 4,
  },
  searchBox: {
    height: 58,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: "#dce3dd",
    borderRadius: 15,
    backgroundColor: "#ffffff",
    marginTop: 24,
    paddingHorizontal: 18,
  },
  searchInput: {
    flex: 1,
    color: "#17231b",
    fontSize: 16,
    paddingVertical: 0,
  },
  inventoryLabel: {
    color: "#17231b",
    fontSize: 18,
    fontWeight: "700",
    marginTop: 24,
  },
  tableHeader: {
    minHeight: 50,
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#dce3dd",
    borderBottomColor: "#e8ece8",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    backgroundColor: "#ffffff",
    gap: 12,
    marginTop: 12,
    paddingHorizontal: 14,
  },
  tableRow: {
    minHeight: 84,
    flexDirection: "row",
    alignItems: "center",
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderLeftColor: "#dce3dd",
    borderRightColor: "#dce3dd",
    borderBottomColor: "#e8ece8",
    backgroundColor: "#ffffff",
    gap: 12,
    paddingHorizontal: 14,
  },
  lastTableRow: {
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  emptyState: {
    minHeight: 120,
    alignItems: "center",
    justifyContent: "center",
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#dce3dd",
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    backgroundColor: "#ffffff",
    padding: 24,
  },
  emptyText: {
    color: "#74808a",
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 21,
    textAlign: "center",
  },
  tableHeading: {
    color: "#879198",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  headerItemCell: {
    flex: 1,
  },
  headerQuantityCell: {
    width: 78,
    textAlign: "center",
  },
  itemCell: {
    flex: 1,
    color: "#17231b",
    fontSize: 14,
    fontWeight: "700",
    paddingRight: 5,
  },
  quantityCell: {
    width: 78,
    color: "#17231b",
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
  },
  actionHeading: {
    width: 72,
    textAlign: "center",
  },
  editButton: {
    width: 72,
    minHeight: 38,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    borderRadius: 9,
    backgroundColor: "#173f28",
  },
  editButtonText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
  },
});
