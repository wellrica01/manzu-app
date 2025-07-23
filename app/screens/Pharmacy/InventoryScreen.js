import React, { useEffect, useState, useContext } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TextInput, RefreshControl, Modal, TouchableOpacity, Alert, ScrollView } from 'react-native';
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
  const [filter, setFilter] = useState('all'); // 'all', 'low', 'expired', 'in_stock'
  const [medQuery, setMedQuery] = useState('');
  const [medSuggestions, setMedSuggestions] = useState([]);
  const [selectedMedication, setSelectedMedication] = useState(null);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadInventory();
  };

  // Advanced filtering logic
  const filtered = medications.filter(med => {
    const q = search.toLowerCase();
    const matchesSearch = (
      med.name.toLowerCase().includes(q)
      || (med.expiryDate && med.expiryDate.toLowerCase().includes(q))
    );
    const isLowStock = med.stock < 10;
    const isExpired = med.expiryDate && new Date(med.expiryDate) < new Date();
    const isInStock = med.stock > 0 && !isExpired;
    let matchesFilter = true;
    if (filter === 'low') matchesFilter = isLowStock;
    else if (filter === 'expired') matchesFilter = isExpired;
    else if (filter === 'in_stock') matchesFilter = isInStock;
    return matchesSearch && matchesFilter;
  });

  // Add Medication
  const handleAdd = async () => {
    if (!selectedMedication || !selectedMedication.id || !form.stock || !form.price) {
      Alert.alert('Error', 'Medication, stock, and price are required.');
      return;
    }
    setFormLoading(true);
    try {
      await apiRequest('/pharmacy/medications', 'POST', {
        medicationId: selectedMedication.id,
        stock: Number(form.stock),
        price: Number(form.price),
        expiryDate: form.expiryDate,
      }, token);
      setShowAddModal(false);
      setForm({ name: '', stock: '', price: '', expiryDate: '' });
      setSelectedMedication(null);
      setMedQuery('');
      setMedSuggestions([]);
      loadInventory();
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setFormLoading(false);
    }
  };

  // Edit Medication
  const handleEdit = async () => {
    if (!form.name || !form.stock || !form.price) {
      Alert.alert('Error', 'Name, stock, and price are required.');
      return;
    }
    setFormLoading(true);
    try {
      await apiRequest('/pharmacy/medications', 'PATCH', {
        medicationId: editMed.medicationId,
        stock: Number(form.stock),
        price: Number(form.price),
        expiryDate: form.expiryDate,
      }, token);
      setShowEditModal(false);
      setEditMed(null);
      setForm({ name: '', stock: '', price: '', expiryDate: '' });
      loadInventory();
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setFormLoading(false);
    }
  };

  // Render item with edit button
  const renderItem = ({ item }) => {
    const isLowStock = item.stock < 10;
    const isExpired = item.expiryDate && new Date(item.expiryDate) < new Date();
    const openEdit = () => {
      setEditMed(item);
      setForm({
        name: item.name,
        stock: String(item.stock),
        price: String(item.price),
        expiryDate: item.expiryDate ? item.expiryDate.split('T')[0] : '',
      });
      setShowEditModal(true);
    };
    return (
      <TouchableOpacity
        style={styles.card}
        onLongPress={openEdit}
        activeOpacity={0.85}
      >
        <View style={{ flex: 1 }}>
          <Text style={styles.medName}>{item.displayName}</Text>
          <Text style={styles.medInfo}>Stock: <Text style={isLowStock ? styles.lowStock : styles.stock}>{item.stock}</Text></Text>
          <Text style={styles.medInfo}>Price: ₦{item.price?.toLocaleString() || '0'}</Text>
          <Text style={styles.medInfo}>Expiry: <Text style={isExpired ? styles.expired : styles.expiry}>{item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : 'N/A'}</Text></Text>
        </View>
        {isLowStock && (
          <View style={styles.badge}><Text style={styles.badgeText}>Low</Text></View>
        )}
        {isExpired && (
          <View style={[styles.badge, { backgroundColor: '#DC2626' }]}><Text style={styles.badgeText}>Expired</Text></View>
        )}
        <TouchableOpacity style={styles.editBtn} onPress={openEdit}>
          <Ionicons name="create" size={20} color="#fff" />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  // Add/Edit Modal
  const renderModal = (isEdit = false) => (
    <Modal
      visible={isEdit ? showEditModal : showAddModal}
      animationType="slide"
      transparent
      onRequestClose={() => {
        if (isEdit) { setShowEditModal(false); setEditMed(null); } else { setShowAddModal(false); }
      }}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>{isEdit ? 'Edit Medication' : 'Add Medication'}</Text>
          <ScrollView>
            {/* Medication autocomplete input (add only) */}
            {!isEdit ? (
              <View>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Search medication name"
                  value={medQuery}
                  onChangeText={async v => {
                    setMedQuery(v);
                    setSelectedMedication(null);
                    setForm(f => ({ ...f, name: v }));
                    if (v.length >= 2) {
                      const suggestions = await fetchMedSuggestions(v, token);
                      setMedSuggestions(suggestions);
                    } else {
                      setMedSuggestions([]);
                    }
                  }}
                  editable={!isEdit}
                  autoCorrect={false}
                  autoCapitalize="none"
                />
                {medSuggestions.length > 0 && !selectedMedication && (
                  <View style={{ backgroundColor: '#fff', borderRadius: 8, maxHeight: 180, marginBottom: 8, borderWidth: 1, borderColor: '#E5F6F0' }}>
                    {medSuggestions.map(sug => (
                      <TouchableOpacity
                        key={sug.id}
                        style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: '#E5F6F0' }}
                        onPress={() => {
                          setSelectedMedication(sug);
                          setMedQuery(sug.displayName);
                          setMedSuggestions([]);
                        }}
                      >
                        <Text style={{ color: '#225F91', fontSize: 16 }}>{sug.displayName}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
                {selectedMedication && (
                  <View style={{ marginBottom: 8 }}>
                    <Text style={{ color: '#1ABA7F', fontWeight: 'bold' }}>Selected: {selectedMedication.displayName}</Text>
                  </View>
                )}
              </View>
            ) : (
              <TextInput
                style={styles.modalInput}
                placeholder="Name"
                value={form.name}
                onChangeText={v => setForm(f => ({ ...f, name: v }))}
                editable={false}
              />
            )}
            <TextInput
              style={styles.modalInput}
              placeholder="Stock"
              value={form.stock}
              onChangeText={v => setForm(f => ({ ...f, stock: v }))}
              keyboardType="numeric"
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Price"
              value={form.price}
              onChangeText={v => setForm(f => ({ ...f, price: v }))}
              keyboardType="numeric"
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Expiry Date (YYYY-MM-DD)"
              value={form.expiryDate}
              onChangeText={v => setForm(f => ({ ...f, expiryDate: v }))}
            />
            <TouchableOpacity
              style={styles.saveBtn}
              onPress={isEdit ? handleEdit : handleAdd}
              disabled={formLoading}
            >
              <Text style={styles.saveBtnText}>{formLoading ? 'Saving...' : (isEdit ? 'Save Changes' : 'Add Medication')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => { if (isEdit) { setShowEditModal(false); setEditMed(null); } else { setShowAddModal(false); } }}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  return (
    <LinearGradient colors={['#1ABA7F', '#225F91']} style={styles.gradientBg}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
        <Ionicons name="cube-outline" size={32} color="#fff" style={{ marginRight: 12 }} />
          <Text style={styles.title}>Inventory</Text>
          <Text style={styles.subtitle}>Manage your pharmacy inventory here.</Text>
        </View>
        {/* Filter Chips */}
        <View style={styles.filterRow}>
          {[
            { key: 'all', label: 'All' },
            { key: 'low', label: 'Low Stock' },
            { key: 'expired', label: 'Expired' },
            { key: 'in_stock', label: 'In Stock' },
          ].map(f => (
            <TouchableOpacity
              key={f.key}
              style={[styles.filterChip, filter === f.key && styles.filterChipActive]}
              onPress={() => setFilter(f.key)}
              activeOpacity={0.85}
            >
              <Text style={[styles.filterChipText, filter === f.key && styles.filterChipTextActive]}>{f.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.searchRow}>
          <Ionicons name="search" size={20} color="#225F91" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name or expiry"
            placeholderTextColor="#7FB7A3"
            value={search}
            onChangeText={setSearch}
            autoCapitalize="none"
            clearButtonMode="while-editing"
          />
        </View>
        {loading ? (
          <View style={styles.loading}><ActivityIndicator size="large" color="#1ABA7F" /></View>
        ) : error ? (
          <Text style={styles.error}>{error}</Text>
        ) : filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="cube-outline" size={48} color="#fff" style={{ marginBottom: 12, opacity: 0.7 }} />
            <Text style={styles.emptyText}>No medications found.</Text>
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={item => `${item.medicationId}`}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1ABA7F" />}
          />
        )}
        {/* Floating Action Button for Add */}
        <TouchableOpacity style={styles.fab} onPress={() => { setShowAddModal(true); setForm({ name: '', stock: '', price: '', expiryDate: '' }); }}>
          <Ionicons name="add" size={32} color="#fff" />
        </TouchableOpacity>
        {renderModal(false)}
        {renderModal(true)}
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
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.97)', borderRadius: 18, padding: 18, marginBottom: 14, shadowColor: '#1ABA7F', shadowOpacity: 0.13, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, minHeight: 90 },
  medName: { color: '#225F91', fontWeight: 'bold', fontSize: 17, marginBottom: 2 },
  medInfo: { color: '#4B5563', fontSize: 14, marginBottom: 2 },
  stock: { color: '#1ABA7F', fontWeight: 'bold' },
  lowStock: { color: '#DC2626', fontWeight: 'bold' },
  expiry: { color: '#225F91', fontWeight: 'bold' },
  expired: { color: '#DC2626', fontWeight: 'bold' },
  badge: { backgroundColor: '#F59E42', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4, marginLeft: 10 },
  badgeText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 60 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 60 },
  emptyText: { color: '#fff', fontSize: 18, fontWeight: '600', opacity: 0.7 },
  editBtn: { backgroundColor: '#1ABA7F', borderRadius: 10, padding: 8, marginLeft: 10 },
  fab: { position: 'absolute', right: 24, bottom: 36, backgroundColor: '#1ABA7F', borderRadius: 32, width: 64, height: 64, alignItems: 'center', justifyContent: 'center', elevation: 6, shadowColor: '#1ABA7F', shadowOpacity: 0.25, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.25)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#fff', borderRadius: 18, padding: 24, width: '90%', maxWidth: 400 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#225F91', marginBottom: 16, textAlign: 'center' },
  modalInput: { borderWidth: 1, borderColor: '#E5F6F0', borderRadius: 10, padding: 12, marginBottom: 12, fontSize: 16, color: '#225F91' },
  saveBtn: { backgroundColor: '#1ABA7F', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  saveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  cancelBtn: { backgroundColor: '#E5F6F0', borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginTop: 8 },
  cancelBtnText: { color: '#225F91', fontWeight: 'bold', fontSize: 15 },
  filterRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, marginHorizontal: 8, paddingVertical: 2, flexWrap: 'wrap' },
  filterChip: { backgroundColor: '#fff', borderRadius: 16, borderWidth: 1.5, borderColor: '#E5F6F0', paddingHorizontal: 14, paddingVertical: 7, marginRight: 8, marginBottom: 6 },
  filterChipActive: { backgroundColor: '#1ABA7F', borderColor: '#1ABA7F' },
  filterChipText: { color: '#225F91', fontWeight: 'bold', fontSize: 14 },
  filterChipTextActive: { color: '#fff' },
}); 