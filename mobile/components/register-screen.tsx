import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  Alert,
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

interface RegisterScreenProps {
  onSignIn: () => void;
}

export function RegisterScreen({ onSignIn }: RegisterScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  function showRegistrationSuccess() {
    Alert.alert(
      'Account created',
      'Your account has been created successfully.',
      [{ text: 'Go to Sign In', onPress: onSignIn }],
    );
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
          </View>

          <View style={styles.titleSection}>
            <Text style={styles.title}>Create your account</Text>
            <Text style={styles.subtitle}>
              Register to access the inventory workspace.
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
                  autoComplete="new-password"
                  onChangeText={setPassword}
                  placeholder="At least 5 characters"
                  placeholderTextColor="#8a96a7"
                  secureTextEntry={!isPasswordVisible}
                  style={styles.input}
                  value={password}
                />
                <Pressable
                  accessibilityLabel={isPasswordVisible ? 'Hide password' : 'Show password'}
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

          <Pressable style={styles.registerButton} onPress={showRegistrationSuccess}>
            <Text style={styles.registerButtonText}>Register</Text>
          </Pressable>

          <View style={styles.signInRow}>
            <Text style={styles.signInPrompt}>Already have an account? </Text>
            <Pressable onPress={onSignIn}>
              <Text style={styles.signInLink}>Sign in</Text>
            </Pressable>
          </View>

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
    width: 84,
    height: 84,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#8eb18d',
    borderRadius: 21,
    backgroundColor: '#ffffff',
    padding: 4,
  },
  logo: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
  },
  brandTitle: {
    marginTop: 10,
    color: '#062f1c',
    fontSize: 23,
    fontWeight: '900',
    textAlign: 'center',
  },
  titleSection: {
    marginTop: 26,
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
  registerButton: {
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    borderRadius: 12,
    backgroundColor: '#075c2d',
  },
  registerButtonText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '900',
  },
  signInRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  signInPrompt: {
    color: '#647078',
    fontSize: 14,
  },
  signInLink: {
    color: '#075c2d',
    fontSize: 14,
    fontWeight: '800',
  },
  footer: {
    marginTop: 26,
    color: '#647078',
    fontSize: 12,
    textAlign: 'center',
  },
});
