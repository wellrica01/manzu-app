import React, { useEffect, useState, useContext } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, SectionList, TouchableOpacity, RefreshControl, TextInput, Image, Animated, FlatList } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthContext } from '../../context/AuthContext';
import { apiRequest } from '../../services/api';
import { Ionicons } from '@expo/vector-icons';
import { SwipeListView } from 'react-native-swipe-list-view';

const STATUS_ORDER = ['CONFIRMED', 'PROCESSING', 'READY_FOR_PICKUP', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'COMPLETED'];
const STATUS_LABELS = {
  ALL: 'All',
  CONFIRMED: 'Pending', // Backend: confirmed, Frontend: pending
  PROCESSING: 'Processing',
  READY_FOR_PICKUP: 'Ready for Pickup',
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
  ALL: '#225F91',
};

function StatusBadge({ status }) {
  return (
    <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[status] || '#888' }]}> 
      <Text style={styles.statusText}>{STATUS_LABELS[status] || status}</Text>
    </View>
  );
}

function MedicationsPreview({ items }) {
  if (!items || items.length === 0) return null;
  const names = items.map(i => i.medication?.name).filter(Boolean);
  const summary = names.length > 2 ? `${names.slice(0,2).join(', ')} +${names.length-2} more` : names.join(', ');
  return <Text style={styles.medsPreview}>{summary}</Text>;
}

function PrescriptionThumb({ prescription }) {
  if (prescription?.fileUrl) {
    return (
      <Image source={{ uri: prescription.fileUrl.startsWith('http') ? prescription.fileUrl : `${process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000'}/${prescription.fileUrl}` }} style={styles.prescriptionThumb} />
    );
  }
  return (
    <View style={styles.prescriptionIcon}><Ionicons name="document" size={20} color="#225F91" /></View>
  );
}

function SkeletonCard() {
  // Simple shimmer animation
  const shimmer = new Animated.Value(0);
  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 1200, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 1200, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  const bg = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(34,95,145,0.08)', 'rgba(26,186,127,0.13)'],
  });
  return (
    <Animated.View style={[styles.skeletonCard, { backgroundColor: bg }]}> 
      <View style={styles.skeletonRow}>
        <View style={styles.skeletonTitle} />
        <View style={styles.skeletonBadge} />
      </View>
      <View style={styles.skeletonLine} />
      <View style={styles.skeletonLineShort} />
      <View style={styles.skeletonLineShort} />
      <View style={styles.skeletonThumb} />
    </Animated.View>
  );
}

