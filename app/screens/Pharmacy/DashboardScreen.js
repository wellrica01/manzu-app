import React, { useEffect, useState, useContext, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, ScrollView, RefreshControl, Image, Animated, FlatList } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthContext } from '../../context/AuthContext';
import { apiRequest } from '../../services/api';
import { Ionicons } from '@expo/vector-icons';

const STAT_CARDS = [
  { key: 'ordersAndPoS', labelLeft: 'Orders Today', labelRight: 'PoS Sales Today', iconLeft: 'cart', iconRight: 'storefront', colorLeft: '#1ABA7F', colorRight: '#0EA5E9' },
  { key: 'revenue', labelTop: 'Online Revenue', labelBottom: 'PoS Revenue', iconTop: 'cash', iconBottom: 'wallet', colorTop: '#225F91', colorBottom: '#16A34A' },
  { key: 'pendingAndStock', labelLeft: 'Pending Orders', labelRight: 'Low Stock', iconLeft: 'time', iconRight: 'alert-circle', colorLeft: '#F59E42', colorRight: '#DC2626' },
];


const STATUS_LABELS = {
  CONFIRMED: 'Pending', // Backend: confirmed, Frontend: pending
  PROCESSING: 'Processing',
  READY_FOR_PICKUP: 'Ready',
  SHIPPED: 'Shipped',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
  COMPLETED: 'Completed',
};
const STATUS_COLORS = {
  CONFIRMED: '#F59E42', // Orange for pending (confirmed)
  PROCESSING: '#1ABA7F',
  READY_FOR_PICKUP: '#225F91',
  SHIPPED: '#8B5CF6',
  DELIVERED: '#16A34A',
  CANCELLED: '#DC2626',
  COMPLETED: '#059669',
};

