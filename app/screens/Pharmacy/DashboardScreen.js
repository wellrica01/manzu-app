// DashboardScreen.js - PREMIUM VERSION

import React, { useEffect, useState, useContext, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, ScrollView, RefreshControl, Animated, FlatList, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthContext } from '../../context/AuthContext';
import { apiRequest } from '../../services/api';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const STATUS_CONFIG = {
  CONFIRMED: { label: 'Pending', color: '#F59E42', bg: 'rgba(245, 158, 66, 0.1)' },
  PROCESSING: { label: 'Processing', color: '#1ABA7F', bg: 'rgba(26, 186, 127, 0.1)' },
  READY_FOR_PICKUP: { label: 'Ready', color: '#225F91', bg: 'rgba(34, 95, 145, 0.1)' },
  SHIPPED: { label: 'Shipped', color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.1)' },
  DELIVERED: { label: 'Delivered', color: '#16A34A', bg: 'rgba(22, 163, 74, 0.1)' },
  CANCELLED: { label: 'Cancelled', color: '#DC2626', bg: 'rgba(220, 38, 38, 0.1)' },
  COMPLETED: { label: 'Completed', color: '#059669', bg: 'rgba(5, 150, 105, 0.1)' },
};

// Enhanced Stat Card with Trends
const StatCard = ({ icon, label, value, color, trend, subtitle }) => {
  const getTrendColor = (trend) => {
    if (!trend) return '#6B7280';
    return trend > 0 ? '#16A34A' : trend < 0 ? '#DC2626' : '#6B7280';
  };

  const getTrendIcon = (trend) => {
    if (!trend) return null;
    return trend > 0 ? 'trending-up' : trend < 0 ? 'trending-down' : 'remove';
  };

  return (
    <View style={[styles.statCard, { borderLeftColor: color, borderLeftWidth: 4 }]}>
      <View style={styles.statHeader}>
        <View style={[styles.iconCircle, { backgroundColor: color + '15' }]}>
          <Ionicons name={icon} size={20} color={color} />
        </View>
        {trend !== undefined && trend !== null && (
          <View style={[styles.trendBadge, { backgroundColor: getTrendColor(trend) + '15' }]}>
            <Ionicons name={getTrendIcon(trend)} size={10} color={getTrendColor(trend)} />
            <Text style={[styles.trendText, { color: getTrendColor(trend) }]}>
              {trend > 0 ? '+' : ''}{trend}%
            </Text>
          </View>
        )}
      </View>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
    </View>
  );
};

// Revenue Card with Privacy Toggle
const RevenueCard = ({ label, value, icon, color, visible, toggleVisible, trend }) => {
  const getTrendColor = (trend) => {
    if (!trend) return '#6B7280';
    return trend > 0 ? '#16A34A' : trend < 0 ? '#DC2626' : '#6B7280';
  };

  return (
    <View style={styles.revenueCard}>
      <View style={styles.revenueHeader}>
        <View style={[styles.iconCircle, { backgroundColor: color + '15' }]}>
          <Ionicons name={icon} size={18} color={color} />
        </View>
        <View style={styles.revenueHeaderRight}>
          {trend !== undefined && (
            <View style={[styles.miniTrendBadge, { backgroundColor: getTrendColor(trend) + '15' }]}>
              <Text style={[styles.miniTrendText, { color: getTrendColor(trend) }]}>
                {trend > 0 ? '+' : ''}{trend}%
              </Text>
            </View>
          )}
          <TouchableOpacity onPress={toggleVisible} style={styles.eyeButton}>
            <Ionicons name={visible ? 'eye' : 'eye-off'} size={18} color="#6B7280" />
          </TouchableOpacity>
        </View>
      </View>
      <Text style={styles.revenueLabel}>{label}</Text>
      <Text style={[styles.revenueValue, { color }]}>
        {visible ? `₦${value.toLocaleString()}` : '••••••'}
      </Text>
    </View>
  );
};

