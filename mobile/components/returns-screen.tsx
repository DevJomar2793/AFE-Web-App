import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
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
  createReturn,
  getInventoryItems,
  getReturns,
  type ReturnRecord,
} from "../lib/api";
import type { InventoryRecord } from "../types/inventory";

interface ReturnsScreenProps {
  onShowSuccess: (title: string, message: string) => void;
}

export function ReturnsScreen({ onShowSuccess }: ReturnsScreenProps) {
  const [returns, setReturns] = useState<ReturnRecord[]>([]);
  const [inventory, setInventory] = useState<InventoryRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadData = useCallback(async (refresh = false) => {
    if (refresh) setIsRefreshing(true);
    else setIsLoading(true);
    setError("");
    try {
      const [nextReturns, nextInventory] = await Promise.all([
        getReturns(),
        getInventoryItems(),
      ]);
      setReturns(nextReturns);
      setInventory(nextInventory);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Returns could not be loaded.",
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const filteredReturns = useMemo(() => {
    const search = query.trim().toLowerCase();
    return returns.filter(
      (item) =>
        !search ||
        item.item.name.toLowerCase().includes(search) ||
        item.customerName.toLowerCase().includes(search) ||
        item.reason.toLowerCase().includes(search),
    );
  }, [query, returns]);

  function savedReturn() {
    setIsModalOpen(false);
    void loadData(true);
    onShowSuccess("Return saved", "The return record and item return count were updated.");
  }

  return (
    <View style={styles.screen}>
      <FlatList
        data={isLoading || error ? [] : filteredReturns}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => void loadData(true)}
            tintColor="#258143"
          />
        }
        ListHeaderComponent={
          <>
            <View style={styles.header}>
              <View style={styles.headerText}>
                <Text style={styles.title}>Product returns</Text>
                <Text style={styles.subtitle}>
                  Return records stored in the database.
                </Text>
              </View>
              <Pressable
                onPress={() => setIsModalOpen(true)}
                style={styles.returnButton}
              >
                <Ionicons name="return-up-back-outline" size={19} color="#ffffff" />
                <Text style={styles.returnButtonText}>Return item</Text>
              </Pressable>
            </View>
            <View style={styles.searchBox}>
              <Ionicons name="search-outline" size={20} color="#516078" />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Search item, customer, reason..."
                placeholderTextColor="#74808a"
                style={styles.searchInput}
              />
            </View>
            {isLoading ? <LoadingState /> : null}
            {error ? (
              <ErrorState error={error} onRetry={() => void loadData()} />
            ) : null}
          </>
        }
        renderItem={({ item }) => <ReturnCard record={item} />}
        ListEmptyComponent={
          !isLoading && !error ? (
            <Text style={styles.emptyText}>
              {returns.length
                ? "No returns match your search."
                : "No product returns have been recorded yet."}
            </Text>
          ) : undefined
        }
      />
      <ReturnModal
        inventory={inventory}
        visible={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSaved={savedReturn}
      />
    </View>
  );
}

function ReturnCard({ record }: { record: ReturnRecord }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.itemName}>{record.item.name}</Text>
        <Text style={styles.quantityBadge}>{record.quantity} returned</Text>
      </View>
      <Text style={styles.customer}>{record.customerName}</Text>
      <Text style={styles.reason}>{record.reason}</Text>
      <Text style={styles.date}>{formatDate(record.createdAt)}</Text>
    </View>
  );
}

function ReturnModal({
  inventory,
  visible,
  onClose,
  onSaved,
}: {
  inventory: InventoryRecord[];
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [inventoryId, setInventoryId] = useState<number | null>(null);
  const [quantity, setQuantity] = useState("1");
  const [customerName, setCustomerName] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const selectedId = inventoryId ?? inventory[0]?.id ?? null;

  async function save() {
    const normalizedQuantity = Number(quantity);
    if (selectedId === null) {
      setError("Choose an inventory item.");
      return;
    }
    if (!Number.isInteger(normalizedQuantity) || normalizedQuantity < 1) {
      setError("Enter a whole quantity of at least one.");
      return;
    }
    if (!customerName.trim() || !reason.trim()) {
      setError("Enter the customer name and return reason.");
      return;
    }

    setIsSubmitting(true);
    setError("");
    try {
      await createReturn({
        inventoryId: selectedId,
        quantity: normalizedQuantity,
        customerName: customerName.trim(),
        reason: reason.trim(),
      });
      setInventoryId(null);
      setQuantity("1");
      setCustomerName("");
      setReason("");
      onSaved();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "The return could not be saved.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={() => {
        if (!isSubmitting) onClose();
      }}
    >
      <View style={styles.overlay}>
        <Pressable
          style={styles.backdrop}
          disabled={isSubmitting}
          onPress={onClose}
        />
        <View style={styles.modalCard}>
          <ScrollView keyboardShouldPersistTaps="handled">
            <View style={styles.modalHeader}>
              <View style={styles.headerText}>
                <Text style={styles.modalTitle}>Record product return</Text>
                <Text style={styles.subtitle}>
                  The item return count is updated when saved.
                </Text>
              </View>
              <Pressable disabled={isSubmitting} onPress={onClose}>
                <Ionicons name="close" size={24} color="#566159" />
              </Pressable>
            </View>

            <Text style={styles.label}>Item</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.choices}
            >
              {inventory.map((item) => (
                <Pressable
                  key={item.id}
                  disabled={isSubmitting}
                  onPress={() => setInventoryId(item.id)}
                  style={[
                    styles.choice,
                    selectedId === item.id && styles.selectedChoice,
                  ]}
                >
                  <Text style={styles.choiceText}>{item.item}</Text>
                </Pressable>
              ))}
            </ScrollView>

            <FormInput
              label="Quantity"
              value={quantity}
              onChange={setQuantity}
              keyboardType="number-pad"
              editable={!isSubmitting}
            />
            <FormInput
              label="Customer"
              value={customerName}
              onChange={setCustomerName}
              editable={!isSubmitting}
            />
            <FormInput
              label="Reason"
              value={reason}
              onChange={setReason}
              editable={!isSubmitting}
              multiline
            />
            {error ? <Text style={styles.modalError}>{error}</Text> : null}
            <Pressable
              disabled={isSubmitting || !inventory.length}
              onPress={() => void save()}
              style={[styles.saveButton, isSubmitting && styles.disabled]}
            >
              {isSubmitting ? <ActivityIndicator color="#ffffff" /> : null}
              <Text style={styles.saveText}>
                {isSubmitting ? "Saving..." : "Save return"}
              </Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function FormInput({
  label,
  value,
  onChange,
  editable,
  keyboardType = "default",
  multiline = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  editable: boolean;
  keyboardType?: "default" | "number-pad";
  multiline?: boolean;
}) {
  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        editable={editable}
        keyboardType={keyboardType}
        multiline={multiline}
        value={value}
        onChangeText={onChange}
        style={[styles.input, multiline && styles.multilineInput]}
      />
    </View>
  );
}

