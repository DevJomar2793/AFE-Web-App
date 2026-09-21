import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

import {
  getInventoryItems,
  getReturns,
  getSales,
  type ReturnRecord,
  type SaleRecord,
} from "../lib/api";
import { getCurrentUser } from "../lib/auth";
import type { InventoryRecord } from "../types/inventory";
import type { MobileTab } from "./bottom-navigation";

interface OverviewScreenProps {
  isLoggingOut: boolean;
  onLogOut: () => void;
  onTabChange: (tab: MobileTab) => void;
}
interface DashboardMetricProps {
  title: string;
  value: string;
  detail: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBackground: string;
  isTablet: boolean;
}
interface ChartDay {
  dateKey: string;
  label: string;
  total: number;
}
interface RecentActivity {
  id: string;
  type: "sale" | "return";
  itemName: string;
  customerName: string;
  quantity: number;
  detail: string;
  createdAt: string;
}

function getDateKey(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}
function calculateSaleTotal(sale: SaleRecord) {
  return sale.items.reduce(
    (total, item) => total + item.price * item.quantity,
    0,
  );
}
function formatCurrency(amount: number) {
  return `₱${amount.toLocaleString("en-PH", { maximumFractionDigits: 0 })}`;
}
function formatChartValue(amount: number) {
  return amount === 0
    ? "—"
    : amount >= 1000
      ? `${(amount / 1000).toFixed(1)}K`
      : amount.toLocaleString("en-PH");
}
function formatActivityDate(value: string) {
  return new Date(value).toLocaleString("en-PH", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function DashboardMetric({
  title,
  value,
  detail,
  icon,
  iconColor,
  iconBackground,
  isTablet,
}: DashboardMetricProps) {
  return (
    <View style={[styles.metricCard, isTablet && styles.tabletMetricCard]}>
      <View style={[styles.metricIcon, { backgroundColor: iconBackground }]}>
        <Ionicons name={icon} size={20} color={iconColor} />
      </View>
      <Text style={styles.metricTitle}>{title}</Text>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricDetail}>{detail}</Text>
    </View>
  );
}

function LoadingState() {
  return (
    <View style={styles.loadingState} accessibilityRole="progressbar">
      <ActivityIndicator color="#2d7042" size="small" />
      <Text style={styles.loadingText}>Loading dashboard...</Text>
    </View>
  );
}

function AccountHeader({
  email,
  isLoading,
  isLoggingOut,
  onLogOut,
}: {
  email: string;
  isLoading: boolean;
  isLoggingOut: boolean;
  onLogOut: () => void;
}) {
  const [isLogoutConfirmationOpen, setIsLogoutConfirmationOpen] =
    useState(false);

  return (
    <View style={styles.accountCard}>
      <View style={styles.accountAvatar}>
        <Ionicons name="person" size={30} color="#ffffff" />
      </View>
      <View style={styles.accountText}>
        <Text style={styles.accountTitle}>Account</Text>
        <Text style={styles.accountEmail} numberOfLines={1}>
          {isLoading ? 'Loading account...' : email}
        </Text>
        <View style={styles.accountBadge}>
          <Text style={styles.accountBadgeText}>Active account</Text>
        </View>
      </View>
      <Pressable
        accessibilityLabel="Open account settings"
        accessibilityRole="button"
        disabled={isLoggingOut}
        hitSlop={8}
        onPress={() => setIsLogoutConfirmationOpen(true)}
        style={[styles.settingsButton, isLoggingOut && styles.disabledButton]}
      >
        <Ionicons name="settings-outline" size={22} color="#285a36" />
      </Pressable>

      <LogoutConfirmationModal
        isLoggingOut={isLoggingOut}
        onClose={() => setIsLogoutConfirmationOpen(false)}
        onConfirm={onLogOut}
        visible={isLogoutConfirmationOpen}
      />
    </View>
  );
}

function LogoutConfirmationModal({
  isLoggingOut,
  onClose,
  onConfirm,
  visible,
}: {
  isLoggingOut: boolean;
  onClose: () => void;
  onConfirm: () => void;
  visible: boolean;
}) {
  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={() => {
        if (!isLoggingOut) onClose();
      }}
    >
      <View style={styles.modalOverlay}>
        <Pressable
          accessibilityLabel="Close logout confirmation"
          disabled={isLoggingOut}
          onPress={onClose}
          style={styles.modalBackdrop}
        />
        <View accessibilityViewIsModal style={styles.logoutModalCard}>
          <View style={styles.logoutIcon}>
            <Ionicons name="log-out-outline" size={24} color="#9b431f" />
          </View>
          <Text style={styles.logoutTitle}>Log out?</Text>
          <Text style={styles.logoutDescription}>
            You will need to sign in again to access the inventory dashboard.
          </Text>
          <View style={styles.logoutActions}>
            <Pressable
              accessibilityRole="button"
              disabled={isLoggingOut}
              onPress={onClose}
              style={[styles.cancelLogoutButton, isLoggingOut && styles.disabledButton]}
            >
              <Text style={styles.cancelLogoutButtonText}>Cancel</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ busy: isLoggingOut }}
              disabled={isLoggingOut}
              onPress={onConfirm}
              style={[styles.confirmLogoutButton, isLoggingOut && styles.disabledButton]}
            >
              {isLoggingOut && <ActivityIndicator color="#ffffff" size="small" />}
              <Text style={styles.confirmLogoutButtonText}>
                {isLoggingOut ? "Logging out..." : "Log out"}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function ErrorState({
  error,
  onRetry,
}: {
  error: string;
  onRetry: () => void;
}) {
  return (
    <View style={styles.errorState} accessibilityRole="alert">
      <Text style={styles.errorText}>{error}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Retry loading dashboard"
        onPress={onRetry}
        style={styles.retryButton}
      >
        <Ionicons name="refresh-outline" size={17} color="#8f421f" />
        <Text style={styles.retryText}>Retry dashboard</Text>
      </Pressable>
    </View>
  );
}

