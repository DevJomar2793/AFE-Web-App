import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  getOfficialReceipt,
  type OfficialReceiptRecord,
  type SaleRecord,
} from "../lib/api";
import {
  OfficialReceiptModal,
  type OfficialReceiptDisplayData,
} from "./official-receipt-modal";

interface SaleDetailsModalProps {
  sale: SaleRecord | null;
  onClose: () => void;
}

const currency = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export function SaleDetailsModal({ sale, onClose }: SaleDetailsModalProps) {
  const [receipt, setReceipt] = useState<OfficialReceiptRecord | null>(null);
  const [isReceiptLoading, setIsReceiptLoading] = useState(false);
  const [receiptError, setReceiptError] = useState("");

  if (!sale) return null;

  const total = sale.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const receiptDisplay: OfficialReceiptDisplayData | null = receipt
    ? {
        transactionId: receipt.saleId,
        orderDate: new Date(receipt.generatedAt),
        customerName: receipt.customerName,
        customerNumber: receipt.customerNumber,
        customerAddress: receipt.customerAddress,
        customerLandmark: receipt.customerLandmark,
        items: receipt.items.map((item) => ({
          id: item.id,
          itemName: item.itemName,
          itemCategory: item.itemCategory,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
        status: "SAVED",
      }
    : null;

  async function openReceipt() {
    if (isReceiptLoading || !sale?.hasOfficialReceipt) return;

    setIsReceiptLoading(true);
    setReceiptError("");
    try {
      setReceipt(await getOfficialReceipt(sale.id));
    } catch (error) {
      setReceiptError(
        error instanceof Error
          ? error.message
          : "The official receipt could not be opened.",
      );
    } finally {
      setIsReceiptLoading(false);
    }
  }

  return (
    <>
      <Modal
        animationType="fade"
        onRequestClose={onClose}
        transparent
        visible={sale !== null}
      >
        <View style={styles.overlay}>
          <View style={styles.modalCard}>
            <ScrollView contentContainerStyle={styles.content}>
              <View style={styles.header}>
                <View style={styles.headerText}>
                  <Text style={styles.eyebrow}>Transaction #{sale.id}</Text>
                  <Text style={styles.title}>Sales details</Text>
                  <Text style={styles.subtitle}>
                    Complete saved order information.
                  </Text>
                </View>
                <Pressable
                  accessibilityLabel="Close sales details"
                  accessibilityRole="button"
                  onPress={onClose}
                  style={styles.closeButton}
                >
                  <Ionicons name="close" size={21} color="#173b24" />
                </Pressable>
              </View>

              <View style={styles.detailsBox}>
                <Detail label="Customer Name" value={sale.customerName} />
                <Detail
                  label="Contact Number"
                  value={sale.customerNumber ?? "Not available"}
                />
                <Detail
                  label="Order Date"
                  value={new Date(sale.createdAt).toLocaleString("en-PH", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                    timeZone: "Asia/Manila",
                  })}
                />
                <Detail label="Transaction / Sales ID" value={`#${sale.id}`} />
                <Detail label="Payment Details" value="Not available" />
              </View>

              <View style={styles.itemsBox}>
                <View style={styles.itemsHeader}>
                  <Text style={[styles.itemsHeaderText, styles.itemColumn]}>
                    Item
                  </Text>
                  <Text style={[styles.itemsHeaderText, styles.quantityColumn]}>
                    Qty
                  </Text>
                  <Text style={[styles.itemsHeaderText, styles.priceColumn]}>
                    Subtotal
                  </Text>
                </View>
                {sale.items.map((item) => (
                  <View style={styles.itemRow} key={item.id}>
                    <View style={styles.itemColumn}>
                      <Text style={styles.itemName}>{item.item.name}</Text>
                      <Text style={styles.unitPrice}>
                        {currency.format(item.price)} each
                      </Text>
                    </View>
                    <Text style={[styles.itemValue, styles.quantityColumn]}>
                      {item.quantity}
                    </Text>
                    <Text style={[styles.itemValue, styles.priceColumn]}>
                      {currency.format(item.price * item.quantity)}
                    </Text>
                  </View>
                ))}
              </View>

              <View style={styles.totalBox}>
                <Text style={styles.totalLabel}>Total Amount</Text>
                <Text style={styles.totalValue}>{currency.format(total)}</Text>
              </View>

              {receiptError ? (
                <Text accessibilityRole="alert" style={styles.errorText}>
                  {receiptError}
                </Text>
              ) : null}

              {!sale.hasOfficialReceipt ? (
                <Text style={styles.unavailableText}>
                  No saved official receipt is available for this transaction.
                </Text>
              ) : null}

              <Pressable
                accessibilityRole="button"
                disabled={isReceiptLoading || !sale.hasOfficialReceipt}
                onPress={() => void openReceipt()}
                style={({ pressed }) => [
                  styles.receiptButton,
                  (pressed || !sale.hasOfficialReceipt) &&
                    styles.receiptButtonDisabled,
                ]}
              >
                {isReceiptLoading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Ionicons name="receipt-outline" size={19} color="#ffffff" />
                )}
                <Text style={styles.receiptButtonText}>
                  {isReceiptLoading
                    ? "Opening receipt..."
                    : "View Official Receipt"}
                </Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <OfficialReceiptModal
        onClose={() => setReceipt(null)}
        receipt={receiptDisplay}
        visible={receipt !== null}
      />
    </>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detail}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(13, 36, 23, 0.55)",
  },
  modalCard: {
    width: "100%",
    maxWidth: 600,
    maxHeight: "92%",
    alignSelf: "center",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: "#ffffff",
  },
  content: { padding: 20, paddingBottom: 30 },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 14,
  },
  headerText: { flex: 1 },
  eyebrow: {
    color: "#a85620",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.4,
    textTransform: "uppercase",
  },
  title: { color: "#17281b", fontSize: 24, fontWeight: "900", marginTop: 5 },
  subtitle: { color: "#6d776f", fontSize: 13, marginTop: 4 },
  closeButton: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#dfe4dd",
    borderRadius: 12,
  },
  detailsBox: {
    gap: 12,
    borderRadius: 16,
    backgroundColor: "#f3f6f1",
    marginTop: 20,
    padding: 15,
  },
  detail: { gap: 3 },
  detailLabel: {
    color: "#89928b",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.7,
    textTransform: "uppercase",
  },
  detailValue: { color: "#283b2c", fontSize: 14, fontWeight: "800" },
  itemsBox: {
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#dfe4dd",
    borderRadius: 16,
    marginTop: 16,
  },
  itemsHeader: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e7f2e6",
    paddingHorizontal: 13,
    paddingVertical: 11,
  },
  itemsHeaderText: { color: "#173b24", fontSize: 11, fontWeight: "900" },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#e8ede6",
    paddingHorizontal: 13,
    paddingVertical: 12,
  },
  itemColumn: { flex: 1, paddingRight: 8 },
  quantityColumn: { width: 34, textAlign: "center" },
  priceColumn: { width: 86, textAlign: "right" },
  itemName: { color: "#283b2c", fontSize: 13, fontWeight: "800" },
  unitPrice: { color: "#68736b", fontSize: 10, marginTop: 3 },
  itemValue: { color: "#283b2c", fontSize: 12, fontWeight: "700" },
  totalBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 16,
    backgroundColor: "#f3f6f1",
    marginTop: 14,
    padding: 15,
  },
  totalLabel: { color: "#68736b", fontSize: 14, fontWeight: "800" },
  totalValue: { color: "#173b24", fontSize: 21, fontWeight: "900" },
  errorText: {
    color: "#9b431f",
    fontSize: 13,
    fontWeight: "700",
    borderRadius: 11,
    backgroundColor: "#fff0e8",
    marginTop: 14,
    padding: 12,
  },
  unavailableText: {
    color: "#8a5a16",
    fontSize: 13,
    fontWeight: "700",
    borderRadius: 11,
    backgroundColor: "#fff6df",
    marginTop: 14,
    padding: 12,
  },
  receiptButton: {
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 12,
    backgroundColor: "#173b24",
    marginTop: 17,
  },
  receiptButtonDisabled: { opacity: 0.55 },
  receiptButtonText: { color: "#ffffff", fontSize: 14, fontWeight: "900" },
});
