import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import {
  createSaleBatch,
  deleteSale,
  getInventoryItems,
  getSales,
  updateSale,
  type SaleRecord,
} from "../lib/api";
import type { InventoryRecord } from "../types/inventory";

interface TransactionScreenProps {
  onBack: () => void;
  onShowSuccess: (title: string, message: string) => void;
}

type DateRange = "daily" | "weekly";
type SaleLine = {
  id: number;
  inventoryId: number;
  quantity: string;
  price?: string;
};

const currency = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  maximumFractionDigits: 0,
});

function manilaDateKey(value: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    timeZone: "Asia/Manila",
  }).formatToParts(value);
  const getPart = (type: string) =>
    Number(parts.find((part) => part.type === type)?.value);
  return `${getPart("year")}-${String(getPart("month")).padStart(2, "0")}-${String(getPart("day")).padStart(2, "0")}`;
}

function shiftDate(dateKey: string, days: number) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day + days))
    .toISOString()
    .slice(0, 10);
}

function displayDate(dateKey: string, includeYear = false) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    ...(includeYear ? { year: "numeric" } : {}),
    timeZone: "UTC",
  });
}

function saleTotal(sale: SaleRecord) {
  return sale.items.reduce(
    (total, item) => total + item.price * item.quantity,
    0,
  );
}

