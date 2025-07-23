import React, { useEffect, useState, useContext } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { fetchSalesHistory } from '../../services/pos';
import { AuthContext } from '../../context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const SalesHistoryScreen = () => {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const { token } = useContext(AuthContext);

  useEffect(() => {
    const loadSales = async () => {
      setLoading(true);
      const data = await fetchSalesHistory(token);
      setSales(data);
      setLoading(false);
    };
    loadSales();
  }, [token]);

  const renderSale = ({ item }) => (
    <View style={styles.saleCard}>
      <View style={styles.saleHeader}>
        <View style={styles.saleHeaderLeft}>
          <Ionicons name="receipt" size={22} color="#225F91" style={{ marginRight: 8 }} />
          <Text style={styles.saleTime}>{new Date(item.date || item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
        </View>
        <Text style={styles.saleTotal}>₦{item.total}</Text>
        <View style={styles.paymentBadge}>
          <Ionicons name="card" size={14} color="#1ABA7F" style={{ marginRight: 2 }} />
          <Text style={styles.salePayment}>{item.paymentMethod}</Text>
        </View>
      </View>
      <View style={styles.itemsList}>
        {item.items.map((med, idx) => (
          <Text key={med.medicationId + '-' + idx} style={styles.itemText}>
            {med.name} x{med.quantity} - ₦{med.price * med.quantity}
          </Text>
        ))}
      </View>
    </View>
  );

  return (
    <LinearGradient colors={["#1ABA7F", "#225F91"]} style={styles.gradientBg}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={[styles.header, { marginTop: 44 }]}>
          <Ionicons name="time" size={32} color="#fff" style={{ marginRight: 12 }} />
          <View>
            <Text style={styles.title}>Sales History</Text>
            <Text style={styles.subtitle}>All PoS sales made today</Text>
          </View>
        </View>
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#fff" />
          </View>
        ) : sales.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Ionicons name="document-text-outline" size={48} color="#fff" style={{ marginBottom: 12 }} />
            <Text style={styles.empty}>No sales recorded today.</Text>
          </View>
        ) : (
          <FlatList
            data={sales}
            keyExtractor={item => item.id.toString()}
            renderItem={renderSale}
            contentContainerStyle={{ paddingHorizontal: 8, paddingBottom: 32 }}
          />
        )}
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradientBg: { flex: 1 },
  safeArea: { flex: 1, paddingHorizontal: 0 },
  header: { 
    marginTop: 16,
    marginBottom: 8, 
    alignItems: 'center' 
  },
  title: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    color: '#fff', 
    textAlign: 'center', 
    textShadowColor: 'rgba(34,95,145,0.4)', 
    textShadowOffset: { width: 0, height: 2 }, 
    textShadowRadius: 6 
  },
  subtitle: { 
    fontSize: 15, 
    color: '#fff', 
    textAlign: 'center', 
    marginTop: 6, 
    marginBottom: 16,
    textShadowColor: 'rgba(34,95,145,0.2)', 
    textShadowOffset: { width: 0, height: 1 }, 
    textShadowRadius: 3 
  },
  saleCard: {
    backgroundColor: 'rgba(255,255,255,0.97)',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#1ABA7F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 2,
  },
  saleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  saleHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  saleTime: {
    fontWeight: 'bold',
    color: '#225F91',
    fontSize: 16,
  },
  saleTotal: {
    fontWeight: 'bold',
    color: '#1ABA7F',
    fontSize: 18,
  },
  paymentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e6f9f2',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  salePayment: {
    fontStyle: 'italic',
    color: '#1ABA7F',
    fontWeight: 'bold',
    fontSize: 14,
  },
  itemsList: {
    marginLeft: 8,
    marginTop: 4,
  },
  itemText: {
    fontSize: 15,
    color: '#333',
    marginBottom: 2,
  },
  emptyWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 48,
  },
  empty: {
    color: '#fff',
    fontStyle: 'italic',
    fontSize: 18,
    textAlign: 'center',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 48,
  },
});

export default SalesHistoryScreen; 