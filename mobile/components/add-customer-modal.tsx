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
  useWindowDimensions,
  View,
} from "react-native";
import {
  formatCustomerName,
  sanitizeCustomerNumber,
} from "../lib/customer-format";

export interface CustomerFormValues {
  name: string;
  number: string;
  address: string;
  landmark: string;
}

interface AddCustomerModalProps {
  customer: CustomerFormValues | null;
  onCancel: () => void;
  onSave: (values: CustomerFormValues) => Promise<void> | void;
}

export function AddCustomerModal({
  customer,
  onCancel,
  onSave,
}: AddCustomerModalProps) {
  const { width } = useWindowDimensions();
  const isWideScreen = width >= 600;
  const [name, setName] = useState(customer?.name.toUpperCase() ?? "");
  const [number, setNumber] = useState(customer?.number ?? "");
  const [address, setAddress] = useState(customer?.address ?? "");
  const [landmark, setLandmark] = useState(customer?.landmark ?? "");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submitForm() {
    const values: CustomerFormValues = {
      name: formatCustomerName(name),
      number: number.trim(),
      address: address.trim(),
      landmark: landmark.trim(),
    };

    if (Object.values(values).some((value) => !value)) {
      setError("Complete all customer information fields.");
      return;
    }

    if (!/^\d{11}$/.test(values.number)) {
      setError("Enter a complete 11-digit customer number.");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave(values);
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "The customer could not be saved.",
      );
      setIsSubmitting(false);
    }
  }

  return (
    <Modal
      animationType="slide"
      onRequestClose={() => {
        if (!isSubmitting) onCancel();
      }}
      transparent
      visible
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={[
          styles.modalContainer,
          isWideScreen && styles.modalContainerWide,
        ]}
      >
        <Pressable
          accessibilityLabel="Close customer form"
          disabled={isSubmitting}
          onPress={onCancel}
          style={styles.modalBackdrop}
        />

        <View
          accessibilityViewIsModal
          style={[styles.modalSheet, isWideScreen && styles.modalSheetWide]}
        >
          <View style={styles.sheetHandle} />
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {customer ? "Edit Customer" : "Add Customer"}
            </Text>
            <Pressable
              accessibilityLabel="Close customer form"
              accessibilityRole="button"
              hitSlop={8}
              disabled={isSubmitting}
              onPress={onCancel}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={28} color="#17281b" />
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={styles.formContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <CustomerInput
              autoFocus
              icon="person-outline"
              label="Name"
              onChange={(value) => {
                setName(value.toUpperCase());
                setError("");
              }}
              placeholder="Enter customer name"
              value={name}
            />
            <CustomerInput
              icon="call-outline"
              keyboardType="number-pad"
              maxLength={11}
              label="Number"
              onChange={(value) => {
                setNumber(sanitizeCustomerNumber(value));
                setError("");
              }}
              placeholder="Enter mobile number"
              value={number}
            />
            <CustomerInput
              icon="location-outline"
              label="Address"
              onChange={(value) => {
                setAddress(value);
                setError("");
              }}
              placeholder="Enter address"
              value={address}
            />
            <CustomerInput
              icon="map-outline"
              label="Landmark"
              maxLength={500}
              multiline
              numberOfLines={4}
              onChange={(value) => {
                setLandmark(value);
                setError("");
              }}
              placeholder="Enter landmark"
              value={landmark}
            />

            {error ? (
              <Text accessibilityRole="alert" style={styles.formError}>
                {error}
              </Text>
            ) : null}

            <View style={styles.formActions}>
              <Pressable
                accessibilityRole="button"
                disabled={isSubmitting}
                onPress={onCancel}
                style={styles.cancelButton}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                disabled={isSubmitting}
                onPress={submitForm}
                style={styles.saveButton}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.saveButtonText}>Save</Text>
                )}
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function CustomerInput({
  autoFocus = false,
  icon,
  keyboardType = "default",
  label,
  maxLength = 255,
  multiline = false,
  numberOfLines,
  onChange,
  placeholder,
  value,
}: {
  autoFocus?: boolean;
  icon: keyof typeof Ionicons.glyphMap;
  keyboardType?: "default" | "number-pad";
  label: string;
  maxLength?: number;
  multiline?: boolean;
  numberOfLines?: number;
  onChange: (value: string) => void;
  placeholder: string;
  value: string;
}) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>
        {label} <Text style={styles.requiredMark}>*</Text>
      </Text>
      <View style={[styles.inputBox, multiline && styles.textareaBox]}>
        <Ionicons name={icon} size={23} color="#173b24" />
        <TextInput
          autoCapitalize={label === "Number" ? "none" : "sentences"}
          autoCorrect={label !== "Number"}
          autoFocus={autoFocus}
          keyboardType={keyboardType}
          maxLength={maxLength}
          multiline={multiline}
          numberOfLines={numberOfLines}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor="#6f7b73"
          returnKeyType={multiline ? "default" : "next"}
          style={[styles.formInput, multiline && styles.textareaInput]}
          textAlignVertical={multiline ? "top" : "center"}
          value={value}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(13, 36, 23, 0.55)",
  },
  modalContainerWide: { alignItems: "center", justifyContent: "center" },
  modalBackdrop: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  modalSheet: {
    width: "100%",
    maxHeight: "92%",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: "#ffffff",
    paddingTop: 10,
  },
  modalSheetWide: { maxWidth: 620, borderRadius: 28 },
  sheetHandle: {
    width: 52,
    height: 5,
    alignSelf: "center",
    borderRadius: 3,
    backgroundColor: "#aeb5b0",
    marginBottom: 12,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },
  modalTitle: { color: "#15321d", fontSize: 26, fontWeight: "900" },
  closeButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  formContent: { padding: 20, paddingBottom: 28 },
  inputGroup: { marginBottom: 17 },
  inputLabel: { color: "#17281b", fontSize: 15, fontWeight: "800" },
  requiredMark: { color: "#df2929" },
  inputBox: {
    height: 54,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: "#cbd4c9",
    borderRadius: 12,
    marginTop: 7,
    paddingHorizontal: 14,
  },
  textareaBox: { height: 112, alignItems: "flex-start", paddingVertical: 14 },
  formInput: { flex: 1, color: "#18251a", fontSize: 15, paddingVertical: 0 },
  textareaInput: { height: "100%" },
  formError: {
    borderRadius: 10,
    backgroundColor: "#fff0e8",
    color: "#9b431f",
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 16,
    padding: 12,
  },
  formActions: { flexDirection: "row", gap: 12, marginTop: 14 },
  cancelButton: {
    height: 52,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#cbd4c9",
    borderRadius: 12,
    backgroundColor: "#ffffff",
  },
  cancelButtonText: { color: "#173b24", fontSize: 16, fontWeight: "800" },
  saveButton: {
    height: 52,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: "#125326",
  },
  saveButtonText: { color: "#ffffff", fontSize: 16, fontWeight: "800" },
});