function SaleRow({
  sale,
  onEdit,
  onRemove,
}: {
  sale: SaleRecord;
  onEdit: () => void;
  onRemove: () => void;
}) {
  const quantity = sale.items.reduce((total, item) => total + item.quantity, 0);
  return (
    <View style={styles.saleRow}>
      <View style={styles.saleIcon}>
        <Ionicons name="arrow-up-outline" size={19} color="#2f7043" />
      </View>
      <View style={styles.saleDetails}>
        <Text style={styles.saleTitle} numberOfLines={1}>
          Sale · {sale.customerName}
        </Text>
        <Text style={styles.saleItems} numberOfLines={2}>
          {sale.items
            .map((item) => `${item.item.name} · ${item.quantity}`)
            .join(", ")}
        </Text>
      </View>
      <View style={styles.saleAmount}>
        <Text style={styles.quantity}>
          −{quantity} {quantity === 1 ? "unit" : "units"}
        </Text>
        <Text style={styles.priceSummary}>
          {currency.format(saleTotal(sale))} total
        </Text>
        <Text style={styles.dateTime}>
          {new Date(sale.createdAt).toLocaleString("en-PH", {
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
          })}
        </Text>
        <View style={styles.rowActions}>
          <Pressable onPress={onEdit} style={styles.iconAction}>
            <Ionicons name="pencil-outline" size={16} color="#173b24" />
          </Pressable>
          <Pressable onPress={onRemove} style={styles.iconAction}>
            <Ionicons name="trash-outline" size={16} color="#9b431f" />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function DatePickerModal({
  visible,
  rangeEndDate,
  onClose,
  onSelect,
}: {
  visible: boolean;
  rangeEndDate: string;
  onClose: () => void;
  onSelect: (date: string) => void;
}) {
  const dates = Array.from({ length: 30 }, (_, index) =>
    shiftDate(rangeEndDate, -index),
  );
  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.dateModal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select date</Text>
            <Pressable onPress={onClose}>
              <Ionicons name="close" size={24} color="#173b24" />
            </Pressable>
          </View>
          <ScrollView>
            {dates.map((date) => (
              <Pressable
                key={date}
                onPress={() => onSelect(date)}
                style={styles.dateOption}
              >
                <Text style={styles.dateOptionText}>
                  {displayDate(date, true)}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function SaleEditorModal({
  visible,
  sale,
  inventory,
  onClose,
  onSaved,
}: {
  visible: boolean;
  sale: SaleRecord | null;
  inventory: InventoryRecord[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = sale !== null;
  const [customerName, setCustomerName] = useState("");
  const [lines, setLines] = useState<SaleLine[]>([]);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setCustomerName(sale?.customerName ?? "");
    setLines(
      sale
        ? sale.items.map((item) => ({
            id: item.id,
            inventoryId: item.inventoryId,
            quantity: String(item.quantity),
            price: String(item.price),
          }))
        : inventory
            .filter((item) => item.quantity > 0)
            .slice(0, 1)
            .map((item) => ({
              id: item.id,
              inventoryId: item.id,
              quantity: "1",
            })),
    );
    setError("");
  }, [visible, sale, inventory]);

  const selectedIds = new Set(lines.map((line) => line.inventoryId));
  function updateLine(id: number, changes: Partial<SaleLine>) {
    setLines((current) =>
      current.map((line) => (line.id === id ? { ...line, ...changes } : line)),
    );
    setError("");
  }
  function addLine() {
    const item = inventory.find(
      (entry) => entry.quantity > 0 && !selectedIds.has(entry.id),
    );
    if (item)
      setLines((current) => [
        ...current,
        { id: Date.now(), inventoryId: item.id, quantity: "1" },
      ]);
  }
  function removeLine(id: number) {
    if (lines.length > 1)
      setLines((current) => current.filter((line) => line.id !== id));
  }

  async function save() {
    const customer = customerName.trim();
    if (!isEdit && !customer) {
      setError("Enter a customer name.");
      return;
    }
    const normalized = [] as {
      id?: number;
      inventoryId: number;
      quantity: number;
      price?: number;
    }[];
    for (const line of lines) {
      const quantity = Number(line.quantity);
      const item = inventory.find((entry) => entry.id === line.inventoryId);
      const price = Number(line.price);
      if (!Number.isInteger(quantity) || quantity < 1) {
        setError("Each quantity must be at least one.");
        return;
      }
      if (!isEdit && (!item || quantity > item.quantity)) {
        setError(`Not enough stock for ${item?.item ?? "the selected item"}.`);
        return;
      }
      if (isEdit && (!Number.isFinite(price) || price < 0)) {
        setError("Enter a valid price for every item.");
        return;
      }
      normalized.push({
        id: isEdit ? line.id : undefined,
        inventoryId: line.inventoryId,
        quantity,
        price: isEdit ? price : undefined,
      });
    }
    setIsSaving(true);
    setError("");
    try {
      if (isEdit && sale)
        await updateSale(sale.id, {
          items: normalized.map((line) => ({
            id: line.id!,
            quantity: line.quantity,
            price: line.price!,
          })),
        });
      else
        await createSaleBatch({
          customerName: customer,
          items: normalized.map((line) => ({
            inventoryId: line.inventoryId,
            quantity: line.quantity,
          })),
        });
      onSaved();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "The sale could not be saved.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.formModal}>
          <ScrollView
            contentContainerStyle={styles.formContent}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalEyebrow}>
                  Transaction{sale ? ` #${sale.id}` : ""}
                </Text>
                <Text style={styles.modalTitle}>
                  {isEdit ? "Edit sale" : "Record new sale"}
                </Text>
                <Text style={styles.modalSubtitle}>
                  {isEdit
                    ? "Update each sale line."
                    : "Stock is deducted when the sale is saved."}
                </Text>
              </View>
              <Pressable disabled={isSaving} onPress={onClose}>
                <Ionicons name="close" size={24} color="#173b24" />
              </Pressable>
            </View>
            {!isEdit && (
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Customer</Text>
                <TextInput
                  value={customerName}
                  onChangeText={setCustomerName}
                  editable={!isSaving}
                  placeholder="Customer or business name"
                  style={styles.field}
                />
              </View>
            )}
            {lines.map((line, index) => {
              const item = inventory.find(
                (entry) => entry.id === line.inventoryId,
              );
              return (
                <View style={styles.lineCard} key={line.id}>
                  <View style={styles.lineHeader}>
                    <Text style={styles.lineTitle}>
                      {item?.item ?? "Item"}{" "}
                    </Text>
                    {!isEdit && lines.length > 1 && (
                      <Pressable onPress={() => removeLine(line.id)}>
                        <Text style={styles.removeText}>Remove</Text>
                      </Pressable>
                    )}
                  </View>
                  {!isEdit && (
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.productChoices}
                    >
                      {inventory
                        .filter(
                          (entry) =>
                            entry.quantity > 0 &&
                            (entry.id === line.inventoryId ||
                              !selectedIds.has(entry.id)),
                        )
                        .map((entry) => (
                          <Pressable
                            key={entry.id}
                            onPress={() =>
                              updateLine(line.id, {
                                inventoryId: entry.id,
                                quantity: "1",
                              })
                            }
                            style={[
                              styles.productChoice,
                              entry.id === line.inventoryId &&
                                styles.selectedProductChoice,
                            ]}
                          >
                            <Text style={styles.productChoiceText}>
                              {entry.item}
                            </Text>
                          </Pressable>
                        ))}
                    </ScrollView>
                  )}
                  <View style={styles.lineFields}>
                    <View style={styles.smallField}>
                      <Text style={styles.label}>Quantity</Text>
                      <TextInput
                        value={line.quantity}
                        onChangeText={(value) =>
                          updateLine(line.id, { quantity: value })
                        }
                        editable={!isSaving}
                        keyboardType="number-pad"
                        style={styles.field}
                      />
                    </View>
                    {isEdit && (
                      <View style={styles.smallField}>
                        <Text style={styles.label}>Price</Text>
                        <TextInput
                          value={line.price ?? ""}
                          onChangeText={(value) =>
                            updateLine(line.id, { price: value })
                          }
                          editable={!isSaving}
                          keyboardType="decimal-pad"
                          style={styles.field}
                        />
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
            {!isEdit && (
              <Pressable
                disabled={
                  isSaving ||
                  selectedIds.size >=
                    inventory.filter((item) => item.quantity > 0).length
                }
                onPress={addLine}
                style={styles.addLineButton}
              >
                <Ionicons name="add" size={17} color="#173b24" />
                <Text style={styles.addLineText}>Add another item</Text>
              </Pressable>
            )}
            {error ? <Text style={styles.formError}>{error}</Text> : null}
            <Pressable
              disabled={isSaving || !lines.length}
              onPress={() => void save()}
              style={styles.saveButton}
            >
              {isSaving ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Ionicons
                  name={isEdit ? "save-outline" : "add"}
                  size={19}
                  color="#ffffff"
                />
              )}
              <Text style={styles.saveButtonText}>
                {isSaving ? "Saving..." : isEdit ? "Update sale" : "Save sale"}
              </Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

export function TransactionScreen({
  onBack,
  onShowSuccess,
}: TransactionScreenProps) {
  const today = manilaDateKey(new Date());
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [inventory, setInventory] = useState<InventoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [range, setRange] = useState<DateRange>("weekly");
  const [rangeEndDate, setRangeEndDate] = useState(today);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<SaleRecord | null | undefined>(
    undefined,
  );
  const loadData = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    setError("");
    try {
      const [nextSales, nextInventory] = await Promise.all([
        getSales(),
        getInventoryItems(),
      ]);
      setSales(nextSales);
      setInventory(nextInventory);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Sales could not be loaded.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);
  useEffect(() => {
    void loadData();
  }, [loadData]);
  const days = useMemo(
    () =>
      Array.from({ length: 7 }, (_, index) =>
        shiftDate(rangeEndDate, index - 6),
      ),
    [rangeEndDate],
  );
  const displayedSales = useMemo(() => {
    const search = query.trim().toLowerCase();
    const dateKeys = new Set(days);
    return sales
      .filter((sale) => {
        const key = manilaDateKey(new Date(sale.createdAt));
        const matchesRange =
          range === "daily" ? key === selectedDate : dateKeys.has(key);
        const matchesSearch =
          !search ||
          sale.customerName.toLowerCase().includes(search) ||
          sale.items.some((item) =>
            item.item.name.toLowerCase().includes(search),
          );
        return matchesRange && matchesSearch;
      })
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  }, [sales, days, query, range, selectedDate]);
  const total = displayedSales.reduce((sum, sale) => sum + saleTotal(sale), 0);
  function selectDate(date: string) {
    setSelectedDate(date);
    setRangeEndDate(date);
    setRange("daily");
    setIsDatePickerOpen(false);
  }
  function removeSale(sale: SaleRecord) {
    Alert.alert(
      "Remove sale?",
      "This will restore its quantities to inventory.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () =>
            void (async () => {
              try {
                await deleteSale(sale.id);
                await loadData(true);
                onShowSuccess("Sale removed", "Inventory has been restored.");
              } catch (removeError) {
                Alert.alert(
                  "Unable to remove sale",
                  removeError instanceof Error
                    ? removeError.message
                    : "Please try again.",
                );
              }
            })(),
        },
      ],
    );
  }
  function savedSale() {
    setEditingSale(undefined);
    void loadData(true);
    onShowSuccess("Sale saved", "Sales and inventory have been updated.");
  }
  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void loadData(true)}
            tintColor="#258143"
          />
        }
      >
        <Pressable onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#111b14" />
        </Pressable>
        <Text style={styles.currentDate}>
          {new Date().toLocaleDateString("en-PH", {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </Text>
        <Text style={styles.title}>Transaction activity</Text>
        <Text style={styles.subtitle}>Sales recorded in the database.</Text>
        <View style={styles.rangeToggle}>
          {(["daily", "weekly"] as DateRange[]).map((value) => (
            <Pressable
              key={value}
              onPress={() => setRange(value)}
              style={[
                styles.rangeButton,
                range === value && styles.activeRangeButton,
              ]}
            >
              <Text
                style={[
                  styles.rangeButtonText,
                  range === value && styles.activeRangeButtonText,
                ]}
              >
                {value === "daily" ? "Daily" : "▮▮ Weekly"}
              </Text>
            </Pressable>
          ))}
        </View>
        <View style={styles.dateSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Sales by Date (Last 7 Days)</Text>
            <View style={styles.weekButtons}>
              <Pressable
                onPress={() => {
                  setRangeEndDate((date) => shiftDate(date, -7));
                  setSelectedDate(null);
                }}
                style={styles.weekButton}
              >
                <Ionicons name="arrow-back" size={19} color="#173b24" />
              </Pressable>
              <Pressable
                onPress={() => {
                  setRangeEndDate((date) => shiftDate(date, 7));
                  setSelectedDate(null);
                }}
                style={styles.weekButton}
              >
                <Ionicons name="arrow-forward" size={19} color="#173b24" />
              </Pressable>
            </View>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.dateCards}
          >
            {days.map((date) => {
              const count = sales.filter(
                (sale) => manilaDateKey(new Date(sale.createdAt)) === date,
              ).length;
              const selected = selectedDate === date;
              return (
                <Pressable
                  key={date}
                  onPress={() => selectDate(date)}
                  style={[styles.dateCard, selected && styles.selectedDateCard]}
                >
                  <Text style={styles.dateCardDate}>{displayDate(date)}</Text>
                  <Text style={styles.dateCardDay}>
                    {new Date(`${date}T12:00:00`).toLocaleDateString("en-PH", {
                      weekday: "short",
                    })}
                  </Text>
                  <Text style={styles.dateCardCount}>{count}</Text>
                  <Text style={styles.dateCardSales}>sales</Text>
                </Pressable>
              );
            })}
          </ScrollView>
          <View style={styles.searchBox}>
            <Ionicons name="search-outline" size={22} color="#17281b" />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search sales (product, customer, etc.)"
              placeholderTextColor="#7a837e"
              style={styles.searchInput}
            />
          </View>
          <View style={styles.controlRow}>
            <Pressable
              onPress={() => setIsDatePickerOpen(true)}
              style={styles.dateButton}
            >
              <Ionicons name="calendar-outline" size={20} color="#173b24" />
              <Text style={styles.dateButtonText}>
                {selectedDate ? displayDate(selectedDate, true) : "Select date"}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setEditingSale(null)}
              style={styles.addSaleButton}
            >
              <Ionicons name="add" size={23} color="#ffffff" />
              <Text style={styles.addSaleText}>Add sale</Text>
            </Pressable>
          </View>
        </View>
        {loading ? (
          <View style={styles.state}>
            <ActivityIndicator color="#258143" />
            <Text>Loading database sales...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorState}>
            <Text style={styles.formError}>{error}</Text>
            <Pressable
              onPress={() => void loadData()}
              style={styles.retryButton}
            >
              <Text style={styles.saveButtonText}>Retry</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.salesCard}>
            <View style={styles.salesHeader}>
              <View>
                <Text style={styles.salesTitle}>Sales</Text>
                <Text style={styles.salesSubtitle}>
                  {displayedSales.length}{" "}
                  {displayedSales.length === 1 ? "sale" : "sales"}{" "}
                  {range === "daily" && selectedDate
                    ? `on ${displayDate(selectedDate, true)}`
                    : "in this week"}
                </Text>
              </View>
              <Text style={styles.latestText}>Latest first</Text>
            </View>
            {displayedSales.length ? (
              displayedSales.map((sale) => (
                <SaleRow
                  key={sale.id}
                  sale={sale}
                  onEdit={() => setEditingSale(sale)}
                  onRemove={() => removeSale(sale)}
                />
              ))
            ) : (
              <Text style={styles.emptyText}>
                {range === "daily" && !selectedDate
                  ? "Select a date card to view its sales."
                  : "No sales found for this date range."}
              </Text>
            )}
          </View>
        )}
        {!loading && !error && (
          <View style={styles.totalCard}>
            <View style={styles.totalIcon}>
              <Ionicons name="stats-chart" size={23} color="#19753a" />
            </View>
            <View style={styles.totalDetails}>
              <Text style={styles.totalLabel}>
                {selectedDate
                  ? `Total for ${displayDate(selectedDate)}`
                  : "Total for displayed week"}
              </Text>
              <Text style={styles.totalValue}>{currency.format(total)}</Text>
            </View>
            <Text style={styles.totalCount}>
              {displayedSales.length}{" "}
              {displayedSales.length === 1 ? "sale" : "sales"}
            </Text>
          </View>
        )}
      </ScrollView>
      <DatePickerModal
        visible={isDatePickerOpen}
        rangeEndDate={rangeEndDate}
        onClose={() => setIsDatePickerOpen(false)}
        onSelect={selectDate}
      />
      <SaleEditorModal
        visible={editingSale !== undefined}
        sale={editingSale ?? null}
        inventory={inventory}
        onClose={() => setEditingSale(undefined)}
        onSaved={savedSale}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#f8faf7" },
  content: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 36 },
  backButton: { width: 40, height: 40, justifyContent: "center" },
  currentDate: {
    color: "#69746d",
    fontSize: 14,
    fontWeight: "600",
    marginTop: 4,
  },
  title: { color: "#101813", fontSize: 28, fontWeight: "800", marginTop: 3 },
  subtitle: { color: "#66716a", fontSize: 16, marginTop: 5 },
  rangeToggle: { flexDirection: "row", gap: 4, marginTop: 17 },
  rangeButton: {
    flex: 1,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#d4ddd5",
    borderRadius: 13,
    backgroundColor: "#ffffff",
  },
  activeRangeButton: { borderColor: "#144d29", backgroundColor: "#144d29" },
  rangeButtonText: { color: "#17281b", fontSize: 16, fontWeight: "800" },
  activeRangeButtonText: { color: "#ffffff" },
  dateSection: {
    borderWidth: 1,
    borderColor: "#e5eae5",
    borderRadius: 18,
    backgroundColor: "#ffffff",
    marginTop: 18,
    padding: 14,
  },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  sectionTitle: { flex: 1, color: "#111a14", fontSize: 18, fontWeight: "800" },
  weekButtons: { flexDirection: "row", gap: 8 },
  weekButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#dde4dd",
    borderRadius: 20,
  },
  dateCards: { gap: 6, paddingTop: 14 },
  dateCard: {
    width: 58,
    minHeight: 110,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#e1e7e1",
    borderRadius: 11,
    backgroundColor: "#fbfcfb",
    padding: 4,
  },
  selectedDateCard: { borderColor: "#3c9855", backgroundColor: "#e9f6e7" },
  dateCardDate: { color: "#152019", fontSize: 12, fontWeight: "800" },
  dateCardDay: { color: "#6f7872", fontSize: 12, marginTop: 7 },
  dateCardCount: {
    color: "#111a14",
    fontSize: 17,
    fontWeight: "800",
    marginTop: 6,
  },
  dateCardSales: { color: "#3f4943", fontSize: 12 },
  searchBox: {
    height: 54,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: "#dce3dd",
    borderRadius: 14,
    backgroundColor: "#f8faf8",
    marginTop: 20,
    paddingHorizontal: 14,
  },
  searchInput: { flex: 1, color: "#18231c", fontSize: 14 },
  controlRow: { flexDirection: "row", gap: 10, marginTop: 14 },
  dateButton: {
    flex: 1.25,
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#dce3dd",
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  dateButtonText: {
    flex: 1,
    color: "#173b24",
    fontSize: 13,
    fontWeight: "800",
  },
  addSaleButton: {
    flex: 1,
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 12,
    backgroundColor: "#173b24",
  },
  addSaleText: { color: "#ffffff", fontSize: 15, fontWeight: "800" },
  state: {
    minHeight: 120,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  errorState: {
    alignItems: "center",
    borderRadius: 14,
    backgroundColor: "#fff0e8",
    marginTop: 18,
    padding: 18,
  },
  retryButton: {
    borderRadius: 10,
    backgroundColor: "#173b24",
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  salesCard: {
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#e5eae5",
    borderRadius: 18,
    backgroundColor: "#ffffff",
    marginTop: 18,
  },
  salesHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#e8ede6",
    padding: 16,
  },
  salesTitle: { color: "#101813", fontSize: 19, fontWeight: "800" },
  salesSubtitle: { color: "#6b756e", fontSize: 13, marginTop: 4 },
  latestText: { color: "#173b24", fontSize: 12, fontWeight: "800" },
  saleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#e8ede6",
    padding: 14,
  },
  saleIcon: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: "#e7f2e6",
  },
  saleDetails: { flex: 1, minWidth: 0 },
  saleTitle: { color: "#17281b", fontSize: 14, fontWeight: "800" },
  saleItems: { color: "#647069", fontSize: 12, marginTop: 4 },
  saleAmount: { width: 102, alignItems: "flex-end" },
  quantity: { color: "#17281b", fontSize: 13, fontWeight: "800" },
  priceSummary: {
    color: "#68736b",
    fontSize: 11,
    fontWeight: "700",
    marginTop: 3,
  },
  dateTime: {
    color: "#89928b",
    fontSize: 10,
    marginTop: 3,
    textAlign: "right",
  },
  rowActions: { flexDirection: "row", gap: 6, marginTop: 7 },
  iconAction: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#dfe4dd",
    borderRadius: 8,
  },
  emptyText: {
    color: "#7c867e",
    fontSize: 14,
    fontWeight: "600",
    padding: 30,
    textAlign: "center",
  },
  totalCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 16,
    backgroundColor: "#edf5eb",
    marginTop: 18,
    padding: 16,
  },
  totalIcon: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: "#e1f1df",
  },
  totalDetails: { flex: 1 },
  totalLabel: { color: "#66736c", fontSize: 13 },
  totalValue: {
    color: "#17281b",
    fontSize: 24,
    fontWeight: "800",
    marginTop: 2,
  },
  totalCount: { color: "#566259", fontSize: 13 },
  modalOverlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
    backgroundColor: "rgba(13, 36, 23, 0.55)",
  },
  dateModal: {
    width: "100%",
    maxHeight: "70%",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: "#ffffff",
    padding: 20,
  },
  formModal: {
    width: "100%",
    maxHeight: "92%",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: "#ffffff",
  },
  formContent: { padding: 20, paddingBottom: 30 },
  modalHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 14,
  },
  modalEyebrow: {
    color: "#a85620",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.4,
    textTransform: "uppercase",
  },
  modalTitle: {
    color: "#17281b",
    fontSize: 23,
    fontWeight: "800",
    marginTop: 5,
  },
  modalSubtitle: {
    color: "#6d776f",
    fontSize: 13,
    lineHeight: 19,
    marginTop: 4,
  },
  dateOption: {
    borderBottomWidth: 1,
    borderBottomColor: "#edf0eb",
    paddingVertical: 15,
  },
  dateOptionText: { color: "#173b24", fontSize: 16, fontWeight: "700" },
  fieldGroup: { gap: 7, marginTop: 20 },
  lineCard: {
    borderWidth: 1,
    borderColor: "#dfe4dd",
    borderRadius: 14,
    backgroundColor: "#fbfcfa",
    marginTop: 16,
    padding: 14,
  },
  lineHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  lineTitle: { flex: 1, color: "#283b2c", fontSize: 15, fontWeight: "800" },
  removeText: { color: "#9b431f", fontSize: 12, fontWeight: "800" },
  productChoices: { gap: 8, marginTop: 12 },
  productChoice: {
    borderWidth: 1,
    borderColor: "#d7ded5",
    borderRadius: 9,
    backgroundColor: "#ffffff",
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  selectedProductChoice: { borderColor: "#4f9a66", backgroundColor: "#e5f3e4" },
  productChoiceText: { color: "#173b24", fontSize: 12, fontWeight: "700" },
  lineFields: { flexDirection: "row", gap: 12, marginTop: 14 },
  smallField: { flex: 1, gap: 7 },
  label: { color: "#283b2c", fontSize: 13, fontWeight: "800" },
  field: {
    height: 46,
    borderWidth: 1,
    borderColor: "#d7ded5",
    borderRadius: 10,
    backgroundColor: "#ffffff",
    color: "#18251a",
    fontSize: 15,
    paddingHorizontal: 12,
  },
  addLineButton: {
    height: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    borderWidth: 1,
    borderColor: "#b9c8b8",
    borderRadius: 11,
    backgroundColor: "#ffffff",
    marginTop: 14,
  },
  addLineText: { color: "#173b24", fontSize: 14, fontWeight: "800" },
  formError: {
    color: "#9b431f",
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20,
    marginTop: 14,
    textAlign: "center",
  },
  saveButton: {
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 12,
    backgroundColor: "#173b24",
    marginTop: 18,
  },
  saveButtonText: { color: "#ffffff", fontSize: 15, fontWeight: "800" },
});
