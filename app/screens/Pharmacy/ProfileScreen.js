import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../../context/AuthContext';
import { apiRequest } from '../../services/api';

export default function ProfileScreen() {
  const { user, token, logout } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    userName: '',
    userEmail: '',
    pharmacyName: '',
    pharmacyAddress: '',
    pharmacyPhone: '',
    pharmacyLicense: '',
  });

  const fetchProfile = async () => {
    setError('');
    try {
      setLoading(true);
      const data = await apiRequest('/pharmacy/profile', 'GET', undefined, token);
      setProfile(data);
      setForm({
        userName: data.user.name,
        userEmail: data.user.email,
        pharmacyName: data.pharmacy.name,
        pharmacyAddress: data.pharmacy.address,
        pharmacyPhone: data.pharmacy.phone,
        pharmacyLicense: data.pharmacy.licenseNumber,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleEditProfile = async () => {
    if (!form.userName || !form.userEmail || !form.pharmacyName || !form.pharmacyAddress || !form.pharmacyPhone) {
      Alert.alert('Error', 'Please fill in all required fields.');
      return;
    }
    setEditLoading(true);
    try {
      await apiRequest('/pharmacy/profile', 'PATCH', {
        user: {
          name: form.userName,
          email: form.userEmail,
        },
        pharmacy: {
          name: form.pharmacyName,
          address: form.pharmacyAddress,
          phone: form.pharmacyPhone,
          licenseNumber: form.pharmacyLicense,
          state: profile.pharmacy.state,
          lga: profile.pharmacy.lga,
          ward: profile.pharmacy.ward,
          latitude: 0, // You might want to get actual coordinates
          longitude: 0,
        },
      }, token);
      setShowEditModal(false);
      fetchProfile();
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setEditLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
  };

  const renderProfileSection = (title, items) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {items.map((item, index) => (
        <View key={index} style={styles.profileItem}>
          <Ionicons name={item.icon} size={20} color="#1ABA7F" style={styles.itemIcon} />
          <View style={styles.itemContent}>
            <Text style={styles.itemLabel}>{item.label}</Text>
            <Text style={styles.itemValue}>{item.value}</Text>
          </View>
        </View>
      ))}
    </View>
  );

  if (loading) {
    return (
      <LinearGradient colors={['#1ABA7F', '#225F91']} style={styles.gradientBg}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.loadingText}>Loading profile...</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#1ABA7F', '#225F91']} style={styles.gradientBg}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
          <Text style={styles.subtitle}>Manage your pharmacy account.</Text>
        </View>
        
        {error ? (
          <Text style={styles.error}>{error}</Text>
        ) : profile ? (
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {/* User Section */}
            {renderProfileSection('User Information', [
              { icon: 'person', label: 'Name', value: profile.user.name },
              { icon: 'mail', label: 'Email', value: profile.user.email },
              { icon: 'shield', label: 'Role', value: profile.user.role },
            ])}

            {/* Pharmacy Section */}
            {renderProfileSection('Pharmacy Information', [
              { icon: 'business', label: 'Name', value: profile.pharmacy.name },
              { icon: 'location', label: 'Address', value: profile.pharmacy.address },
              { icon: 'call', label: 'Phone', value: profile.pharmacy.phone },
              { icon: 'card', label: 'License', value: profile.pharmacy.licenseNumber },
              { icon: 'checkmark-circle', label: 'Status', value: profile.pharmacy.status },
            ])}

            {/* Action Buttons */}
            <View style={styles.actionsContainer}>
              <TouchableOpacity style={styles.editBtn} onPress={() => setShowEditModal(true)}>
                <Ionicons name="create" size={20} color="#fff" />
                <Text style={styles.editBtnText}>Edit Profile</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                <Ionicons name="log-out" size={20} color="#fff" />
                <Text style={styles.logoutBtnText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        ) : null}

        {/* Edit Profile Modal */}
        <Modal
          visible={showEditModal}
          animationType="slide"
          transparent
          onRequestClose={() => setShowEditModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Edit Profile</Text>
              <ScrollView>
                <Text style={styles.modalSectionTitle}>User Information</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Name"
                  value={form.userName}
                  onChangeText={v => setForm(f => ({ ...f, userName: v }))}
                />
                <TextInput
                  style={styles.modalInput}
                  placeholder="Email"
                  value={form.userEmail}
                  onChangeText={v => setForm(f => ({ ...f, userEmail: v }))}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                
                <Text style={styles.modalSectionTitle}>Pharmacy Information</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Pharmacy Name"
                  value={form.pharmacyName}
                  onChangeText={v => setForm(f => ({ ...f, pharmacyName: v }))}
                />
                <TextInput
                  style={styles.modalInput}
                  placeholder="Address"
                  value={form.pharmacyAddress}
                  onChangeText={v => setForm(f => ({ ...f, pharmacyAddress: v }))}
                />
                <TextInput
                  style={styles.modalInput}
                  placeholder="Phone"
                  value={form.pharmacyPhone}
                  onChangeText={v => setForm(f => ({ ...f, pharmacyPhone: v }))}
                  keyboardType="phone-pad"
                />
                <TextInput
                  style={styles.modalInput}
                  placeholder="License Number"
                  value={form.pharmacyLicense}
                  onChangeText={v => setForm(f => ({ ...f, pharmacyLicense: v }))}
                />
                
                <TouchableOpacity
                  style={styles.saveBtn}
                  onPress={handleEditProfile}
                  disabled={editLoading}
                >
                  <Text style={styles.saveBtnText}>{editLoading ? 'Saving...' : 'Save Changes'}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setShowEditModal(false)}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>
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
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: '#fff', fontSize: 16, marginTop: 12 },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 32 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff', marginBottom: 12, textShadowColor: 'rgba(34,95,145,0.3)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 },
  profileItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.97)', borderRadius: 12, padding: 16, marginBottom: 8, shadowColor: '#1ABA7F', shadowOpacity: 0.1, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
  itemIcon: { marginRight: 12 },
  itemContent: { flex: 1 },
  itemLabel: { fontSize: 14, color: '#6B7280', marginBottom: 2 },
  itemValue: { fontSize: 16, fontWeight: '600', color: '#225F91' },
  actionsContainer: { marginTop: 24, gap: 12 },
  editBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#1ABA7F', borderRadius: 12, paddingVertical: 16, paddingHorizontal: 24 },
  editBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16, marginLeft: 8 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#DC2626', borderRadius: 12, paddingVertical: 16, paddingHorizontal: 24 },
  logoutBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16, marginLeft: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.25)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#fff', borderRadius: 18, padding: 24, width: '90%', maxWidth: 400, maxHeight: '80%' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#225F91', marginBottom: 16, textAlign: 'center' },
  modalSectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#225F91', marginTop: 16, marginBottom: 8 },
  modalInput: { borderWidth: 1, borderColor: '#E5F6F0', borderRadius: 10, padding: 12, marginBottom: 12, fontSize: 16, color: '#225F91' },
  saveBtn: { backgroundColor: '#1ABA7F', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 16 },
  saveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  cancelBtn: { backgroundColor: '#E5F6F0', borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginTop: 8 },
  cancelBtnText: { color: '#225F91', fontWeight: 'bold', fontSize: 15 },
}); 