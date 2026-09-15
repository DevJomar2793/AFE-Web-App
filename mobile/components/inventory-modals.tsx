import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { createInventoryItem, updateInventoryItem } from "../lib/api";
import type { InventoryRecord, SuccessNotice } from "../types/inventory";

interface AddStockModalProps {
  onClose: () => void;
  onCreated: (item: InventoryRecord) => void;
}

interface EditItemModalProps {
  item: InventoryRecord;
  onClose: () => void;
  onUpdated: (item: InventoryRecord) => void;
}

interface SuccessModalProps {
  notice: SuccessNotice;
  onClose: () => void;
}

const pricePattern = /^\d+(?:\.\d{1,2})?$/;
const maximumPrice = 9_999_999_999.99;

function ModalHeader({
  title,
  subtitle,
  isSubmitting,
  onClose,
}: {
  title: string;
  subtitle: string;
  isSubmitting: boolean;
  onClose: () => void;
}) {
  return (
    <View style={styles.modalHeader}>
      <View style={styles.modalTitleGroup}>
        <Text style={styles.eyebrow}>Inventory</Text>
        <Text style={styles.modalTitle}>{title}</Text>
        <Text style={styles.modalSubtitle}>{subtitle}</Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Close ${title.toLowerCase()} form`}
        disabled={isSubmitting}
        onPress={onClose}
        style={[styles.closeButton, isSubmitting && styles.disabledButton]}
      >
        <Ionicons name="close" size={21} color="#566159" />
      </Pressable>
    </View>
  );
}

function FormField({
  label,
  value,
  placeholder,
  keyboardType = "default",
  editable,
  autoFocus = false,
  onChangeText,
}: {
  label: string;
  value: string;
  placeholder?: string;
  keyboardType?: "default" | "number-pad" | "decimal-pad";
  editable: boolean;
  autoFocus?: boolean;
  onChangeText: (value: string) => void;
}) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        autoFocus={autoFocus}
        editable={editable}
        keyboardType={keyboardType}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#929a94"
        style={[styles.field, !editable && styles.disabledField]}
        value={value}
      />
    </View>
  );
}

function ModalLayout({
  children,
  isSubmitting,
  onClose,
}: {
  children: React.ReactNode;
  isSubmitting: boolean;
  onClose: () => void;
}) {
  return (
    <Modal
      transparent
      animationType="fade"
      onRequestClose={() => {
        if (!isSubmitting) onClose();
      }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.overlay}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close modal"
          disabled={isSubmitting}
          onPress={onClose}
          style={styles.backdrop}
        />
        <View accessibilityViewIsModal style={styles.formCard}>
          <ScrollView
            contentContainerStyle={styles.formContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {children}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function validatePrice(value: string) {
  const numberValue = Number(value);
  return (
    pricePattern.test(value) &&
    Number.isFinite(numberValue) &&
    numberValue >= 0 &&
    numberValue <= maximumPrice
  );
}

export function AddStockModal({ onClose, onCreated }: AddStockModalProps) {
  const [itemName, setItemName] = useState("");
  const [quantity, setQuantity] = useState("0");
  const [price, setPrice] = useState("");
  const [wholesalePrice, setWholesalePrice] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField(setValue: (value: string) => void, value: string) {
    setValue(value);
    setError("");
  }

  async function submitItem() {
    const normalizedName = itemName.trim();
    const normalizedQuantity = Number(quantity);

    if (!normalizedName) {
      setError("Enter an item name.");
      return;
    }
    if (
      quantity.trim() === "" ||
      !Number.isInteger(normalizedQuantity) ||
      normalizedQuantity < 0
    ) {
      setError("Starting quantity must be a whole number of zero or more.");
      return;
    }
    if (!validatePrice(price)) {
      setError("Enter a valid price with no more than two decimal places.");
      return;
    }
    if (wholesalePrice && !validatePrice(wholesalePrice)) {
      setError(
        "Enter a valid Wholesale/Batch Price with no more than two decimal places.",
      );
      return;
    }

    setIsSubmitting(true);
    setError("");
    try {
      const createdItem = await createInventoryItem({
        item: normalizedName,
        quantity: normalizedQuantity,
        price: Number(price),
        wholesalePrice: wholesalePrice ? Number(wholesalePrice) : null,
      });
      onCreated(createdItem);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "The inventory item could not be added.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ModalLayout isSubmitting={isSubmitting} onClose={onClose}>
      <ModalHeader
        title="Add item"
        subtitle="Create a new item in the inventory database."
        isSubmitting={isSubmitting}
        onClose={onClose}
      />
      <View style={styles.form}>
        <FormField
          label="Item name"
          value={itemName}
          placeholder="Large eggs"
          editable={!isSubmitting}
          autoFocus
          onChangeText={(value) => updateField(setItemName, value)}
        />
        <FormField
          label="Starting quantity"
          value={quantity}
          keyboardType="number-pad"
          editable={!isSubmitting}
          onChangeText={(value) => updateField(setQuantity, value)}
        />
        <FormField
          label="Price"
          value={price}
          placeholder="250.00"
          keyboardType="decimal-pad"
          editable={!isSubmitting}
          onChangeText={(value) => updateField(setPrice, value)}
        />
        <FormField
          label="Wholesale/Batch Price"
          value={wholesalePrice}
          placeholder="Optional"
          keyboardType="decimal-pad"
          editable={!isSubmitting}
          onChangeText={(value) => updateField(setWholesalePrice, value)}
        />
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        <Pressable
          accessibilityRole="button"
          disabled={isSubmitting}
          onPress={() => void submitItem()}
          style={[styles.primaryButton, isSubmitting && styles.disabledButton]}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <Ionicons name="add" size={19} color="#ffffff" />
          )}
          <Text style={styles.primaryButtonText}>
            {isSubmitting ? "Adding item..." : "Add item"}
          </Text>
        </Pressable>
      </View>
    </ModalLayout>
  );
}

export function EditItemModal({
  item,
  onClose,
  onUpdated,
}: EditItemModalProps) {
  const [quantity, setQuantity] = useState(String(item.quantity));
  const [price, setPrice] = useState(String(item.price));
  const [wholesalePrice, setWholesalePrice] = useState(
    item.wholesalePrice === null ? "" : String(item.wholesalePrice),
  );
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField(setValue: (value: string) => void, value: string) {
    setValue(value);
    setError("");
  }

  async function saveItem() {
    const normalizedQuantity = Number(quantity);

    if (
      quantity.trim() === "" ||
      !Number.isInteger(normalizedQuantity) ||
      normalizedQuantity < 0
    ) {
      setError("Quantity must be a whole number of zero or more.");
      return;
    }
    if (!validatePrice(price)) {
      setError("Enter a valid price with no more than two decimal places.");
      return;
    }
    if (wholesalePrice && !validatePrice(wholesalePrice)) {
      setError(
        "Enter a valid Wholesale/Batch Price with no more than two decimal places.",
      );
      return;
    }

    setIsSubmitting(true);
    setError("");
    try {
      const updatedItem = await updateInventoryItem(item.id, {
        quantity: normalizedQuantity,
        price: Number(price),
        wholesalePrice: wholesalePrice ? Number(wholesalePrice) : null,
      });
      onUpdated(updatedItem);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "The inventory item could not be updated.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ModalLayout isSubmitting={isSubmitting} onClose={onClose}>
      <ModalHeader
        title="Edit item"
        subtitle={`Update the current quantity and price for ${item.item}.`}
        isSubmitting={isSubmitting}
        onClose={onClose}
      />
      <View style={styles.form}>
        <FormField
          label="Quantity"
          value={quantity}
          keyboardType="number-pad"
          editable={!isSubmitting}
          autoFocus
          onChangeText={(value) => updateField(setQuantity, value)}
        />
        <FormField
          label="Price"
          value={price}
          keyboardType="decimal-pad"
          editable={!isSubmitting}
          onChangeText={(value) => updateField(setPrice, value)}
        />
        <FormField
          label="Wholesale/Batch Price"
          value={wholesalePrice}
          placeholder="Optional"
          keyboardType="decimal-pad"
          editable={!isSubmitting}
          onChangeText={(value) => updateField(setWholesalePrice, value)}
        />
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        <View style={styles.buttonRow}>
          <Pressable
            accessibilityRole="button"
            disabled={isSubmitting}
            onPress={onClose}
            style={[
              styles.secondaryButton,
              isSubmitting && styles.disabledButton,
            ]}
          >
            <Text style={styles.secondaryButtonText}>Cancel</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            disabled={isSubmitting}
            onPress={() => void saveItem()}
            style={[
              styles.primaryButton,
              styles.rowButton,
              isSubmitting && styles.disabledButton,
            ]}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <Ionicons name="save-outline" size={18} color="#ffffff" />
            )}
            <Text style={styles.primaryButtonText}>
              {isSubmitting ? "Saving..." : "Save"}
            </Text>
          </Pressable>
        </View>
      </View>
    </ModalLayout>
  );
}

export function SuccessModal({ notice, onClose }: SuccessModalProps) {
  return (
    <Modal transparent animationType="fade" onRequestClose={onClose}>
      <View style={[styles.overlay, styles.centeredOverlay]}>
        <View accessibilityViewIsModal style={styles.successCard}>
          <View style={styles.successCircle}>
            <Ionicons name="checkmark" size={56} color="#258143" />
          </View>
          <Text style={styles.successTitle}>{notice.title}</Text>
          <Text style={styles.successMessage}>{notice.message}</Text>
          <Pressable onPress={onClose} style={styles.doneButton}>
            <Text style={styles.primaryButtonText}>Done</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(13, 36, 23, 0.55)",
  },
  centeredOverlay: {
    alignItems: "center",
    justifyContent: "center",
    padding: 18,
  },
  backdrop: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  formCard: {
    width: "100%",
    maxWidth: 520,
    maxHeight: "92%",
    alignSelf: "center",
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    backgroundColor: "#ffffff",
  },
  formContent: { padding: 22, paddingBottom: 30 },
  modalHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 16,
  },
  modalTitleGroup: { flex: 1 },
  eyebrow: {
    color: "#a85620",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.7,
    textTransform: "uppercase",
  },
  modalTitle: {
    color: "#17281b",
    fontSize: 24,
    fontWeight: "800",
    marginTop: 8,
  },
  modalSubtitle: {
    color: "#6d776f",
    fontSize: 14,
    lineHeight: 21,
    marginTop: 4,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#dfe4dd",
    borderRadius: 12,
  },
  form: { gap: 18, marginTop: 24 },
  fieldGroup: { gap: 8 },
  label: { color: "#283b2c", fontSize: 14, fontWeight: "800" },
  field: {
    height: 50,
    borderWidth: 1,
    borderColor: "#d7ded5",
    borderRadius: 12,
    backgroundColor: "#ffffff",
    color: "#18251a",
    fontSize: 15,
    paddingHorizontal: 14,
  },
  disabledField: { backgroundColor: "#f3f5f1", color: "#7c867e" },
  errorText: {
    borderRadius: 12,
    backgroundColor: "#fff0e8",
    color: "#9b431f",
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  primaryButton: {
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 12,
    backgroundColor: "#173b24",
    paddingHorizontal: 18,
  },
  primaryButtonText: { color: "#ffffff", fontSize: 14, fontWeight: "800" },
  buttonRow: { flexDirection: "row", gap: 12 },
  rowButton: { flex: 1 },
  secondaryButton: {
    height: 52,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#cfd8cd",
    borderRadius: 12,
    backgroundColor: "#ffffff",
  },
  secondaryButtonText: { color: "#173b24", fontSize: 14, fontWeight: "800" },
  disabledButton: { opacity: 0.55 },
  successCard: {
    width: "100%",
    maxWidth: 390,
    alignItems: "center",
    borderRadius: 24,
    backgroundColor: "#ffffff",
    padding: 28,
  },
  successCircle: {
    width: 96,
    height: 96,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 48,
    backgroundColor: "#eaf7eb",
  },
  successTitle: {
    color: "#17281b",
    fontSize: 24,
    fontWeight: "800",
    marginTop: 20,
  },
  successMessage: {
    color: "#6d776f",
    fontSize: 15,
    lineHeight: 22,
    marginTop: 8,
    textAlign: "center",
  },
  doneButton: {
    width: "100%",
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: "#173b24",
    marginTop: 24,
  },
});
