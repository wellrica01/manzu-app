import React, { useEffect, useState, useContext, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, FlatList, TouchableOpacity, RefreshControl, TextInput, Animated, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthContext } from '../../context/AuthContext';
import { apiRequest } from '../../services/api';
import { Ionicons } from '@expo/vector-icons';

const STATUS_CONFIG = {
  ALL: { label: 'All Orders', color: '#6B7280', icon: 'apps', bg: '#F3F4F6' },
  CONFIRMED: { label: 'Pending', color: '#F59E42', icon: 'time', bg: '#FEF3C7' },
  PROCESSING: { label: 'Processing', color: '#1ABA7F', icon: 'refresh', bg: '#D1FAE5' },
  READY_FOR_PICKUP: { label: 'Ready', color: '#225F91', icon: 'checkmark-circle', bg: '#DBEAFE' },
  SHIPPED: { label: 'Shipped', color: '#8B5CF6', icon: 'airplane', bg: '#EDE9FE' },
  DELIVERED: { label: 'Delivered', color: '#16A34A', icon: 'checkmark-done', bg: '#DCFCE7' },
  CANCELLED: { label: 'Cancelled', color: '#DC2626', icon: 'close-circle', bg: '#FEE2E2' },
  COMPLETED: { label: 'Completed', color: '#059669', icon: 'shield-checkmark', bg: '#D1FAE5' },
};

