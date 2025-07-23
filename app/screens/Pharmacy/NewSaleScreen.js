import React, { useState, useContext, useEffect } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, Alert, Modal, ActivityIndicator, ScrollView } from 'react-native';
import { usePoS } from '../../context/PoSContext';
import { recordSale } from '../../services/pos';
import { fetchInventory } from '../../services/inventory';
import { AuthContext } from '../../context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const PAYMENT_METHODS = ['Cash', 'Card', 'Transfer', 'Other'];

const NewSaleScreen = () => {
  const [search, setSearch] = useState('');
  const { state, dispatch } = usePoS();
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHODS[0]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const { token } = useContext(AuthContext);
  const [inventory, setInventory] = useState([]);
  const [inventoryLoading, setInventoryLoading] = useState(true);

  useEffect(() => {
    const loadInventory = async () => {
      setInventoryLoading(true);
      try {
        const meds = await fetchInventory(token);
        setInventory(meds);
      } catch (e) {
        Alert.alert('Error', e.message || 'Failed to load inventory.');
      }
      setInventoryLoading(false);
    };
    loadInventory();
  }, [token]);

  // Filter medications by search
  const filteredMeds = inventory.filter(med =>
    med.name.toLowerCase().includes(search.toLowerCase())
  );

  // Add medication to cart
  const addToCart = (med) => {
    const cartItem = state.cart.find(item => item.medicationId === (med.medicationId || med.id));
    const currentQty = cartItem ? cartItem.quantity : 0;
    if (med.stock < 1) {
      Alert.alert('Out of Stock', 'This medication is out of stock.');
      return;
    }
    if (currentQty + 1 > med.stock) {
      Alert.alert('Stock Limit', `Only ${med.stock} in stock. You cannot add more.`);
      return;
    }
    dispatch({
      type: 'ADD_TO_CART',
      payload: { medicationId: med.medicationId || med.id, name: med.name, price: med.price, quantity: 1 },
    });
  };

  // Remove item from cart
  const removeFromCart = (medicationId) => {
    dispatch({ type: 'REMOVE_FROM_CART', payload: { medicationId } });
  };

  // Increase quantity
  const increaseQty = (medicationId) => {
    const med = inventory.find(m => (m.medicationId || m.id) === medicationId);
    const cartItem = state.cart.find(item => item.medicationId === medicationId);
    if (!med) return;
    if (cartItem && cartItem.quantity + 1 > med.stock) {
      Alert.alert('Stock Limit', `Only ${med.stock} in stock. You cannot add more.`);
      return;
    }
    dispatch({ type: 'ADD_TO_CART', payload: { medicationId, quantity: 1 } });
  };

  // Decrease quantity
  const decreaseQty = (medicationId) => {
    const item = state.cart.find(i => i.medicationId === medicationId);
    if (item && item.quantity > 1) {
      dispatch({ type: 'ADD_TO_CART', payload: { medicationId, quantity: -1 } });
    } else {
      removeFromCart(medicationId);
    }
  };

  // Calculate total
  const total = state.cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // Checkout
  const handleCheckout = async () => {
    if (state.cart.length === 0) {
      Alert.alert('Cart is empty', 'Add items to the cart before checkout.');
      return;
    }
    // Check for any cart item exceeding stock
    for (const item of state.cart) {
      const med = inventory.find(m => (m.medicationId || m.id) === item.medicationId);
      if (!med || item.quantity > med.stock) {
        Alert.alert('Stock Error', `Not enough stock for ${item.name}. Please adjust quantity.`);
        return;
      }
    }
    setShowPaymentModal(true);
  };

  // Confirm payment and record sale
  const confirmPayment = async () => {
    setShowPaymentModal(false);
    setLoading(true);
    try {
      await recordSale({ items: state.cart, total, paymentMethod }, token);
      dispatch({ type: 'CLEAR_CART' });
      Alert.alert('Sale Complete', `The sale has been recorded. Payment: ${paymentMethod}`);
    } catch (e) {
      Alert.alert('Sale Failed', e.message || 'Failed to record sale. Please try again.');
    }
    setLoading(false);
  };

  return (
    <LinearGradient colors={["#1ABA7F", "#225F91"]} style={styles.gradientBg}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <ScrollView contentContainerStyle={{ paddingBottom: 32 }} keyboardShouldPersistTaps="handled">
          <View style={[styles.header, { marginTop: 44 }]}>
            <Ionicons name="add-circle" size={32} color="#fff" style={{ marginRight: 12 }} />
            <View>
              <Text style={styles.title}>New Sale</Text>
              <Text style={styles.subtitle}>Search and add medications to start a sale</Text>
            </View>
          </View>
          <View style={styles.sectionCard}>
            <View style={styles.searchRow}>
              <Ionicons name="search" size={20} color="#225F91" style={{ marginRight: 8 }} />
              <TextInput
                style={styles.search}
                placeholder="Search medication..."
                value={search}
                onChangeText={setSearch}
                placeholderTextColor="#888"
              />
            </View>
            {inventoryLoading ? (
              <ActivityIndicator size="large" color="#1ABA7F" style={{ marginVertical: 32 }} />
            ) : (
              search.trim() === '' ? (
                <Text style={{ color: '#888', textAlign: 'center', marginVertical: 16 }}>
                  Start typing to search for medications.
                </Text>
              ) : (
                <FlatList
                  data={filteredMeds}
                  keyExtractor={item => (item.medicationId || item.id).toString()}
                  renderItem={({ item }) => (
                    <View style={styles.medRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.medName}>{item.displayName}</Text>
                        <Text style={styles.medPrice}>₦{item.price} <Text style={styles.stockLabel}>| Stock: {item.stock}</Text></Text>
                      </View>
                      <TouchableOpacity style={styles.addBtn} onPress={() => addToCart(item)}>
                        <Ionicons name="cart" size={20} color="#fff" />
                        <Text style={styles.addBtnText}>Add</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                  style={{ marginBottom: 8 }}
                  scrollEnabled={false}
                />
              )
            )}
          </View>
          <View style={styles.sectionCard}>
            <View style={styles.cartHeader}>
              <Ionicons name="cart" size={22} color="#1ABA7F" style={{ marginRight: 8 }} />
              <Text style={styles.cartTitle}>Cart</Text>
            </View>
            {state.cart.length === 0 ? (
              <Text style={styles.emptyCart}>Cart is empty</Text>
            ) : (
              <FlatList
                data={state.cart}
                keyExtractor={item => item.medicationId.toString()}
                renderItem={({ item }) => (
                  <View style={styles.cartRow}>
                    <Text style={{ flex: 1 }}>{item.name}</Text>
                    <View style={styles.qtyControls}>
                      <TouchableOpacity style={styles.qtyBtn} onPress={() => decreaseQty(item.medicationId)}>
                        <Text style={styles.qtyBtnText}>-</Text>
                      </TouchableOpacity>
                      <Text style={styles.qtyText}>{item.quantity}</Text>
                      <TouchableOpacity style={styles.qtyBtn} onPress={() => increaseQty(item.medicationId)}>
                        <Text style={styles.qtyBtnText}>+</Text>
                      </TouchableOpacity>
                    </View>
                    <Text style={{ width: 70, textAlign: 'right' }}>₦{item.price * item.quantity}</Text>
                    <TouchableOpacity onPress={() => removeFromCart(item.medicationId)}>
                      <Ionicons name="trash" size={18} color="#E11D48" />
                    </TouchableOpacity>
                  </View>
                )}
                scrollEnabled={false}
              />
            )}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total:</Text>
              <Text style={styles.totalValue}>₦{total}</Text>
            </View>
            <TouchableOpacity
              style={[styles.checkoutBtn, loading && { backgroundColor: '#ccc' }]}
              onPress={handleCheckout}
              disabled={loading}
            >
              <Ionicons name="cash" size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.checkoutBtnText}>{loading ? 'Processing...' : 'Checkout'}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
        {/* Payment Method Modal */}
        <Modal
          visible={showPaymentModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowPaymentModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Select Payment Method</Text>
              {PAYMENT_METHODS.map(method => (
                <TouchableOpacity
                  key={method}
                  style={[
                    styles.paymentOption,
                    paymentMethod === method && styles.selectedPaymentOption,
                  ]}
                  onPress={() => setPaymentMethod(method)}
                >
                  <Text style={styles.paymentOptionText}>{method}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity style={styles.confirmBtn} onPress={confirmPayment}>
                <Text style={styles.confirmBtnText}>Confirm Payment</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowPaymentModal(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
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
  sectionCard: {
    backgroundColor: 'rgba(255,255,255,0.97)',
    borderRadius: 18,
    padding: 18,
    marginHorizontal: 16,
    marginBottom: 18,
    shadowColor: '#1ABA7F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 2,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 12,
  },
  search: {
    flex: 1,
    height: 40,
    fontSize: 16,
    color: '#225F91',
  },
  medRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 12,
  },
  medName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#225F91',
  },
  medPrice: {
    color: '#555',
    fontSize: 14,
    marginTop: 2,
  },
  stockLabel: {
    color: '#1ABA7F',
    fontWeight: 'bold',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1ABA7F',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 6,
    marginLeft: 8,
  },
  addBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 6,
    fontSize: 15,
  },
  cartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#225F91',
  },
  emptyCart: {
    color: '#888',
    fontStyle: 'italic',
    marginBottom: 16,
    textAlign: 'center',
  },
  cartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    padding: 8,
  },
  qtyControls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  qtyBtn: {
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginHorizontal: 2,
  },
  qtyBtnText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1ABA7F',
  },
  qtyText: {
    fontSize: 16,
    marginHorizontal: 4,
    minWidth: 20,
    textAlign: 'center',
  },
  removeBtn: {
    color: '#E11D48',
    marginLeft: 12,
    fontWeight: 'bold',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1ABA7F',
  },
  checkoutBtn: {
    flexDirection: 'row',
    backgroundColor: '#1ABA7F',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  checkoutBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    width: 300,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  paymentOption: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    marginBottom: 8,
    width: '100%',
    alignItems: 'center',
  },
  selectedPaymentOption: {
    borderColor: '#1ABA7F',
    backgroundColor: '#e6f9f2',
  },
  paymentOptionText: {
    fontSize: 16,
  },
  confirmBtn: {
    backgroundColor: '#1ABA7F',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 12,
    marginBottom: 4,
  },
  confirmBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  cancelBtnText: {
    color: '#E11D48',
    marginTop: 8,
    fontWeight: 'bold',
  },
});

export default NewSaleScreen; 