export function OverviewScreen({
  isLoggingOut,
  onLogOut,
  onTabChange,
}: OverviewScreenProps) {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const isWideTablet = width >= 900;
  const [items, setItems] = useState<InventoryRecord[]>([]);
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [returns, setReturns] = useState<ReturnRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [accountEmail, setAccountEmail] = useState("");
  const [isLoadingAccount, setIsLoadingAccount] = useState(true);

  const loadDashboard = useCallback(
    async (signal?: AbortSignal, refresh = false) => {
      if (refresh) setIsRefreshing(true);
      else setIsLoading(true);
      setError("");
      try {
        const [nextItems, nextSales, nextReturns] = await Promise.all([
          getInventoryItems(signal),
          getSales(signal),
          getReturns(signal),
        ]);
        setItems(nextItems);
        setSales(nextSales);
        setReturns(nextReturns);
      } catch (loadError) {
        if (signal?.aborted) return;
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Dashboard data could not be loaded. Check the API and try again.",
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
    void loadDashboard(controller.signal);
    return () => controller.abort();
  }, [loadDashboard]);

  useEffect(() => {
    let isMounted = true;

    async function loadAccount() {
      const account = await getCurrentUser();
      if (!isMounted) return;

      if (!account) {
        onLogOut();
        return;
      }

      setAccountEmail(account.email);
      setIsLoadingAccount(false);
    }

    void loadAccount();

    return () => {
      isMounted = false;
    };
  }, [onLogOut]);

  const dashboard = useMemo(() => {
    const now = new Date();
    const today = getDateKey(now);
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - 29);
    const startKey = getDateKey(startDate);
    const todaysSales = sales.filter(
      (sale) => getDateKey(new Date(sale.createdAt)) === today,
    );
    const last30DaysSales = sales.filter((sale) => {
      const key = getDateKey(new Date(sale.createdAt));
      return key >= startKey && key <= today;
    });
    const todaysReturns = returns.filter(
      (itemReturn) => getDateKey(new Date(itemReturn.createdAt)) === today,
    );
    const chartDays: ChartDay[] = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(now);
      date.setDate(now.getDate() - (6 - index));
      const dateKey = getDateKey(date);
      return {
        dateKey,
        label: date
          .toLocaleDateString("en-PH", { weekday: "short" })
          .toUpperCase(),
        total: sales
          .filter((sale) => getDateKey(new Date(sale.createdAt)) === dateKey)
          .reduce((sum, sale) => sum + calculateSaleTotal(sale), 0),
      };
    });
    const activities: RecentActivity[] = [
      ...sales.map((sale) => ({
        id: `sale-${sale.id}`,
        type: "sale" as const,
        itemName: sale.items.map((item) => item.item.name).join(", "),
        customerName: sale.customerName,
        quantity: sale.items.reduce((sum, item) => sum + item.quantity, 0),
        detail: formatCurrency(calculateSaleTotal(sale)),
        createdAt: sale.createdAt,
      })),
      ...returns.map((itemReturn) => ({
        id: `return-${itemReturn.id}`,
        type: "return" as const,
        itemName: itemReturn.item.name,
        customerName: itemReturn.customerName,
        quantity: itemReturn.quantity,
        detail: itemReturn.reason,
        createdAt: itemReturn.createdAt,
      })),
    ]
      .sort(
        (first, second) =>
          Date.parse(second.createdAt) - Date.parse(first.createdAt),
      )
      .slice(0, 5);
    return {
      salesToday: todaysSales.reduce(
        (sum, sale) => sum + calculateSaleTotal(sale),
        0,
      ),
      saleCount: todaysSales.length,
      unitsOnHand: items.reduce((sum, item) => sum + item.quantity, 0),
      returnsToday: todaysReturns.reduce(
        (sum, itemReturn) => sum + itemReturn.quantity,
        0,
      ),
      returnCount: todaysReturns.length,
      last30DaysSales: last30DaysSales.reduce(
        (sum, sale) => sum + calculateSaleTotal(sale),
        0,
      ),
      last30DaysSaleCount: last30DaysSales.length,
      stockAttention: items.filter((item) => item.status !== "in_stock"),
      chartDays,
      activities,
    };
  }, [items, sales, returns]);
  const highestChartValue = Math.max(
    ...dashboard.chartDays.map((day) => day.total),
    1,
  );

  return (
    <View style={[styles.screen, isTablet && styles.tabletScreen]}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          isTablet && styles.tabletContent,
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => void loadDashboard(undefined, true)}
            tintColor="#2d7042"
            colors={["#2d7042"]}
          />
        }
      >
        <AccountHeader
          email={accountEmail}
          isLoading={isLoadingAccount}
          isLoggingOut={isLoggingOut}
          onLogOut={onLogOut}
        />
        {isLoading && !items.length ? (
          <LoadingState />
        ) : error ? (
          <ErrorState error={error} onRetry={() => void loadDashboard()} />
        ) : (
          <>
            <View style={styles.metricsGrid}>
              <DashboardMetric
                title="Sales today"
                value={formatCurrency(dashboard.salesToday)}
                detail={`${dashboard.saleCount} completed ${dashboard.saleCount === 1 ? "sale" : "sales"}`}
                icon="cash-outline"
                iconColor="#2d7042"
                iconBackground="#e4f1e4"
                isTablet={isTablet}
              />
              <DashboardMetric
                title="Units on hand"
                value={dashboard.unitsOnHand.toLocaleString("en-PH")}
                detail={`${items.length} inventory ${items.length === 1 ? "item" : "items"}`}
                icon="bag-handle-outline"
                iconColor="#4566a0"
                iconBackground="#e8edf9"
                isTablet={isTablet}
              />
              <DashboardMetric
                title="Returns today"
                value={dashboard.returnsToday.toLocaleString("en-PH")}
                detail={`${dashboard.returnCount} return ${dashboard.returnCount === 1 ? "record" : "records"}`}
                icon="return-down-back-outline"
                iconColor="#b15b26"
                iconBackground="#fff0e5"
                isTablet={isTablet}
              />
              <DashboardMetric
                title="Sales last 30 days"
                value={formatCurrency(dashboard.last30DaysSales)}
                detail={`${dashboard.last30DaysSaleCount} completed ${dashboard.last30DaysSaleCount === 1 ? "sale" : "sales"}`}
                icon="trending-up-outline"
                iconColor="#7b5391"
                iconBackground="#f1e9f5"
                isTablet={isTablet}
              />
            </View>
            <View
              style={[
                styles.dashboardPanels,
                isWideTablet && styles.wideDashboardPanels,
              ]}
            >
              <View
                style={[styles.sectionCard, isWideTablet && styles.tabletPanel]}
              >
                <View style={styles.sectionHeader}>
                  <View>
                    <Text style={styles.sectionTitle}>7-day sales</Text>
                    <Text style={styles.sectionSubtitle}>
                      Gross sales revenue
                    </Text>
                  </View>
                  <View style={styles.liveBadge}>
                    <Text style={styles.liveText}>Live</Text>
                  </View>
                </View>
                <View style={styles.chart}>
                  {dashboard.chartDays.map((day) => {
                    const height =
                      day.total === 0
                        ? 0
                        : Math.max(
                            12,
                            Math.round((day.total / highestChartValue) * 100),
                          );
                    return (
                      <View key={day.dateKey} style={styles.chartColumn}>
                        <Text style={styles.chartValue}>
                          {formatChartValue(day.total)}
                        </Text>
                        <View style={styles.chartTrack}>
                          <View
                            style={[styles.chartBar, { height: `${height}%` }]}
                          />
                        </View>
                        <Text style={styles.chartLabel}>{day.label}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>
              <View
                style={[styles.sectionCard, isWideTablet && styles.tabletPanel]}
              >
                <View style={styles.sectionHeader}>
                  <View style={styles.flexText}>
                    <Text style={styles.sectionTitle}>Stock attention</Text>
                    <Text style={styles.sectionSubtitle}>
                      Low and out-of-stock items
                    </Text>
                  </View>
                  <View style={[styles.sectionIcon, styles.warningIcon]}>
                    <Ionicons
                      name="warning-outline"
                      size={20}
                      color="#b15b26"
                    />
                  </View>
                </View>
                <View style={styles.stockList}>
                  {dashboard.stockAttention.length ? (
                    <Pressable
                      accessibilityLabel="View inventory items that need attention"
                      accessibilityRole="button"
                      onPress={() => onTabChange("inventory")}
                      style={styles.stockSummary}
                    >
                      <View style={styles.stockSummaryIcon}>
                        <Ionicons name="cube-outline" size={27} color="#2f7043" />
                      </View>
                      <View style={styles.flexText}>
                        <Text style={styles.stockSummaryTitle}>
                          {dashboard.stockAttention.length} item{dashboard.stockAttention.length === 1 ? "" : "s"} need attention
                        </Text>
                        <Text style={styles.stockSummaryText}>
                          Check low and out-of-stock items
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={22} color="#2f7043" />
                    </Pressable>
                  ) : (
                    <Text style={styles.emptyStock}>
                      All items are currently in stock.
                    </Text>
                  )}
                </View>
              </View>
            </View>
            <View style={[styles.sectionCard, styles.activityCard]}>
              <View style={styles.sectionHeader}>
                <View style={styles.flexText}>
                  <Text style={styles.sectionTitle}>
                    Recent database activity
                  </Text>
                  <Text style={styles.sectionSubtitle}>
                    Latest sales and returns
                  </Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="View sales"
                  onPress={() => onTabChange("orders")}
                  hitSlop={8}
                >
                  <Text style={styles.viewSalesText}>View sales</Text>
                </Pressable>
              </View>
              {dashboard.activities.length ? (
                dashboard.activities.map((activity) => {
                  const isSale = activity.type === "sale";
                  return (
                    <View key={activity.id} style={styles.activityRow}>
                      <View
                        style={[
                          styles.activityIcon,
                          isSale ? styles.saleIcon : styles.returnIcon,
                        ]}
                      >
                        <Ionicons
                          name={
                            isSale ? "arrow-up-outline" : "arrow-down-outline"
                          }
                          size={18}
                          color={isSale ? "#2f7043" : "#b15b26"}
                        />
                      </View>
                      <View style={styles.activityName}>
                        <Text style={styles.activityTitle} numberOfLines={1}>
                          {activity.type} · {activity.itemName}
                        </Text>
                        <Text style={styles.activityCustomer} numberOfLines={1}>
                          {activity.customerName}
                        </Text>
                      </View>
                      <View style={styles.activityValues}>
                        <Text style={styles.activityQuantity}>
                          {isSale ? "−" : "+"}
                          {activity.quantity}
                        </Text>
                        <Text style={styles.activityDetail} numberOfLines={1}>
                          {activity.detail}
                        </Text>
                        <Text style={styles.activityDate}>
                          {formatActivityDate(activity.createdAt)}
                        </Text>
                      </View>
                    </View>
                  );
                })
              ) : (
                <Text style={styles.emptyActivity}>
                  No sales or returns have been recorded yet.
                </Text>
              )}
            </View>
          </>
        )}
      </ScrollView>
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
  accountCard: {
    minHeight: 96,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 18,
    backgroundColor: "#edf5ed",
    marginBottom: 16,
    padding: 14,
  },
  accountAvatar: {
    width: 62,
    height: 62,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 31,
    backgroundColor: "#3f8152",
  },
  accountText: { flex: 1, minWidth: 0 },
  accountTitle: { color: "#18251a", fontSize: 17, fontWeight: "800" },
  accountEmail: {
    color: "#758078",
    fontSize: 13,
    marginTop: 2,
  },
  accountBadge: {
    alignSelf: "flex-start",
    borderRadius: 10,
    backgroundColor: "#e2f2e1",
    marginTop: 6,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  accountBadgeText: { color: "#2f7043", fontSize: 12, fontWeight: "800" },
  settingsButton: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 24,
    backgroundColor: "#dfecdf",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(13, 36, 23, 0.55)",
    padding: 20,
  },
  modalBackdrop: {
    position: "absolute",
    inset: 0,
  },
  logoutModalCard: {
    borderRadius: 24,
    backgroundColor: "#ffffff",
    padding: 24,
  },
  logoutIcon: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    backgroundColor: "#fff0e8",
  },
  logoutTitle: {
    color: "#17281b",
    fontSize: 24,
    fontWeight: "900",
    marginTop: 18,
  },
  logoutDescription: {
    color: "#6d776f",
    fontSize: 14,
    lineHeight: 21,
    marginTop: 8,
  },
  logoutActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 24,
  },
  cancelLogoutButton: {
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#d5ddd3",
    borderRadius: 12,
    paddingHorizontal: 18,
  },
  cancelLogoutButtonText: { color: "#526058", fontSize: 14, fontWeight: "800" },
  confirmLogoutButton: {
    height: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 12,
    backgroundColor: "#a33d22",
    paddingHorizontal: 18,
  },
  confirmLogoutButtonText: { color: "#ffffff", fontSize: 14, fontWeight: "800" },
  disabledButton: { opacity: 0.6 },
  loadingState: {
    minHeight: 220,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: { color: "#7a857d", fontSize: 14, fontWeight: "600" },
  errorState: {
    alignItems: "center",
    borderRadius: 18,
    backgroundColor: "#fff0e8",
    padding: 24,
  },
  errorText: {
    color: "#8f421f",
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginTop: 14,
    borderRadius: 12,
    backgroundColor: "#ffffff",
    paddingHorizontal: 15,
    paddingVertical: 11,
  },
  retryText: { color: "#8f421f", fontSize: 14, fontWeight: "800" },
  metricsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  metricCard: {
    position: "relative",
    flexBasis: "47%",
    flexGrow: 1,
    minHeight: 132,
    borderWidth: 1,
    borderColor: "#e1e6df",
    borderRadius: 16,
    backgroundColor: "#ffffff",
    padding: 15,
  },
  tabletMetricCard: { flexBasis: "22%" },
  metricIcon: {
    position: "absolute",
    top: 14,
    right: 14,
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
  },
  metricTitle: {
    maxWidth: "70%",
    color: "#758078",
    fontSize: 14,
    fontWeight: "700",
  },
  metricValue: {
    color: "#18251a",
    fontSize: 24,
    fontWeight: "800",
    marginTop: 23,
  },
  metricDetail: {
    color: "#849087",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 4,
  },
  dashboardPanels: { gap: 0 },
  wideDashboardPanels: { flexDirection: "row", alignItems: "stretch", gap: 14 },
  tabletPanel: { flex: 1 },
  sectionCard: {
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#e1e6df",
    borderRadius: 18,
    backgroundColor: "#ffffff",
    marginTop: 14,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    padding: 16,
  },
  sectionTitle: { color: "#18251a", fontSize: 18, fontWeight: "800" },
  sectionSubtitle: { color: "#7a857d", fontSize: 14, marginTop: 3 },
  liveBadge: {
    borderRadius: 14,
    backgroundColor: "#e9f4e8",
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  liveText: { color: "#2d7042", fontSize: 12, fontWeight: "800" },
  chart: {
    height: 170,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 7,
    paddingHorizontal: 15,
    paddingBottom: 16,
  },
  chartColumn: { flex: 1, alignItems: "center" },
  chartValue: {
    color: "#718078",
    fontSize: 10,
    fontWeight: "700",
    marginBottom: 6,
  },
  chartTrack: {
    width: "76%",
    height: 94,
    justifyContent: "flex-end",
    overflow: "hidden",
    borderRadius: 7,
    backgroundColor: "#edf1eb",
  },
  chartBar: { width: "100%", borderRadius: 7, backgroundColor: "#3f8152" },
  chartLabel: {
    color: "#8a938c",
    fontSize: 10,
    fontWeight: "800",
    marginTop: 7,
  },
  flexText: { flex: 1, minWidth: 0 },
  sectionIcon: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
  },
  warningIcon: { backgroundColor: "#fff0e5" },
  stockList: { gap: 10, paddingHorizontal: 12, paddingBottom: 12 },
  stockSummary: {
    minHeight: 68,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 12,
    backgroundColor: "#f0f7f0",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  stockSummaryIcon: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
  },
  stockSummaryTitle: { color: "#2f7043", fontSize: 14, fontWeight: "800" },
  stockSummaryText: { color: "#718078", fontSize: 12, marginTop: 3 },
  stockRow: {
    minHeight: 68,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    borderWidth: 1,
    borderColor: "#edf0eb",
    borderRadius: 12,
    padding: 10,
  },
  stockQuantity: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    backgroundColor: "#f4f6f1",
  },
  stockQuantityText: { color: "#173b24", fontSize: 15, fontWeight: "800" },
  stockName: { color: "#18251a", fontSize: 14, fontWeight: "800" },
  stockStatus: {
    color: "#828c84",
    fontSize: 12,
    marginTop: 3,
    textTransform: "capitalize",
  },
  manageText: { color: "#a85620", fontSize: 12, fontWeight: "800" },
  emptyStock: {
    borderRadius: 12,
    backgroundColor: "#eef6ed",
    color: "#39704a",
    fontSize: 14,
    fontWeight: "700",
    padding: 14,
  },
  activityCard: { marginBottom: 4 },
  viewSalesText: { color: "#2d7042", fontSize: 12, fontWeight: "800" },
  activityRow: {
    minHeight: 82,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    borderTopWidth: 1,
    borderTopColor: "#edf0eb",
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  activityIcon: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
  },
  saleIcon: { backgroundColor: "#e7f2e6" },
  returnIcon: { backgroundColor: "#fff0e5" },
  activityName: { flex: 1, minWidth: 0 },
  activityTitle: {
    color: "#18251a",
    fontSize: 14,
    fontWeight: "800",
    textTransform: "capitalize",
  },
  activityCustomer: {
    color: "#89928b",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 3,
  },
  activityValues: { width: 92, alignItems: "flex-end" },
  activityQuantity: { color: "#24362a", fontSize: 14, fontWeight: "800" },
  activityDetail: {
    color: "#68736b",
    fontSize: 11,
    fontWeight: "600",
    marginTop: 2,
    textAlign: "right",
  },
  activityDate: {
    color: "#929a94",
    fontSize: 10,
    fontWeight: "600",
    marginTop: 2,
  },
  emptyActivity: {
    color: "#7c867e",
    fontSize: 14,
    fontWeight: "600",
    padding: 32,
    textAlign: "center",
  },
});
