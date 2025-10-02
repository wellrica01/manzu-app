import React, { useState, useContext, useEffect, useRef } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, Alert, Modal, ActivityIndicator, ScrollView, Animated, Keyboard } from 'react-native';
import { usePoS } from '../../context/PoSContext';
import { recordSale } from '../../services/pos';
import { fetchInventory } from '../../services/inventory';
import { AuthContext } from '../../context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const PAYMENT_METHODS = [
  { id: 'Cash', label: 'Cash', icon: 'cash', color: '#16A34A' },
  { id: 'Card', label: 'Card', icon: 'card', color: '#225F91' },
  { id: 'Transfer', label: 'Bank Transfer', icon: 'swap-horizontal', color: '#1ABA7F' },
  { id: 'Other', label: 'Other', icon: 'ellipsis-horizontal', color: '#6B7280' },
];

const MedicationSearchItem = ({ item, onAdd, inCart, cartQuantity }) => {
  const stockPercentage = (item.stock / 100) * 100; // Assuming 100 is max display
  const stockColor = item.stock < 5 ? '#DC2626' : item.stock < 20 ? '#F59E42' : '#16A34A';

  return (
    <View style={styles.medCard}>
      <View style={styles.medCardHeader}>
        <View style={styles.medInfo}>
          <Text style={styles.medName} numberOfLines={2}>{item.displayName}</Text>
          <View style={styles.medMeta}>
            <View style={styles.priceTag}>
              <Ionicons name="cash-outline" size={14} color="#1ABA7F" />
              <Text style={styles.medPrice}>₦{item.price?.toLocaleString()}</Text>
            </View>
            <View style={styles.stockBadge}>
              <View style={[styles.stockDot, { backgroundColor: stockColor }]} />
              <Text style={[styles.stockText, { color: stockColor }]}>
                {item.stock} in stock
              </Text>
            </View>
          </View>
        </View>
        <TouchableOpacity 
          style={[styles.addBtn, inCart && styles.addBtnActive]} 
          onPress={() => onAdd(item)}
          disabled={item.stock < 1}
        >
          <Ionicons name={inCart ? "checkmark" : "add"} size={20} color="#fff" />
        </TouchableOpacity>
      </View>
      {inCart && (
        <View style={styles.inCartIndicator}>
          <Ionicons name="cart" size={12} color="#1ABA7F" />
          <Text style={styles.inCartText}>{cartQuantity} in cart</Text>
        </View>
      )}
    </View>
  );
};

const CartItem = ({ item, onIncrease, onDecrease, onRemove, maxStock }) => {
  const subtotal = item.price * item.quantity;

  return (
    <View style={styles.cartItemCard}>
      <TouchableOpacity 
        style={styles.removeIconBtn}
        onPress={() => onRemove(item.medicationId)}
      >
        <Ionicons name="close-circle" size={20} color="#DC2626" />
      </TouchableOpacity>

      <View style={styles.cartItemContent}>
        <Text style={styles.cartItemName} numberOfLines={2}>{item.name}</Text>
        <Text style={styles.cartItemPrice}>₦{item.price?.toLocaleString()} each</Text>
      </View>

      <View style={styles.cartItemRight}>
        <View style={styles.qtyControls}>
          <TouchableOpacity 
            style={styles.qtyBtn} 
            onPress={() => onDecrease(item.medicationId)}
          >
            <Ionicons name="remove" size={16} color="#225F91" />
          </TouchableOpacity>
          <View style={styles.qtyDisplay}>
            <Text style={styles.qtyText}>{item.quantity}</Text>
          </View>
          <TouchableOpacity 
            style={[styles.qtyBtn, item.quantity >= maxStock && styles.qtyBtnDisabled]} 
            onPress={() => onIncrease(item.medicationId)}
            disabled={item.quantity >= maxStock}
          >
            <Ionicons name="add" size={16} color={item.quantity >= maxStock ? "#9CA3AF" : "#225F91"} />
          </TouchableOpacity>
        </View>
        <Text style={styles.cartItemSubtotal}>₦{subtotal?.toLocaleString()}</Text>
      </View>
    </View>
  );
};

