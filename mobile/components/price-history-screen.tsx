import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  getInventoryPriceHistory,
  type InventoryPriceHistoryRecord,
  type PriceChangeDirection,
} from "../lib/api";

interface PriceHistoryScreenProps {
  onBack: () => void;
}

const currency = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const dateTimeFormatter = new Intl.DateTimeFormat("en-PH", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Manila",
});

const eventLabels = {
  initial: "Initial price",
  stock_added: "Stock added",
  price_update: "Price update",
};

export function PriceHistoryScreen({ onBack }: PriceHistoryScreenProps) {
  const [records, setRecords] = useState<InventoryPriceHistoryRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadHistory = useCallback(
    async (signal?: AbortSignal, refresh = false) => {
      if (refresh) setIsRefreshing(true);
      else setIsLoading(true);
      setError("");

      try {
        setRecords(await getInventoryPriceHistory(signal));
      } catch (loadError) {
        if (signal?.aborted) return;
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Price history could not be loaded.",
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
    void loadHistory(controller.signal);
    return () => controller.abort();
  }, [loadHistory]);

  return (
    <View style={styles.screen}>
      <FlatList
        data={isLoading || error ? [] : records}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => void loadHistory(undefined, true)}
            tintColor="#258143"
            colors={["#258143"]}
          />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Back to Inventory"
              onPress={onBack}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={19} color="#173b24" />
            </Pressable>
            <View style={styles.headerText}>
              <Text style={styles.title}>Price History</Text>
              <Text style={styles.subtitle}>
                Compare recorded inventory purchase costs.
              </Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.stateBox}>
              <ActivityIndicator color="#258143" />
              <Text style={styles.stateText}>Loading price history...</Text>
            </View>
          ) : error ? (
            <View style={styles.errorBox} accessibilityRole="alert">
              <Text style={styles.errorText}>{error}</Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => void loadHistory()}
                style={styles.retryButton}
              >
                <Ionicons name="refresh" size={16} color="#ffffff" />
                <Text style={styles.retryText}>Try again</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.stateBox}>
              <Ionicons name="time-outline" size={34} color="#718078" />
              <Text style={styles.emptyTitle}>No price history yet</Text>
              <Text style={styles.stateText}>
                Initial stock and future price changes will appear here.
              </Text>
            </View>
          )
        }
        renderItem={({ item }) => <PriceHistoryCard record={item} />}
      />
    </View>
  );
}

function PriceHistoryCard({
  record,
}: {
  record: InventoryPriceHistoryRecord;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.productText}>
          <Text style={styles.productName}>{record.productName}</Text>
          <Text style={styles.categoryText}>
            {record.category === "eggs" ? "Eggs" : `Oil · ${record.oilSize}`}
            {" · "}{eventLabels[record.eventType]}
          </Text>
        </View>
        <ChangeBadge record={record} />
      </View>

      <View style={styles.priceRow}>
        <PriceValue
          label="Previous price"
          value={
            record.previousPurchaseCost === null
              ? "—"
              : currency.format(record.previousPurchaseCost)
          }
        />
        <Ionicons name="arrow-forward" size={17} color="#89938c" />
        <PriceValue
          label="New price"
          value={currency.format(record.newPurchaseCost)}
        />
      </View>

      <View style={styles.cardFooter}>
        <Text style={styles.detailText}>Quantity: {record.quantity}</Text>
        <Text style={styles.detailText}>
          {dateTimeFormatter.format(new Date(record.purchaseDate))}
        </Text>
      </View>
    </View>
  );
}

function PriceValue({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.priceValue}>
      <Text style={styles.priceLabel}>{label}</Text>
      <Text style={styles.priceText}>{value}</Text>
    </View>
  );
}

function ChangeBadge({
  record,
}: {
  record: InventoryPriceHistoryRecord;
}) {
  if (record.priceDifference === null) {
    return (
      <View style={[styles.changeBadge, styles.initialBadge]}>
        <Text style={[styles.changeText, styles.initialText]}>Initial</Text>
      </View>
    );
  }

  const directionStyles: Record<PriceChangeDirection, object> = {
    initial: styles.initialBadge,
    increased: styles.increasedBadge,
    decreased: styles.decreasedBadge,
    unchanged: styles.initialBadge,
  };
  const textStyles: Record<PriceChangeDirection, object> = {
    initial: styles.initialText,
    increased: styles.increasedText,
    decreased: styles.decreasedText,
    unchanged: styles.initialText,
  };
  const percentage =
    record.percentageChange === null
      ? "N/A"
      : `${record.percentageChange > 0 ? "+" : ""}${record.percentageChange.toFixed(2)}%`;

  return (
    <View style={[styles.changeBadge, directionStyles[record.changeDirection]]}>
      <Text style={[styles.changeText, textStyles[record.changeDirection]]}>
        {record.priceDifference > 0 ? "+" : ""}
        {currency.format(record.priceDifference)} · {percentage}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    width: "100%",
    maxWidth: 720,
    alignSelf: "center",
    backgroundColor: "#f4f6f1",
  },
  content: { padding: 16, paddingBottom: 28, gap: 12 },
  header: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 4 },
  backButton: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#cfd8cd",
    backgroundColor: "#ffffff",
  },
  headerText: { flex: 1 },
  title: { fontSize: 24, fontWeight: "900", color: "#17281b" },
  subtitle: { marginTop: 2, fontSize: 13, color: "#768178" },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#e0e5de",
    backgroundColor: "#ffffff",
    padding: 16,
    gap: 14,
  },
  cardHeader: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  productText: { flex: 1 },
  productName: { fontSize: 16, fontWeight: "900", color: "#24362a" },
  categoryText: { marginTop: 3, fontSize: 12, fontWeight: "600", color: "#7c867e" },
  priceRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  priceValue: { flex: 1 },
  priceLabel: { fontSize: 11, fontWeight: "700", color: "#89938c" },
  priceText: { marginTop: 3, fontSize: 16, fontWeight: "900", color: "#263c2c" },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: "#edf0eb",
    paddingTop: 12,
  },
  detailText: { flexShrink: 1, fontSize: 11, fontWeight: "600", color: "#69766d" },
  changeBadge: { borderRadius: 999, paddingHorizontal: 9, paddingVertical: 5 },
  changeText: { fontSize: 10, fontWeight: "900" },
  initialBadge: { backgroundColor: "#edf1ed" },
  initialText: { color: "#637068" },
  increasedBadge: { backgroundColor: "#fff0e8" },
  increasedText: { color: "#a34820" },
  decreasedBadge: { backgroundColor: "#e9f4e8" },
  decreasedText: { color: "#28643c" },
  stateBox: { alignItems: "center", paddingVertical: 64, gap: 10 },
  stateText: { maxWidth: 320, textAlign: "center", fontSize: 13, color: "#718078" },
  emptyTitle: { fontSize: 16, fontWeight: "900", color: "#24362a" },
  errorBox: { alignItems: "center", paddingVertical: 50, gap: 14 },
  errorText: { textAlign: "center", fontSize: 13, fontWeight: "700", color: "#9b3f3f" },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 11,
    backgroundColor: "#173b24",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  retryText: { fontSize: 13, fontWeight: "900", color: "#ffffff" },
});