const FilterChip = ({ status, active, onPress, count }) => {
  const config = STATUS_CONFIG[status];
  return (
    <TouchableOpacity
      style={[
        styles.filterChip,
        active && { backgroundColor: config.color, borderColor: config.color }
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Ionicons name={config.icon} size={16} color={active ? '#fff' : config.color} />
      <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
        {config.label}
      </Text>
      {count !== undefined && count > 0 && (
        <View style={[styles.filterBadge, active && styles.filterBadgeActive]}>
          <Text style={[styles.filterBadgeText, active && styles.filterBadgeTextActive]}>
            {count}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const OrderCard = ({ order, onPress }) => {
  const config = STATUS_CONFIG[order.status] || STATUS_CONFIG.CONFIRMED;
  const itemCount = order.items?.length || 0;
  const hasRx = order.prescription?.fileUrl;

  return (
    <TouchableOpacity style={styles.orderCard} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <View style={[styles.statusIndicator, { backgroundColor: config.color + '15' }]}>
            <Ionicons name={config.icon} size={20} color={config.color} />
          </View>
          <View style={styles.orderIdSection}>
            <Text style={styles.orderId}>Order #{order.id}</Text>
            <Text style={styles.orderDate}>
              {new Date(order.createdAt).toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: config.bg }]}>
          <Text style={[styles.statusText, { color: config.color }]}>{config.label}</Text>
        </View>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.infoRow}>
          <Ionicons name="person-outline" size={16} color="#6B7280" />
          <Text style={styles.infoText}>{order.name || 'N/A'}</Text>
        </View>

        {order.items && order.items.length > 0 && (
          <View style={styles.medicationsSection}>
            <View style={styles.medsHeader}>
              <Ionicons name="medical" size={14} color="#1ABA7F" />
              <Text style={styles.medsCount}>{itemCount} medication{itemCount !== 1 ? 's' : ''}</Text>
            </View>
            <Text style={styles.medsPreview} numberOfLines={2}>
              {order.items.slice(0, 3).map(i => i.medication?.brandName || i.medication?.name).filter(Boolean).join(', ')}
              {itemCount > 3 && ` +${itemCount - 3} more`}
            </Text>
          </View>
        )}

        <View style={styles.cardFooter}>
          <View style={styles.priceSection}>
            <Text style={styles.priceLabel}>Total</Text>
            <Text style={styles.priceValue}>₦{order.totalPrice?.toLocaleString() || '0'}</Text>
          </View>
          {hasRx && (
            <View style={styles.rxBadge}>
              <Ionicons name="document-text" size={14} color="#225F91" />
              <Text style={styles.rxText}>Rx</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const SkeletonCard = () => {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
        Animated.timing(shimmerAnim, { toValue: 0, duration: 1000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View style={[styles.skeletonCard, { opacity }]}>
      <View style={styles.skeletonHeader}>
        <View style={styles.skeletonCircle} />
        <View style={styles.skeletonBlock} />
      </View>
      <View style={styles.skeletonLine} />
      <View style={styles.skeletonLineShort} />
      <View style={styles.skeletonFooter}>
        <View style={styles.skeletonBlock} />
        <View style={styles.skeletonBadge} />
      </View>
    </Animated.View>
  );
};

export default function OrdersScreen({ navigation, route }) {
  const { token } = useContext(AuthContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(route?.params?.filter || 'ALL');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const PAGE_SIZE = 20;

  const fetchOrders = async (opts = {}) => {
    setError('');
    const isRefresh = opts.refresh;
    const isNewFilter = opts.newFilter;
    const currentPage = isRefresh || isNewFilter ? 1 : page;
    
    try {
      if (!isRefresh && !isNewFilter && !opts.loadMore) setLoading(true);
      const res = await apiRequest(`/pharmacy/orders?page=${currentPage}&limit=${PAGE_SIZE}`, 'GET', undefined, token);
      setTotal(res.total || 0);
      
      if (isRefresh || isNewFilter) {
        setOrders(res.orders || []);
        setPage(1);
      } else if (opts.loadMore) {
        setOrders(prev => [...prev, ...(res.orders || [])]);
      } else {
        setOrders(res.orders || []);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchOrders({ newFilter: true });
  }, [statusFilter]);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  const loadMore = async () => {
    if (orders.length >= total || loadingMore || loading) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    setPage(nextPage);
    
    try {
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
    fetchOrders({ refresh: true });
  };

  const filtered = orders.filter(order => {
    const q = search.toLowerCase();
    const matchesSearch = !q || (
      order.id.toString().includes(q) ||
      order.name?.toLowerCase().includes(q) ||
      order.userIdentifier?.toLowerCase().includes(q) ||
      order.items?.some(i => 
        i.medication?.brandName?.toLowerCase().includes(q) ||
        i.medication?.name?.toLowerCase().includes(q)
      )
    );
    const matchesStatus = statusFilter === 'ALL' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Get status counts
  const statusCounts = orders.reduce((acc, order) => {
    acc[order.status] = (acc[order.status] || 0) + 1;
    return acc;
  }, {});

  const mainFilters = ['ALL', 'CONFIRMED', 'PROCESSING', 'READY_FOR_PICKUP'];
  const otherFilters = ['SHIPPED', 'DELIVERED', 'COMPLETED', 'CANCELLED'];

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#F8FAFC', '#F1F5F9']} style={styles.gradientBg}>
        <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <View style={styles.headerIcon}>
                <Ionicons name="receipt" size={24} color="#225F91" />
              </View>
              <View>
                <Text style={styles.headerTitle}>Orders</Text>
                <Text style={styles.headerSubtitle}>
                  {filtered.length} of {total} order{total !== 1 ? 's' : ''}
                </Text>
              </View>
            </View>
          </View>

          {/* Search */}
          <Animated.View style={[styles.searchSection, { opacity: fadeAnim }]}>
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color="#6B7280" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search orders, customers, medications..."
                value={search}
                onChangeText={setSearch}
                placeholderTextColor="#9CA3AF"
                autoCapitalize="none"
              />
              {search.length > 0 && (
                <TouchableOpacity onPress={() => setSearch('')} style={styles.clearBtn}>
                  <Ionicons name="close-circle" size={20} color="#9CA3AF" />
                </TouchableOpacity>
              )}
            </View>
          </Animated.View>

          {/* Filters */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterContainer}
          >
            {mainFilters.map(status => (
              <FilterChip
                key={status}
                status={status}
                active={statusFilter === status}
                onPress={() => setStatusFilter(status)}
                count={status === 'ALL' ? total : statusCounts[status]}
              />
            ))}
            <View style={styles.filterDivider} />
            {otherFilters.map(status => (
              <FilterChip
                key={status}
                status={status}
                active={statusFilter === status}
                onPress={() => setStatusFilter(status)}
                count={statusCounts[status]}
              />
            ))}
          </ScrollView>

          {/* Content */}
          {loading && orders.length === 0 ? (
            <View style={styles.skeletonContainer}>
              {[...Array(5)].map((_, i) => <SkeletonCard key={i} />)}
            </View>
          ) : error ? (
            <View style={styles.centerContent}>
              <Ionicons name="alert-circle" size={48} color="#DC2626" />
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity style={styles.retryBtn} onPress={() => fetchOrders({ refresh: true })}>
                <Text style={styles.retryBtnText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : filtered.length === 0 ? (
            <View style={styles.centerContent}>
              <Ionicons name="file-tray-outline" size={64} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>
                {search ? 'No orders found' : 'No orders yet'}
              </Text>
              <Text style={styles.emptyText}>
                {search 
                  ? 'Try adjusting your search or filters' 
                  : 'Orders will appear here when customers place them'
                }
              </Text>
            </View>
          ) : (
            <FlatList
              data={filtered}
              keyExtractor={item => item.id.toString()}
              renderItem={({ item }) => (
                <OrderCard 
                  order={item} 
                  onPress={() => navigation.navigate('OrderDetails', { order: item })}
                />
              )}
              contentContainerStyle={styles.listContent}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1ABA7F" />
              }
              onEndReached={loadMore}
              onEndReachedThreshold={0.3}
              ListFooterComponent={
                loadingMore ? (
                  <View style={styles.loadMoreContainer}>
                    <ActivityIndicator size="small" color="#1ABA7F" />
                    <Text style={styles.loadMoreText}>Loading more...</Text>
                  </View>
                ) : null
              }
              showsVerticalScrollIndicator={false}
            />
          )}
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
  searchSection: {
    padding: 20,
    backgroundColor: '#fff',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
  },
  clearBtn: {
    padding: 4,
  },
  filterContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 8,
    gap: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  filterChipTextActive: {
    color: '#fff',
  },
  filterBadge: {
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
  },
  filterBadgeActive: {
    backgroundColor: '#fff',
  },
  filterBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#374151',
  },
  filterBadgeTextActive: {
    color: '#1ABA7F',
  },
  filterDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 8,
  },
  listContent: {
    padding: 20,
    paddingBottom: 40,
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  statusIndicator: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  orderIdSection: {
    flex: 1,
  },
  orderId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 2,
  },
  orderDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  cardBody: {
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  medicationsSection: {
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 12,
  },
  medsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  medsCount: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1ABA7F',
  },
  medsPreview: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  priceSection: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  priceLabel: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  priceValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#225F91',
  },
  rxBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  rxText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#225F91',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorText: {
    fontSize: 16,
    color: '#DC2626',
    marginTop: 16,
    textAlign: 'center',
  },
  retryBtn: {
    backgroundColor: '#1ABA7F',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 16,
  },
  retryBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 16,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
  loadMoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 10,
  },
  loadMoreText: {
    fontSize: 14,
    color: '#6B7280',
  },
  skeletonContainer: {
    padding: 20,
  },
  skeletonCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  skeletonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  skeletonCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  skeletonBlock: {
    flex: 1,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  skeletonLine: {
    height: 14,
    borderRadius: 7,
    backgroundColor: '#F3F4F6',
    marginBottom: 8,
    width: '80%',
  },
  skeletonLineShort: {
    height: 14,
    borderRadius: 7,
    backgroundColor: '#F3F4F6',
    marginBottom: 12,
    width: '60%',
  },
  skeletonFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skeletonBadge: {
    width: 60,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
});