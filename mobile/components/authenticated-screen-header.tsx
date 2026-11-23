import { Ionicons } from "@expo/vector-icons";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import { mobileTheme } from "../theme";

interface AuthenticatedScreenHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  backAccessibilityLabel?: string;
}

export function AuthenticatedScreenHeader({
  title,
  subtitle,
  onBack,
  backAccessibilityLabel = "Go back",
}: AuthenticatedScreenHeaderProps) {
  const currentDate = new Date().toLocaleDateString("en-PH", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: "Asia/Manila",
  });

  return (
    <>
      <View style={styles.brandHeader}>
        <View style={styles.logoFrame}>
          <Image
            accessibilityLabel="Adamos Fresh Eggs logo"
            resizeMode="contain"
            source={require("../assets/icon.png")}
            style={styles.logo}
          />
        </View>
        <View style={styles.brandText}>
          <Text numberOfLines={1} style={styles.brandName}>
            Adamos Fresh Eggs
          </Text>
          <Text style={styles.brandSubtitle}>Inventory Workspace</Text>
        </View>
      </View>

      <Text style={styles.dateText}>{currentDate}</Text>
      <Text style={styles.pageTitle}>{title}</Text>
      {subtitle ? <Text style={styles.pageSubtitle}>{subtitle}</Text> : null}
    </>
  );
}

const styles = StyleSheet.create({
  brandHeader: {
    minHeight: 72,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    borderBottomWidth: 1,
    borderBottomColor: "#e1e7e0",
    marginHorizontal: -16,
    marginTop: -16,
    marginBottom: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: mobileTheme.colors.surface,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: mobileTheme.colors.border,
    borderRadius: 12,
    backgroundColor: mobileTheme.colors.surface,
  },
  logoFrame: {
    width: 50,
    height: 50,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: mobileTheme.colors.border,
    borderRadius: 13,
    backgroundColor: "#fbfaf3",
  },
  logo: { width: "100%", height: "100%" },
  brandText: { flex: 1, minWidth: 0 },
  brandName: {
    color: "#123a20",
    fontSize: 17,
    fontWeight: "800",
  },
  brandSubtitle: {
    color: "#66736c",
    fontSize: 12,
    marginTop: 2,
  },
  dateText: {
    color: "#59655d",
    fontSize: 14,
    fontWeight: "700",
  },
  pageTitle: {
    color: mobileTheme.colors.text,
    fontSize: 28,
    fontWeight: "900",
    marginTop: 4,
  },
  pageSubtitle: {
    color: mobileTheme.colors.mutedText,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 5,
  },
});