function LoadingState() {
  return (
    <View style={styles.state}>
      <ActivityIndicator color="#258143" />
      <Text>Loading returns...</Text>
    </View>
  );
}

function ErrorState({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <View style={styles.errorBox}>
      <Text style={styles.errorText}>{error}</Text>
      <Pressable onPress={onRetry} style={styles.retryButton}>
        <Text style={styles.retryText}>Retry</Text>
      </Pressable>
    </View>
  );
}

function formatDate(value: string) {
  return new Date(value).toLocaleString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Manila",
  });
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#f8faf8" },
  content: { width: "100%", maxWidth: 720, alignSelf: "center", padding: 18, paddingBottom: 38 },
  header: { flexDirection: "row", alignItems: "center", gap: 12 },
  headerText: { flex: 1 },
  title: { color: "#121a15", fontSize: 26, fontWeight: "800" },
  subtitle: { color: "#74808a", fontSize: 14, marginTop: 4 },
  returnButton: { height: 46, flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 12, backgroundColor: "#173f28", paddingHorizontal: 13 },
  returnButtonText: { color: "#ffffff", fontSize: 13, fontWeight: "800" },
  searchBox: { height: 52, flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 1, borderColor: "#d5deda", borderRadius: 13, backgroundColor: "#ffffff", marginTop: 20, paddingHorizontal: 14 },
  searchInput: { flex: 1, color: "#263044", fontSize: 15 },
  card: { borderWidth: 1, borderColor: "#dce3dd", borderRadius: 16, backgroundColor: "#ffffff", marginTop: 13, padding: 16 },
  cardHeader: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  itemName: { flex: 1, color: "#121a15", fontSize: 17, fontWeight: "800" },
  quantityBadge: { borderRadius: 999, overflow: "hidden", backgroundColor: "#fff0e5", color: "#a44f1f", fontSize: 12, fontWeight: "800", paddingHorizontal: 9, paddingVertical: 5 },
  customer: { color: "#35453a", fontSize: 14, fontWeight: "700", marginTop: 9 },
  reason: { color: "#66736c", fontSize: 14, lineHeight: 20, marginTop: 5 },
  date: { color: "#89928b", fontSize: 12, marginTop: 10 },
  emptyText: { color: "#7c867e", fontSize: 14, fontWeight: "600", padding: 40, textAlign: "center" },
  state: { flexDirection: "row", justifyContent: "center", gap: 9, padding: 28 },
  errorBox: { borderRadius: 12, backgroundColor: "#fff0e8", marginTop: 18, padding: 14 },
  errorText: { color: "#8f421f", fontSize: 13, fontWeight: "700" },
  retryButton: { alignSelf: "flex-start", borderRadius: 8, backgroundColor: "#ffffff", marginTop: 9, paddingHorizontal: 13, paddingVertical: 8 },
  retryText: { color: "#173b24", fontWeight: "800" },
  overlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(13,36,23,0.55)" },
  backdrop: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0 },
  modalCard: { maxHeight: "92%", borderTopLeftRadius: 24, borderTopRightRadius: 24, backgroundColor: "#ffffff", padding: 22 },
  modalHeader: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  modalTitle: { color: "#17281b", fontSize: 22, fontWeight: "800" },
  label: { color: "#283b2c", fontSize: 14, fontWeight: "800", marginTop: 18 },
  choices: { gap: 8, marginTop: 9 },
  choice: { borderWidth: 1, borderColor: "#d7ded5", borderRadius: 9, backgroundColor: "#ffffff", paddingHorizontal: 11, paddingVertical: 9 },
  selectedChoice: { borderColor: "#4f9a66", backgroundColor: "#e5f3e4" },
  choiceText: { color: "#173b24", fontSize: 13, fontWeight: "700" },
  input: { minHeight: 48, borderWidth: 1, borderColor: "#d7ded5", borderRadius: 11, color: "#18251a", fontSize: 15, marginTop: 8, paddingHorizontal: 13 },
  multilineInput: { minHeight: 86, paddingTop: 12, textAlignVertical: "top" },
  modalError: { color: "#9b431f", fontSize: 13, fontWeight: "700", marginTop: 14 },
  saveButton: { height: 50, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 12, backgroundColor: "#173b24", marginTop: 20 },
  saveText: { color: "#ffffff", fontSize: 14, fontWeight: "800" },
  disabled: { opacity: 0.55 },
});
