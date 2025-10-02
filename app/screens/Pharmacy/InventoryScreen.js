import React, { useEffect, useState, useContext, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TextInput, RefreshControl, Modal, TouchableOpacity, Alert, ScrollView, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthContext } from '../../context/AuthContext';
import { fetchInventory } from '../../services/inventory';
import { Ionicons } from '@expo/vector-icons';
import { apiRequest } from '../../services/api';

// Helper: fetch medication suggestions
async function fetchMedSuggestions(query, token) {
  if (!query) return [];
  try {
    const res = await apiRequest(`/medication-suggestions?q=${encodeURIComponent(query)}`, 'GET', undefined, token);
    return res;
  } catch {
    return [];
  }
}

const FilterChip = ({ label, icon, active, onPress, count }) => (
  <TouchableOpacity
    style={[styles.filterChip, active && styles.filterChipActive]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <Ionicons name={icon} size={16} color={active ? '#fff' : '#225F91'} />
    <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
      {label}
    </Text>
    {count > 0 && (
      <View style={[styles.filterCount, active && styles.filterCountActive]}>
        <Text style={[styles.filterCountText, active && styles.filterCountTextActive]}>
          {count}
        </Text>
      </View>
    )}
  </TouchableOpacity>
);

const InventoryCard = ({ item, onEdit }) => {
  const isLowStock = item.stock < 10;
  const isOutOfStock = item.stock === 0;
  const isExpired = item.expiryDate && new Date(item.expiryDate) < new Date();
  const expiryDate = item.expiryDate ? new Date(item.expiryDate) : null;
  const daysUntilExpiry = expiryDate ? Math.ceil((expiryDate - new Date()) / (1000 * 60 * 60 * 24)) : null;
  const isExpiringSoon = daysUntilExpiry !== null && daysUntilExpiry > 0 && daysUntilExpiry <= 30;

  const getStockColor = () => {
    if (isOutOfStock) return '#DC2626';
    if (isLowStock) return '#F59E42';
    return '#16A34A';
  };

  const getStockLabel = () => {
    if (isOutOfStock) return 'Out of Stock';
    if (isLowStock) return 'Low Stock';
    return 'In Stock';
  };

  return (
    <TouchableOpacity
      style={styles.inventoryCard}
      onPress={onEdit}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <View style={[styles.stockIndicator, { backgroundColor: getStockColor() + '15' }]}>
            <View style={[styles.stockDot, { backgroundColor: getStockColor() }]} />
          </View>
          <View style={styles.cardTitleSection}>
            <Text style={styles.cardTitle} numberOfLines={2}>{item.displayName}</Text>
            <View style={styles.stockBadge}>
              <Text style={[styles.stockBadgeText, { color: getStockColor() }]}>
                {getStockLabel()}
              </Text>
            </View>
          </View>
        </View>
        <TouchableOpacity style={styles.editIconBtn} onPress={onEdit}>
          <Ionicons name="create-outline" size={20} color="#6B7280" />
        </TouchableOpacity>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Ionicons name="cube-outline" size={16} color="#6B7280" />
            <Text style={styles.infoLabel}>Stock</Text>
            <Text style={[styles.infoValue, { color: getStockColor() }]}>
              {item.stock}
            </Text>
          </View>
          <View style={styles.infoDivider} />
          <View style={styles.infoItem}>
            <Ionicons name="cash-outline" size={16} color="#6B7280" />
            <Text style={styles.infoLabel}>Price</Text>
            <Text style={styles.infoValue}>₦{item.price?.toLocaleString() || '0'}</Text>
          </View>
        </View>

        {(isExpired || isExpiringSoon) && (
          <View style={[styles.expiryAlert, { backgroundColor: isExpired ? '#DC262615' : '#F59E4215' }]}>
            <Ionicons 
              name={isExpired ? "alert-circle" : "time-outline"} 
              size={14} 
              color={isExpired ? '#DC2626' : '#F59E42'} 
            />
            <Text style={[styles.expiryAlertText, { color: isExpired ? '#DC2626' : '#F59E42' }]}>
              {isExpired 
                ? 'Expired' 
                : `Expires in ${daysUntilExpiry} day${daysUntilExpiry !== 1 ? 's' : ''}`
              }
            </Text>
            {expiryDate && (
              <Text style={styles.expiryDate}>
                {expiryDate.toLocaleDateString()}
              </Text>
            )}
          </View>
        )}

        {!isExpired && !isExpiringSoon && expiryDate && (
          <View style={styles.expiryInfo}>
            <Ionicons name="calendar-outline" size={14} color="#9CA3AF" />
            <Text style={styles.expiryInfoText}>
              Expires: {expiryDate.toLocaleDateString()}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const MedicationModal = ({ visible, onClose, isEdit, form, setForm, onSave, loading, medQuery, setMedQuery, medSuggestions, setMedSuggestions, selectedMedication, setSelectedMedication, token }) => {
  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>
                {isEdit ? 'Edit Medication' : 'Add New Medication'}
              </Text>
              <Text style={styles.modalSubtitle}>
                {isEdit ? 'Update stock and pricing' : 'Add to your inventory'}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            {/* Medication Search (Add only) */}
            {!isEdit ? (
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Medication Name *</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="search" size={20} color="#9CA3AF" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Search medication..."
                    value={medQuery}
                    onChangeText={async v => {
                      setMedQuery(v);
                      setSelectedMedication(null);
                      if (v.length >= 2) {
                        const suggestions = await fetchMedSuggestions(v, token);
                        setMedSuggestions(suggestions);
                      } else {
                        setMedSuggestions([]);
                      }
                    }}
                    autoCorrect={false}
                    autoCapitalize="none"
                  />
                </View>

                {medSuggestions.length > 0 && !selectedMedication && (
                  <View style={styles.suggestionsContainer}>
                    <Text style={styles.suggestionsLabel}>Suggestions:</Text>
                    {medSuggestions.map(sug => (
                      <TouchableOpacity
                        key={sug.id}
                        style={styles.suggestionItem}
                        onPress={() => {
                          setSelectedMedication(sug);
                          setMedQuery(sug.displayName);
                          setMedSuggestions([]);
                        }}
                      >
                        <Ionicons name="medical" size={16} color="#1ABA7F" />
                        <Text style={styles.suggestionText}>{sug.displayName}</Text>
                        <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {selectedMedication && (
                  <View style={styles.selectedMedication}>
                    <Ionicons name="checkmark-circle" size={20} color="#1ABA7F" />
                    <Text style={styles.selectedMedText}>{selectedMedication.displayName}</Text>
                  </View>
                )}
              </View>
            ) : (
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Medication Name</Text>
                <View style={[styles.inputWrapper, styles.inputDisabled]}>
                  <Ionicons name="medical" size={20} color="#9CA3AF" style={styles.inputIcon} />
                  <Text style={styles.inputDisabledText}>{form.name}</Text>
                </View>
              </View>
            )}

            {/* Stock */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Stock Quantity *</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="cube-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter stock quantity"
                  value={form.stock}
                  onChangeText={v => setForm(f => ({ ...f, stock: v }))}
                  keyboardType="numeric"
                />
              </View>
            </View>

            {/* Price */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Price (₦) *</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="cash-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter price"
                  value={form.price}
                  onChangeText={v => setForm(f => ({ ...f, price: v }))}
                  keyboardType="numeric"
                />
              </View>
            </View>

            {/* Expiry Date */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Expiry Date (Optional)</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="calendar-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="YYYY-MM-DD"
                  value={form.expiryDate}
                  onChangeText={v => setForm(f => ({ ...f, expiryDate: v }))}
                />
              </View>
              <Text style={styles.helperText}>Format: YYYY-MM-DD (e.g., 2025-12-31)</Text>
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={onClose}
            >
              <Text style={styles.secondaryBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.primaryBtn, loading && styles.primaryBtnDisabled]}
              onPress={onSave}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={20} color="#fff" />
                  <Text style={styles.primaryBtnText}>
                    {isEdit ? 'Save Changes' : 'Add to Inventory'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default function InventoryScreen() {
  const { token } = useContext(AuthContext);
  const [medications, setMedications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editMed, setEditMed] = useState(null);
  const [form, setForm] = useState({ name: '', stock: '', price: '', expiryDate: '' });
  const [formLoading, setFormLoading] = useState(false);
  const [filter, setFilter] = useState('all');
  const [medQuery, setMedQuery] = useState('');
  const [medSuggestions, setMedSuggestions] = useState([]);
  const [selectedMedication, setSelectedMedication] = useState(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const loadInventory = async () => {
    setError('');
    try {
      setLoading(true);
      const meds = await fetchInventory(token);
      setMedications(meds);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadInventory();
  }, []);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadInventory();
  };

  // Filter logic
  const getFilteredMedications = () => {
    return medications.filter(med => {
      const q = search.toLowerCase();
      const matchesSearch = (
        med.displayName?.toLowerCase().includes(q) ||
        med.name?.toLowerCase().includes(q)
      );

      const isLowStock = med.stock < 10;
      const isExpired = med.expiryDate && new Date(med.expiryDate) < new Date();
      const isInStock = med.stock > 0 && !isExpired;

      let matchesFilter = true;
      if (filter === 'low') matchesFilter = isLowStock && !isExpired;
      else if (filter === 'expired') matchesFilter = isExpired;
      else if (filter === 'in_stock') matchesFilter = isInStock && !isLowStock;

      return matchesSearch && matchesFilter;
    });
  };

  // Get counts for filter chips
  const getCounts = () => {
    const lowStock = medications.filter(m => m.stock < 10 && !(m.expiryDate && new Date(m.expiryDate) < new Date())).length;
    const expired = medications.filter(m => m.expiryDate && new Date(m.expiryDate) < new Date()).length;
    const inStock = medications.filter(m => m.stock > 0 && !(m.stock < 10) && !(m.expiryDate && new Date(m.expiryDate) < new Date())).length;
    return { lowStock, expired, inStock, all: medications.length };
  };

  const counts = getCounts();
  const filtered = getFilteredMedications();

  // Add Medication
  const handleAdd = async () => {
    if (!selectedMedication || !selectedMedication.id || !form.stock || !form.price) {
      Alert.alert('Missing Information', 'Please select a medication and fill in stock and price.');
      return;
    }
    setFormLoading(true);
    try {
      await apiRequest('/pharmacy/medications', 'POST', {
        medicationId: selectedMedication.id,
        stock: Number(form.stock),
        price: Number(form.price),
        expiryDate: form.expiryDate || undefined,
      }, token);
      setShowAddModal(false);
      setForm({ name: '', stock: '', price: '', expiryDate: '' });
      setSelectedMedication(null);
      setMedQuery('');
      setMedSuggestions([]);
      Alert.alert('Success', 'Medication added to inventory successfully.');
      loadInventory();
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setFormLoading(false);
    }
  };

  // Edit Medication
  const handleEdit = async () => {
    if (!form.stock || !form.price) {
      Alert.alert('Missing Information', 'Stock and price are required.');
      return;
    }
    setFormLoading(true);
    try {
      await apiRequest('/pharmacy/medications', 'PATCH', {
        medicationId: editMed.medicationId,
        stock: Number(form.stock),
        price: Number(form.price),
        expiryDate: form.expiryDate || undefined,
      }, token);
      setShowEditModal(false);
      setEditMed(null);
      setForm({ name: '', stock: '', price: '', expiryDate: '' });
      Alert.alert('Success', 'Medication updated successfully.');
      loadInventory();
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const openEdit = (item) => {
    setEditMed(item);
    setForm({
      name: item.displayName || item.name,
      stock: String(item.stock),
      price: String(item.price),
      expiryDate: item.expiryDate ? item.expiryDate.split('T')[0] : '',
    });
    setShowEditModal(true);
  };

  const openAdd = () => {
    setForm({ name: '', stock: '', price: '', expiryDate: '' });
    setSelectedMedication(null);
    setMedQuery('');
    setMedSuggestions([]);
    setShowAddModal(true);
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#F8FAFC', '#F1F5F9']} style={styles.gradientBg}>
        <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <View style={styles.headerIcon}>
                <Ionicons name="cube" size={24} color="#225F91" />
              </View>
              <View>
                <Text style={styles.headerTitle}>Inventory</Text>
                <Text style={styles.headerSubtitle}>{medications.length} medication{medications.length !== 1 ? 's' : ''} total</Text>
              </View>
            </View>
          </View>

          {/* Search Bar */}
          <Animated.View style={[styles.searchSection, { opacity: fadeAnim }]}>
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color="#6B7280" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search medications..."
                value={search}
                onChangeText={setSearch}
                placeholderTextColor="#9CA3AF"
                autoCapitalize="none"
              />
              {search.length > 0 && (
                <TouchableOpacity onPress={() => setSearch('')} style={styles.clearSearchBtn}>
                  <Ionicons name="close-circle" size={20} color="#9CA3AF" />
                </TouchableOpacity>
              )}
            </View>
          </Animated.View>

          {/* Filter Chips */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterContainer}
          >
            <FilterChip
              label="All"
              icon="apps"
              active={filter === 'all'}
              onPress={() => setFilter('all')}
              count={counts.all}
            />
            <FilterChip
              label="In Stock"
              icon="checkmark-circle"
              active={filter === 'in_stock'}
              onPress={() => setFilter('in_stock')}
              count={counts.inStock}
            />
            <FilterChip
              label="Low Stock"
              icon="alert-circle"
              active={filter === 'low'}
              onPress={() => setFilter('low')}
              count={counts.lowStock}
            />
            <FilterChip
              label="Expired"
              icon="time"
              active={filter === 'expired'}
              onPress={() => setFilter('expired')}
              count={counts.expired}
            />
          </ScrollView>

          {/* Content */}
          {loading ? (
            <View style={styles.centerContent}>
              <ActivityIndicator size="large" color="#1ABA7F" />
              <Text style={styles.loadingText}>Loading inventory...</Text>
            </View>
          ) : error ? (
            <View style={styles.centerContent}>
              <Ionicons name="alert-circle" size={48} color="#DC2626" />
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity style={styles.retryBtn} onPress={loadInventory}>
                <Text style={styles.retryBtnText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : filtered.length === 0 ? (
            <View style={styles.centerContent}>
              <Ionicons name="cube-outline" size={64} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>
                {search ? 'No medications found' : 'No medications in inventory'}
              </Text>
              <Text style={styles.emptyText}>
                {search 
                  ? 'Try adjusting your search or filters' 
                  : 'Add your first medication to get started'
                }
              </Text>
              {!search && (
                <TouchableOpacity style={styles.emptyActionBtn} onPress={openAdd}>
                  <Ionicons name="add-circle" size={20} color="#fff" />
                  <Text style={styles.emptyActionBtnText}>Add Medication</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <FlatList
              data={filtered}
              keyExtractor={item => `${item.medicationId}`}
              renderItem={({ item }) => <InventoryCard item={item} onEdit={() => openEdit(item)} />}
              contentContainerStyle={styles.listContent}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1ABA7F" />
              }
              showsVerticalScrollIndicator={false}
            />
          )}

          {/* Floating Action Button */}
          <TouchableOpacity style={styles.fab} onPress={openAdd}>
            <Ionicons name="add" size={28} color="#fff" />
          </TouchableOpacity>

          {/* Modals */}
          <MedicationModal
            visible={showAddModal}
            onClose={() => {
              setShowAddModal(false);
              setSelectedMedication(null);
              setMedQuery('');
              setMedSuggestions([]);
            }}
            isEdit={false}
            form={form}
            setForm={setForm}
            onSave={handleAdd}
            loading={formLoading}
            medQuery={medQuery}
            setMedQuery={setMedQuery}
            medSuggestions={medSuggestions}
            setMedSuggestions={setMedSuggestions}
            selectedMedication={selectedMedication}
            setSelectedMedication={setSelectedMedication}
            token={token}
          />

          <MedicationModal
            visible={showEditModal}
            onClose={() => {
              setShowEditModal(false);
              setEditMed(null);
            }}
            isEdit={true}
            form={form}
            setForm={setForm}
            onSave={handleEdit}
            loading={formLoading}
            token={token}
          />
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
  clearSearchBtn: {
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
  filterChipActive: {
    backgroundColor: '#1ABA7F',
    borderColor: '#1ABA7F',
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#225F91',
  },
  filterChipTextActive: {
    color: '#fff',
  },
  filterCount: {
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
  },
  filterCountActive: {
    backgroundColor: '#fff',
  },
  filterCountText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#225F91',
  },
  filterCountTextActive: {
    color: '#1ABA7F',
  },
  listContent: {
    padding: 20,
    paddingBottom: 100,
  },
  inventoryCard: {
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
    alignItems: 'flex-start',
    flex: 1,
    gap: 12,
  },
  stockIndicator: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stockDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  cardTitleSection: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 6,
  },
  stockBadge: {
    alignSelf: 'flex-start',
  },
  stockBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  editIconBtn: {
    padding: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
  },
  cardBody: {
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 12,
  },
  infoLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  infoValue: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#225F91',
  },
  expiryAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 10,
    borderRadius: 10,
  },
  expiryAlertText: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  expiryDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  expiryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  expiryInfoText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 12,
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
  emptyActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#1ABA7F',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 24,
  },
  emptyActionBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#1ABA7F',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#1ABA7F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 24,
    width: '90%',
    maxWidth: 500,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
  },
  closeBtn: {
    padding: 4,
  },
  modalBody: {
    padding: 24,
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    height: 48,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
  },
  inputDisabled: {
    backgroundColor: '#F3F4F6',
  },
  inputDisabledText: {
    flex: 1,
    fontSize: 15,
    color: '#6B7280',
  },
  helperText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 6,
  },
  suggestionsContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    maxHeight: 200,
  },
  suggestionsLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    padding: 12,
    paddingBottom: 8,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  suggestionText: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
  },
  selectedMedication: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#1ABA7F15',
    padding: 12,
    borderRadius: 10,
    marginTop: 8,
  },
  selectedMedText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#1ABA7F',
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    padding: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  secondaryBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
  },
  primaryBtn: {
    flex: 1,
    flexDirection: 'row',
    height: 48,
    borderRadius: 12,
    backgroundColor: '#1ABA7F',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#1ABA7F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  primaryBtnDisabled: {
    backgroundColor: '#9CA3AF',
  },
  primaryBtnText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#fff',
  },
});
