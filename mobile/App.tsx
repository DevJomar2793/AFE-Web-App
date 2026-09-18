import { Ionicons } from '@expo/vector-icons';
import * as Font from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Platform,
  SafeAreaView,
  StatusBar as NativeStatusBar,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import { AddStockModal, EditItemModal, SuccessModal } from './components/inventory-modals';
import { BottomNavigation } from './components/bottom-navigation';
import { InventoryScreen } from './components/inventory-screen';
import { LoginScreen } from './components/login-screen';
import { RegisterScreen } from './components/register-screen';
import { hasValidSession } from './lib/auth';
import { OverviewScreen } from './components/overview-screen';
import { TransactionScreen } from './components/transaction-screen';
import { ReturnsScreen } from './components/returns-screen';
import type { MobileTab } from './components/bottom-navigation';
import type { InventoryRecord, SuccessNotice } from './types/inventory';

void SplashScreen.preventAutoHideAsync();

export default function App() {
  const [hasNativeSplashHidden, setHasNativeSplashHidden] = useState(false);
  const [isAppReady, setIsAppReady] = useState(false);
  const [isSessionReady, setIsSessionReady] = useState(false);
  const isHidingNativeSplash = useRef(false);
  const [currentScreen, setCurrentScreen] = useState<'login' | 'register' | 'dashboard'>('login');
  const [activeTab, setActiveTab] = useState<MobileTab>('home');
  const [isAddStockModalVisible, setIsAddStockModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryRecord | null>(null);
  const [inventoryRefreshKey, setInventoryRefreshKey] = useState(0);
  const [successNotice, setSuccessNotice] = useState<SuccessNotice | null>(null);

  useEffect(() => {
    if (!hasNativeSplashHidden) return;

    let isMounted = true;

    async function initializeApp() {
      try {
        await Font.loadAsync(Ionicons.font);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Unknown font loading error';
        console.warn(`App fonts could not be loaded: ${message}`);
      } finally {
        if (isMounted) setIsAppReady(true);
      }
    }

    void initializeApp();

    return () => {
      isMounted = false;
    };
  }, [hasNativeSplashHidden]);

  useEffect(() => {
    if (!isAppReady) return;

    let isMounted = true;

    async function restoreSession() {
      try {
        const isSessionValid = await hasValidSession();
        if (!isMounted) return;

        if (isSessionValid) setCurrentScreen('dashboard');
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Unknown session error';
        console.warn(`Unable to restore the mobile session: ${message}`);
      } finally {
        if (isMounted) setIsSessionReady(true);
      }
    }

    void restoreSession();

    return () => {
      isMounted = false;
    };
  }, [isAppReady]);

  async function showCustomLoadingScreen() {
    if (isHidingNativeSplash.current) return;
    isHidingNativeSplash.current = true;

    try {
      await SplashScreen.hideAsync();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown splash screen error';
      console.warn(`Native splash screen could not be hidden: ${message}`);
    } finally {
      setHasNativeSplashHidden(true);
    }
  }

  function completeAddStock(createdItem: InventoryRecord) {
    setIsAddStockModalVisible(false);
    setInventoryRefreshKey((currentKey) => currentKey + 1);
    setSuccessNotice({
      title: 'Item added!',
      message: `${createdItem.item} has been added to your inventory.`,
    });
  }

  function saveItemChanges(updatedItem: InventoryRecord) {
    setInventoryRefreshKey((currentKey) => currentKey + 1);
    setSuccessNotice({
      title: 'Changes saved!',
      message: `${updatedItem.item} details have been updated.`,
    });
    setEditingItem(null);
  }

  function showReturnNotice() {
    setSuccessNotice({
      title: 'Returns',
      message: 'The return feature is not available yet.',
    });
  }

  function showTransactionSuccess(title: string, message: string) {
    setSuccessNotice({ title, message });
  }

  if (!isAppReady || !isSessionReady) {
    return (
      <AppLoadingScreen onLayout={() => void showCustomLoadingScreen()} />
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      {currentScreen === 'login' ? (
        <LoginScreen
          onRegister={() => setCurrentScreen('register')}
          onSignIn={() => setCurrentScreen('dashboard')}
        />
      ) : currentScreen === 'register' ? (
        <RegisterScreen onSignIn={() => setCurrentScreen('login')} />
      ) : (
        <>
          {activeTab === 'home' ? (
            <OverviewScreen onTabChange={setActiveTab} />
          ) : activeTab === 'inventory' ? (
            <InventoryScreen
              onAddItem={() => setIsAddStockModalVisible(true)}
              onEditItem={setEditingItem}
              onReturn={showReturnNotice}
              refreshKey={inventoryRefreshKey}
            />
          ) : activeTab === 'orders' ? (
            <TransactionScreen
              onBack={() => setActiveTab('home')}
              onShowSuccess={showTransactionSuccess}
            />
          ) : (
            <ReturnsScreen
              onShowUnavailableNotice={(featureName) =>
                setSuccessNotice({
                  title: `${featureName} coming soon`,
                  message: 'This feature is not available yet.',
                })
              }
            />
          )}

          <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              © DevJomar · {new Date().getFullYear()} · v1.0.00
            </Text>
          </View>

          {isAddStockModalVisible && (
            <AddStockModal
              onClose={() => setIsAddStockModalVisible(false)}
              onCreated={completeAddStock}
            />
          )}

          {editingItem && (
            <EditItemModal
              item={editingItem}
              onClose={() => setEditingItem(null)}
              onUpdated={saveItemChanges}
            />
          )}

          {successNotice && (
            <SuccessModal
              notice={successNotice}
              onClose={() => setSuccessNotice(null)}
            />
          )}
        </>
      )}
    </SafeAreaView>
  );
}

function AppLoadingScreen({ onLayout }: { onLayout: () => void }) {
  const { width } = useWindowDimensions();
  const logoSize = Math.min(220, Math.max(150, width * 0.52));

  return (
    <View
      accessibilityLabel="Adamos Fresh Eggs is loading"
      accessibilityRole="progressbar"
      onLayout={onLayout}
      style={styles.loadingScreen}
    >
      <StatusBar style="dark" />
      <Image
        accessibilityLabel="Adamos Fresh Eggs logo"
        resizeMode="contain"
        source={require('./assets/splash-icon.png')}
        style={{ width: logoSize, height: logoSize }}
      />
      <ActivityIndicator
        accessibilityLabel="Loading application"
        color="#173B24"
        size="small"
        style={styles.loadingIndicator}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  loadingScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FBFAF3',
    padding: 24,
  },
  loadingIndicator: {
    marginTop: 28,
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#eef2f5',
    paddingTop: Platform.OS === 'android' ? NativeStatusBar.currentHeight : 0,
  },
  footer: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingTop: 8,
    paddingBottom: 2,
  },
  footerText: {
    color: '#758078',
    fontSize: 11,
    fontWeight: '600',
  },
});