export default function OrdersScreen({ navigation }) {
  const { token } = useContext(AuthContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const PAGE_SIZE = 20;
  const [showAllFilters, setShowAllFilters] = useState(false);

  // Fetch paginated orders
  const fetchOrders = async (opts = {}) => {
    setError('');
    const isRefresh = opts.refresh;
    const isNewFilter = opts.newFilter;
    if (isRefresh || isNewFilter) setPage(1);
    try {
      if (!isRefresh && !isNewFilter) setLoading(true);
      const res = await apiRequest(`/pharmacy/orders?page=${isNewFilter ? 1 : (isRefresh ? 1 : page)}&limit=${PAGE_SIZE}`, 'GET', undefined, token);
      setTotal(res.total || 0);
      if (isRefresh || isNewFilter) {
        setOrders(res.orders || []);
      } else {
        setOrders(prev => [...prev, ...(res.orders || [])]);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  // Initial fetch and when filters/search change
  useEffect(() => {
    setOrders([]);
    setPage(1);
    fetchOrders({ newFilter: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, statusFilter]);

  // Fetch next page
  const loadMore = async () => {
    if (orders.length >= total || loadingMore) return;
    setLoadingMore(true);
    setPage(prev => prev + 1);
    try {
      const nextPage = page + 1;
      const res = await apiRequest(`/pharmacy/orders?page=${nextPage}&limit=${PAGE_SIZE}`, 'GET', undefined, token);
      setOrders(prev => [...prev, ...(res.orders || [])]);
      setTotal(res.total || 0);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingMore(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    setPage(1);
    fetchOrders({ refresh: true });
  };

  // Swipe action handlers
  const handleMarkProcessing = async (orderId) => {
    try {
      await apiRequest(`/pharmacy/orders/${orderId}/status`, 'PATCH', { status: 'PROCESSING' }, token);
      fetchOrders();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleMarkReady = async (orderId) => {
    try {
      await apiRequest(`/pharmacy/orders/${orderId}/status`, 'PATCH', { status: 'READY_FOR_PICKUP' }, token);
      fetchOrders();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCancel = async (orderId) => {
    try {
      await apiRequest(`/pharmacy/orders/${orderId}/status`, 'PATCH', { status: 'CANCELLED' }, token);
      fetchOrders();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleViewDetails = (orderId) => {
    const order = orders.find(o => o.id === orderId);
    navigation.navigate('OrderDetails', { order });
  };

  // Swipe actions row
  const renderHiddenActions = ({ item }) => {
    const canMarkProcessing = item.status === 'CONFIRMED';
    const canMarkReady = item.status === 'PROCESSING';
    const canCancel = item.status !== 'DELIVERED' && item.status !== 'CANCELLED' && item.status !== 'COMPLETED';
    return (
      <View style={styles.swipeActionsRow}>
        {canMarkProcessing && (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#1ABA7F' }]}
            onPress={() => handleMarkProcessing(item.id)}
          >
            <Ionicons name="play" size={22} color="#fff" />
            <Text style={styles.actionText}>Process</Text>
          </TouchableOpacity>
        )}
        {canMarkReady && (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#225F91' }]}
            onPress={() => handleMarkReady(item.id)}
          >
            <Ionicons name="checkmark-done" size={22} color="#fff" />
            <Text style={styles.actionText}>Ready</Text>
          </TouchableOpacity>
        )}
        {canCancel && (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#DC2626' }]}
            onPress={() => handleCancel(item.id)}
          >
            <Ionicons name="close-circle" size={22} color="#fff" />
            <Text style={styles.actionText}>Cancel</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#8B5CF6' }]}
          onPress={() => handleViewDetails(item.id)}
        >
          <Ionicons name="ellipsis-horizontal" size={22} color="#fff" />
          <Text style={styles.actionText}>More</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // Filter client-side for search/status (for now, ideally backend should support this)
  const filtered = orders.filter(order => {
    const q = search.toLowerCase();
    const matchesSearch = (
      order.id.toString().includes(q) ||
      (order.userIdentifier && order.userIdentifier.toLowerCase().includes(q)) ||
      (order.items && order.items.some(i => i.medication?.name?.toLowerCase().includes(q)))
    );
    const matchesStatus = statusFilter === 'ALL' ? true : order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.orderCard} onPress={() => navigation.navigate('OrderDetails', { order: item })} activeOpacity={0.85}>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
          <Text style={styles.orderTitle}>Order #{item.id}</Text>
          <StatusBadge status={item.status} />
        </View>
        <MedicationsPreview items={item.items} />
        <Text style={styles.orderSub}>Name: {item.name || 'N/A'}</Text>
        <Text style={styles.orderSub}>Total: ₦{item.totalPrice?.toLocaleString() || '0'}</Text>
        <Text style={styles.orderSub}>Date: {new Date(item.createdAt).toLocaleDateString()}</Text>
      </View>
      <PrescriptionThumb prescription={item.prescription} />
    </TouchableOpacity>
  );

  const renderSectionHeader = ({ section: { title } }) => (
    <View style={styles.sectionHeader}><Text style={styles.sectionHeaderText}>{title}</Text></View>
  );

  return (
    <LinearGradient colors={['#1ABA7F', '#225F91']} style={styles.gradientBg}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          <Ionicons name="cart-outline" size={32} color="#fff" style={{ marginRight: 12 }} />
          <Text style={styles.title}>Orders</Text>
          <Text style={styles.subtitle}>Manage all your pharmacy orders here.</Text>
        </View>
        <View style={styles.filterRow}>
          {/* Only show 'ALL', 'CONFIRMED', 'PROCESSING' by default, rest under 'More'/'Less' */}
          {(['ALL', 'CONFIRMED', 'PROCESSING'].map(status => (
            <TouchableOpacity
              key={status}
              style={[styles.filterChip, statusFilter === status && { backgroundColor: STATUS_COLORS[status], borderColor: STATUS_COLORS[status] }]}
              onPress={() => setStatusFilter(status)}
              activeOpacity={0.85}
            >
              <Text style={[styles.filterChipText, statusFilter === status && { color: '#fff' }]}>{STATUS_LABELS[status]}</Text>
            </TouchableOpacity>
          )))}
          {showAllFilters && (
            STATUS_ORDER.filter(status => !['CONFIRMED', 'PROCESSING'].includes(status)).map(status => (
              <TouchableOpacity
                key={status}
                style={[styles.filterChip, statusFilter === status && { backgroundColor: STATUS_COLORS[status], borderColor: STATUS_COLORS[status] }]}
                onPress={() => setStatusFilter(status)}
                activeOpacity={0.85}
              >
                <Text style={[styles.filterChipText, statusFilter === status && { color: '#fff' }]}>{STATUS_LABELS[status]}</Text>
              </TouchableOpacity>
            ))
          )}
          <TouchableOpacity
            style={styles.filterChip}
            onPress={() => setShowAllFilters(v => !v)}
            activeOpacity={0.85}
          >
            <Text style={styles.filterChipText}>{showAllFilters ? 'Less' : 'More'}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.searchRow}>
          <Ionicons name="search" size={20} color="#225F91" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by user, order #, or medication"
            placeholderTextColor="#7FB7A3"
            value={search}
            onChangeText={setSearch}
            autoCapitalize="none"
            clearButtonMode="while-editing"
          />
        </View>
        {loading && orders.length === 0 ? (
          <View style={styles.skeletonList}>
            {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
          </View>
        ) : error ? (
          <Text style={styles.error}>{error}</Text>
        ) : filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="file-tray-outline" size={48} color="#fff" style={{ marginBottom: 12, opacity: 0.7 }} />
            <Text style={styles.emptyText}>No orders found.</Text>
          </View>
        ) : (
          <SwipeListView
            data={filtered}
            keyExtractor={item => item.id.toString()}
            renderItem={renderItem}
            renderHiddenItem={renderHiddenActions}
            rightOpenValue={-220}
            disableRightSwipe
            contentContainerStyle={styles.listContent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1ABA7F" />}
            onEndReached={loadMore}
            onEndReachedThreshold={0.2}
            ListFooterComponent={
              loadingMore ? (
                <View style={styles.infiniteScrollSpinner}>
                  <ActivityIndicator size="small" color="#1ABA7F" />
                </View>
              ) : null
            }
          />
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradientBg: { flex: 1 },
  safeArea: { flex: 1 },
  header: { marginTop: 16, marginBottom: 8, alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff', textAlign: 'center', textShadowColor: 'rgba(34,95,145,0.4)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 6 },
  subtitle: { fontSize: 15, color: '#fff', textAlign: 'center', marginTop: 6, textShadowColor: 'rgba(34,95,145,0.2)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 },
  error: { color: '#fff', backgroundColor: 'rgba(220,53,69,0.85)', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4, marginBottom: 12, textAlign: 'center', fontWeight: 'bold', fontSize: 15, marginTop: 24 },
  searchRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 12, paddingHorizontal: 12, marginHorizontal: 16, marginBottom: 12, height: 44, shadowColor: '#1ABA7F', shadowOpacity: 0.08, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
  searchInput: { flex: 1, fontSize: 15, color: '#225F91', height: 44 },
  listContent: { paddingHorizontal: 8, paddingBottom: 32 },
  sectionHeader: { backgroundColor: 'rgba(34,95,145,0.08)', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8, marginTop: 12, marginBottom: 4 },
  sectionHeaderText: { color: '#225F91', fontWeight: 'bold', fontSize: 15, letterSpacing: 0.5 },
  orderCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.97)', borderRadius: 18, padding: 18, marginBottom: 14, shadowColor: '#1ABA7F', shadowOpacity: 0.13, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
  orderTitle: { color: '#225F91', fontWeight: 'bold', fontSize: 17, marginBottom: 2, marginRight: 8 },
  orderSub: { color: '#4B5563', fontSize: 14, marginBottom: 2 },
  medsPreview: { color: '#1ABA7F', fontWeight: '600', fontSize: 14, marginBottom: 2 },
  statusBadge: { paddingVertical: 5, paddingHorizontal: 12, borderRadius: 12, alignSelf: 'flex-start', marginLeft: 8 },
  statusText: { color: '#fff', fontWeight: 'bold', fontSize: 13, textTransform: 'capitalize' },
  prescriptionThumb: { width: 36, height: 36, borderRadius: 8, marginLeft: 12, backgroundColor: '#E5F6F0' },
  prescriptionIcon: { width: 36, height: 36, borderRadius: 8, marginLeft: 12, backgroundColor: '#E5F6F0', alignItems: 'center', justifyContent: 'center' },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 60 },
  emptyText: { color: '#fff', fontSize: 18, fontWeight: '600', opacity: 0.7 },
  skeletonList: { width: '100%', paddingHorizontal: 8, marginTop: 24 },
  skeletonCard: { borderRadius: 18, padding: 18, marginBottom: 14, width: '100%', maxWidth: 500, alignSelf: 'center', backgroundColor: 'rgba(34,95,145,0.08)' },
  skeletonRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  skeletonTitle: { width: 110, height: 18, borderRadius: 6, backgroundColor: 'rgba(34,95,145,0.13)', marginRight: 12 },
  skeletonBadge: { width: 60, height: 18, borderRadius: 9, backgroundColor: 'rgba(26,186,127,0.13)' },
  skeletonLine: { width: '80%', height: 12, borderRadius: 6, backgroundColor: 'rgba(34,95,145,0.10)', marginBottom: 8 },
  skeletonLineShort: { width: '50%', height: 12, borderRadius: 6, backgroundColor: 'rgba(34,95,145,0.10)', marginBottom: 8 },
  skeletonThumb: { width: 36, height: 36, borderRadius: 8, backgroundColor: 'rgba(26,186,127,0.10)', alignSelf: 'flex-end', marginTop: 8 },
  filterRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, marginHorizontal: 8, paddingVertical: 2, flexWrap: 'wrap' },
  filterChip: { backgroundColor: '#fff', borderRadius: 16, borderWidth: 1.5, borderColor: '#E5F6F0', paddingHorizontal: 14, paddingVertical: 7, marginRight: 8, marginBottom: 6 },
  filterChipText: { color: '#225F91', fontWeight: 'bold', fontSize: 14 },
  loadMoreBtn: { backgroundColor: '#225F91', borderRadius: 16, paddingVertical: 14, paddingHorizontal: 32, alignSelf: 'center', marginVertical: 18 },
  loadMoreText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  swipeActionsRow: { flex: 1, flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', height: '95%', marginRight: 8 },
  actionButton: { width: 70, height: '90%', marginLeft: 8, borderRadius: 14, justifyContent: 'center', alignItems: 'center', flexDirection: 'column', elevation: 2 },
  actionText: { color: '#fff', fontWeight: 'bold', fontSize: 13, marginTop: 2 },
  infiniteScrollSpinner: { paddingVertical: 18, alignItems: 'center', justifyContent: 'center' },
}); 