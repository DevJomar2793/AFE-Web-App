import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { login } from '../lib/auth';

interface LoginScreenProps {
  onRegister: () => void;
  onSignIn: () => void;
}

export function LoginScreen({ onRegister, onSignIn }: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  async function handleSignIn() {
    if (!email.trim() || !password) {
      setErrorMessage('Enter your email address and password.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      await login(email.trim(), password);
      onSignIn();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Unable to sign in. Please try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <View style={styles.brandSection}>
            <View style={styles.logoFrame}>
              <Image
                source={require('../assets/splash-icon.png')}
                style={styles.logo}
              />
            </View>
            <Text style={styles.brandTitle}>Adamos Fresh Eggs</Text>
            <Text style={styles.brandSubtitle}>Inventory workspace</Text>
          </View>

          <View style={styles.titleSection}>
            <Text style={styles.title}>Sign in to your account</Text>
            <Text style={styles.subtitle}>
              Access your inventory, sales, and returns
            </Text>
          </View>

          <View style={styles.form}>
            <View>
              <Text style={styles.label}>Email Address</Text>
              <View style={styles.inputWrapper}>
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
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={22} color="#4d5a61" />
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
                  accessibilityLabel={isPasswordVisible ? 'Hide password' : 'Show password'}
                  disabled={isSubmitting}
                  hitSlop={8}
                  onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                >
                  <Ionicons
                    name={isPasswordVisible ? 'eye-outline' : 'eye-off-outline'}
                    size={22}
                    color="#6b7780"
                  />
                </Pressable>
              </View>
            </View>
          </View>

          <Text style={styles.forgotPassword}>Forgot password?</Text>

          {errorMessage ? <Text style={styles.errorMessage}>{errorMessage}</Text> : null}

          <Pressable
            accessibilityState={{ busy: isSubmitting }}
            disabled={isSubmitting}
            style={[styles.signInButton, isSubmitting && styles.disabledButton]}
            onPress={() => void handleSignIn()}
          >
            {isSubmitting && <ActivityIndicator color="#ffffff" size="small" />}
            <Text style={styles.signInButtonText}>{isSubmitting ? 'Signing in...' : 'Sign In'}</Text>
          </Pressable>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          <Pressable
            disabled={isSubmitting}
            style={[styles.registerButton, isSubmitting && styles.disabledButton]}
            onPress={onRegister}
          >
            <Text style={styles.registerButtonText}>Register</Text>
          </Pressable>

          <Text style={styles.footer}>© 2026 Adamos Fresh Eggs. Built by DevJomar</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fdfdfc',
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 18,
  },
  card: {
    borderWidth: 2,
    borderColor: '#579266',
    borderRadius: 28,
    backgroundColor: '#ffffff',
    padding: 24,
    shadowColor: '#102819',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.1,
    shadowRadius: 22,
    elevation: 4,
  },
  brandSection: {
    alignItems: 'center',
  },
  logoFrame: {
    width: 100,
    height: 100,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#8eb18d',
    borderRadius: 24,
    backgroundColor: '#ffffff',
    padding: 4,
  },
  logo: {
    width: '100%',
    height: '100%',
    borderRadius: 19,
  },
  brandTitle: {
    marginTop: 12,
    color: '#062f1c',
    fontSize: 26,
    fontWeight: '900',
    textAlign: 'center',
  },
  brandSubtitle: {
    marginTop: 3,
    color: '#68727a',
    fontSize: 17,
    textAlign: 'center',
  },
  titleSection: {
    marginTop: 28,
  },
  title: {
    color: '#062f1c',
    fontSize: 25,
    fontWeight: '900',
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 5,
    color: '#68727a',
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'center',
  },
  form: {
    marginTop: 28,
    gap: 18,
  },
  label: {
    marginBottom: 8,
    color: '#082d20',
    fontSize: 16,
    fontWeight: '700',
  },
  inputWrapper: {
    height: 58,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 2,
    borderColor: '#d0d6d8',
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  input: {
    flex: 1,
    color: '#213238',
    fontSize: 16,
  },
  forgotPassword: {
    marginTop: 15,
    color: '#075d2b',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'right',
  },
  signInButton: {
    height: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 20,
    borderRadius: 12,
    backgroundColor: '#075c2d',
  },
  signInButtonText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '900',
  },
  disabledButton: {
    opacity: 0.6,
  },
  errorMessage: {
    marginTop: 16,
    borderRadius: 10,
    backgroundColor: '#fdf0f0',
    color: '#9b3f3f',
    fontSize: 14,
    fontWeight: '600',
    padding: 12,
    textAlign: 'center',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: 24,
  },
  dividerLine: {
    height: 1,
    flex: 1,
    backgroundColor: '#cfd5d7',
  },
  dividerText: {
    color: '#68727a',
    fontSize: 15,
  },
  registerButton: {
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
    borderWidth: 2,
    borderColor: '#075c2d',
    borderRadius: 12,
  },
  registerButtonText: {
    color: '#075c2d',
    fontSize: 18,
    fontWeight: '900',
  },
  footer: {
    marginTop: 26,
    color: '#647078',
    fontSize: 12,
    textAlign: 'center',
  },
});
