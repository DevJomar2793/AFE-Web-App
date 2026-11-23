import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { login } from "../lib/auth";
import { AppFooter } from "./app-footer";
import { KeyboardAwareScrollView } from "./keyboard-aware-scroll-view";

interface LoginScreenProps {
  onRegister: () => void;
  onSignIn: () => Promise<void>;
}

export function LoginScreen({ onRegister, onSignIn }: LoginScreenProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const { height, width } = useWindowDimensions();
  const useCompactLayout = height < 750 || width < 370;

  async function handleSignIn() {
    if (!email.trim() || !password) {
      setErrorMessage("Enter your email address and password.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      await login(email.trim(), password, rememberMe);
      await onSignIn();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to sign in. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <KeyboardAwareScrollView
        automaticallyAdjustKeyboardInsets
        contentContainerStyle={[
          styles.content,
          useCompactLayout && styles.compactContent,
        ]}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.card, useCompactLayout && styles.compactCard]}>
          <View style={styles.brandSection}>
            <View
              style={[
                styles.logoFrame,
                useCompactLayout && styles.compactLogoFrame,
              ]}
            >
              <Image
                source={require("../assets/splash-icon.png")}
                style={styles.logo}
              />
            </View>
            <Text
              style={[
                styles.brandTitle,
                useCompactLayout && styles.compactBrandTitle,
              ]}
            >
              Adamos Fresh Eggs
            </Text>
            <Text
              style={[
                styles.brandSubtitle,
                useCompactLayout && styles.compactBrandSubtitle,
              ]}
            >
              Inventory workspace
            </Text>
          </View>

          <View
            style={[
              styles.titleSection,
              useCompactLayout && styles.compactTitleSection,
            ]}
          >
            <Text
              style={[styles.title, useCompactLayout && styles.compactTitle]}
            >
              Sign in to your account
            </Text>
            <Text
              style={[
                styles.subtitle,
                useCompactLayout && styles.compactSubtitle,
              ]}
            >
              Access your inventory, sales, and returns
            </Text>
          </View>

          <View
            style={[styles.form, useCompactLayout && styles.compactForm]}
          >
            <View>
              <Text style={styles.label}>Email Address</Text>
              <View
                style={[
                  styles.inputWrapper,
                  useCompactLayout && styles.compactInputWrapper,
                ]}
              >
                <Ionicons name="mail-outline" size={22} color="#4d5a61" />
                <TextInput
                  autoCapitalize="none"
                  autoComplete="email"
                  editable={!isSubmitting}
                  keyboardType="email-address"
                  onChangeText={setEmail}
                  placeholder="you@example.com"
                  placeholderTextColor="#8a96a7"
                  style={styles.input}
                  value={email}
                />
              </View>
            </View>

            <View>
              <Text style={styles.label}>Password</Text>
              <View
                style={[
                  styles.inputWrapper,
                  useCompactLayout && styles.compactInputWrapper,
                ]}
              >
                <Ionicons
                  name="lock-closed-outline"
                  size={22}
                  color="#4d5a61"
                />
                <TextInput
                  autoComplete="password"
                  editable={!isSubmitting}
                  onChangeText={setPassword}
                  placeholder="Enter your password"
                  placeholderTextColor="#8a96a7"
                  secureTextEntry={!isPasswordVisible}
                  style={styles.input}
                  value={password}
                />
                <Pressable
                  accessibilityLabel={
                    isPasswordVisible ? "Hide password" : "Show password"
                  }
                  disabled={isSubmitting}
                  hitSlop={8}
                  onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                >
                  <Ionicons
                    name={isPasswordVisible ? "eye-outline" : "eye-off-outline"}
                    size={22}
                    color="#6b7780"
                  />
                </Pressable>
              </View>
            </View>
          </View>

          <View
            style={[
              styles.loginOptions,
              useCompactLayout && styles.compactLoginOptions,
            ]}
          >
            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{ checked: rememberMe }}
              disabled={isSubmitting}
              onPress={() => setRememberMe(!rememberMe)}
              style={styles.rememberOption}
            >
              <View
                style={[
                  styles.checkbox,
                  rememberMe && styles.checkboxSelected,
                ]}
              >
                {rememberMe ? (
                  <Ionicons name="checkmark" size={15} color="#ffffff" />
                ) : null}
              </View>
              <Text style={styles.rememberText}>Remember Me</Text>
            </Pressable>
            <Text style={styles.forgotPassword}>Forgot password?</Text>
          </View>

          {errorMessage ? (
            <Text style={styles.errorMessage}>{errorMessage}</Text>
          ) : null}

          <Pressable
            accessibilityState={{ busy: isSubmitting }}
            disabled={isSubmitting}
            style={[
              styles.signInButton,
              useCompactLayout && styles.compactSignInButton,
              isSubmitting && styles.disabledButton,
            ]}
            onPress={() => void handleSignIn()}
          >
            {isSubmitting && <ActivityIndicator color="#ffffff" size="small" />}
            <Text style={styles.signInButtonText}>
              {isSubmitting ? "Signing in..." : "Sign In"}
            </Text>
          </Pressable>

          <View
            style={[styles.divider, useCompactLayout && styles.compactDivider]}
          >
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          <Pressable
            disabled={isSubmitting}
            style={[
              styles.registerButton,
              useCompactLayout && styles.compactRegisterButton,
              isSubmitting && styles.disabledButton,
            ]}
            onPress={onRegister}
          >
            <Text style={styles.registerButtonText}>Register</Text>
          </Pressable>

          <AppFooter
            style={[styles.footer, useCompactLayout && styles.compactFooter]}
          />
        </View>
      </KeyboardAwareScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fdfdfc",
  },
  content: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 18,
  },
  card: {
    width: "100%",
    maxWidth: 620,
    alignSelf: "center",
    borderWidth: 2,
    borderColor: "#579266",
    borderRadius: 28,
    backgroundColor: "#ffffff",
    padding: 24,
    shadowColor: "#102819",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.1,
    shadowRadius: 22,
    elevation: 4,
  },
  brandSection: {
    alignItems: "center",
  },
  logoFrame: {
    width: 100,
    height: 100,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#8eb18d",
    borderRadius: 24,
    backgroundColor: "#ffffff",
    padding: 4,
  },
  logo: {
    width: "100%",
    height: "100%",
    borderRadius: 19,
  },
  brandTitle: {
    marginTop: 12,
    color: "#062f1c",
    fontSize: 26,
    fontWeight: "900",
    textAlign: "center",
  },
  brandSubtitle: {
    marginTop: 3,
    color: "#68727a",
    fontSize: 17,
    textAlign: "center",
  },
  titleSection: {
    marginTop: 28,
  },
  title: {
    color: "#062f1c",
    fontSize: 25,
    fontWeight: "900",
    textAlign: "center",
  },
  subtitle: {
    marginTop: 5,
    color: "#68727a",
    fontSize: 16,
    lineHeight: 22,
    textAlign: "center",
  },
  form: {
    marginTop: 28,
    gap: 18,
  },
  label: {
    marginBottom: 8,
    color: "#082d20",
    fontSize: 16,
    fontWeight: "700",
  },
  inputWrapper: {
    height: 58,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 2,
    borderColor: "#d0d6d8",
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  input: {
    flex: 1,
    color: "#213238",
    fontSize: 16,
  },
  forgotPassword: {
    color: "#075d2b",
    fontSize: 15,
    fontWeight: "600",
    textAlign: "right",
  },
  loginOptions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 15,
  },
  rememberOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#579266",
    borderRadius: 5,
    backgroundColor: "#ffffff",
  },
  checkboxSelected: {
    borderColor: "#075c2d",
    backgroundColor: "#075c2d",
  },
  rememberText: {
    color: "#213238",
    fontSize: 15,
    fontWeight: "600",
  },
  signInButton: {
    height: 58,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginTop: 20,
    borderRadius: 12,
    backgroundColor: "#075c2d",
  },
  signInButtonText: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "900",
  },
  disabledButton: {
    opacity: 0.6,
  },
  errorMessage: {
    marginTop: 16,
    borderRadius: 10,
    backgroundColor: "#fdf0f0",
    color: "#9b3f3f",
    fontSize: 14,
    fontWeight: "600",
    padding: 12,
    textAlign: "center",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginTop: 24,
  },
  dividerLine: {
    height: 1,
    flex: 1,
    backgroundColor: "#cfd5d7",
  },
  dividerText: {
    color: "#68727a",
    fontSize: 15,
  },
  registerButton: {
    height: 54,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 18,
    borderWidth: 2,
    borderColor: "#075c2d",
    borderRadius: 12,
  },
  registerButtonText: {
    color: "#075c2d",
    fontSize: 18,
    fontWeight: "900",
  },
  footer: {
    marginTop: 26,
    color: "#647078",
    fontSize: 12,
    textAlign: "center",
  },
  compactContent: {
    padding: 10,
  },
  compactCard: {
    borderRadius: 22,
    padding: 12,
  },
  compactLogoFrame: {
    width: 58,
    height: 58,
    borderRadius: 15,
  },
  compactBrandTitle: {
    marginTop: 6,
    fontSize: 20,
  },
  compactBrandSubtitle: {
    fontSize: 14,
  },
  compactTitleSection: {
    marginTop: 12,
  },
  compactTitle: {
    fontSize: 22,
  },
  compactSubtitle: {
    marginTop: 2,
    fontSize: 14,
    lineHeight: 18,
  },
  compactForm: {
    marginTop: 14,
    gap: 12,
  },
  compactInputWrapper: {
    height: 50,
  },
  compactLoginOptions: {
    marginTop: 10,
  },
  compactSignInButton: {
    height: 50,
    marginTop: 12,
  },
  compactDivider: {
    marginTop: 14,
  },
  compactRegisterButton: {
    height: 48,
    marginTop: 12,
  },
  compactFooter: {
    marginTop: 14,
  },
});
