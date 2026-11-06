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
  approveAccount,
  getActivityLogs,
  getPendingAccounts,
  type ActivityLogRecord,
  type PendingAccountRecord,
} from "../lib/api";

type MoreView = "menu" | "logs" | "accounts";

export function MoreScreen({ isAdmin }: { isAdmin: boolean }) {
  const [view, setView] = useState<MoreView>("menu");

  if (view === "logs") {
    return <ActivityLogsScreen onBack={() => setView("menu")} />;
  }
  if (view === "accounts" && isAdmin) {
    return <AccountApprovalScreen onBack={() => setView("menu")} />;
  }

  return (
    <View style={styles.screen}>
      <View style={styles.content}>
        <Text style={styles.title}>More</Text>
        <Text style={styles.subtitle}>Administrative records and tools.</Text>
        <MenuButton
          icon="time-outline"
          title="Activity Logs"
          description="Review successful changes made in the dashboard."
          onPress={() => setView("logs")}
        />
        {isAdmin ? (
          <MenuButton
            icon="person-add-outline"
            title="Account Approval"
            description="Review and approve newly registered accounts."
            onPress={() => setView("accounts")}
          />
        ) : null}
      </View>
    </View>
  );
}

function MenuButton({
  icon,
  title,
  description,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.menuCard}>
      <View style={styles.menuIcon}>
        <Ionicons name={icon} size={23} color="#2f7043" />
      </View>
      <View style={styles.menuDetails}>
        <Text style={styles.menuTitle}>{title}</Text>
        <Text style={styles.menuDescription}>{description}</Text>
      </View>
      <Ionicons name="chevron-forward" size={22} color="#768178" />
    </Pressable>
  );
}

function ScreenHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <View style={styles.header}>
      <Pressable accessibilityLabel="Go back" onPress={onBack} style={styles.backButton}>
        <Ionicons name="arrow-back" size={22} color="#173b24" />
      </Pressable>
      <Text style={styles.headerTitle}>{title}</Text>
    </View>
  );
}

function ActivityLogsScreen({ onBack }: { onBack: () => void }) {
  const [logs, setLogs] = useState<ActivityLogRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadLogs = useCallback(async (refresh = false) => {
    if (refresh) setIsRefreshing(true);
    else setIsLoading(true);
    setError("");
    try {
      setLogs(await getActivityLogs());
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Activity logs could not be loaded.",
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadLogs();
  }, [loadLogs]);

  return (
    <View style={styles.screen}>
      <FlatList
        data={isLoading || error ? [] : logs}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => void loadLogs(true)}
            tintColor="#2f7043"
          />
        }
        ListHeaderComponent={
          <>
            <ScreenHeader title="Activity Logs" onBack={onBack} />
            <Text style={styles.sectionSubtitle}>
              Successful changes made by signed-in users.
            </Text>
            {isLoading ? <LoadingState label="Loading activity logs..." /> : null}
            {error ? <ErrorState error={error} onRetry={() => void loadLogs()} /> : null}
          </>
        }
        renderItem={({ item }) => <ActivityLogCard log={item} />}
        ListEmptyComponent={
          !isLoading && !error ? (
            <Text style={styles.emptyText}>No activity has been recorded yet.</Text>
          ) : undefined
        }
      />
    </View>
  );
}

function ActivityLogCard({ log }: { log: ActivityLogRecord }) {
  const colors =
    log.action === "deleted"
      ? { background: "#fff0e8", text: "#9b431f" }
      : log.action === "edited"
        ? { background: "#e9eef8", text: "#4566a0" }
        : { background: "#e7f2e6", text: "#2f7043" };
  return (
    <View style={styles.recordCard}>
      <View style={styles.recordHeader}>
        <Text
          style={[
            styles.actionBadge,
            { backgroundColor: colors.background, color: colors.text },
          ]}
        >
          {log.action.toUpperCase()}
        </Text>
        <Text style={styles.dateText}>{formatDate(log.createdAt)}</Text>
      </View>
      <Text style={styles.recordTitle}>{log.affectedRecord}</Text>
      <Text style={styles.recordDetail}>{log.adminEmail}</Text>
    </View>
  );
}

