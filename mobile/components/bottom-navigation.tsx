import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

export type MobileTab =
  | "home"
  | "inventory"
  | "transactions"
  | "returns"
  | "more";

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
  const color = isActive ? "#125326" : "#748078";

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
      <Text numberOfLines={1} style={[styles.navigationLabel, { color }]}>
        {label}
      </Text>
    </Pressable>
  );
}

export function BottomNavigation({
  activeTab,
  onTabChange,
}: BottomNavigationProps) {
  return (
    <View style={styles.navigation}>
      <View style={styles.navigationContent}>
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
          label="Transactions"
          isActive={activeTab === "transactions"}
          onPress={() => onTabChange("transactions")}
        />
        <NavigationItem
          icon="bar-chart-outline"
          label="Returns"
          isActive={activeTab === "returns"}
          onPress={() => onTabChange("returns")}
        />
        <NavigationItem
          icon="ellipsis-horizontal-circle-outline"
          label="More"
          isActive={activeTab === "more"}
          onPress={() => onTabChange("more")}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  navigation: {
    minHeight: 76,
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#dce3da",
    backgroundColor: "#ffffff",
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 10,
  },
  navigationContent: {
    width: "100%",
    maxWidth: 720,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
  },
  navigationItem: {
    minHeight: 54,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
  },
  activeIcon: {
    borderRadius: 12,
    backgroundColor: "#e5f3e4",
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  navigationLabel: { fontSize: 10, fontWeight: "700" },
});