const PaymentMethodModal = ({ visible, onClose, selected, onSelect, onConfirm, total }) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Payment Method</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <View style={styles.totalSummary}>
            <Text style={styles.totalSummaryLabel}>Total Amount</Text>
            <Text style={styles.totalSummaryValue}>₦{total?.toLocaleString()}</Text>
          </View>

          <View style={styles.paymentMethods}>
            {PAYMENT_METHODS.map(method => (
              <TouchableOpacity
                key={method.id}
                style={[
                  styles.paymentMethodCard,
                  selected === method.id && styles.paymentMethodCardSelected,
                ]}
                onPress={() => onSelect(method.id)}
              >
                <View style={[styles.paymentMethodIcon, { backgroundColor: method.color + '15' }]}>
                  <Ionicons name={method.icon} size={24} color={method.color} />
                </View>
                <Text style={styles.paymentMethodLabel}>{method.label}</Text>
                {selected === method.id && (
                  <View style={styles.selectedCheckmark}>
                    <Ionicons name="checkmark-circle" size={24} color="#1ABA7F" />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.confirmPaymentBtn} onPress={onConfirm}>
            <Ionicons name="checkmark-circle" size={20} color="#fff" />
            <Text style={styles.confirmPaymentBtnText}>Complete Sale</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const NewSaleScreen = ({ navigation }) => {
  const [search, setSearch] = useState('');
  const { state, dispatch } = usePoS();
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const { token } = useContext(AuthContext);
  const [inventory, setInventory] = useState([]);
  const [inventoryLoading, setInventoryLoading] = useState(true);
  const searchInputRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

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

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  const filteredMeds = inventory.filter(med =>
    med.displayName?.toLowerCase().includes(search.toLowerCase()) ||
    med.name?.toLowerCase().includes(search.toLowerCase())
  );

  const addToCart = (med) => {
    const cartItem = state.cart.find(item => item.medicationId === (med.medicationId || med.id));
    const currentQty = cartItem ? cartItem.quantity : 0;
    if (med.stock < 1) {
      Alert.alert('Out of Stock', 'This medication is currently out of stock.');
      return;
    }
    if (currentQty + 1 > med.stock) {
      Alert.alert('Stock Limit', `Only ${med.stock} units available in stock.`);
      return;
    }
    dispatch({
      type: 'ADD_TO_CART',
      payload: { 
        medicationId: med.medicationId || med.id, 
        name: med.displayName || med.name, 
        price: med.price, 
        quantity: 1 
      },
    });
    setSearch(''); // Clear search after adding
    Keyboard.dismiss();
  };

  const removeFromCart = (medicationId) => {
    Alert.alert(
      'Remove Item',
      'Remove this item from cart?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => dispatch({ type: 'REMOVE_FROM_CART', payload: { medicationId } }) },
      ]
    );
  };

  const increaseQty = (medicationId) => {
    const med = inventory.find(m => (m.medicationId || m.id) === medicationId);
    const cartItem = state.cart.find(item => item.medicationId === medicationId);
    if (!med) return;
    if (cartItem && cartItem.quantity + 1 > med.stock) {
      Alert.alert('Stock Limit', `Only ${med.stock} units available.`);
      return;
    }
    dispatch({ type: 'ADD_TO_CART', payload: { medicationId, quantity: 1 } });
  };

  const decreaseQty = (medicationId) => {
    const item = state.cart.find(i => i.medicationId === medicationId);
    if (item && item.quantity > 1) {
      dispatch({ type: 'ADD_TO_CART', payload: { medicationId, quantity: -1 } });
    } else {
      removeFromCart(medicationId);
    }
  };

  const total = state.cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const itemCount = state.cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleCheckout = async () => {
    if (state.cart.length === 0) {
      Alert.alert('Empty Cart', 'Please add items to the cart before checkout.');
      return;
    }
    for (const item of state.cart) {
      const med = inventory.find(m => (m.medicationId || m.id) === item.medicationId);
      if (!med || item.quantity > med.stock) {
        Alert.alert('Stock Error', `Insufficient stock for ${item.name}. Please adjust quantity.`);
        return;
      }
    }
    setShowPaymentModal(true);
  };

  const confirmPayment = async () => {
    setShowPaymentModal(false);
    setLoading(true);
    try {
      await recordSale({ items: state.cart, total, paymentMethod }, token);
      dispatch({ type: 'CLEAR_CART' });
      Alert.alert(
        'Sale Completed',
        `Transaction successful! Payment received via ${paymentMethod}.`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (e) {
      Alert.alert('Sale Failed', e.message || 'Failed to record sale. Please try again.');
    }
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#F8FAFC', '#F1F5F9']} style={styles.gradientBg}>
        <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color="#225F91" />
            </TouchableOpacity>
            <View style={styles.headerCenter}>
              <Text style={styles.headerTitle}>New Sale</Text>
              <Text style={styles.headerSubtitle}>Point of Sale</Text>
            </View>
            <View style={styles.headerRight}>
              {state.cart.length > 0 && (
                <View style={styles.cartBadge}>
                  <Text style={styles.cartBadgeText}>{itemCount}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Search Section */}
          <Animated.View style={[styles.searchSection, { opacity: fadeAnim }]}>
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color="#6B7280" style={styles.searchIcon} />
              <TextInput
                ref={searchInputRef}
                style={styles.searchInput}
                placeholder="Search medications by name..."
                value={search}
                onChangeText={setSearch}
                placeholderTextColor="#9CA3AF"
                returnKeyType="search"
              />
              {search.length > 0 && (
                <TouchableOpacity onPress={() => setSearch('')} style={styles.clearBtn}>
                  <Ionicons name="close-circle" size={20} color="#9CA3AF" />
                </TouchableOpacity>
              )}
            </View>
          </Animated.View>

          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Search Results */}
            {search.trim().length > 0 && (
              <View style={styles.searchResults}>
                <Text style={styles.sectionLabel}>
                  {filteredMeds.length} medication{filteredMeds.length !== 1 ? 's' : ''} found
                </Text>
                {inventoryLoading ? (
                  <ActivityIndicator size="large" color="#1ABA7F" style={{ marginVertical: 32 }} />
                ) : filteredMeds.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Ionicons name="search" size={48} color="#D1D5DB" />
                    <Text style={styles.emptyStateText}>No medications found</Text>
                    <Text style={styles.emptyStateSubtext}>Try a different search term</Text>
                  </View>
                ) : (
                  <View style={styles.medList}>
                    {filteredMeds.map(item => {
                      const cartItem = state.cart.find(c => c.medicationId === (item.medicationId || item.id));
                      return (
                        <MedicationSearchItem
                          key={item.medicationId || item.id}
                          item={item}
                          onAdd={addToCart}
                          inCart={!!cartItem}
                          cartQuantity={cartItem?.quantity || 0}
                        />
                      );
                    })}
                  </View>
                )}
              </View>
            )}

            {/* Cart Section */}
            <View style={styles.cartSection}>
              <View style={styles.cartHeader}>
                <View style={styles.cartHeaderLeft}>
                  <Ionicons name="cart" size={22} color="#225F91" />
                  <Text style={styles.cartTitle}>Shopping Cart</Text>
                  {state.cart.length > 0 && (
                    <View style={styles.itemCountBadge}>
                      <Text style={styles.itemCountText}>{itemCount}</Text>
                    </View>
                  )}
                </View>
                {state.cart.length > 0 && (
                  <TouchableOpacity 
                    onPress={() => {
                      Alert.alert(
                        'Clear Cart',
                        'Remove all items from cart?',
                        [
                          { text: 'Cancel', style: 'cancel' },
                          { text: 'Clear', style: 'destructive', onPress: () => dispatch({ type: 'CLEAR_CART' }) },
                        ]
                      );
                    }}
                  >
                    <Text style={styles.clearCartBtn}>Clear All</Text>
                  </TouchableOpacity>
                )}
              </View>

              {state.cart.length === 0 ? (
                <View style={styles.emptyCart}>
                  <Ionicons name="cart-outline" size={64} color="#D1D5DB" />
                  <Text style={styles.emptyCartTitle}>Cart is empty</Text>
                  <Text style={styles.emptyCartText}>Search and add medications to start a sale</Text>
                </View>
              ) : (
                <>
                  <View style={styles.cartList}>
                    {state.cart.map(item => {
                      const med = inventory.find(m => (m.medicationId || m.id) === item.medicationId);
                      return (
                        <CartItem
                          key={item.medicationId}
                          item={item}
                          onIncrease={increaseQty}
                          onDecrease={decreaseQty}
                          onRemove={removeFromCart}
                          maxStock={med?.stock || 0}
                        />
                      );
                    })}
                  </View>

                  {/* Total & Checkout */}
                  <View style={styles.checkoutSection}>
                    <View style={styles.totalRow}>
                      <View>
                        <Text style={styles.totalLabel}>Total Amount</Text>
                        <Text style={styles.totalItems}>{itemCount} item{itemCount !== 1 ? 's' : ''}</Text>
                      </View>
                      <Text style={styles.totalValue}>₦{total?.toLocaleString()}</Text>
                    </View>

                    <TouchableOpacity
                      style={[styles.checkoutBtn, loading && styles.checkoutBtnDisabled]}
                      onPress={handleCheckout}
                      disabled={loading}
                    >
                      {loading ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <>
                          <Ionicons name="card" size={20} color="#fff" />
                          <Text style={styles.checkoutBtnText}>Proceed to Payment</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>

      {/* Payment Method Modal */}
      <PaymentMethodModal
        visible={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        selected={paymentMethod}
        onSelect={setPaymentMethod}
        onConfirm={confirmPayment}
        total={total}
      />
    </View>
  );
};

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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  headerRight: {
    width: 40,
    alignItems: 'flex-end',
  },
  cartBadge: {
    backgroundColor: '#1ABA7F',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 24,
    alignItems: 'center',
  },
  cartBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  searchResults: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
    marginBottom: 12,
  },
  medList: {
    gap: 12,
  },
  medCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  medCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  medInfo: {
    flex: 1,
    marginRight: 12,
  },
  medName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  medMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  priceTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  medPrice: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1ABA7F',
  },
  stockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  stockDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  stockText: {
    fontSize: 12,
    fontWeight: '600',
  },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1ABA7F',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#1ABA7F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  addBtnActive: {
    backgroundColor: '#16A34A',
  },
  inCartIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  inCartText: {
    fontSize: 12,
    color: '#1ABA7F',
    fontWeight: '600',
  },
  cartSection: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  cartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cartHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  itemCountBadge: {
    backgroundColor: '#1ABA7F15',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  itemCountText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1ABA7F',
  },
  clearCartBtn: {
    fontSize: 14,
    fontWeight: '600',
    color: '#DC2626',
  },
  emptyCart: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyCartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyCartText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  cartList: {
    gap: 12,
    marginBottom: 20,
  },
  cartItemCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  removeIconBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 1,
  },
  cartItemContent: {
    flex: 1,
    marginRight: 12,
  },
  cartItemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  cartItemPrice: {
    fontSize: 12,
    color: '#6B7280',
  },
  cartItemRight: {
    alignItems: 'flex-end',
  },
  qtyControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 6,
  },
  qtyBtn: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyBtnDisabled: {
    opacity: 0.3,
  },
  qtyDisplay: {
    minWidth: 32,
    alignItems: 'center',
  },
  qtyText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#111827',
  },
  cartItemSubtotal: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#225F91',
  },
  checkoutSection: {
    borderTopWidth: 2,
    borderTopColor: '#E5E7EB',
    paddingTop: 20,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  totalItems: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  totalValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1ABA7F',
  },
  checkoutBtn: {
    flexDirection: 'row',
    backgroundColor: '#1ABA7F',
    height: 56,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#1ABA7F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  checkoutBtnDisabled: {
    backgroundColor: '#9CA3AF',
  },
  checkoutBtnText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: 'bold',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  totalSummary: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    alignItems: 'center',
  },
  totalSummaryLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  totalSummaryValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1ABA7F',
  },
  paymentMethods: {
    gap: 12,
    marginBottom: 24,
  },
  paymentMethodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  paymentMethodCardSelected: {
    borderColor: '#1ABA7F',
    backgroundColor: '#1ABA7F08',
  },
  paymentMethodIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  paymentMethodLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  selectedCheckmark: {
    marginLeft: 8,
  },
  confirmPaymentBtn: {
    flexDirection: 'row',
    backgroundColor: '#1ABA7F',
    height: 56,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    shadowColor: '#1ABA7F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  confirmPaymentBtnText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: 'bold',
  },
  cancelBtn: {
    padding: 12,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
});

export default NewSaleScreen;
