import React, { useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, ScrollView, Alert, Linking } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { apiRequest } from '../../services/api';
import { Ionicons } from '@expo/vector-icons';

const STATUS_COLORS = {
  CONFIRMED: '#F59E42', // Backend: confirmed, Frontend: pending
  PROCESSING: '#1ABA7F',
  READY_FOR_PICKUP: '#225F91',
  SHIPPED: '#8B5CF6',
  DELIVERED: '#16A34A',
  CANCELLED: '#DC2626',
  COMPLETED: '#059669',
};

const STATUS_LABELS = {
  CONFIRMED: 'Pending', // Backend: confirmed, Frontend: pending
  PROCESSING: 'Processing',
  READY_FOR_PICKUP: 'Ready for Pickup',
  SHIPPED: 'Shipped',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
  COMPLETED: 'Completed',
};

function StatusBadge({ status }) {
  const displayStatus = STATUS_LABELS[status] || status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  return (
    <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[status] || '#888' }]}> 
      <Text style={styles.statusText}>{displayStatus}</Text>
    </View>
  );
}

export default function OrderDetailsScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { token } = useContext(AuthContext);
  const [order, setOrder] = useState(route.params?.order || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const refreshOrder = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await apiRequest(`/pharmacy/orders`, 'GET', undefined, token);
      const updated = res.orders.find(o => o.id === order.id);
      setOrder(updated || order);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (status) => {
    setActionLoading(true);
    setError('');
    try {
      await apiRequest(`/pharmacy/orders/${order.id}`, 'PATCH', { status }, token);
      await refreshOrder();
      Alert.alert('Success', `Order marked as ${status.replace(/_/g, ' ')}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (!order) {
    return (
      <View style={styles.centered}><Text style={styles.error}>Order not found.</Text></View>
    );
  }

  return (
    <LinearGradient colors={['#1ABA7F', '#225F91']} style={styles.gradientBg}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#225F91" />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
          <View style={styles.headerRow}>
            <Text style={styles.title}>Order #{order.id}</Text>
            <StatusBadge status={order.status} />
          </View>
          <Text style={styles.label}>User ID:</Text>
          <Text style={styles.value}>{order.userIdentifier || 'N/A'}</Text>
          <Text style={styles.label}>Date:</Text>
          <Text style={styles.value}>{new Date(order.createdAt).toLocaleString()}</Text>
          <Text style={styles.label}>Delivery Method:</Text>
          <Text style={styles.value}>{order.deliveryMethod || 'N/A'}</Text>
          {order.address && <>
            <Text style={styles.label}>Address:</Text>
            <Text style={styles.value}>{order.address}</Text>
          </>}
          <Text style={styles.label}>Medications:</Text>
          <View style={styles.medsList}>
            {order.items && order.items.length > 0 ? order.items.map(item => (
              <View key={item.id} style={styles.medRow}>
                <Text style={styles.medName}>{item.medication?.name || 'Medication'}</Text>
                <Text style={styles.medQty}>x{item.quantity}</Text>
                <Text style={styles.medPrice}>₦{item.price?.toLocaleString() || '0'}</Text>
              </View>
            )) : <Text style={styles.value}>No medications</Text>}
          </View>
          {order.prescription?.fileUrl && (
            <TouchableOpacity style={styles.prescriptionBtn} onPress={() => Linking.openURL(order.prescription.fileUrl)}>
              <Text style={styles.prescriptionText}>View Prescription</Text>
            </TouchableOpacity>
          )}
          <Text style={styles.label}>Total:</Text>
          <Text style={styles.total}>₦{order.totalPrice?.toLocaleString() || '0'}</Text>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.actionBtn} onPress={refreshOrder} disabled={loading || actionLoading}>
              <Text style={styles.actionText}>{loading ? 'Refreshing...' : 'Refresh'}</Text>
            </TouchableOpacity>
            {order.status === 'CONFIRMED' && (
              <TouchableOpacity style={styles.actionBtn} onPress={() => updateStatus('PROCESSING')} disabled={actionLoading}>
                <Text style={styles.actionText}>Mark as Processing</Text>
              </TouchableOpacity>
            )}
            {order.status === 'PROCESSING' && (
              <TouchableOpacity style={styles.actionBtn} onPress={() => updateStatus('READY_FOR_PICKUP')} disabled={actionLoading}>
                <Text style={styles.actionText}>Mark as Ready</Text>
              </TouchableOpacity>
            )}
            {order.status === 'READY_FOR_PICKUP' && (
              <TouchableOpacity style={styles.actionBtn} onPress={() => updateStatus('DELIVERED')} disabled={actionLoading}>
                <Text style={styles.actionText}>Mark as Delivered</Text>
              </TouchableOpacity>
            )}
            {order.status !== 'CANCELLED' && order.status !== 'DELIVERED' && order.status !== 'COMPLETED' && (
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#DC2626' }]} onPress={() => updateStatus('CANCELLED')} disabled={actionLoading}>
                <Text style={styles.actionText}>Cancel Order</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradientBg: { flex: 1 },
  safeArea: { flex: 1 },
  scrollContent: { flexGrow: 1, padding: 24 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  backBtn: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, alignSelf: 'flex-start' },
  backText: { color: '#225F91', fontWeight: 'bold', fontSize: 16, marginLeft: 4 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#fff', textShadowColor: 'rgba(34,95,145,0.4)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 6 },
  statusBadge: { paddingVertical: 6, paddingHorizontal: 14, borderRadius: 12, alignSelf: 'flex-start', marginLeft: 12 },
  statusText: { color: '#fff', fontWeight: 'bold', fontSize: 13, textTransform: 'capitalize' },
  label: { color: '#225F91', fontWeight: 'bold', fontSize: 15, marginTop: 10 },
  value: { color: '#fff', fontSize: 15, marginTop: 2 },
  medsList: { marginTop: 6, marginBottom: 10 },
  medRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(255,255,255,0.93)', borderRadius: 10, padding: 10, marginBottom: 6 },
  medName: { color: '#225F91', fontWeight: 'bold', fontSize: 15 },
  medQty: { color: '#1ABA7F', fontWeight: 'bold', fontSize: 15 },
  medPrice: { color: '#4B5563', fontWeight: 'bold', fontSize: 15 },
  prescriptionBtn: { backgroundColor: '#225F91', borderRadius: 10, paddingVertical: 10, paddingHorizontal: 18, alignItems: 'center', marginVertical: 12 },
  prescriptionText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  total: { color: '#1ABA7F', fontWeight: 'bold', fontSize: 22, marginTop: 2, marginBottom: 12 },
  error: { color: '#fff', backgroundColor: 'rgba(220,53,69,0.85)', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4, marginBottom: 12, textAlign: 'center', fontWeight: 'bold', fontSize: 15, marginTop: 12 },
  actionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 10, justifyContent: 'flex-start' },
  actionBtn: { backgroundColor: '#1ABA7F', borderRadius: 10, paddingVertical: 10, paddingHorizontal: 16, marginVertical: 6, marginRight: 8, shadowColor: '#225F91', shadowOpacity: 0.13, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
  actionText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
}); 