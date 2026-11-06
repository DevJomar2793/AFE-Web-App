import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import {
  createFundTransaction,
  getBusinessFunds,
  initializeBusinessFunds,
  type BusinessFundsRecord,
} from "../lib/api";

interface BusinessFundsPanelProps {
  refreshKey: number;
  onChanged: () => void;
}

const currency = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function BusinessFundsPanel({
  refreshKey,
  onChanged,
}: BusinessFundsPanelProps) {
  const [funds, setFunds] = useState<BusinessFundsRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    async function loadFunds() {
      setIsLoading(true);
      setError("");
      try {
        setFunds(await getBusinessFunds(controller.signal));
      } catch (loadError) {
        if (!controller.signal.aborted) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load business funds.",
          );
        }
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }
    void loadFunds();
    return () => controller.abort();
  }, [refreshKey, reloadKey]);

  function handleSaved() {
    setIsModalOpen(false);
    setReloadKey((key) => key + 1);
    onChanged();
  }

  return (
    <View style={[styles.card, funds && funds.currentTotal < 0 && styles.negativeCard]}>
      <View style={styles.row}>
        <View style={styles.icon}>
          <Ionicons name="cash-outline" size={23} color="#2d7042" />
        </View>
        <View style={styles.details}>
          <Text style={styles.eyebrow}>Business funds</Text>
          <Text
            style={[
              styles.total,
              funds && funds.currentTotal < 0 && styles.negativeText,
            ]}
          >
            {isLoading && !funds
              ? "Loading..."
              : currency.format(funds?.currentTotal ?? 0)}
          </Text>
          <Text style={styles.caption}>
            Updated automatically from income, expenses, and stock costs.
          </Text>
        </View>
      </View>

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable onPress={() => setReloadKey((key) => key + 1)}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      ) : (
        <Pressable
          disabled={isLoading || !funds}
          onPress={() => setIsModalOpen(true)}
          style={[styles.button, (isLoading || !funds) && styles.disabled]}
        >
          <Ionicons name="add" size={18} color="#ffffff" />
          <Text style={styles.buttonText}>
            {funds?.isInitialized ? "Add transaction" : "Set current funds"}
          </Text>
        </Pressable>
      )}

      {funds ? (
        <FundsModal
          visible={isModalOpen}
          isInitialized={funds.isInitialized}
          onClose={() => setIsModalOpen(false)}
          onSaved={handleSaved}
        />
      ) : null}
    </View>
  );
}