function AccountApprovalScreen({ onBack }: { onBack: () => void }) {
  const [accounts, setAccounts] = useState<PendingAccountRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [approvingId, setApprovingId] = useState<number | null>(null);
  const [loadError, setLoadError] = useState("");
  const [approvalError, setApprovalError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const loadAccounts = useCallback(async (refresh = false) => {
    if (refresh) setIsRefreshing(true);
    else setIsLoading(true);
    setLoadError("");
    try {
      setAccounts(await getPendingAccounts());
    } catch (loadError) {
      setLoadError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load pending accounts.",
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadAccounts();
  }, [loadAccounts]);

  async function approve(account: PendingAccountRecord) {
    if (approvingId !== null) return;
    setApprovingId(account.id);
    setApprovalError("");
    setSuccessMessage("");
    try {
      await approveAccount(account.id);
      setAccounts((current) => current.filter((item) => item.id !== account.id));
      setSuccessMessage(`${account.email} can now sign in.`);
    } catch (approveError) {
      setApprovalError(
        approveError instanceof Error
          ? approveError.message
          : "The account could not be approved.",
      );
    } finally {
      setApprovingId(null);
    }
  }

  return (
    <View style={styles.screen}>
      <FlatList
        data={isLoading || loadError ? [] : accounts}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => void loadAccounts(true)}
            tintColor="#2f7043"
          />
        }
        ListHeaderComponent={
          <>
            <ScreenHeader title="Account Approval" onBack={onBack} />
            <Text style={styles.sectionSubtitle}>
              {accounts.length} account{accounts.length === 1 ? "" : "s"} waiting for approval.
            </Text>
            {isLoading ? <LoadingState label="Loading pending accounts..." /> : null}
            {loadError ? (
              <ErrorState error={loadError} onRetry={() => void loadAccounts()} />
            ) : null}
            {approvalError ? <Text style={styles.inlineError}>{approvalError}</Text> : null}
            {successMessage ? <Text style={styles.successText}>{successMessage}</Text> : null}
          </>
        }
        renderItem={({ item }) => (
          <View style={styles.recordCard}>
            <Text style={styles.recordTitle}>{item.email}</Text>
            <Text style={styles.recordDetail}>Registered {formatDate(item.createdAt)}</Text>
            <Pressable
              disabled={approvingId !== null}
              onPress={() => void approve(item)}
              style={[styles.approveButton, approvingId !== null && styles.disabled]}
            >
              {approvingId === item.id ? <ActivityIndicator color="#ffffff" /> : <Ionicons name="checkmark" size={18} color="#ffffff" />}
              <Text style={styles.approveText}>
                {approvingId === item.id ? "Approving..." : "Approve"}
              </Text>
            </Pressable>
          </View>
        )}
        ListEmptyComponent={
          !isLoading && !loadError ? (
            <Text style={styles.emptyText}>No accounts are waiting for approval.</Text>
          ) : undefined
        }
      />
    </View>
  );
}

function LoadingState({ label }: { label: string }) {
  return (
    <View style={styles.state}>
      <ActivityIndicator color="#2f7043" />
      <Text style={styles.stateText}>{label}</Text>
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
  screen: { flex: 1, backgroundColor: "#f4f6f1" },
  content: { width: "100%", maxWidth: 720, alignSelf: "center", padding: 18 },
  listContent: { width: "100%", maxWidth: 720, alignSelf: "center", padding: 18, paddingBottom: 40 },
  title: { color: "#18251a", fontSize: 28, fontWeight: "800" },
  subtitle: { color: "#768178", fontSize: 14, marginTop: 5, marginBottom: 20 },
  menuCard: { flexDirection: "row", alignItems: "center", gap: 13, borderWidth: 1, borderColor: "#dce3da", borderRadius: 16, backgroundColor: "#ffffff", marginBottom: 12, padding: 16 },
  menuIcon: { width: 44, height: 44, alignItems: "center", justifyContent: "center", borderRadius: 12, backgroundColor: "#e7f2e6" },
  menuDetails: { flex: 1 },
  menuTitle: { color: "#24362a", fontSize: 16, fontWeight: "800" },
  menuDescription: { color: "#758078", fontSize: 13, lineHeight: 18, marginTop: 3 },
  header: { flexDirection: "row", alignItems: "center", gap: 10 },
  backButton: { width: 42, height: 42, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#dce3da", borderRadius: 12, backgroundColor: "#ffffff" },
  headerTitle: { color: "#18251a", fontSize: 24, fontWeight: "800" },
  sectionSubtitle: { color: "#768178", fontSize: 14, marginTop: 12, marginBottom: 12 },
  recordCard: { borderWidth: 1, borderColor: "#dce3da", borderRadius: 15, backgroundColor: "#ffffff", marginTop: 10, padding: 16 },
  recordHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  actionBadge: { borderRadius: 999, overflow: "hidden", fontSize: 11, fontWeight: "800", paddingHorizontal: 10, paddingVertical: 5 },
  dateText: { color: "#768178", fontSize: 11 },
  recordTitle: { color: "#24362a", fontSize: 15, fontWeight: "800", marginTop: 10 },
  recordDetail: { color: "#66736c", fontSize: 13, marginTop: 5 },
  approveButton: { height: 43, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, borderRadius: 11, backgroundColor: "#173b24", marginTop: 14 },
  approveText: { color: "#ffffff", fontSize: 14, fontWeight: "800" },
  disabled: { opacity: 0.55 },
  state: { flexDirection: "row", justifyContent: "center", gap: 9, padding: 28 },
  stateText: { color: "#66736c", fontSize: 14 },
  errorBox: { borderRadius: 12, backgroundColor: "#fff0e8", marginTop: 12, padding: 14 },
  errorText: { color: "#8f421f", fontSize: 13, fontWeight: "700" },
  inlineError: { borderRadius: 10, backgroundColor: "#fff0e8", color: "#8f421f", fontSize: 13, fontWeight: "700", marginTop: 8, padding: 12 },
  successText: { borderRadius: 10, backgroundColor: "#e9f4e8", color: "#28643c", fontSize: 13, fontWeight: "700", marginTop: 8, padding: 12 },
  retryButton: { alignSelf: "flex-start", borderRadius: 8, backgroundColor: "#ffffff", marginTop: 10, paddingHorizontal: 13, paddingVertical: 8 },
  retryText: { color: "#173b24", fontSize: 13, fontWeight: "800" },
  emptyText: { color: "#7c867e", fontSize: 14, fontWeight: "600", padding: 40, textAlign: "center" },
});
