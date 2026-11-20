import { Ionicons } from "@expo/vector-icons";
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import type { ProductCategory } from "../types/inventory";

export interface OfficialReceiptDisplayData {
  transactionId: number | null;
  orderDate: Date;
  customerName: string;
  customerNumber: string | null;
  customerAddress: string | null;
  customerLandmark: string | null;
  items: {
    id: number;
    itemName: string;
    itemCategory: ProductCategory;
    quantity: number;
    unitPrice: number;
  }[];
  status: "PREVIEW" | "SAVED";
}

interface OfficialReceiptModalProps {
  visible: boolean;
  receipt: OfficialReceiptDisplayData | null;
  onClose: () => void;
}

const currency = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function OfficialReceiptModal({
  visible,
  receipt,
  onClose,
}: OfficialReceiptModalProps) {
  if (!receipt) return null;

  const total = receipt.items.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0,
  );
  const address = receipt.customerAddress
    ? `${receipt.customerAddress}${
        receipt.customerLandmark
          ? ` (Landmark: ${receipt.customerLandmark})`
          : ""
      }`
    : "Not available";

  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      transparent
      visible={visible}
    >
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          <View style={styles.topActions}>
            <Pressable
              accessibilityLabel="Close official receipt"
              accessibilityRole="button"
              onPress={onClose}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={21} color="#173b24" />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.receipt}>
            <View style={styles.brandRow}>
              <Image
                source={require("../assets/app-icon-emblem.png")}
                style={styles.logo}
              />
              <Text style={styles.brandName}>Adamos Fresh Eggs</Text>
            </View>

            <Text style={styles.receiptTitle}>Official Receipt</Text>

            <View style={styles.orderBox}>
              <Text style={styles.orderText}>
                Order/Transaction ID: {receipt.transactionId ?? "Pending"}
              </Text>
              <Text style={styles.orderText}>
                Date: {receipt.orderDate.toLocaleString("en-PH", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                  timeZone: "Asia/Manila",
                })}
              </Text>
            </View>

            <SectionTitle>Customer Details</SectionTitle>
            <DetailRow label="Name:" value={receipt.customerName} />
            <DetailRow
              label="Phone:"
              value={receipt.customerNumber ?? "Not available"}
            />
            <DetailRow label="Address:" value={address} />

            <View style={styles.divider} />
            <SectionTitle>Items Purchased</SectionTitle>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.headerText, styles.itemColumn]}>Item</Text>
                <Text style={[styles.headerText, styles.quantityColumn]}>Qty</Text>
                <Text style={[styles.headerText, styles.totalColumn]}>Total</Text>
              </View>
              {receipt.items.map((item) => (
                <View style={styles.tableRow} key={item.id}>
                  <View style={styles.itemColumn}>
                    <Text style={styles.itemName}>{item.itemName}</Text>
                    <Text style={styles.itemType}>
                      {item.itemCategory === "eggs" ? "Fresh Eggs" : "Palm Oil"}
                      {` · ${currency.format(item.unitPrice)} each`}
                    </Text>
                  </View>
                  <Text style={[styles.cellText, styles.quantityColumn]}>
                    {item.quantity}
                  </Text>
                  <Text style={[styles.cellText, styles.totalColumn]}>
                    {currency.format(item.unitPrice * item.quantity)}
                  </Text>
                </View>
              ))}
            </View>

            <View style={styles.divider} />
            <SectionTitle>Transaction Summary</SectionTitle>
            <SummaryRow label="Subtotal:" value={currency.format(total)} />
            <SummaryRow label="Delivery Fee:" value={currency.format(0)} />
            <View style={styles.grandTotal}>
              <Text style={styles.grandTotalLabel}>Total Amount:</Text>
              <Text style={styles.grandTotalValue}>{currency.format(total)}</Text>
            </View>
            <View style={styles.paymentBox}>
              <Text style={styles.paymentText}>Payment: Not specified</Text>
              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>{receipt.status}</Text>
                <Ionicons name="checkmark-circle" size={16} color="#ffffff" />
              </View>
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>
                Thank you for purchasing at Adamos Fresh Eggs.
              </Text>
              <Text style={styles.footerNote}>
                {receipt.status === "PREVIEW"
                  ? "*This is a preview generated by Adamos Inventory System."
                  : "*This receipt was generated by Adamos Inventory System."}
              </Text>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function SectionTitle({ children }: { children: string }) {
  return <Text style={styles.sectionTitle}>{children.toUpperCase()}</Text>;
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryText}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(13, 36, 23, 0.65)",
    padding: 12,
  },
  modalCard: {
    width: "100%",
    maxWidth: 520,
    maxHeight: "94%",
    alignSelf: "center",
    overflow: "hidden",
    borderRadius: 22,
    backgroundColor: "#ffffff",
  },
  topActions: {
    zIndex: 1,
    position: "absolute",
    top: 10,
    right: 10,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#d7dfd5",
    borderRadius: 12,
    backgroundColor: "#ffffff",
  },
  receipt: { padding: 18, paddingTop: 16, paddingBottom: 26 },
  brandRow: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#d8dfd5",
    paddingHorizontal: 44,
    paddingBottom: 10,
  },
  logo: { width: 40, height: 40, borderRadius: 9 },
  brandName: { color: "#111a14", fontSize: 19, fontWeight: "900" },
  receiptTitle: {
    color: "#173b24",
    fontSize: 29,
    fontWeight: "900",
    marginVertical: 12,
    textAlign: "center",
  },
  orderBox: {
    borderRadius: 10,
    backgroundColor: "#c9dbc8",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  orderText: { color: "#17281b", fontSize: 13, lineHeight: 20 },
  sectionTitle: {
    color: "#111a14",
    fontSize: 14,
    fontWeight: "900",
    marginBottom: 6,
    marginTop: 14,
  },
  detailRow: { flexDirection: "row", alignItems: "flex-start", marginTop: 2 },
  detailLabel: { width: 62, color: "#111a14", fontSize: 12, fontWeight: "700" },
  detailValue: { flex: 1, color: "#111a14", fontSize: 12, lineHeight: 17 },
  divider: { height: 1, backgroundColor: "#d8dfd5", marginTop: 12 },
  table: {
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#173b24",
    borderRadius: 6,
  },
  tableHeader: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#c9dbc8",
    paddingHorizontal: 7,
    paddingVertical: 7,
  },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#8ba08d",
    paddingHorizontal: 7,
    paddingVertical: 7,
  },
  itemColumn: { flex: 1, paddingRight: 5 },
  quantityColumn: { width: 32, textAlign: "center" },
  totalColumn: { width: 86, textAlign: "right" },
  headerText: { color: "#111a14", fontSize: 11, fontWeight: "900" },
  cellText: { color: "#111a14", fontSize: 11, fontWeight: "700" },
  itemName: { color: "#111a14", fontSize: 11, fontWeight: "700" },
  itemType: { color: "#536158", fontSize: 9, marginTop: 2 },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  summaryText: { color: "#111a14", fontSize: 12 },
  summaryValue: { color: "#111a14", fontSize: 12, fontWeight: "700" },
  grandTotal: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 8,
    backgroundColor: "#dcebd8",
    marginTop: 5,
    paddingHorizontal: 9,
    paddingVertical: 8,
  },
  grandTotalLabel: { color: "#111a14", fontSize: 14, fontWeight: "900" },
  grandTotalValue: { color: "#111a14", fontSize: 16, fontWeight: "900" },
  paymentBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 8,
    backgroundColor: "#edf4ea",
    marginTop: 8,
    paddingHorizontal: 9,
    paddingVertical: 8,
  },
  paymentText: { color: "#111a14", fontSize: 12 },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 20,
    backgroundColor: "#25683a",
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  statusText: { color: "#ffffff", fontSize: 10, fontWeight: "900" },
  footer: {
    borderTopWidth: 1,
    borderTopColor: "#d8dfd5",
    marginTop: 14,
    paddingTop: 12,
  },
  footerText: { color: "#111a14", fontSize: 11 },
  footerNote: { color: "#111a14", fontSize: 10, fontWeight: "700", marginTop: 3 },
});
