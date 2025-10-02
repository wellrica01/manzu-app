import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const StatCard = ({ title, value, subtitle, icon, color, gradient, trend, index }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        delay: index * 100,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        delay: index * 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.statCard,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <LinearGradient colors={gradient} style={styles.statGradient}>
        <View style={styles.statHeader}>
          <View style={[styles.statIconContainer, { backgroundColor: color + '20' }]}>
            <Ionicons name={icon} size={24} color={color} />
          </View>
          {trend && (
            <View style={[styles.trendBadge, { backgroundColor: trend > 0 ? '#DCFCE7' : '#FEE2E2' }]}>
              <Ionicons
                name={trend > 0 ? 'trending-up' : 'trending-down'}
                size={14}
                color={trend > 0 ? '#16A34A' : '#DC2626'}
              />
              <Text style={[styles.trendText, { color: trend > 0 ? '#16A34A' : '#DC2626' }]}>
                {Math.abs(trend)}%
              </Text>
            </View>
          )}
        </View>
        <Text style={styles.statTitle}>{title}</Text>
        <Text style={styles.statValue}>{value}</Text>
        {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
      </LinearGradient>
    </Animated.View>
  );
};

const SummaryCard = ({ title, items, icon, color }) => {
  return (
    <View style={styles.summaryCard}>
      <View style={styles.summaryHeader}>
        <View style={[styles.summaryIconContainer, { backgroundColor: color + '15' }]}>
          <Ionicons name={icon} size={22} color={color} />
        </View>
        <Text style={styles.summaryTitle}>{title}</Text>
      </View>
      <View style={styles.summaryContent}>
        {items.map((item, index) => (
          <View key={index} style={styles.summaryItem}>
            <View style={styles.summaryItemLeft}>
              <View style={[styles.summaryDot, { backgroundColor: item.color }]} />
              <Text style={styles.summaryItemLabel}>{item.label}</Text>
            </View>
            <View style={styles.summaryItemRight}>
              <Text style={styles.summaryItemValue}>{item.value}</Text>
              {item.count && <Text style={styles.summaryItemCount}>{item.count}</Text>}
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

const ChartPlaceholder = ({ title, subtitle, icon, color, height = 200 }) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <View style={styles.chartCard}>
      <View style={styles.chartHeader}>
        <View style={[styles.chartIconContainer, { backgroundColor: color + '15' }]}>
          <Ionicons name={icon} size={24} color={color} />
        </View>
        <View style={styles.chartTitleContainer}>
          <Text style={styles.chartTitle}>{title}</Text>
          {subtitle && <Text style={styles.chartSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      <Animated.View
        style={[
          styles.chartPlaceholder,
          { height, transform: [{ scale: pulseAnim }] },
        ]}
      >
        <View style={[styles.chartPlaceholderIcon, { backgroundColor: color + '15' }]}>
          <Ionicons name="bar-chart-outline" size={48} color={color} />
        </View>
        <Text style={[styles.chartPlaceholderText, { color }]}>Chart Coming Soon</Text>
        <Text style={styles.chartPlaceholderSubtext}>
          We're preparing insightful visualizations for your data
        </Text>
      </Animated.View>
    </View>
  );
};

const TimeFilter = ({ selected, onSelect }) => {
  const periods = ['Today', 'Week', 'Month', 'Year'];

  return (
    <View style={styles.filterContainer}>
      {periods.map((period) => (
        <TouchableOpacity
          key={period}
          style={[
            styles.filterButton,
            selected === period && styles.filterButtonActive,
          ]}
          onPress={() => onSelect(period)}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.filterButtonText,
              selected === period && styles.filterButtonTextActive,
            ]}
          >
            {period}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

export default function AnalyticsScreen() {
  const [selectedPeriod, setSelectedPeriod] = useState('Week');
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  // Mock data - replace with actual API calls
  const stats = [
    {
      title: 'Total Sales',
      value: '₦--',
      subtitle: '-- transactions',
      icon: 'cash-outline',
      color: '#1ABA7F',
      gradient: ['#D1FAE5', '#fff'],
      trend: null,
    },
    {
      title: 'Online Orders',
      value: '--',
      subtitle: 'pending orders',
      icon: 'cart-outline',
      color: '#225F91',
      gradient: ['#DBEAFE', '#fff'],
      trend: null,
    },
    {
      title: 'PoS Revenue',
      value: '₦--',
      subtitle: 'this week',
      icon: 'storefront-outline',
      color: '#0EA5E9',
      gradient: ['#E0F2FE', '#fff'],
      trend: null,
    },
    {
      title: 'Avg. Order',
      value: '₦--',
      subtitle: 'per transaction',
      icon: 'trending-up-outline',
      color: '#F59E42',
      gradient: ['#FEF3C7', '#fff'],
      trend: null,
    },
  ];

  const posSummary = [
    { label: 'Cash', value: '₦--', count: '-- sales', color: '#16A34A' },
    { label: 'Transfer', value: '₦--', count: '-- sales', color: '#0EA5E9' },
    { label: 'Card', value: '₦--', count: '-- sales', color: '#8B5CF6' },
  ];

  const ordersSummary = [
    { label: 'Pending', value: '--', color: '#F59E42' },
    { label: 'Processing', value: '--', color: '#1ABA7F' },
    { label: 'Ready', value: '--', color: '#225F91' },
    { label: 'Delivered', value: '--', color: '#16A34A' },
  ];

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#F8FAFC', '#F1F5F9']} style={styles.gradientBg}>
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <View style={styles.headerIcon}>
                <Ionicons name="stats-chart" size={24} color="#225F91" />
              </View>
              <View>
                <Text style={styles.headerTitle}>Analytics</Text>
                <Text style={styles.headerSubtitle}>Track your pharmacy performance</Text>
              </View>
            </View>
          </View>

          <Animated.ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            style={{ opacity: fadeAnim }}
          >
            {/* Time Filter */}
            <View style={styles.filterSection}>
              <TimeFilter selected={selectedPeriod} onSelect={setSelectedPeriod} />
            </View>

            {/* Stats Grid */}
            <View style={styles.statsGrid}>
              {stats.map((stat, index) => (
                <StatCard key={stat.title} {...stat} index={index} />
              ))}
            </View>

            {/* PoS Sales Summary */}
            <SummaryCard
              title="PoS Payment Methods"
              items={posSummary}
              icon="card-outline"
              color="#0EA5E9"
            />

            {/* Orders Summary */}
            <SummaryCard
              title="Order Status Overview"
              items={ordersSummary}
              icon="list-outline"
              color="#1ABA7F"
            />

            {/* Charts Section */}
            <View style={styles.chartsSection}>
              <Text style={styles.sectionTitle}>Performance Charts</Text>
              
              <ChartPlaceholder
                title="Revenue Trend"
                subtitle="Daily revenue over time"
                icon="trending-up"
                color="#1ABA7F"
                height={220}
              />

              <ChartPlaceholder
                title="Sales by Category"
                subtitle="Product category breakdown"
                icon="pie-chart"
                color="#8B5CF6"
                height={200}
              />

              <ChartPlaceholder
                title="Order Volume"
                subtitle="Orders received over time"
                icon="bar-chart"
                color="#225F91"
                height={200}
              />

              <ChartPlaceholder
                title="Top Medications"
                subtitle="Best selling products"
                icon="medal"
                color="#F59E42"
                height={180}
              />

              <ChartPlaceholder
                title="Customer Analytics"
                subtitle="Customer behavior insights"
                icon="people"
                color="#16A34A"
                height={200}
              />

              <ChartPlaceholder
                title="Inventory Status"
                subtitle="Stock levels and turnover"
                icon="cube"
                color="#DC2626"
                height={180}
              />
            </View>

            {/* Coming Soon Notice */}
            <View style={styles.noticeCard}>
              <View style={styles.noticeIcon}>
                <Ionicons name="information-circle" size={24} color="#225F91" />
              </View>
              <View style={styles.noticeContent}>
                <Text style={styles.noticeTitle}>Advanced Analytics Coming Soon</Text>
                <Text style={styles.noticeText}>
                  We're working on bringing you detailed charts, trends, and insights to help you make data-driven decisions for your pharmacy.
                </Text>
              </View>
            </View>
          </Animated.ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientBg: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1ABA7F15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  filterSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterButtonActive: {
    backgroundColor: '#1ABA7F',
    borderColor: '#1ABA7F',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    paddingTop: 8,
    gap: 12,
  },
  statCard: {
    width: (width - 52) / 2,
    marginBottom: 12,
  },
  statGradient: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  trendText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  statTitle: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 6,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  statSubtitle: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  summaryCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  summaryIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#111827',
  },
  summaryContent: {
    gap: 12,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  summaryItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  summaryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  summaryItemLabel: {
    fontSize: 15,
    color: '#374151',
    fontWeight: '500',
  },
  summaryItemRight: {
    alignItems: 'flex-end',
  },
  summaryItemValue: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#111827',
  },
  summaryItemCount: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  chartsSection: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  chartCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  chartIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chartTitleContainer: {
    flex: 1,
  },
  chartTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 2,
  },
  chartSubtitle: {
    fontSize: 12,
    color: '#6B7280',
  },
  chartPlaceholder: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    padding: 20,
  },
  chartPlaceholderIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  chartPlaceholderText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  chartPlaceholderSubtext: {
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
    maxWidth: 240,
  },
  noticeCard: {
    flexDirection: 'row',
    backgroundColor: '#DBEAFE',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginTop: 8,
    gap: 12,
  },
  noticeIcon: {
    marginTop: 2,
  },
  noticeContent: {
    flex: 1,
  },
  noticeTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#225F91',
    marginBottom: 6,
  },
  noticeText: {
    fontSize: 13,
    color: '#225F91',
    lineHeight: 18,
  },
});