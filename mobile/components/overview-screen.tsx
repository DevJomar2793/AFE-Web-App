import { Ionicons } from '@expo/vector-icons';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import { inventoryItems } from '../data/inventory';
import { productReturns } from '../data/returns';
import { recentSales } from '../data/sales';
import type { MobileTab } from './bottom-navigation';

interface OverviewScreenProps {
  onTabChange: (tab: MobileTab) => void;
}

interface DashboardMetricProps {
  title: string;
  value: string;
  detail: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBackground: string;
  isTablet: boolean;
}

interface ChartDay {
  dateKey: string;
  label: string;
  total: number;
}

interface RecentActivity {
  id: string;
  type: 'sale' | 'return';
  itemName: string;
  customerName: string;
  quantity: number;
  detail: string;
  createdAt: Date;
}

function getDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function getStockQuantity(stock: string) {
  return Number.parseInt(stock, 10) || 0;
}

function getPrice(price: string) {
  return Number(price.replace(/[^0-9.]/g, '')) || 0;
}

function formatCurrency(amount: number) {
  return `₱${amount.toLocaleString('en-PH', { maximumFractionDigits: 0 })}`;
}

function formatChartValue(amount: number) {
  if (amount === 0) {
    return '—';
  }

  if (amount >= 1000) {
    return `${(amount / 1000).toFixed(1)}K`;
  }

  return amount.toLocaleString('en-PH');
}

