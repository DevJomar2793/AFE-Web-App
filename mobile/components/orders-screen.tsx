import { Ionicons } from '@expo/vector-icons';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import { recentSales } from '../data/sales';
import type { SaleActivity } from '../types/sales';

interface OrdersScreenProps {
  onShowUnavailableNotice: (featureName: string) => void;
}

interface SaleRowProps {
  isCompact: boolean;
  sale: SaleActivity;
  onEdit: () => void;
}

function SaleRow({ isCompact, sale, onEdit }: SaleRowProps) {
  return (
    <View style={[styles.saleRow, isCompact && styles.compactSaleRow]}>
      <View style={[styles.saleIcon, isCompact && styles.compactSaleIcon]}>
        <Ionicons
          name="arrow-up-outline"
          size={isCompact ? 27 : 32}
          color="#3c9654"
        />
      </View>

      <View
        style={[styles.saleContent, isCompact && styles.compactSaleContent]}
      >
        <View style={styles.saleDetails}>
          <Text style={styles.saleTitle}>Sale · {sale.itemName}</Text>
          <Text style={styles.customerName}>{sale.customerName}</Text>
        </View>

        <View
          style={[styles.saleAmount, isCompact && styles.compactSaleAmount]}
        >
          <Text style={styles.quantity}>{sale.quantity}</Text>
          <Text style={styles.priceSummary}>{sale.priceSummary}</Text>
          <Text style={styles.dateTime}>{sale.dateTime}</Text>
        </View>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Edit sale for ${sale.itemName}`}
        onPress={onEdit}
        style={[styles.editButton, isCompact && styles.compactEditButton]}
      >
        <Ionicons name="pencil-outline" size={18} color="#1d4c2d" />
        {!isCompact && <Text style={styles.editButtonText}>Edit</Text>}
      </Pressable>
    </View>
  );
}

export function OrdersScreen({ onShowUnavailableNotice }: OrdersScreenProps) {
  const { width } = useWindowDimensions();
  const isCompact = width < 430;

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.title}>Transaction activity</Text>
            <Text style={styles.subtitle}>Sales recorded in the database.</Text>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Filter transactions"
            onPress={() => onShowUnavailableNotice('Filtering')}
            style={styles.filterButton}
          >
            <Ionicons name="filter-outline" size={24} color="#1d4c2d" />
            <Text style={styles.filterButtonText}>Filter</Text>
          </Pressable>
        </View>

        <View style={styles.activityCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Recent activity</Text>
            <Text style={styles.cardSubtitle}>Latest sales</Text>
          </View>

          {recentSales.map((sale) => (
            <SaleRow
              isCompact={isCompact}
              key={sale.id}
              sale={sale}
              onEdit={() => onShowUnavailableNotice('Sale editing')}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    backgroundColor: '#f8faf8',
  },
  content: {
    padding: 20,
    paddingTop: 18,
    paddingBottom: 28,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  headerText: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    color: '#121a15',
    fontSize: 28,
    fontWeight: '700',
  },
  subtitle: {
    color: '#74808a',
    fontSize: 16,
    marginTop: 4,
  },
  filterButton: {
    minWidth: 112,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#dce3dd',
    borderRadius: 14,
    backgroundColor: '#ffffff',
    paddingHorizontal: 22,
  },
  filterButtonText: {
    color: '#1d4c2d',
    fontSize: 17,
    fontWeight: '700',
  },
  activityCard: {
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#dce3dd',
    borderRadius: 18,
    backgroundColor: '#ffffff',
    marginTop: 30,
  },
  cardHeader: {
    borderBottomWidth: 1,
    borderBottomColor: '#e8ece8',
    padding: 20,
  },
  cardTitle: {
    color: '#121a15',
    fontSize: 24,
    fontWeight: '700',
  },
  cardSubtitle: {
    color: '#74808a',
    fontSize: 17,
    marginTop: 6,
  },
  saleRow: {
    minHeight: 122,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e8ece8',
    paddingHorizontal: 18,
    paddingVertical: 18,
  },
  compactSaleRow: {
    alignItems: 'flex-start',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 15,
  },
  saleIcon: {
    width: 54,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: '#eef7ee',
  },
  compactSaleIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
  },
  saleContent: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  compactSaleContent: {
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: 8,
  },
  saleDetails: {
    flex: 1,
    minWidth: 0,
  },
  saleTitle: {
    color: '#121a15',
    fontSize: 16,
    fontWeight: '700',
  },
  customerName: {
    color: '#74808a',
    fontSize: 15,
    marginTop: 5,
  },
  saleAmount: {
    alignItems: 'flex-end',
  },
  compactSaleAmount: {
    alignItems: 'flex-start',
  },
  quantity: {
    color: '#121a15',
    fontSize: 16,
    fontWeight: '700',
  },
  priceSummary: {
    color: '#6e7a84',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 5,
  },
  dateTime: {
    color: '#74808a',
    fontSize: 12,
    marginTop: 5,
  },
  editButton: {
    width: 68,
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: '#cfd9d0',
    borderRadius: 11,
    backgroundColor: '#ffffff',
  },
  compactEditButton: {
    width: 44,
    minHeight: 40,
  },
  editButtonText: {
    color: '#1d4c2d',
    fontSize: 13,
    fontWeight: '700',
  },
});
