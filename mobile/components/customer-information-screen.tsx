import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  AddCustomerModal,
  type CustomerFormValues,
} from "./add-customer-modal";
import {
  createCustomerDetails,
  deleteCustomerDetails,
  getCustomerDetails,
  updateCustomerDetails,
  type CustomerDetailsRecord as Customer,
} from "../lib/api";
import { AuthenticatedScreenHeader } from "./authenticated-screen-header";

interface CustomerInformationScreenProps {
  onBack: () => void;
  onShowSuccess: (title: string, message: string) => void;
}

export function CustomerInformationScreen({
  onBack,
  onShowSuccess,
}: CustomerInformationScreenProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [query, setQuery] = useState("");
  const [customerInForm, setCustomerInForm] = useState<
    Customer | null | undefined
  >(undefined);

  const loadCustomers = useCallback(async (signal?: AbortSignal) => {
    try {
      setCustomers(await getCustomerDetails(signal));
      setLoadError("");
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;
      setLoadError(
        error instanceof Error
          ? error.message
          : "Customer information could not be loaded.",
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void loadCustomers(controller.signal);
    return () => controller.abort();
  }, [loadCustomers]);

  const visibleCustomers = useMemo(() => {
    const search = query.trim().toLowerCase();
    if (!search) return customers;

    return customers.filter((customer) =>
      [
        customer.name,
        customer.number,
        customer.address,
        customer.landmark,
      ].some((value) => value.toLowerCase().includes(search)),
    );
  }, [customers, query]);

  async function saveCustomer(values: CustomerFormValues) {
    if (customerInForm) {
      await updateCustomerDetails(customerInForm.id, values);
    } else {
      await createCustomerDetails(values);
    }

    const customerWasAdded = customerInForm === null;
    setCustomerInForm(undefined);
    await loadCustomers();
    if (customerWasAdded) {
      onShowSuccess(
        "Customer successfully added!",
        "The customer is now available in the customer list.",
      );
    }
  }

  function confirmDelete(customer: Customer) {
    Alert.alert(
      "Delete customer?",
      `Remove ${customer.name} from the current customer list?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteCustomerDetails(customer.id);
              await loadCustomers();
            } catch (error) {
              Alert.alert(
                "Unable to delete customer",
                error instanceof Error
                  ? error.message
                  : "Please try again.",
              );
            }
          },
        },
      ],
    );
  }

  function refreshCustomers() {
    setQuery("");
    setIsRefreshing(true);
    void loadCustomers();
  }

  return (
    <View style={styles.screen}>
      <FlatList
        automaticallyAdjustKeyboardInsets
        data={visibleCustomers}
        keyExtractor={(customer) => customer.id.toString()}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            colors={["#125326"]}
            onRefresh={refreshCustomers}
            refreshing={isRefreshing}
            tintColor="#125326"
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <CustomerScreenHeader
            onAddCustomer={() => setCustomerInForm(null)}
            onBack={onBack}
            onQueryChange={setQuery}
            onRefresh={refreshCustomers}
            query={query}
          />
        }
        renderItem={({ item }) => (
          <CustomerCard
            customer={item}
            onDelete={() => confirmDelete(item)}
            onEdit={() => setCustomerInForm(item)}
          />
        )}
        ListEmptyComponent={
          isLoading ? (
            <ActivityIndicator color="#125326" size="large" style={styles.loader} />
          ) : loadError ? (
            <View style={styles.errorState}>
              <Text style={styles.errorText}>{loadError}</Text>
              <Pressable onPress={refreshCustomers} style={styles.retryButton}>
                <Text style={styles.retryButtonText}>Try again</Text>
              </Pressable>
            </View>
          ) : (
            <Text style={styles.emptyText}>
              {customers.length
                ? `No customers match “${query.trim()}”.`
                : "No customer information is available."}
            </Text>
          )
        }
      />

      {customerInForm !== undefined ? (
        <AddCustomerModal
          customer={customerInForm}
          onCancel={() => setCustomerInForm(undefined)}
          onSave={saveCustomer}
        />
      ) : null}
    </View>
  );
}

function CustomerScreenHeader({
  onAddCustomer,
  onBack,
  onQueryChange,
  onRefresh,
  query,
}: {
  onAddCustomer: () => void;
  onBack: () => void;
  onQueryChange: (query: string) => void;
  onRefresh: () => void;
  query: string;
}) {
  return (
    <>
      <AuthenticatedScreenHeader
        backAccessibilityLabel="Back to More"
        onBack={onBack}
        title="Customer Information"
      />

      <View style={styles.controlsCard}>
        <View style={styles.sectionHeading}>
          <View style={styles.sectionIcon}>
            <Ionicons name="people-outline" size={26} color="#1e6736" />
          </View>
          <View style={styles.sectionHeadingText}>
            <Text style={styles.sectionTitle}>Customers</Text>
            <Text style={styles.sectionDescription}>
              Manage customer information (Name, Number, Address, and
              Landmark).
            </Text>
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={onAddCustomer}
          style={styles.addButton}
        >
          <Ionicons name="add" size={24} color="#ffffff" />
          <Text style={styles.addButtonText}>Add Customer</Text>
        </Pressable>

        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={22} color="#173b24" />
          <TextInput
            accessibilityLabel="Search by name, number, address, or landmark"
            autoCapitalize="none"
            autoCorrect={false}
            onChangeText={onQueryChange}
            placeholder="Search by name, number, address, or landmark..."
            placeholderTextColor="#7a857d"
            returnKeyType="search"
            style={styles.searchInput}
            value={query}
          />
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={onRefresh}
          style={styles.refreshButton}
        >
          <Ionicons name="refresh-outline" size={22} color="#173b24" />
          <Text style={styles.refreshButtonText}>Refresh</Text>
        </Pressable>
      </View>
    </>
  );
}

function CustomerCard({
  customer,
  onDelete,
  onEdit,
}: {
  customer: Customer;
  onDelete: () => void;
  onEdit: () => void;
}) {
  return (
    <View style={styles.customerCard}>
      <View style={styles.customerDetails}>
        <CustomerDetail
          icon="person-outline"
          isName
          text={customer.name}
        />
        <CustomerDetail icon="call-outline" text={customer.number} />
        <CustomerDetail icon="location-outline" text={customer.address} />
        <CustomerDetail icon="map-outline" text={customer.landmark} />
      </View>

      <View style={styles.cardActions}>
        <Pressable
          accessibilityLabel={`Edit ${customer.name}`}
          accessibilityRole="button"
          onPress={onEdit}
          style={styles.editButton}
        >
          <Ionicons name="pencil-outline" size={19} color="#173b24" />
        </Pressable>
        <Pressable
          accessibilityLabel={`Delete ${customer.name}`}
          accessibilityRole="button"
          onPress={onDelete}
          style={styles.deleteButton}
        >
          <Ionicons name="trash-outline" size={19} color="#d52f2f" />
        </Pressable>
      </View>
    </View>
  );
}

function CustomerDetail({
  icon,
  isName = false,
  text,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  isName?: boolean;
  text: string;
}) {
  return (
    <View style={styles.detailRow}>
      <Ionicons name={icon} size={19} color="#173b24" />
      <Text style={isName ? styles.customerName : styles.detailText}>
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#f4f6f1" },
  listContent: {
    width: "100%",
    maxWidth: 720,
    alignSelf: "center",
    padding: 16,
    paddingBottom: 36,
  },
  controlsCard: {
    borderWidth: 1,
    borderColor: "#d8e0d6",
    borderRadius: 22,
    backgroundColor: "#ffffff",
    marginTop: 22,
    marginBottom: 8,
    padding: 16,
  },
  sectionHeading: { flexDirection: "row", alignItems: "center", gap: 13 },
  sectionIcon: {
    width: 60,
    height: 60,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 17,
    backgroundColor: "#e5f3e4",
  },
  sectionHeadingText: { flex: 1 },
  sectionTitle: { color: "#142619", fontSize: 21, fontWeight: "900" },
  sectionDescription: {
    color: "#58645c",
    fontSize: 13,
    lineHeight: 19,
    marginTop: 4,
  },
  addButton: {
    height: 54,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderRadius: 13,
    backgroundColor: "#125326",
    marginTop: 18,
  },
  addButtonText: { color: "#ffffff", fontSize: 16, fontWeight: "800" },
  searchBox: {
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: "#cfd8cd",
    borderRadius: 13,
    marginTop: 14,
    paddingHorizontal: 14,
  },
  searchInput: { flex: 1, color: "#18251a", fontSize: 14, paddingVertical: 0 },
  refreshButton: {
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    borderWidth: 1,
    borderColor: "#cfd8cd",
    borderRadius: 13,
    marginTop: 12,
  },
  refreshButtonText: { color: "#173b24", fontSize: 15, fontWeight: "800" },
  customerCard: {
    minHeight: 144,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    borderWidth: 1,
    borderColor: "#dce3da",
    borderRadius: 18,
    backgroundColor: "#ffffff",
    marginTop: 12,
    padding: 16,
  },
  customerDetails: { flex: 1, gap: 10 },
  detailRow: { flexDirection: "row", alignItems: "flex-start", gap: 11 },
  customerName: {
    flex: 1,
    color: "#18251a",
    fontSize: 16,
    fontWeight: "900",
    lineHeight: 21,
  },
  detailText: { flex: 1, color: "#2f3c33", fontSize: 13, lineHeight: 19 },
  cardActions: { flexDirection: "row", gap: 8 },
  editButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#d5ddd3",
    borderRadius: 12,
    backgroundColor: "#f8faf7",
  },
  deleteButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: "#fde7e7",
  },
  emptyText: {
    color: "#748078",
    fontSize: 14,
    fontWeight: "600",
    padding: 40,
    textAlign: "center",
  },
  loader: { margin: 40 },
  errorState: { alignItems: "center", padding: 32 },
  errorText: {
    color: "#a33d22",
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
  },
  retryButton: { marginTop: 14, padding: 8 },
  retryButtonText: {
    color: "#173b24",
    fontSize: 14,
    fontWeight: "800",
    textDecorationLine: "underline",
  },
});