function formatActivityDate(date: Date) {
  return date.toLocaleString('en-PH', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function DashboardMetric({
  title,
  value,
  detail,
  icon,
  iconColor,
  iconBackground,
  isTablet,
}: DashboardMetricProps) {
  return (
    <View style={[styles.metricCard, isTablet && styles.tabletMetricCard]}>
      <View style={[styles.metricIcon, { backgroundColor: iconBackground }]}>
        <Ionicons name={icon} size={23} color={iconColor} />
      </View>
      <Text style={styles.metricTitle}>{title}</Text>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricDetail}>{detail}</Text>
    </View>
  );
}

export function OverviewScreen({ onTabChange }: OverviewScreenProps) {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const isWideTablet = width >= 900;
  const today = new Date();
  const todayKey = getDateKey(today);

  const todaysSales = recentSales.filter(
    (sale) => getDateKey(new Date(sale.createdAt)) === todayKey,
  );
  const salesToday = todaysSales.reduce((total, sale) => total + sale.total, 0);

  const todaysReturns = productReturns.filter(
    (productReturn) => getDateKey(new Date(productReturn.createdAtIso)) === todayKey,
  );
  const returnsToday = todaysReturns.reduce(
    (total, productReturn) => total + productReturn.quantity,
    0,
  );

  const unitsOnHand = inventoryItems.reduce(
    (total, item) => total + getStockQuantity(item.stock),
    0,
  );
  const inventoryValue = inventoryItems.reduce(
    (total, item) => total + getStockQuantity(item.stock) * getPrice(item.price),
    0,
  );
  const lowStockItems = inventoryItems.filter((item) => item.isLowStock);

  const chartDays: ChartDay[] = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (6 - index));
    const dateKey = getDateKey(date);
    const total = recentSales
      .filter((sale) => getDateKey(new Date(sale.createdAt)) === dateKey)
      .reduce((dayTotal, sale) => dayTotal + sale.total, 0);

    return {
      dateKey,
      label: date.toLocaleDateString('en-PH', { weekday: 'short' }).toUpperCase(),
      total,
    };
  });
  const highestChartValue = Math.max(...chartDays.map((day) => day.total), 1);

  const saleActivity: RecentActivity[] = recentSales.map((sale) => ({
    id: `sale-${sale.id}`,
    type: 'sale',
    itemName: sale.itemName,
    customerName: sale.customerName,
    quantity: sale.quantityValue,
    detail: formatCurrency(sale.total),
    createdAt: new Date(sale.createdAt),
  }));
  const returnActivity: RecentActivity[] = productReturns.map((productReturn) => ({
    id: `return-${productReturn.id}`,
    type: 'return',
    itemName: productReturn.itemName,
    customerName: productReturn.customerName,
    quantity: productReturn.quantity,
    detail: productReturn.reason,
    createdAt: new Date(productReturn.createdAtIso),
  }));
  const recentActivity = [...saleActivity, ...returnActivity]
    .sort((first, second) => second.createdAt.getTime() - first.createdAt.getTime())
    .slice(0, 5);

  return (
    <View style={[styles.screen, isTablet && styles.tabletScreen]}>
      <ScrollView
        contentContainerStyle={[styles.content, isTablet && styles.tabletContent]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.date}>
          {today.toLocaleDateString('en-PH', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
          })}
        </Text>
        <Text style={styles.title}>Operations overview</Text>

        <View style={styles.metricsGrid}>
          <DashboardMetric
            title="Sales today"
            value={formatCurrency(salesToday)}
            detail={`${todaysSales.length} completed ${todaysSales.length === 1 ? 'sale' : 'sales'}`}
            icon="cash-outline"
            iconColor="#2f8c48"
            iconBackground="#eaf7eb"
            isTablet={isTablet}
          />
          <DashboardMetric
            title="Units on hand"
            value={unitsOnHand.toLocaleString('en-PH')}
            detail={`${inventoryItems.length} inventory items`}
            icon="bag-handle-outline"
            iconColor="#4267c7"
            iconBackground="#eef1ff"
            isTablet={isTablet}
          />
          <DashboardMetric
            title="Returns today"
            value={returnsToday.toLocaleString('en-PH')}
            detail={`${todaysReturns.length} return ${todaysReturns.length === 1 ? 'record' : 'records'}`}
            icon="return-down-back-outline"
            iconColor="#bd5b14"
            iconBackground="#fff1e5"
            isTablet={isTablet}
          />
          <DashboardMetric
            title="Inventory value"
            value={formatCurrency(inventoryValue)}
            detail="Based on regular prices"
            icon="trending-up-outline"
            iconColor="#8c4eb0"
            iconBackground="#f5ebf8"
            isTablet={isTablet}
          />
        </View>

        <View
          style={[
            styles.dashboardPanels,
            isWideTablet && styles.wideDashboardPanels,
          ]}
        >
          <View style={[styles.sectionCard, isWideTablet && styles.tabletPanel]}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>7-day sales</Text>
                <Text style={styles.sectionSubtitle}>Gross sales revenue</Text>
              </View>
              <View style={styles.liveBadge}>
                <Text style={styles.liveText}>Live</Text>
              </View>
            </View>

            <View style={styles.chart}>
              {chartDays.map((day) => {
                const barHeight = day.total === 0
                  ? 0
                  : Math.max(10, Math.round((day.total / highestChartValue) * 100));

                return (
                  <View key={day.dateKey} style={styles.chartColumn}>
                    <Text style={styles.chartValue}>{formatChartValue(day.total)}</Text>
                    <View style={styles.chartTrack}>
                      <View style={[styles.chartBar, { height: `${barHeight}%` }]} />
                    </View>
                    <Text style={styles.chartLabel}>{day.label}</Text>
                  </View>
                );
              })}
            </View>
          </View>

          <View style={[styles.sectionCard, isWideTablet && styles.tabletPanel]}>
            <View style={styles.sectionHeader}>
              <View style={styles.flexText}>
                <Text style={styles.sectionTitle}>Stock attention</Text>
                <Text style={styles.sectionSubtitle}>Low and out-of-stock items</Text>
              </View>
              <View style={[styles.sectionIcon, styles.warningIcon]}>
                <Ionicons name="warning-outline" size={24} color="#bd5b14" />
              </View>
            </View>

            <View style={styles.stockList}>
              {lowStockItems.map((item) => (
                <View key={item.id} style={styles.stockRow}>
                  <View style={styles.stockQuantity}>
                    <Text style={styles.stockQuantityText}>{getStockQuantity(item.stock)}</Text>
                  </View>
                  <View style={styles.flexText}>
                    <Text style={styles.stockName}>{item.name}</Text>
                    <Text style={styles.stockStatus}>{item.stockLabel}</Text>
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Manage ${item.name}`}
                    onPress={() => onTabChange('inventory')}
                    hitSlop={8}
                  >
                    <Text style={styles.manageText}>Manage</Text>
                  </Pressable>
                </View>
              ))}
            </View>
          </View>
        </View>

        <View style={[styles.sectionCard, styles.activityCard]}>
          <View style={styles.sectionHeader}>
            <View style={styles.flexText}>
              <Text style={styles.sectionTitle}>Recent database activity</Text>
              <Text style={styles.sectionSubtitle}>Latest sales and returns</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="View sales"
              onPress={() => onTabChange('orders')}
              hitSlop={8}
            >
              <Text style={styles.viewSalesText}>View sales</Text>
            </Pressable>
          </View>

          {recentActivity.map((activity) => {
            const isSale = activity.type === 'sale';

            return (
              <View key={activity.id} style={styles.activityRow}>
                <View
                  style={[
                    styles.activityIcon,
                    isSale ? styles.saleIcon : styles.returnIcon,
                  ]}
                >
                  <Ionicons
                    name={isSale ? 'arrow-up-outline' : 'arrow-down-outline'}
                    size={24}
                    color={isSale ? '#2f8c48' : '#bd5b14'}
                  />
                </View>
                <View style={styles.activityName}>
                  <Text style={styles.activityTitle} numberOfLines={1}>
                    {isSale ? 'Sale' : 'Return'} · {activity.itemName}
                  </Text>
                  <Text style={styles.activityCustomer} numberOfLines={1}>
                    {activity.customerName}
                  </Text>
                </View>
                <View style={styles.activityValues}>
                  <Text style={styles.activityQuantity}>
                    {isSale ? '−' : '+'}{activity.quantity}
                  </Text>
                  <Text style={styles.activityDetail} numberOfLines={1}>
                    {activity.detail}
                  </Text>
                  <Text style={styles.activityDate}>{formatActivityDate(activity.createdAt)}</Text>
                </View>
              </View>
            );
          })}
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
  tabletScreen: {
    maxWidth: 1120,
  },
  content: {
    padding: 18,
    paddingTop: 14,
    paddingBottom: 28,
  },
  tabletContent: {
    padding: 28,
    paddingBottom: 36,
  },
  date: {
    color: '#66736c',
    fontSize: 14,
    fontWeight: '600',
  },
  title: {
    color: '#121a15',
    fontSize: 28,
    fontWeight: '800',
    marginTop: 3,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 20,
  },
  metricCard: {
    position: 'relative',
    flexBasis: '47%',
    flexGrow: 1,
    minHeight: 130,
    borderWidth: 1,
    borderColor: '#dde4de',
    borderRadius: 16,
    backgroundColor: '#ffffff',
    padding: 15,
  },
  tabletMetricCard: {
    flexBasis: '22%',
  },
  dashboardPanels: {
    gap: 0,
  },
  wideDashboardPanels: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 14,
  },
  tabletPanel: {
    flex: 1,
  },
  metricIcon: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 13,
  },
  metricTitle: {
    maxWidth: '72%',
    color: '#66736c',
    fontSize: 14,
    fontWeight: '700',
  },
  metricValue: {
    color: '#101713',
    fontSize: 25,
    fontWeight: '800',
    marginTop: 22,
  },
  metricDetail: {
    color: '#748078',
    fontSize: 13,
    marginTop: 3,
  },
  sectionCard: {
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#dde4de',
    borderRadius: 18,
    backgroundColor: '#ffffff',
    marginTop: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    padding: 16,
  },
  sectionTitle: {
    color: '#121a15',
    fontSize: 19,
    fontWeight: '800',
  },
  sectionSubtitle: {
    color: '#748078',
    fontSize: 14,
    marginTop: 3,
  },
  liveBadge: {
    borderRadius: 14,
    backgroundColor: '#eaf7eb',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  liveText: {
    color: '#287c40',
    fontSize: 13,
    fontWeight: '700',
  },
  chart: {
    height: 170,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 7,
    paddingHorizontal: 15,
    paddingBottom: 16,
  },
  chartColumn: {
    flex: 1,
    alignItems: 'center',
  },
  chartValue: {
    color: '#657169',
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 6,
  },
  chartTrack: {
    width: '76%',
    height: 94,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    borderRadius: 7,
    backgroundColor: '#f0f3f0',
  },
  chartBar: {
    width: '100%',
    minHeight: 0,
    borderRadius: 7,
    backgroundColor: '#4a925d',
  },
  chartLabel: {
    color: '#6f7b73',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 7,
  },
  flexText: {
    flex: 1,
    minWidth: 0,
  },
  sectionIcon: {
    width: 46,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
  },
  warningIcon: {
    backgroundColor: '#fff1e5',
  },
  stockList: {
    gap: 10,
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  stockRow: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#e8ece8',
    borderRadius: 14,
    padding: 11,
  },
  stockQuantity: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: '#f2f5f1',
  },
  stockQuantityText: {
    color: '#163c23',
    fontSize: 17,
    fontWeight: '800',
  },
  stockName: {
    color: '#121a15',
    fontSize: 15,
    fontWeight: '700',
  },
  stockStatus: {
    color: '#748078',
    fontSize: 13,
    marginTop: 3,
  },
  manageText: {
    color: '#b64f0a',
    fontSize: 14,
    fontWeight: '700',
  },
  activityCard: {
    marginBottom: 4,
  },
  viewSalesText: {
    color: '#287c40',
    fontSize: 14,
    fontWeight: '700',
  },
  activityRow: {
    minHeight: 84,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    borderTopWidth: 1,
    borderTopColor: '#e8ece8',
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  activityIcon: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 13,
  },
  saleIcon: {
    backgroundColor: '#eaf7eb',
  },
  returnIcon: {
    backgroundColor: '#fff1e5',
  },
  activityName: {
    flex: 1,
    minWidth: 0,
  },
  activityTitle: {
    color: '#121a15',
    fontSize: 14,
    fontWeight: '700',
  },
  activityCustomer: {
    color: '#748078',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 3,
  },
  activityValues: {
    width: 115,
    alignItems: 'flex-end',
  },
  activityQuantity: {
    color: '#121a15',
    fontSize: 15,
    fontWeight: '800',
  },
  activityDetail: {
    maxWidth: '100%',
    color: '#68756d',
    fontSize: 12,
    marginTop: 2,
  },
  activityDate: {
    color: '#7a857e',
    fontSize: 11,
    marginTop: 3,
  },
});