// Quick Action Card
const QuickActionCard = ({ icon, label, description, color, badge, onPress }) => {
  return (
    <TouchableOpacity 
      style={[styles.actionCard, { borderTopColor: color, borderTopWidth: 3 }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {badge > 0 && (
        <View style={[styles.actionBadge, { backgroundColor: color }]}>
          <Text style={styles.actionBadgeText}>{badge}</Text>
        </View>
      )}
      <View style={[styles.actionIconCircle, { backgroundColor: color + '15' }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <Text style={styles.actionLabel}>{label}</Text>
      <Text style={styles.actionDesc}>{description}</Text>
    </TouchableOpacity>
  );
};

// Activity Item
const ActivityItem = ({ activity }) => {
  const config = STATUS_CONFIG[activity.status] || STATUS_CONFIG.CONFIRMED;
  const timeAgo = getTimeAgo(activity.time);

  return (
    <TouchableOpacity style={styles.activityItem} activeOpacity={0.7}>
      <View style={[styles.activityDot, { backgroundColor: config.color }]} />
      <View style={styles.activityContent}>
        <View style={styles.activityHeader}>
          <Text style={styles.activityTitle}>Order #{activity.id}</Text>
          <Text style={styles.activityAmount}>₦{activity.amount?.toLocaleString()}</Text>
        </View>
        <View style={styles.activityFooter}>
          <View style={[styles.activityStatus, { backgroundColor: config.bg }]}>
            <Text style={[styles.activityStatusText, { color: config.color }]}>{config.label}</Text>
          </View>
          <Text style={styles.activityTime}>{timeAgo}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// Top Selling Med Item
const TopMedItem = ({ med, index }) => {
  const colors = ['#1ABA7F', '#225F91', '#F59E42', '#8B5CF6', '#DC2626'];
  const color = colors[index % colors.length];

  return (
    <View style={styles.topMedItem}>
      <View style={styles.topMedRank}>
        <Text style={[styles.topMedRankText, { color }]}>#{index + 1}</Text>
      </View>
      <View style={styles.topMedContent}>
        <Text style={styles.topMedName} numberOfLines={1}>{med.name}</Text>
        <View style={styles.topMedStats}>
          <View style={styles.topMedStat}>
            <Ionicons name="cube" size={12} color="#6B7280" />
            <Text style={styles.topMedStatText}>{med.quantity} units</Text>
          </View>
          <View style={styles.topMedStat}>
            <Ionicons name="cash" size={12} color="#6B7280" />
            <Text style={styles.topMedStatText}>₦{med.revenue?.toLocaleString()}</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

// Low Stock Item
const LowStockItem = ({ med }) => {
  const urgency = med.stock === 0 ? 'critical' : med.stock < 5 ? 'high' : 'medium';
  const color = urgency === 'critical' ? '#DC2626' : urgency === 'high' ? '#F59E42' : '#F59E42';

  return (
    <View style={[styles.lowStockItem, { borderLeftColor: color }]}>
      <View style={styles.lowStockHeader}>
        <Text style={styles.lowStockName} numberOfLines={1}>{med.name}</Text>
        <View style={[styles.lowStockBadge, { backgroundColor: color + '15' }]}>
          <Text style={[styles.lowStockBadgeText, { color }]}>{med.stock} left</Text>
        </View>
      </View>
      {med.form && <Text style={styles.lowStockForm}>{med.form}</Text>}
    </View>
  );
};

// Helper function
const getTimeAgo = (date) => {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  const intervals = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60,
  };

  for (const [unit, secondsInUnit] of Object.entries(intervals)) {
    const interval = Math.floor(seconds / secondsInUnit);
    if (interval >= 1) {
      return `${interval} ${unit}${interval > 1 ? 's' : ''} ago`;
    }
  }
  return 'Just now';
};

export default function DashboardScreen({ navigation }) {
  const { user, token } = useContext(AuthContext);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [showOnlineRevenue, setShowOnlineRevenue] = useState(true);
  const [showPosRevenue, setShowPosRevenue] = useState(true);

  const fetchDashboard = async () => {
    setError('');
    try {
      setLoading(true);
      const json = await apiRequest('/pharmacy/dashboard', 'GET', undefined, token);
      setData(json);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchDashboard(); }, []);
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const onRefresh = () => { setRefreshing(true); fetchDashboard(); };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#F8FAFC', '#F1F5F9']} style={styles.gradientBg}>
        <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
          <ScrollView 
            contentContainerStyle={styles.scrollContent} 
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1ABA7F" />}
          >
            {/* Header */}
            <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
              <View style={styles.headerLeft}>
                <Text style={styles.greeting}>Welcome back!</Text>
                {user?.pharmacy?.name && (
                  <Text style={styles.pharmacyName}>{user.pharmacy.name}</Text>
                )}
              </View>
              <TouchableOpacity 
                style={styles.notificationBtn} 
                onPress={() => navigation.navigate('Notifications')}
              >
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationCount}>3</Text>
                </View>
                <Ionicons name="notifications-outline" size={24} color="#225F91" />
              </TouchableOpacity>
            </Animated.View>

            {loading ? (
              <ActivityIndicator size="large" color="#1ABA7F" style={{ marginTop: 60 }} />
            ) : error ? (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={48} color="#DC2626" />
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={fetchDashboard}>
                  <Text style={styles.retryText}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : data ? (
              <>
                {/* Revenue Cards */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Today's Revenue</Text>
                  <View style={styles.revenueGrid}>
                    <RevenueCard
                      icon="cart"
                      label="Online Orders"
                      value={data.revenueToday || 0}
                      color="#1ABA7F"
                      visible={showOnlineRevenue}
                      toggleVisible={() => setShowOnlineRevenue(!showOnlineRevenue)}
                      trend={data.revenueTrend}
                    />
                    <RevenueCard
                      icon="storefront"
                      label="Point of Sale"
                      value={data.posRevenueToday || 0}
                      color="#225F91"
                      visible={showPosRevenue}
                      toggleVisible={() => setShowPosRevenue(!showPosRevenue)}
                      trend={data.posRevenueTrend}
                    />
                  </View>
                </View>

                {/* Stats Grid */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Overview</Text>
                  <View style={styles.statsGrid}>
                    <StatCard
                      icon="cart"
                      label="Online Orders"
                      value={data.ordersToday || 0}
                      color="#1ABA7F"
                      trend={data.ordersTrend}
                    />
                    <StatCard
                      icon="storefront"
                      label="PoS Sales"
                      value={data.posSalesToday || 0}
                      color="#225F91"
                      trend={data.posSalesTrend}
                    />
                    <StatCard
                      icon="time"
                      label="Pending"
                      value={data.pendingOrders || 0}
                      color="#F59E42"
                      subtitle={`${data.processingOrders || 0} processing`}
                    />
                    <StatCard
                      icon="alert-circle"
                      label="Low Stock"
                      value={data.inventoryAlerts || 0}
                      color="#DC2626"
                      subtitle={`${data.expiringMeds || 0} expiring soon`}
                    />
                  </View>
                </View>

                {/* Quick Actions */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Quick Actions</Text>
                  <View style={styles.actionsGrid}>
                    <QuickActionCard
                      icon="add-circle"
                      label="New Sale"
                      description="Record walk-in purchase"
                      color="#1ABA7F"
                      onPress={() => navigation.navigate('NewSale')}
                    />
                    <QuickActionCard
                      icon="time"
                      label="Pending"
                      description="View pending orders"
                      color="#F59E42"
                      badge={data.pendingOrders || 0}
                      onPress={() => navigation.navigate('Orders', { filter: 'CONFIRMED' })}
                    />
                    <QuickActionCard
                      icon="checkmark-circle"
                      label="Ready"
                      description="Ready for pickup"
                      color="#225F91"
                      badge={data.readyOrders || 0}
                      onPress={() => navigation.navigate('Orders', { filter: 'READY_FOR_PICKUP' })}
                    />
                    <QuickActionCard
                      icon="alert-circle"
                      label="Low Stock"
                      description="Restock medications"
                      color="#DC2626"
                      badge={data.inventoryAlerts || 0}
                      onPress={() => navigation.navigate('Inventory', { filter: 'low-stock' })}
                    />
                  </View>
                </View>

                {/* Top Selling & Low Stock Side by Side */}
                <View style={styles.doubleSection}>
                  {/* Top Selling */}
                  {data.topSellingMeds && data.topSellingMeds.length > 0 && (
                    <View style={[styles.section, styles.halfSection]}>
                      <View style={styles.sectionHeader}>
                        <Ionicons name="trending-up" size={18} color="#1ABA7F" />
                        <Text style={[styles.sectionTitle, styles.sectionTitleSmall]}>Top Sellers</Text>
                      </View>
                      <View style={styles.topMedsList}>
                        {data.topSellingMeds.slice(0, 3).map((med, index) => (
                          <TopMedItem key={index} med={med} index={index} />
                        ))}
                      </View>
                    </View>
                  )}

                  {/* Low Stock */}
                  {data.lowStockMeds && data.lowStockMeds.length > 0 && (
                    <View style={[styles.section, styles.halfSection]}>
                      <View style={styles.sectionHeader}>
                        <Ionicons name="alert-circle" size={18} color="#DC2626" />
                        <Text style={[styles.sectionTitle, styles.sectionTitleSmall]}>Low Stock</Text>
                      </View>
                      <View style={styles.lowStockList}>
                        {data.lowStockMeds.slice(0, 3).map((med, index) => (
                          <LowStockItem key={index} med={med} />
                        ))}
                      </View>
                      <TouchableOpacity 
                        style={styles.viewAllButton}
                        onPress={() => navigation.navigate('Inventory', { filter: 'low-stock' })}
                      >
                        <Text style={styles.viewAllButtonText}>View All</Text>
                        <Ionicons name="arrow-forward" size={14} color="#1ABA7F" />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>

                {/* Recent Activity */}
                {data.recentActivity && data.recentActivity.length > 0 && (
                  <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                      <Text style={styles.sectionTitle}>Recent Activity</Text>
                        <TouchableOpacity onPress={() => navigation.navigate('Orders')}>
                        <Text style={styles.viewAllLink}>View All →</Text>
                      </TouchableOpacity>
                    </View>
                    <View style={styles.activityList}>
                      {data.recentActivity.slice(0, 5).map((activity) => (
                        <ActivityItem key={activity.id} activity={activity} />
                      ))}
                    </View>
                  </View>
                )}
              </>
            ) : null}
          </ScrollView>
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
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 4,
  },
  pharmacyName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
  },
  notificationBtn: {
    position: 'relative',
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  notificationBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#DC2626',
    borderRadius: 10,
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  notificationCount: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  sectionTitleSmall: {
    fontSize: 16,
    marginBottom: 0,
  },
  viewAllLink: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1ABA7F',
  },
  revenueGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  revenueCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  revenueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  revenueHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  miniTrendBadge: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  miniTrendText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eyeButton: {
    padding: 4,
  },
  revenueLabel: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 8,
  },
  revenueValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  trendText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  statSubtitle: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 4,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    position: 'relative',
  },
  actionBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  actionBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  actionIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionLabel: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
    textAlign: 'center',
  },
  actionDesc: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  doubleSection: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  halfSection: {
    flex: 1,
    marginBottom: 0,
  },
  topMedsList: {
    gap: 8,
  },
  topMedItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  topMedRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  topMedRankText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  topMedContent: {
    flex: 1,
  },
  topMedName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  topMedStats: {
    flexDirection: 'row',
    gap: 12,
  },
  topMedStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  topMedStatText: {
    fontSize: 11,
    color: '#6B7280',
  },
  lowStockList: {
    gap: 8,
  },
  lowStockItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  lowStockHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  lowStockName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
    marginRight: 8,
  },
  lowStockBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  lowStockBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  lowStockForm: {
    fontSize: 11,
    color: '#6B7280',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: 8,
    paddingVertical: 8,
  },
  viewAllButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1ABA7F',
  },
  activityList: {
    gap: 8,
  },
  activityItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  activityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  activityContent: {
    flex: 1,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  activityAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#225F91',
  },
  activityFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activityStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  activityStatusText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  activityTime: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 60,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#1ABA7F',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