export default function DashboardScreen({ navigation }) {
  const { user, token } = useContext(AuthContext);
  const [data, setData] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]); // <-- new state
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
      // Fetch recent orders (first 5)
      const ordersRes = await apiRequest('/pharmacy/orders?page=1&limit=5', 'GET', undefined, token);
      // Map backend orders to UI format
      const mappedOrders = (ordersRes.orders || []).map(order => ({
        ...order,
        createdAt: new Date(order.createdAt),
      }));
      setRecentOrders(mappedOrders);
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
      duration: 700,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);
  const onRefresh = () => { setRefreshing(true); fetchDashboard(); };

  // Animated card scale on mount
  const cardAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(cardAnim, {
      toValue: 1,
      friction: 7,
      useNativeDriver: true,
    }).start();
  }, []);

  // Render stat cards
  const renderStatCards = () => (
    <View style={styles.cardsGrid}>
      {/* Orders Today & PoS Sales Today (columns) */}
      <Animated.View
        key="ordersAndPoS"
        style={[
          styles.card,
          { backgroundColor: 'rgba(255,255,255,0.98)' },
          { transform: [{ scale: cardAnim }] },
          { shadowColor: '#1ABA7F' },
          { minWidth: 340, flexBasis: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 32, marginHorizontal: 8, marginVertical: 10 },
        ]}
      >
        <View style={{ flex: 1, alignItems: 'center', paddingVertical: 8 }}>
          <Ionicons name="cart" size={32} color="#16A34A" style={{ marginBottom: 8 }} />
          <Text style={styles.cardLabelOrders}>Orders Today</Text>
          <Text style={[styles.cardValue, { color: '#16A34A' }]}>{data ? data.ordersToday : '--'}</Text>
        </View>
        <View style={{ width: 1, backgroundColor: '#e0e7ef', height: 56, marginHorizontal: 24 }} />
        <View style={{ flex: 1, alignItems: 'center', paddingVertical: 8 }}>
          <Ionicons name="storefront" size={32} color="#16A34A" style={{ marginBottom: 8 }} />
          <Text style={styles.cardLabelPoS}>PoS Sales Today</Text>
          <Text style={[styles.cardValue, { color: '#16A34A' }]}>{data ? data.posSalesToday : '--'}</Text>
        </View>
      </Animated.View>
      {/* Revenue Card (rows, centered, with separator and eye icon) */}
      <Animated.View
        key="revenue"
        style={[
          styles.card,
          { backgroundColor: 'rgba(255,255,255,0.98)' },
          { transform: [{ scale: cardAnim }] },
          { shadowColor: '#225F91' },
          { minWidth: 340, flexBasis: '100%', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32, marginHorizontal: 8, marginVertical: 10 },
        ]}
      >
        <View style={styles.revenueRow}>
          <Ionicons name="cash" size={28} color="#16A34A" />
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={styles.revenueLabelOrders}>Online Revenue</Text>
          </View>
          <Ionicons
            name={showOnlineRevenue ? 'eye' : 'eye-off'}
            size={22}
            color="#16A34A"
            onPress={() => setShowOnlineRevenue(v => !v)}
          />
        </View>
        <Text style={[styles.cardValue, { color: '#16A34A', marginBottom: 10, textAlign: 'center' }]}> 
          {showOnlineRevenue ? (data ? `₦${data.revenueToday?.toLocaleString()}` : '--') : '••••••'}
        </Text>
        {/* Horizontal separator */}
        <View style={{ width: 120, height: 1, backgroundColor: '#e0e7ef', marginVertical: 6, alignSelf: 'center' }} />
        <View style={styles.revenueRow}>
          <Ionicons name="wallet" size={28} color="#16A34A" />
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={styles.revenueLabelPoS}>PoS Revenue</Text>
          </View>
          <Ionicons
            name={showPosRevenue ? 'eye' : 'eye-off'}
            size={22}
            color="#16A34A"
            onPress={() => setShowPosRevenue(v => !v)}
          />
        </View>
        <Text style={[styles.cardValue, { color: '#16A34A', textAlign: 'center' }]}> 
          {showPosRevenue ? (data ? `₦${data.posRevenueToday?.toLocaleString()}` : '--') : '••••••'}
        </Text>
      </Animated.View>
      {/* Pending Orders & Low Stock (columns) */}
      <Animated.View
        key="pendingAndStock"
        style={[
          styles.card,
          { backgroundColor: 'rgba(255,255,255,0.98)' },
          { transform: [{ scale: cardAnim }] },
          { shadowColor: '#F59E42' },
          { minWidth: 340, flexBasis: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 32, marginHorizontal: 8, marginVertical: 10 },
        ]}
      >
        <View style={{ flex: 1, alignItems: 'center', paddingVertical: 8 }}>
          <Ionicons name="time" size={32} color="#F59E42" style={{ marginBottom: 8 }} />
          <Text style={styles.cardLabel}>Pending Orders</Text>
          <Text style={[styles.cardValue, { color: '#F59E42' }]}>{data ? data.pendingOrders : '--'}</Text>
        </View>
        <View style={{ width: 1, backgroundColor: '#e0e7ef', height: 56, marginHorizontal: 24 }} />
        <View style={{ flex: 1, alignItems: 'center', paddingVertical: 8 }}>
          <Ionicons name="alert-circle" size={32} color="#DC2626" style={{ marginBottom: 8 }} />
          <Text style={styles.cardLabel}>Low Stock</Text>
          <Text style={[styles.cardValue, { color: '#DC2626' }]}>{data ? data.inventoryAlerts : '--'}</Text>
        </View>
      </Animated.View>
    </View>
  );

  // Render recent orders
  const renderRecentOrders = () => (
    <View style={styles.recentSection}>
      <View style={styles.recentHeader}>
        <Text style={styles.recentTitle}>Recent Orders</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Orders')}>
          <Text style={styles.recentLink}>View All</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={recentOrders}
        keyExtractor={item => item.id.toString()}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.recentList}
        ListEmptyComponent={
          !loading && (
            <Text style={{ color: '#888', padding: 16 }}>No recent orders found.</Text>
          )
        }
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.recentCard} 
            activeOpacity={0.85} 
            onPress={() => navigation.navigate('OrderDetails', { order: item })}
          >
            <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[item.status] || '#888' }]}> 
              <Text style={styles.statusText}>{STATUS_LABELS[item.status] || item.status}</Text>
            </View>
            <Text style={styles.recentOrderId}>Order #{item.id}</Text>
            <Text style={styles.recentOrderUser}>{item.name || 'N/A'}</Text>
            <Text style={styles.recentOrderTotal}>₦{item.totalPrice?.toLocaleString() ?? '--'}</Text>
            <Text style={styles.recentOrderDate}>{item.createdAt instanceof Date && !isNaN(item.createdAt) ? item.createdAt.toLocaleDateString() : '--'}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );

  return (
    <LinearGradient colors={['#1ABA7F', '#225F91']} style={styles.gradientBg}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <ScrollView contentContainerStyle={styles.scrollContent} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1ABA7F" />}>
          {/* Branded Header */}
          <Animated.View style={[styles.header, { opacity: fadeAnim }]}> 
            <View style={styles.headerRow}>
              <View style={styles.headerText}>
                {user?.pharmacy?.name && (
                  <View style={styles.pharmacyNameRow}>
                    <Ionicons name="business" size={28} color="#fff" style={{ marginRight: 8 }} />
                    <Text style={styles.pharmacyName}>Hi, {user.pharmacy.name}</Text>
                  </View>
                )}
                <Text style={styles.subtitle}>Here’s your pharmacy at a glance.</Text>
              </View>
              <TouchableOpacity style={styles.notificationBtn} onPress={() => navigation.navigate('Notifications')}>
                <Ionicons name="notifications" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            {/* Optionally add logo/avatar here */}
            {/* <Image source={require('../../assets/logo.png')} style={styles.logo} /> */}
          </Animated.View>

          {/* Stat Cards */}
          {loading ? (
            <ActivityIndicator size="large" color="#fff" style={{ marginTop: 40 }} />
          ) : error ? (
            <Text style={styles.error}>{error}</Text>
          ) : data ? (
            renderStatCards()
          ) : null}

          {/* Recent Orders */}
          {renderRecentOrders()}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradientBg: { flex: 1 },
  safeArea: { flex: 1, paddingHorizontal: 8 }, // Add horizontal padding for dashboard edge
  scrollContent: { flexGrow: 1, alignItems: 'center', justifyContent: 'flex-start', paddingVertical: 36, paddingHorizontal: 8 },
  header: { marginBottom: 16, alignItems: 'center', width: '100%' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%', marginBottom: 16, paddingHorizontal: 8 },
  headerText: { flex: 1 },
  pharmacyNameRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  pharmacyName: { fontSize: 28, fontWeight: 'bold', color: '#fff', textAlign: 'left', textShadowColor: 'rgba(34,95,145,0.4)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 6 },
  subtitle: { fontSize: 16, color: '#fff', textAlign: 'left', marginTop: 6, textShadowColor: 'rgba(34,95,145,0.2)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 },
  notificationBtn: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 12, padding: 10, marginLeft: 16 },
  // Cards
  cardsGrid: { flexDirection: 'column', alignItems: 'center', gap: 0, marginBottom: 36, width: '100%', maxWidth: 520 },
  card: {
    borderRadius: 22,
    paddingVertical: 18,
    marginVertical: 10,
    minWidth: 340,
    alignItems: 'center',
    shadowOpacity: 0.16,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
    backgroundColor: 'rgba(255,255,255,0.98)',
    borderWidth: 1,
    borderColor: 'rgba(34,95,145,0.07)',
  },
  cardLabel: {
    color: '#225F91',
    fontWeight: '500',
    fontSize: 15,
    marginBottom: 6,
    textAlign: 'center',
    letterSpacing: 0.1,
    opacity: 0.85,
  },
  cardLabelOrders: {
    color: '#225F91',
    fontWeight: '500',
    fontSize: 15,
    marginBottom: 6,
    textAlign: 'center',
    letterSpacing: 0.1,
    opacity: 0.85,
  },
  cardLabelPoS: {
    color: '#2563EB',
    fontWeight: '500',
    fontSize: 15,
    marginBottom: 6,
    textAlign: 'center',
    letterSpacing: 0.1,
    opacity: 0.85,
  },
  cardValue: {
    fontWeight: 'bold',
    fontSize: 34,
    marginBottom: 2,
    textAlign: 'center',
    letterSpacing: 0.3,
    fontVariant: ['tabular-nums'],
  },
  // Actions
  actionsRow: { flexDirection: 'row', justifyContent: 'center', gap: 16, marginTop: 8, marginBottom: 24 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1ABA7F', borderRadius: 12, paddingVertical: 14, paddingHorizontal: 24, marginHorizontal: 8, shadowColor: '#225F91', shadowOpacity: 0.13, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
  actionText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  // Recent Orders
  recentSection: { width: '100%', maxWidth: 420, marginTop: 8 },
  recentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, paddingHorizontal: 8 },
  recentTitle: { color: '#225F91', fontWeight: 'bold', fontSize: 18 },
  recentLink: { color: '#1ABA7F', fontWeight: 'bold', fontSize: 15 },
  recentList: { paddingLeft: 8, paddingRight: 8 },
  recentCard: { backgroundColor: 'rgba(255,255,255,0.97)', borderRadius: 16, padding: 16, marginRight: 14, minWidth: 140, alignItems: 'flex-start', shadowColor: '#1ABA7F', shadowOpacity: 0.08, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
  statusBadge: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 10, alignSelf: 'flex-start', marginBottom: 6 },
  statusText: { color: '#fff', fontWeight: 'bold', fontSize: 13, textTransform: 'capitalize' },
  recentOrderId: { color: '#225F91', fontWeight: 'bold', fontSize: 15, marginBottom: 2 },
  recentOrderUser: { color: '#1ABA7F', fontSize: 14, marginBottom: 2 },
  recentOrderTotal: { color: '#4B5563', fontSize: 14, marginBottom: 2 },
  recentOrderDate: { color: '#9CA3AF', fontSize: 12 },
  error: { color: '#fff', backgroundColor: 'rgba(220,53,69,0.85)', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4, marginBottom: 12, textAlign: 'center', fontWeight: 'bold', fontSize: 15, marginTop: 24 },
  revenueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginBottom: 6,
    minHeight: 32,
  },

  // Remove leftIcon and rightIcon styles
  
  revenueLabelOrders: {
    fontSize: 15,
    fontWeight: '500',
    color: '#225F91',
    textAlign: 'center',
    opacity: 0.85,
  },
  revenueLabelPoS: {
    fontSize: 15,
    fontWeight: '500',
    color: '#2563EB',
    textAlign: 'center',
    opacity: 0.85,
  },
}); 