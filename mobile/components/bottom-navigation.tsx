import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

export type MobileTab = "home" | "inventory" | "orders" | "returns";

interface BottomNavigationProps {
  activeTab: MobileTab;
  onTabChange: (tab: MobileTab) => void;
}

type IconName = keyof typeof Ionicons.glyphMap;

interface NavigationItemProps {
  icon: IconName;
  label: string;
  isActive?: boolean;
  onPress?: () => void;
}

function NavigationItem({
  icon,
  label,
  isActive = false,
  onPress,
}: NavigationItemProps) {
  const color = isActive ? "#2f8c48" : "#7c8996";

  return (
    <Pressable
      accessibilityRole={onPress ? "button" : undefined}
      accessibilityState={{ selected: isActive }}
      disabled={onPress === undefined}
      onPress={onPress}
      style={styles.navigationItem}
    >
      <View style={isActive ? styles.activeIcon : undefined}>
        <Ionicons name={icon} size={27} color={color} />
      </View>
      <Text style={[styles.navigationLabel, { color }]}>{label}</Text>
    </Pressable>
  );
}

export function BottomNavigation({
  activeTab,
  onTabChange,
}: BottomNavigationProps) {
  return (
    <View style={styles.navigation}>
      <NavigationItem
        icon="home-outline"
        label="Home"
        isActive={activeTab === "home"}
        onPress={() => onTabChange("home")}
      />
      <NavigationItem
        icon="cube-outline"
        label="Inventory"
        isActive={activeTab === "inventory"}
        onPress={() => onTabChange("inventory")}
      />
      <NavigationItem
        icon="receipt-outline"
        label="Orders"
        isActive={activeTab === "orders"}
        onPress={() => onTabChange("orders")}
      />
      <NavigationItem
        icon="bar-chart-outline"
        label="Return"
        isActive={activeTab === "returns"}
        onPress={() => onTabChange("returns")}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  navigation: {
    minHeight: 78,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    borderTopWidth: 1,
    borderTopColor: "#e4e9e5",
    backgroundColor: "#ffffff",
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 10,
  },
  navigationItem: { flex: 1, alignItems: "center", gap: 3 },
  activeIcon: {
    borderRadius: 12,
    backgroundColor: "#eaf7eb",
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  navigationLabel: { fontSize: 11 },
});
