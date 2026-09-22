import Constants from "expo-constants";
import { StyleSheet, Text, type StyleProp, type TextStyle } from "react-native";

interface AppFooterProps {
  style?: StyleProp<TextStyle>;
}

const fallbackVersion = "2.0.00";

export function AppFooter({ style }: AppFooterProps) {
  const version = Constants.expoConfig?.version ?? fallbackVersion;
  const currentYear = new Date().getFullYear();

  return (
    <Text style={[styles.footerText, style]}>
      © {currentYear} Adamos Fresh Eggs. Built by DevJomar · v{version}
    </Text>
  );
}

const styles = StyleSheet.create({
  footerText: {
    color: "#758078",
    fontSize: 11,
    fontWeight: "600",
    textAlign: "center",
  },
});
