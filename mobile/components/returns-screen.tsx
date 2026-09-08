import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { productReturns } from '../data/returns';
import type { ProductReturn } from '../types/returns';

interface ReturnsScreenProps {
  onShowUnavailableNotice: (featureName: string) => void;
}

function ReturnCard({ record, onPress }: { record: ProductReturn; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`View return for ${record.itemName}`}
      onPress={onPress}
      style={styles.returnCard}
    >
      <View style={styles.cardTitleRow}>
        <Text style={styles.itemName}>{record.itemName}</Text>
        <Ionicons name="chevron-forward" size={28} color="#657082" />
      </View>

      <View style={styles.detailsRow}>
        <View style={styles.quantityColumn}>
          <Text style={styles.fieldLabel}>Quantity</Text>
          <Text style={styles.quantity}>{record.quantity}</Text>
        </View>
        <View style={styles.customerColumn}>
          <Text style={styles.fieldLabel}>Customer</Text>
          <Text style={styles.fieldValue}>{record.customerName}</Text>
        </View>
        <View style={styles.reasonColumn}>
          <Text style={styles.fieldLabel}>Reason</Text>
          <Text style={styles.fieldValue} numberOfLines={2}>{record.reason}</Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.timeRow}>
        <View style={styles.timeColumn}>
          <Text style={styles.fieldLabel}>Created at</Text>
          <Text style={styles.timeValue}>{record.createdAt}</Text>
        </View>
        <View style={styles.timeColumn}>
          <Text style={styles.fieldLabel}>Updated at</Text>
          <Text style={styles.timeValue}>{record.updatedAt}</Text>
        </View>
      </View>
    </Pressable>
  );
}

export function ReturnsScreen({ onShowUnavailableNotice }: ReturnsScreenProps) {
  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.title}>Product returns</Text>
            <Text style={styles.subtitle}>Return records stored in the database.</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Return item"
            onPress={() => onShowUnavailableNotice('Returning items')}
            style={styles.returnButton}
          >
            <Ionicons name="return-up-back-outline" size={25} color="#ffffff" />
            <Text style={styles.returnButtonText}>Return item</Text>
          </Pressable>
        </View>

        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={27} color="#516078" />
          <Text style={styles.searchPlaceholder}>Search item, customer...</Text>
        </View>

        <View style={styles.recordsList}>
          {productReturns.map((record) => (
            <ReturnCard
              key={record.id}
              record={record}
              onPress={() => onShowUnavailableNotice('Return details')}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, width: '100%', maxWidth: 520, alignSelf: 'center', backgroundColor: '#f8faf8' },
  content: { padding: 20, paddingTop: 18, paddingBottom: 28 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  headerText: { flex: 1, minWidth: 0, gap: 4 },
  title: { color: '#121a15', fontSize: 28, fontWeight: '700' },
  subtitle: { color: '#74808a', fontSize: 16 },
  returnButton: { width: 142, height: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, borderRadius: 15, backgroundColor: '#173f28' },
  returnButtonText: { color: '#ffffff', fontSize: 15, fontWeight: '700' },
  searchBox: { height: 66, flexDirection: 'row', alignItems: 'center', gap: 13, borderWidth: 1, borderColor: '#d5deda', borderRadius: 16, backgroundColor: '#ffffff', marginTop: 28, paddingHorizontal: 20 },
  searchPlaceholder: { color: '#74808a', fontSize: 17 },
  recordsList: { gap: 20, marginTop: 30 },
  returnCard: { borderWidth: 1, borderColor: '#dce3dd', borderRadius: 18, backgroundColor: '#ffffff', padding: 18 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  itemName: { flex: 1, color: '#121a15', fontSize: 22, fontWeight: '700' },
  detailsRow: { flexDirection: 'row', gap: 12, marginTop: 20 },
  quantityColumn: { width: 76 },
  customerColumn: { flex: 1 },
  reasonColumn: { flex: 1.35 },
  fieldLabel: { color: '#66748b', fontSize: 14 },
  fieldValue: { color: '#263044', fontSize: 16, lineHeight: 22, marginTop: 7 },
  quantity: { color: '#121a15', fontSize: 25, fontWeight: '700', marginTop: 6 },
  divider: { height: 1, backgroundColor: '#e2e7e3', marginTop: 20 },
  timeRow: { flexDirection: 'row', gap: 14, marginTop: 17 },
  timeColumn: { flex: 1 },
  timeValue: { color: '#536171', fontSize: 14, lineHeight: 20, marginTop: 5 },
});
