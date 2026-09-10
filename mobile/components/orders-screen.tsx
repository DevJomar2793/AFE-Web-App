import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';

import { recentSales } from '../data/sales';
import type { SaleActivity } from '../types/sales';

interface OrdersScreenProps {
  onBack: () => void;
  onShowUnavailableNotice: (featureName: string) => void;
}

interface SaleRowProps {
  sale: SaleActivity;
  onPress: () => void;
}

interface DateCard {
  dateKey: string;
  day: string;
  date: string;
  saleCount: number;
}

type DateRange = 'daily' | 'weekly';

const currency = new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
  maximumFractionDigits: 0,
});

function SaleRow({ sale, onPress }: SaleRowProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open sale for ${sale.itemName}`}
      onPress={onPress}
      style={styles.saleRow}
    >
      <View style={styles.saleIcon}>
        <Ionicons name="arrow-up-outline" size={23} color="#238244" />
      </View>

      <View style={styles.saleDetails}>
        <Text numberOfLines={1} style={styles.saleTitle}>
          Sale · {sale.itemName}
        </Text>
        <Text numberOfLines={1} style={styles.customerName}>
          {sale.customerName}
        </Text>
      </View>

      <View style={styles.saleAmount}>
        <Text style={styles.quantity}>{sale.quantity}</Text>
        <Text numberOfLines={1} style={styles.priceSummary}>
          {sale.priceSummary}
        </Text>
        <Text style={styles.dateTime}>{sale.dateTime}</Text>
      </View>

      <Ionicons name="chevron-forward" size={21} color="#15271b" />
    </Pressable>
  );
}

export function OrdersScreen({
  onBack,
  onShowUnavailableNotice,
}: OrdersScreenProps) {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const today = new Date();
  const todayKey = getDateKey(today);
  const dateCardWidth = Math.max(
    43,
    Math.min(57, (Math.min(width, 520) - 90) / 7),
  );
  const [dateRange, setDateRange] = useState<DateRange>('weekly');
  const [rangeEndDate, setRangeEndDate] = useState(todayKey);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  const dateCards = useMemo(
    () => buildDateCards(rangeEndDate),
    [rangeEndDate],
  );
  const weekDateKeys = new Set(dateCards.map((card) => card.dateKey));
  const normalizedQuery = query.trim().toLowerCase();
  const displayedSales = recentSales.filter((sale) => {
    const saleDateKey = getDateKey(new Date(sale.createdAt));
    const matchesDate =
      dateRange === 'daily'
        ? selectedDate !== null && saleDateKey === selectedDate
        : weekDateKeys.has(saleDateKey);
    const matchesQuery =
      !normalizedQuery ||
      sale.itemName.toLowerCase().includes(normalizedQuery) ||
      sale.customerName.toLowerCase().includes(normalizedQuery);

    return matchesDate && matchesQuery;
  });
  const selectedDateValue = selectedDate ? dateFromKey(selectedDate) : null;
  const totalSales = displayedSales.reduce(
    (total, sale) => total + sale.total,
    0,
  );

  function moveWeek(numberOfDays: number) {
    setRangeEndDate((currentDate) => shiftDateKey(currentDate, numberOfDays));
    setSelectedDate(null);
  }

  function selectDate(dateKey: string) {
    setSelectedDate(dateKey);
    setDateRange('daily');
  }

  return (
    <View style={[styles.screen, isTablet && styles.tabletScreen]}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          isTablet && styles.tabletContent,
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back to overview"
          onPress={onBack}
          hitSlop={12}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={27} color="#111b14" />
        </Pressable>

        <Text style={styles.currentDate}>
          {today.toLocaleDateString('en-PH', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
          })}
        </Text>
        <Text style={styles.title}>Transaction activity</Text>
        <Text style={styles.subtitle}>Sales recorded in the database.</Text>

        <View style={styles.rangeToggle}>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: dateRange === 'daily' }}
            onPress={() => setDateRange('daily')}
            style={[
              styles.rangeButton,
              dateRange === 'daily' && styles.activeRangeButton,
            ]}
          >
            <Text
              style={[
                styles.rangeButtonText,
                dateRange === 'daily' && styles.activeRangeButtonText,
              ]}
            >
              Daily
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: dateRange === 'weekly' }}
            onPress={() => setDateRange('weekly')}
            style={[
              styles.rangeButton,
              dateRange === 'weekly' && styles.activeRangeButton,
            ]}
          >
            <Ionicons
              name="stats-chart"
              size={18}
              color={dateRange === 'weekly' ? '#ffffff' : '#173b24'}
            />
            <Text
              style={[
                styles.rangeButtonText,
                dateRange === 'weekly' && styles.activeRangeButtonText,
              ]}
            >
              Weekly
            </Text>
          </Pressable>
        </View>

        <View style={styles.dateSection}>
          <View style={styles.dateSectionHeader}>
            <Text style={styles.sectionTitle}>Sales by Date (Last 7 Days)</Text>
            <View style={styles.weekButtons}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Show previous seven days"
                onPress={() => moveWeek(-7)}
                style={styles.weekButton}
              >
                <Ionicons name="arrow-back" size={20} color="#173b24" />
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Show next seven days"
                onPress={() => moveWeek(7)}
                style={styles.weekButton}
              >
                <Ionicons name="arrow-forward" size={20} color="#173b24" />
              </Pressable>
            </View>
          </View>

          <ScrollView
            horizontal
            contentContainerStyle={styles.dateCards}
            showsHorizontalScrollIndicator={false}
          >
            {dateCards.map((card) => {
              const isSelected = selectedDate === card.dateKey;
              const isToday = todayKey === card.dateKey;

              return (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`${card.date}, ${card.saleCount} sales${isToday ? ', today' : ''}`}
                  accessibilityState={{ selected: isSelected }}
                  key={card.dateKey}
                  onPress={() => selectDate(card.dateKey)}
                  style={[
                    styles.dateCard,
                    { width: dateCardWidth },
                    isToday && styles.todayCard,
                    isSelected && styles.selectedDateCard,
                  ]}
                >
                  <Text style={styles.dateCardDate}>{card.date}</Text>
                  <Text
                    style={[
                      styles.dateCardDay,
                      (isToday || isSelected) && styles.highlightedDateText,
                    ]}
                  >
                    {card.day}
                  </Text>
                  <Text style={styles.dateCardCount}>{card.saleCount}</Text>
                  <Text style={styles.dateCardSales}>sales</Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <View style={styles.searchBox}>
            <Ionicons name="search-outline" size={25} color="#17281b" />
            <TextInput
              accessibilityLabel="Search sales"
              autoCapitalize="none"
              autoCorrect={false}
              onChangeText={setQuery}
              placeholder="Search sales (product, customer, etc.)"
              placeholderTextColor="#7a837e"
              style={styles.searchInput}
              value={query}
            />
          </View>

          <View style={styles.controlRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Select transaction date"
              onPress={() => onShowUnavailableNotice('Date picker')}
              style={styles.dateButton}
            >
              <Ionicons name="calendar-outline" size={22} color="#173b24" />
              <Text numberOfLines={1} style={styles.dateButtonText}>
                {selectedDateValue
                  ? selectedDateValue.toLocaleDateString('en-PH', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })
                  : 'Select date'}
              </Text>
              <Ionicons name="chevron-down" size={18} color="#173b24" />
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Add sale"
              onPress={() => onShowUnavailableNotice('Add sale')}
              style={styles.addSaleButton}
            >
              <Ionicons name="add" size={27} color="#ffffff" />
              <Text style={styles.addSaleButtonText}>Add sale</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.salesCard}>
          <View style={styles.salesHeader}>
            <View style={styles.salesHeaderText}>
              <Text style={styles.salesTitle}>Sales</Text>
              <Text style={styles.salesSubtitle}>
                {buildSalesSubtitle(
                  displayedSales.length,
                  dateRange,
                  selectedDateValue,
                  dateCards,
                )}
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Sort sales"
              onPress={() => onShowUnavailableNotice('Sales sorting')}
              style={styles.sortButton}
            >
              <Ionicons name="options-outline" size={18} color="#173b24" />
              <Text style={styles.sortButtonText}>Latest first</Text>
              <Ionicons name="chevron-down" size={16} color="#173b24" />
            </Pressable>
          </View>

          {displayedSales.length ? (
            displayedSales.map((sale) => (
              <SaleRow
                key={sale.id}
                sale={sale}
                onPress={() => onShowUnavailableNotice('Sale editing')}
              />
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                {dateRange === 'daily' && selectedDate === null
                  ? 'Select a date card to view its sales.'
                  : 'No sales found for this date range.'}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.totalCard}>
          <View style={styles.totalIcon}>
            <Ionicons name="stats-chart" size={25} color="#19753a" />
          </View>
          <View style={styles.totalDetails}>
            <Text style={styles.totalLabel}>
              {selectedDateValue
                ? `Total for ${selectedDateValue.toLocaleDateString('en-PH', {
                    month: 'short',
                    day: 'numeric',
                  })}`
                : 'Total for displayed week'}
            </Text>
            <Text style={styles.totalValue}>{currency.format(totalSales)}</Text>
          </View>
          <Text style={styles.totalCount}>
            {displayedSales.length}{' '}
            {displayedSales.length === 1 ? 'sale' : 'sales'}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

function buildDateCards(rangeEndDate: string): DateCard[] {
  const endDate = dateFromKey(rangeEndDate);

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(endDate);
    date.setDate(endDate.getDate() - index);
    const dateKey = getDateKey(date);

    return {
      dateKey,
      day: date.toLocaleDateString('en-PH', { weekday: 'short' }),
      date: date.toLocaleDateString('en-PH', {
        month: 'short',
        day: 'numeric',
      }),
      saleCount: recentSales.filter(
        (sale) => getDateKey(new Date(sale.createdAt)) === dateKey,
      ).length,
    };
  });
}

function buildSalesSubtitle(
  saleCount: number,
  dateRange: DateRange,
  selectedDate: Date | null,
  dateCards: DateCard[],
) {
  const saleLabel = saleCount === 1 ? 'sale' : 'sales';

  if (dateRange === 'daily') {
    if (!selectedDate) return 'Select a date to view daily sales';
    return `${saleCount} ${saleLabel} on ${selectedDate.toLocaleDateString('en-PH', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })}`;
  }

  const oldestDate = dateCards[dateCards.length - 1].date;
  const latestDate = dateCards[0].date;
  return `${saleCount} ${saleLabel} from ${oldestDate} to ${latestDate}`;
}

function shiftDateKey(dateKey: string, numberOfDays: number) {
  const date = dateFromKey(dateKey);
  date.setDate(date.getDate() + numberOfDays);
  return getDateKey(date);
}

function dateFromKey(dateKey: string) {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(year, month - 1, day, 12);
}

function getDateKey(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    backgroundColor: '#f8faf7',
  },
  tabletScreen: { maxWidth: 820 },
  content: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 36 },
  tabletContent: { paddingHorizontal: 28, paddingTop: 22 },
  backButton: {
    width: 38,
    height: 38,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  currentDate: {
    color: '#69746d',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 5,
  },
  title: {
    color: '#101813',
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 34,
    marginTop: 3,
  },
  subtitle: { color: '#66716a', fontSize: 16, marginTop: 5 },
  rangeToggle: { flexDirection: 'row', gap: 4, marginTop: 17 },
  rangeButton: {
    flex: 1,
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    borderWidth: 1,
    borderColor: '#d4ddd5',
    borderRadius: 13,
    backgroundColor: '#ffffff',
  },
  activeRangeButton: { borderColor: '#144d29', backgroundColor: '#144d29' },
  rangeButtonText: { color: '#17281b', fontSize: 16, fontWeight: '700' },
  activeRangeButtonText: { color: '#ffffff' },
  dateSection: {
    borderWidth: 1,
    borderColor: '#e5eae5',
    borderRadius: 18,
    backgroundColor: '#ffffff',
    marginTop: 18,
    padding: 14,
  },
  dateSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  sectionTitle: {
    flex: 1,
    color: '#111a14',
    fontSize: 18,
    fontWeight: '800',
  },
  weekButtons: { flexDirection: 'row', gap: 10 },
  weekButton: {
    width: 43,
    height: 43,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#dde4dd',
    borderRadius: 22,
    backgroundColor: '#ffffff',
  },
  dateCards: { gap: 5, paddingTop: 14, paddingBottom: 2 },
  dateCard: {
    width: 57,
    minHeight: 112,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e1e7e1',
    borderRadius: 11,
    backgroundColor: '#fbfcfb',
    paddingHorizontal: 3,
    paddingVertical: 8,
  },
  todayCard: { borderColor: '#8fbd9a', backgroundColor: '#f0f8ee' },
  selectedDateCard: { borderColor: '#3c9855', backgroundColor: '#e9f6e7' },
  dateCardDate: { color: '#152019', fontSize: 13, fontWeight: '700' },
  dateCardDay: { color: '#6f7872', fontSize: 13, marginTop: 9 },
  highlightedDateText: { color: '#26723e' },
  dateCardCount: {
    color: '#111a14',
    fontSize: 18,
    fontWeight: '800',
    marginTop: 7,
  },
  dateCardSales: { color: '#3f4943', fontSize: 13, marginTop: 1 },
  searchBox: {
    height: 58,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#dce3dd',
    borderRadius: 14,
    backgroundColor: '#f8faf8',
    marginTop: 22,
    paddingHorizontal: 15,
  },
  searchInput: { flex: 1, color: '#18231c', fontSize: 15 },
  controlRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  dateButton: {
    flex: 1.2,
    height: 57,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#d5ddd6',
    borderRadius: 13,
    backgroundColor: '#ffffff',
    paddingHorizontal: 13,
  },
  dateButtonText: {
    flex: 1,
    color: '#121b15',
    fontSize: 14,
    fontWeight: '700',
  },
  addSaleButton: {
    flex: 0.95,
    height: 57,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 13,
    backgroundColor: '#144d29',
  },
  addSaleButtonText: { color: '#ffffff', fontSize: 16, fontWeight: '800' },
  salesCard: {
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e5eae5',
    borderRadius: 18,
    backgroundColor: '#ffffff',
    marginTop: 1,
  },
  salesHeader: {
    minHeight: 82,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e6ebe6',
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  salesHeaderText: { flex: 1, minWidth: 0 },
  salesTitle: { color: '#111a14', fontSize: 20, fontWeight: '800' },
  salesSubtitle: { color: '#737d76', fontSize: 14, marginTop: 5 },
  sortButton: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#d5ddd6',
    borderRadius: 11,
    backgroundColor: '#ffffff',
    paddingHorizontal: 10,
  },
  sortButtonText: { color: '#17281b', fontSize: 13, fontWeight: '700' },
  saleRow: {
    minHeight: 105,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    borderBottomWidth: 1,
    borderBottomColor: '#e8ece8',
    paddingHorizontal: 13,
    paddingVertical: 15,
  },
  saleIcon: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 13,
    backgroundColor: '#eaf6e9',
  },
  saleDetails: { flex: 1, minWidth: 0 },
  saleTitle: { color: '#111a14', fontSize: 15, fontWeight: '800' },
  customerName: { color: '#727c76', fontSize: 14, marginTop: 6 },
  saleAmount: { maxWidth: 130, alignItems: 'flex-end' },
  quantity: { color: '#111a14', fontSize: 16, fontWeight: '800' },
  priceSummary: {
    color: '#69736d',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 5,
  },
  dateTime: { color: '#77817b', fontSize: 12, marginTop: 5 },
  emptyState: {
    minHeight: 140,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyStateText: {
    color: '#707a74',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  totalCard: {
    minHeight: 82,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 14,
    backgroundColor: '#edf6ed',
    marginTop: 14,
    paddingHorizontal: 15,
    paddingVertical: 13,
  },
  totalIcon: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 13,
    backgroundColor: '#dcefdc',
  },
  totalDetails: { flex: 1 },
  totalLabel: { color: '#667069', fontSize: 14 },
  totalValue: {
    color: '#101913',
    fontSize: 23,
    fontWeight: '800',
    marginTop: 2,
  },
  totalCount: { color: '#5f6963', fontSize: 14 },
});