function FundsModal({
  visible,
  isInitialized,
  onClose,
  onSaved,
}: {
  visible: boolean;
  isInitialized: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [transactionType, setTransactionType] = useState<"income" | "expense">(
    "income",
  );
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function save() {
    const normalizedAmount = Number(amount);
    if (
      !/^\d+(?:\.\d{1,2})?$/.test(amount) ||
      !Number.isFinite(normalizedAmount) ||
      (isInitialized ? normalizedAmount <= 0 : normalizedAmount < 0)
    ) {
      setError(
        isInitialized
          ? "Enter an amount greater than zero."
          : "Enter a valid current fund amount.",
      );
      return;
    }
    if (isInitialized && !description.trim()) {
      setError("Enter a description for this transaction.");
      return;
    }

    setIsSubmitting(true);
    setError("");
    try {
      if (isInitialized) {
        await createFundTransaction({
          transactionType,
          amount: normalizedAmount,
          description: description.trim(),
        });
      } else {
        await initializeBusinessFunds(normalizedAmount);
      }
      setAmount("");
      setDescription("");
      onSaved();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "The business funds could not be saved.",
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
        <Pressable style={styles.backdrop} disabled={isSubmitting} onPress={onClose} />
        <View style={styles.modalCard}>
          <ScrollView keyboardShouldPersistTaps="handled">
            <View style={styles.modalHeader}>
              <View style={styles.details}>
                <Text style={styles.modalTitle}>
                  {isInitialized ? "Add fund transaction" : "Set current funds"}
                </Text>
                <Text style={styles.caption}>
                  {isInitialized
                    ? "Record business income or an expense."
                    : "Enter the business money currently available."}
                </Text>
              </View>
              <Pressable disabled={isSubmitting} onPress={onClose}>
                <Ionicons name="close" size={24} color="#566159" />
              </Pressable>
            </View>

            {isInitialized ? (
              <View style={styles.typeRow}>
                {(["income", "expense"] as const).map((type) => (
                  <Pressable
                    key={type}
                    disabled={isSubmitting}
                    onPress={() => setTransactionType(type)}
                    style={[
                      styles.typeButton,
                      transactionType === type && styles.activeTypeButton,
                    ]}
                  >
                    <Text
                      style={[
                        styles.typeText,
                        transactionType === type && styles.activeTypeText,
                      ]}
                    >
                      {type === "income" ? "Income" : "Expense"}
                    </Text>
                  </Pressable>
                ))}
              </View>
            ) : null}

            <Text style={styles.label}>
              {isInitialized ? "Amount" : "Current total business money"}
            </Text>
            <TextInput
              editable={!isSubmitting}
              keyboardType="decimal-pad"
              placeholder="0.00"
              style={styles.input}
              value={amount}
              onChangeText={(value) => {
                setAmount(value);
                setError("");
              }}
            />

            {isInitialized ? (
              <>
                <Text style={styles.label}>Description</Text>
                <TextInput
                  editable={!isSubmitting}
                  multiline
                  maxLength={255}
                  placeholder="Customer payment, supplier purchase, or reason"
                  style={[styles.input, styles.descriptionInput]}
                  value={description}
                  onChangeText={(value) => {
                    setDescription(value);
                    setError("");
                  }}
                />
              </>
            ) : null}

            {error ? <Text style={styles.modalError}>{error}</Text> : null}
            <Pressable
              disabled={isSubmitting}
              onPress={() => void save()}
              style={[styles.saveButton, isSubmitting && styles.disabled]}
            >
              {isSubmitting ? <ActivityIndicator color="#ffffff" /> : null}
              <Text style={styles.buttonText}>
                {isSubmitting ? "Saving..." : "Save"}
              </Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: "#dce5da",
    borderRadius: 18,
    backgroundColor: "#ffffff",
    marginTop: 22,
    padding: 18,
  },
  negativeCard: { borderColor: "#e8c5bc", backgroundColor: "#fff9f7" },
  row: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  icon: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: "#e4f1e4",
  },
  details: { flex: 1 },
  eyebrow: { color: "#718078", fontSize: 11, fontWeight: "800", textTransform: "uppercase" },
  total: { color: "#173b24", fontSize: 28, fontWeight: "800", marginTop: 3 },
  negativeText: { color: "#9b431f" },
  caption: { color: "#758078", fontSize: 13, lineHeight: 19, marginTop: 3 },
  button: {
    height: 46,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    borderRadius: 12,
    backgroundColor: "#173b24",
    marginTop: 16,
  },
  buttonText: { color: "#ffffff", fontSize: 14, fontWeight: "800" },
  disabled: { opacity: 0.55 },
  errorBox: { borderRadius: 10, backgroundColor: "#fff0e8", marginTop: 14, padding: 12 },
  errorText: { color: "#8f421f", fontSize: 13, fontWeight: "700" },
  retryText: { color: "#173b24", fontSize: 13, fontWeight: "800", marginTop: 8 },
  overlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(13,36,23,0.55)" },
  backdrop: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0 },
  modalCard: { maxHeight: "90%", borderTopLeftRadius: 24, borderTopRightRadius: 24, backgroundColor: "#ffffff", padding: 22 },
  modalHeader: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  modalTitle: { color: "#17281b", fontSize: 22, fontWeight: "800" },
  typeRow: { flexDirection: "row", gap: 10, marginTop: 22 },
  typeButton: { flex: 1, alignItems: "center", borderWidth: 1, borderColor: "#d5ddd3", borderRadius: 11, padding: 13 },
  activeTypeButton: { borderColor: "#173b24", backgroundColor: "#173b24" },
  typeText: { color: "#173b24", fontSize: 14, fontWeight: "800" },
  activeTypeText: { color: "#ffffff" },
  label: { color: "#283b2c", fontSize: 14, fontWeight: "800", marginTop: 18 },
  input: { minHeight: 50, borderWidth: 1, borderColor: "#d7ded5", borderRadius: 12, color: "#18251a", fontSize: 15, marginTop: 8, paddingHorizontal: 14 },
  descriptionInput: { minHeight: 92, paddingTop: 13, textAlignVertical: "top" },
  modalError: { color: "#9b431f", fontSize: 13, fontWeight: "700", marginTop: 14 },
  saveButton: { height: 50, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 12, backgroundColor: "#173b24", marginTop: 20 },
});
