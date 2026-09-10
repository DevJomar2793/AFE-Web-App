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
  useWindowDimensions,
  View,
} from 'react-native';

import { AddStockModal, EditItemModal, SuccessModal } from './components/inventory-modals';
import { BottomNavigation } from './components/bottom-navigation';
import { InventoryScreen } from './components/inventory-screen';
import { OverviewScreen } from './components/overview-screen';
import { OrdersScreen } from './components/orders-screen';
import { ReturnsScreen } from './components/returns-screen';
import type { MobileTab } from './components/bottom-navigation';
import type { InventoryItem, SuccessNotice } from './types/inventory';

void SplashScreen.preventAutoHideAsync();

export default function App() {
  const [hasNativeSplashHidden, setHasNativeSplashHidden] = useState(false);
  const [isAppReady, setIsAppReady] = useState(false);
  const isHidingNativeSplash = useRef(false);
  const [activeTab, setActiveTab] = useState<MobileTab>('home');
  const [isAddStockModalVisible, setIsAddStockModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
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

  function completeAddStock() {
    setIsAddStockModalVisible(false);
    setSuccessNotice({
      title: 'Stock Added!',
      message: '10 trays of Eggs - Medium\nhas been added to your inventory.',
    });
  }

  function saveItemChanges() {
    if (editingItem === null) {
      return;
    }

    setSuccessNotice({
      title: 'Changes Saved!',
      message: `${editingItem.name} details have been updated.`,
    });
    setEditingItem(null);
  }

  function showReturnNotice() {
    setSuccessNotice({
      title: 'Returns',
      message: 'The return feature is not available yet.',
    });
  }

  function showUnavailableNotice(featureName: string) {
    setSuccessNotice({
      title: `${featureName} coming soon`,
      message: 'This feature is not available yet.',
    });
  }

  if (!isAppReady) {
    return (
      <AppLoadingScreen onLayout={() => void showCustomLoadingScreen()} />
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      {activeTab === 'home' ? (
        <OverviewScreen onTabChange={setActiveTab} />
      ) : activeTab === 'inventory' ? (
        <InventoryScreen
          onAddItem={() => setIsAddStockModalVisible(true)}
          onEditItem={setEditingItem}
          onReturn={showReturnNotice}
        />
      ) : activeTab === 'orders' ? (
        <OrdersScreen
          onBack={() => setActiveTab('home')}
          onShowUnavailableNotice={showUnavailableNotice}
        />
      ) : (
        <ReturnsScreen onShowUnavailableNotice={showUnavailableNotice} />
      )}

      {activeTab !== 'orders' && (
        <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
      )}

      {isAddStockModalVisible && (
        <AddStockModal
          onClose={() => setIsAddStockModalVisible(false)}
          onComplete={completeAddStock}
        />
      )}

      {editingItem && (
        <EditItemModal
          item={editingItem}
          onClose={() => setEditingItem(null)}
          onSave={saveItemChanges}
        />
      )}

      {successNotice && (
        <SuccessModal
          notice={successNotice}
          onClose={() => setSuccessNotice(null)}
        />
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
});
