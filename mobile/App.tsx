import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
  Platform,
  SafeAreaView,
  StatusBar as NativeStatusBar,
  StyleSheet,
} from 'react-native';

import { AddStockModal, EditItemModal, SuccessModal } from './components/inventory-modals';
import { InventoryScreen } from './components/inventory-screen';
import type { InventoryItem, SuccessNotice } from './types/inventory';

export default function App() {
  const [isAddStockModalVisible, setIsAddStockModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [successNotice, setSuccessNotice] = useState<SuccessNotice | null>(null);

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

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <InventoryScreen
        onAddItem={() => setIsAddStockModalVisible(true)}
        onEditItem={setEditingItem}
        onReturn={showReturnNotice}
      />

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

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#eef2f5',
    paddingTop: Platform.OS === 'android' ? NativeStatusBar.currentHeight : 0,
  },
});
