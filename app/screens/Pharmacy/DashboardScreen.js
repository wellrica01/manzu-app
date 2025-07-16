import React, { useEffect, useState, useContext, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, ScrollView, RefreshControl, Image, Animated, FlatList } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthContext } from '../../context/AuthContext';
import { apiRequest } from '../../services/api';
import { Ionicons } from '@expo/vector-icons';

const STAT_CARDS = [
  { key: 'ordersToday', label: 'Orders Today', icon: 'cart', color: '#1ABA7F' },
  { key: 'pendingOrders', label: 'Pending Orders', icon: 'time', color: '#F59E42' }, // This counts 'confirmed' orders
  { key: 'inventoryAlerts', label: 'Low Stock', icon: 'alert-circle', color: '#DC2626' },
  { key: 'revenueToday', label: 'Revenue Today', icon: 'cash', color: '#225F91' },
];

// Mock recent orders (replace with real API call if needed)
const MOCK_RECENT_ORDERS = [
  { id: 1234, status: 'confirmed', patient: 'John Doe', total: 5000, createdAt: new Date(), badge: '#F59E42', patientIdentifier: 'JD001' },
  { id: 1235, status: 'ready_for_pickup', patient: 'Jane Smith', total: 12000, createdAt: new Date(), badge: '#225F91', patientIdentifier: 'JS002' },
  { id: 1236, status: 'delivered', patient: 'Sam Lee', total: 8000, createdAt: new Date(), badge: '#16A34A', patientIdentifier: 'SL003' },
];

const STATUS_LABELS = {
  confirmed: 'Pending', // Backend: confirmed, Frontend: pending
  processing: 'Processing',
  ready_for_pickup: 'Ready',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  completed: 'Completed',
};
const STATUS_COLORS = {
  confirmed: '#F59E42', // Orange for pending (confirmed)
  processing: '#1ABA7F',
  ready_for_pickup: '#225F91',
  shipped: '#8B5CF6',
  delivered: '#16A34A',
  cancelled: '#DC2626',
  completed: '#059669',
};

export default function DashboardScreen({ navigation }) {
  const { user, token } = useContext(AuthContext);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const fadeAnim = useRef(new Animated.Value(0)).current;

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
      {STAT_CARDS.map((card, idx) => (
        <Animated.View
          key={card.key}
          style={[
            styles.card,
            { backgroundColor: 'rgba(255,255,255,0.97)' },
            { transform: [{ scale: cardAnim }] },
            { shadowColor: card.color },
          ]}
        >
          <View style={[styles.cardIcon, { backgroundColor: card.color + '22' }]}> 
            <Ionicons name={card.icon} size={28} color={card.color} />
          </View>
          <Text style={styles.cardLabel}>{card.label}</Text>
          <Text style={[styles.cardValue, { color: card.color }]}> 
            {card.key === 'revenueToday' && data ? `₦${data[card.key]?.toLocaleString()}` : data ? data[card.key] : '--'}
          </Text>
        </Animated.View>
      ))}
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
        data={MOCK_RECENT_ORDERS}
        keyExtractor={item => item.id.toString()}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.recentList}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.recentCard} 
            activeOpacity={0.85} 
            onPress={() => navigation.navigate('OrderDetails', { order: item })}
          >
            <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[item.status] }]}> 
              <Text style={styles.statusText}>{STATUS_LABELS[item.status]}</Text>
            </View>
            <Text style={styles.recentOrderId}>Order #{item.id}</Text>
            <Text style={styles.recentOrderPatient}>{item.patient}</Text>
            <Text style={styles.recentOrderTotal}>₦{item.total.toLocaleString()}</Text>
            <Text style={styles.recentOrderDate}>{item.createdAt.toLocaleDateString()}</Text>
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
                <Text style={styles.welcome}>Welcome{user?.pharmacy?.name ? `, ${user.pharmacy.name}` : ''}!</Text>
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
  safeArea: { flex: 1 },
  scrollContent: { flexGrow: 1, alignItems: 'center', justifyContent: 'flex-start', paddingVertical: 32, paddingHorizontal: 8 },
  header: { marginBottom: 12, alignItems: 'center', width: '100%' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%', marginBottom: 12, paddingHorizontal: 8 },
  headerText: { flex: 1 },
  welcome: { fontSize: 28, fontWeight: 'bold', color: '#fff', textAlign: 'left', textShadowColor: 'rgba(34,95,145,0.4)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 6 },
  subtitle: { fontSize: 16, color: '#fff', textAlign: 'left', marginTop: 6, textShadowColor: 'rgba(34,95,145,0.2)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 },
  notificationBtn: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 12, padding: 10, marginLeft: 16 },
  // Cards
  cardsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'stretch', gap: 16, marginBottom: 32, width: '100%', maxWidth: 420 },
  card: { borderRadius: 18, padding: 20, margin: 8, minWidth: 150, flexBasis: '45%', flexGrow: 1, alignItems: 'center', shadowOpacity: 0.12, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
  cardIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  cardLabel: { color: '#225F91', fontWeight: '600', fontSize: 15, marginBottom: 6 },
  cardValue: { fontWeight: 'bold', fontSize: 28 },
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
  recentOrderPatient: { color: '#1ABA7F', fontSize: 14, marginBottom: 2 },
  recentOrderTotal: { color: '#4B5563', fontSize: 14, marginBottom: 2 },
  recentOrderDate: { color: '#9CA3AF', fontSize: 12 },
  error: { color: '#fff', backgroundColor: 'rgba(220,53,69,0.85)', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4, marginBottom: 12, textAlign: 'center', fontWeight: 'bold', fontSize: 15, marginTop: 24 },
}); 