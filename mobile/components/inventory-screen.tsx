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

import { getInventoryItems } from "../lib/api";
import type { InventoryRecord, InventoryStatus } from "../types/inventory";

interface InventoryScreenProps {
  onAddItem: () => void;
  onEditItem: (item: InventoryRecord) => void;
  onReturn: () => void;
  refreshKey: number;
}

interface ProductPriceCardProps {
  item: InventoryRecord;
  columns: number;
}

const currency = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

const statusLabels: Record<InventoryStatus, string> = {
  in_stock: "In stock",
  low_stock: "Low stock",
  out_of_stock: "Out of stock",
};

function getStatus(item: InventoryRecord): InventoryStatus {
  if (item.quantity === 0) return "out_of_stock";
  if (item.quantity <= 4) return "low_stock";
  return "in_stock";
}

function ProductPriceCard({ item, columns }: ProductPriceCardProps) {
  return (
    <View
      style={[
        styles.priceCard,
        columns === 2 && styles.twoColumnPriceCard,
        columns === 4 && styles.fourColumnPriceCard,
      ]}
    >
      <View style={styles.priceCardHeader}>
        <Text style={styles.priceCardName}>{item.item}</Text>
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

function StatusBadge({ status }: { status: InventoryStatus }) {
  return (
    <View style={[styles.statusBadge, styles[`${status}Badge`]]}>
      <View style={[styles.statusDot, styles[`${status}Dot`]]} />
      <Text style={[styles.statusText, styles[`${status}Text`]]}>
        {statusLabels[status]}
      </Text>
    </View>
  );
}

function InventoryCard({
  item,
  onEdit,
}: {
  item: InventoryRecord;
  onEdit: () => void;
}) {
  const status = getStatus(item);

  return (
    <View style={styles.inventoryCard}>
      <Text style={styles.itemName}>{item.item}</Text>
      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Quantity</Text>
        <Text style={styles.detailValue}>{item.quantity}</Text>
      </View>
      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Returns</Text>
        <Text style={styles.returnsValue}>{item.returnsCount}</Text>
      </View>
      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Status</Text>
        <StatusBadge status={status} />
      </View>
      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Action</Text>
        <EditButton itemName={item.item} onPress={onEdit} />
      </View>
    </View>
  );
}

function InventoryTableRow({
  item,
  onEdit,
}: {
  item: InventoryRecord;
  onEdit: () => void;
}) {
  return (
    <View style={styles.tableRow}>
      <Text style={[styles.tableItem, styles.itemColumn]} numberOfLines={2}>
        {item.item}
      </Text>
      <Text style={[styles.tableNumber, styles.quantityColumn]}>
        {item.quantity}
      </Text>
      <Text style={[styles.tableReturns, styles.returnsColumn]}>
        {item.returnsCount}
      </Text>
      <View style={styles.statusColumn}>
        <StatusBadge status={getStatus(item)} />
      </View>
      <View style={styles.actionColumn}>
        <EditButton itemName={item.item} onPress={onEdit} />
      </View>
    </View>
  );
}

function EditButton({
  itemName,
  onPress,
}: {
  itemName: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Edit ${itemName}`}
      onPress={onPress}
      style={styles.editButton}
    >
      <Ionicons name="pencil-outline" size={14} color="#ffffff" />
      <Text style={styles.editButtonText}>Edit</Text>
    </Pressable>
  );
}

export function InventoryScreen({
  onAddItem,
  onEditItem,
  onReturn,
  refreshKey,
}: InventoryScreenProps) {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const priceColumns = isTablet ? 4 : width >= 420 ? 2 : 1;
  const [items, setItems] = useState<InventoryRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  const loadInventory = useCallback(
    async (signal?: AbortSignal, refresh = false) => {
      if (refresh) setIsRefreshing(true);
      else setIsLoading(true);
      setError("");

      try {
        setItems(await getInventoryItems(signal));
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
  }, [loadInventory, refreshKey]);

  const filteredItems = useMemo(() => {
    const search = query.trim().toLowerCase();
    return items.filter(
      (item) => !search || item.item.toLowerCase().includes(search),
    );
  }, [items, query]);

  return (
    <View style={[styles.screen, isTablet && styles.tabletScreen]}>
      <FlatList
        data={isLoading || error ? [] : filteredItems}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={[
          styles.content,
          isTablet && styles.tabletContent,
        ]}
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
              <View style={styles.headerActions}>
                <Pressable onPress={onAddItem} style={styles.addStockButton}>
                  <Ionicons name="cube-outline" size={18} color="#173b24" />
                  <Text style={styles.addStockText}>Add stock</Text>
                </Pressable>
                <Pressable onPress={onReturn} style={styles.returnButton}>
                  <Ionicons
                    name="return-up-back-outline"
                    size={18}
                    color="#ffffff"
                  />
                  <Text style={styles.returnButtonText}>Return</Text>
                </Pressable>
              </View>
            </View>

            {!error && (
              <View style={styles.priceSection}>
                <Text style={styles.sectionTitle}>Product prices</Text>
                <Text style={styles.sectionSubtitle}>
                  Current prices for all inventory products.
                </Text>
                {isLoading ? (
                  <View style={styles.loadingPrices}>
                    <ActivityIndicator color="#258143" />
                    <Text style={styles.loadingText}>
                      Loading product prices...
                    </Text>
                  </View>
                ) : items.length ? (
                  <View style={styles.priceGrid}>
                    {items.map((item) => (
                      <ProductPriceCard
                        key={item.id}
                        item={item}
                        columns={priceColumns}
                      />
                    ))}
                  </View>
                ) : (
                  <Text style={styles.emptyPrices}>
                    No product prices are available yet.
                  </Text>
                )}
              </View>
            )}

            <View style={styles.searchBox}>
              <Ionicons name="search-outline" size={19} color="#839087" />
              <TextInput
                accessibilityLabel="Search inventory"
                autoCapitalize="none"
                autoCorrect={false}
                onChangeText={setQuery}
                placeholder="Search item"
                placeholderTextColor="#839087"
                style={styles.searchInput}
                value={query}
              />
            </View>

            {isTablet && !isLoading && !error && (
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeading, styles.itemColumn]}>
                  Item
                </Text>
                <Text style={[styles.tableHeading, styles.quantityColumn]}>
                  Quantity
                </Text>
                <Text style={[styles.tableHeading, styles.returnsColumn]}>
                  Returns
                </Text>
                <Text style={[styles.tableHeading, styles.statusColumn]}>
                  Status
                </Text>
                <Text style={[styles.tableHeading, styles.actionColumn]}>
                  Action
                </Text>
              </View>
            )}

            {isLoading && (
              <View style={styles.listState}>
                <ActivityIndicator color="#258143" />
                <Text style={styles.loadingText}>Loading inventory...</Text>
              </View>
            )}

            {error && (
              <View style={styles.errorState} accessibilityRole="alert">
                <Text style={styles.errorText}>{error}</Text>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => void loadInventory()}
                  style={styles.retryButton}
                >
                  <Ionicons name="refresh-outline" size={16} color="#ffffff" />
                  <Text style={styles.retryButtonText}>Try again</Text>
                </Pressable>
              </View>
            )}
          </>
        }
        renderItem={({ item }) =>
          isTablet ? (
            <InventoryTableRow item={item} onEdit={() => onEditItem(item)} />
          ) : (
            <InventoryCard item={item} onEdit={() => onEditItem(item)} />
          )
        }
        ListEmptyComponent={
          !isLoading && !error ? (
            <Text style={styles.emptyList}>
              {items.length
                ? `No inventory items match “${query}”.`
                : "No inventory items are stored in the database."}
            </Text>
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
    backgroundColor: "#f4f6f1",
  },
  tabletScreen: { maxWidth: 1120 },
  content: { padding: 18, paddingBottom: 28 },
  tabletContent: { padding: 28, paddingBottom: 36 },
  header: { gap: 16 },
  tabletHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerText: { flex: 1, minWidth: 0 },
  title: { color: "#18251a", fontSize: 24, fontWeight: "800" },
  subtitle: { color: "#768178", fontSize: 14, marginTop: 4 },
  headerActions: { flexDirection: "row", gap: 8 },
  addStockButton: {
    height: 44,
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    borderWidth: 1,
    borderColor: "#cfd8cd",
    borderRadius: 12,
    backgroundColor: "#ffffff",
    paddingHorizontal: 14,
  },
  addStockText: { color: "#173b24", fontSize: 14, fontWeight: "800" },
  returnButton: {
    height: 44,
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    borderRadius: 12,
    backgroundColor: "#173b24",
    paddingHorizontal: 14,
  },
  returnButtonText: { color: "#ffffff", fontSize: 14, fontWeight: "800" },
  priceSection: { marginTop: 24 },
  sectionTitle: { color: "#18251a", fontSize: 18, fontWeight: "800" },
  sectionSubtitle: { color: "#768178", fontSize: 14, marginTop: 4 },
  priceGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 16 },
  priceCard: {
    width: "100%",
    minHeight: 128,
    borderWidth: 1,
    borderColor: "#e0e5de",
    borderRadius: 16,
    backgroundColor: "#ffffff",
    padding: 18,
  },
  twoColumnPriceCard: { width: "48%" },
  fourColumnPriceCard: { width: "23.5%" },
  priceCardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10,
  },
  priceCardName: { flex: 1, color: "#26382a", fontSize: 16, fontWeight: "800" },
  priceIcon: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: "#edf5eb",
  },
  pesoIcon: { color: "#39704a", fontSize: 18, fontWeight: "800" },
  priceValue: {
    color: "#173b24",
    fontSize: 24,
    fontWeight: "800",
    marginTop: 14,
  },
  wholesalePriceSection: {
    borderTopWidth: 1,
    borderTopColor: "#e8ece6",
    marginTop: 14,
    paddingTop: 12,
  },
  wholesalePriceLabel: {
    color: "#768178",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  wholesalePriceValue: {
    color: "#39704a",
    fontSize: 18,
    fontWeight: "800",
    marginTop: 4,
  },
  loadingPrices: {
    minHeight: 110,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  loadingText: { color: "#66736c", fontSize: 14, fontWeight: "600" },
  emptyPrices: {
    marginTop: 16,
    borderWidth: 1,
    borderColor: "#e0e5de",
    borderRadius: 16,
    backgroundColor: "#ffffff",
    color: "#7c867e",
    fontSize: 14,
    fontWeight: "600",
    padding: 24,
    textAlign: "center",
  },
  searchBox: {
    height: 50,
    maxWidth: 440,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: "#d7ded5",
    borderRadius: 12,
    backgroundColor: "#ffffff",
    marginTop: 24,
    paddingHorizontal: 14,
  },
  searchInput: { flex: 1, color: "#18251a", fontSize: 14, paddingVertical: 0 },
  inventoryCard: {
    gap: 13,
    borderWidth: 1,
    borderColor: "#e0e5de",
    borderRadius: 16,
    backgroundColor: "#ffffff",
    marginTop: 12,
    padding: 18,
  },
  itemName: { color: "#18251a", fontSize: 16, fontWeight: "800" },
  detailRow: {
    minHeight: 32,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
  },
  detailLabel: {
    color: "#929a94",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  detailValue: { color: "#18251a", fontSize: 17, fontWeight: "800" },
  returnsValue: { color: "#9b3f3f", fontSize: 17, fontWeight: "800" },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 12, fontWeight: "800" },
  in_stockBadge: { backgroundColor: "#e9f4e8" },
  low_stockBadge: { backgroundColor: "#fff0e5" },
  out_of_stockBadge: { backgroundColor: "#f8e8e8" },
  in_stockDot: { backgroundColor: "#3d8a53" },
  low_stockDot: { backgroundColor: "#d46c2c" },
  out_of_stockDot: { backgroundColor: "#bf5555" },
  in_stockText: { color: "#28643c" },
  low_stockText: { color: "#a44f1f" },
  out_of_stockText: { color: "#9b3f3f" },
  editButton: {
    height: 36,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 8,
    backgroundColor: "#173b24",
    paddingHorizontal: 12,
  },
  editButtonText: { color: "#ffffff", fontSize: 12, fontWeight: "800" },
  tableHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: "#e0e5de",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    backgroundColor: "#f8f9f6",
    marginTop: 20,
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  tableHeading: {
    color: "#818b83",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.7,
    textTransform: "uppercase",
  },
  tableRow: {
    minHeight: 72,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#e0e5de",
    backgroundColor: "#ffffff",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  itemColumn: { flex: 1.5 },
  quantityColumn: { flex: 0.7, textAlign: "center" },
  returnsColumn: { flex: 0.7, textAlign: "center" },
  statusColumn: { flex: 0.9 },
  actionColumn: { flex: 0.65, alignItems: "flex-start" },
  tableItem: { color: "#18251a", fontSize: 14, fontWeight: "800" },
  tableNumber: { color: "#18251a", fontSize: 16, fontWeight: "800" },
  tableReturns: { color: "#9b3f3f", fontSize: 16, fontWeight: "800" },
  listState: {
    minHeight: 150,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: "#e0e5de",
    borderRadius: 16,
    backgroundColor: "#ffffff",
    marginTop: 20,
  },
  errorState: {
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e0e5de",
    borderRadius: 16,
    backgroundColor: "#ffffff",
    marginTop: 20,
    padding: 32,
  },
  errorText: {
    color: "#9b3f3f",
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 21,
    textAlign: "center",
  },
  retryButton: {
    height: 40,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    borderRadius: 10,
    backgroundColor: "#173b24",
    marginTop: 14,
    paddingHorizontal: 15,
  },
  retryButtonText: { color: "#ffffff", fontSize: 14, fontWeight: "800" },
  emptyList: {
    borderWidth: 1,
    borderColor: "#e0e5de",
    borderRadius: 16,
    backgroundColor: "#ffffff",
    color: "#7c867e",
    fontSize: 14,
    fontWeight: "600",
    marginTop: 12,
    padding: 32,
    textAlign: "center",
  },
});
