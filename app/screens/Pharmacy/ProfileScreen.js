import React, { useState, useEffect, useContext, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../../context/AuthContext';
import { apiRequest } from '../../services/api';

const { width } = Dimensions.get('window');

const ProfileHeader = ({ profile }) => {
  const initials = profile?.user?.name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'PH';

  return (
    <View style={styles.profileHeader}>
      <View style={styles.avatarContainer}>
        <LinearGradient
          colors={['#1ABA7F', '#225F91']}
          style={styles.avatar}
        >
          <Text style={styles.avatarText}>{initials}</Text>
        </LinearGradient>
        <View style={styles.statusBadge}>
          <Ionicons name="checkmark-circle" size={20} color="#1ABA7F" />
        </View>
      </View>
      <Text style={styles.profileName}>{profile?.user?.name || 'Pharmacy User'}</Text>
      <Text style={styles.profileRole}>{profile?.pharmacy?.name || 'Pharmacy'}</Text>
      <View style={styles.verificationBadge}>
        <Ionicons name="shield-checkmark" size={16} color="#225F91" />
        <Text style={styles.verificationText}>Verified Account</Text>
      </View>
    </View>
  );
};

const InfoCard = ({ icon, label, value, iconColor = '#225F91', onPress }) => {
  const Component = onPress ? TouchableOpacity : View;
  
  return (
    <Component 
      style={styles.infoCard}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={[styles.infoIconContainer, { backgroundColor: iconColor + '15' }]}>
        <Ionicons name={icon} size={20} color={iconColor} />
      </View>
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue} numberOfLines={2}>{value}</Text>
      </View>
      {onPress && (
        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
      )}
    </Component>
  );
};

const ActionButton = ({ icon, label, onPress, variant = 'primary' }) => {
  const colors = {
    primary: { bg: ['#1ABA7F', '#159B6A'], text: '#fff', iconBg: 'rgba(255,255,255,0.2)' },
    secondary: { bg: ['#225F91', '#1A4970'], text: '#fff', iconBg: 'rgba(255,255,255,0.2)' },
    danger: { bg: ['#DC2626', '#B91C1C'], text: '#fff', iconBg: 'rgba(255,255,255,0.2)' },
  };
  
  const style = colors[variant] || colors.primary;
  
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <LinearGradient colors={style.bg} style={styles.actionButton}>
        <View style={[styles.actionIconContainer, { backgroundColor: style.iconBg }]}>
          <Ionicons name={icon} size={22} color={style.text} />
        </View>
        <Text style={[styles.actionButtonText, { color: style.text }]}>{label}</Text>
        <Ionicons name="chevron-forward" size={20} color={style.text} />
      </LinearGradient>
    </TouchableOpacity>
  );
};

const SkeletonLoader = () => {
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
    <View style={styles.skeletonContainer}>
      <Animated.View style={[styles.skeletonCircle, { opacity }]} />
      <Animated.View style={[styles.skeletonLine, { opacity, width: '60%', marginTop: 16 }]} />
      <Animated.View style={[styles.skeletonLine, { opacity, width: '40%', marginTop: 8 }]} />
      
      <View style={styles.skeletonSection}>
        {[1, 2, 3].map(i => (
          <Animated.View key={i} style={[styles.skeletonCard, { opacity }]} />
        ))}
      </View>
    </View>
  );
};

export default function ProfileScreen() {
  const { user, token, logout } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [error, setError] = useState('');
  const fadeAnim = useRef(new Animated.Value(0)).current;
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
      
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start();
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
      Alert.alert('Validation Error', 'Please fill in all required fields.');
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
          latitude: profile.pharmacy.latitude || 0,
          longitude: profile.pharmacy.longitude || 0,
        },
      }, token);
      setShowEditModal(false);
      await fetchProfile();
      Alert.alert('Success', 'Your profile has been updated successfully!');
    } catch (err) {
      Alert.alert('Update Failed', err.message);
    } finally {
      setEditLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Confirm Logout',
      'Are you sure you want to logout from your account?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive', 
          onPress: logout 
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={['#F8FAFC', '#F1F5F9']} style={styles.gradientBg}>
          <SafeAreaView style={styles.safeArea} edges={['top']}>
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Profile</Text>
            </View>
            <SkeletonLoader />
          </SafeAreaView>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#F8FAFC', '#F1F5F9']} style={styles.gradientBg}>
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Profile</Text>
            <TouchableOpacity 
              style={styles.refreshButton}
              onPress={fetchProfile}
            >
              <Ionicons name="refresh" size={20} color="#225F91" />
            </TouchableOpacity>
          </View>

          {error ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={48} color="#DC2626" />
              <Text style={styles.errorTitle}>Failed to Load Profile</Text>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={fetchProfile}>
                <Text style={styles.retryButtonText}>Try Again</Text>
              </TouchableOpacity>
            </View>
          ) : profile ? (
            <Animated.ScrollView 
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              style={{ opacity: fadeAnim }}
            >
              {/* Profile Header */}
              <ProfileHeader profile={profile} />

              {/* Quick Actions */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Quick Actions</Text>
                <View style={styles.actionsGrid}>
                  <ActionButton
                    icon="create-outline"
                    label="Edit Profile"
                    onPress={() => setShowEditModal(true)}
                    variant="primary"
                  />
                  <ActionButton
                    icon="log-out-outline"
                    label="Logout"
                    onPress={handleLogout}
                    variant="danger"
                  />
                </View>
              </View>

              {/* User Information */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="person-outline" size={20} color="#225F91" />
                  <Text style={styles.sectionTitle}>User Information</Text>
                </View>
                <View style={styles.cardsContainer}>
                  <InfoCard
                    icon="person"
                    label="Full Name"
                    value={profile.user.name}
                    iconColor="#225F91"
                  />
                  <InfoCard
                    icon="mail"
                    label="Email Address"
                    value={profile.user.email}
                    iconColor="#1ABA7F"
                  />
                  <InfoCard
                    icon="shield-checkmark"
                    label="Account Role"
                    value={profile.user.role.charAt(0).toUpperCase() + profile.user.role.slice(1)}
                    iconColor="#8B5CF6"
                  />
                </View>
              </View>

              {/* Pharmacy Information */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="business-outline" size={20} color="#225F91" />
                  <Text style={styles.sectionTitle}>Pharmacy Information</Text>
                </View>
                <View style={styles.cardsContainer}>
                  <InfoCard
                    icon="business"
                    label="Pharmacy Name"
                    value={profile.pharmacy.name}
                    iconColor="#225F91"
                  />
                  <InfoCard
                    icon="location"
                    label="Address"
                    value={profile.pharmacy.address}
                    iconColor="#F59E42"
                  />
                  <InfoCard
                    icon="call"
                    label="Phone Number"
                    value={profile.pharmacy.phone}
                    iconColor="#1ABA7F"
                  />
                  <InfoCard
                    icon="card"
                    label="License Number"
                    value={profile.pharmacy.licenseNumber}
                    iconColor="#8B5CF6"
                  />
                  <InfoCard
                    icon="checkmark-circle"
                    label="Verification Status"
                    value={profile.pharmacy.status.charAt(0).toUpperCase() + profile.pharmacy.status.slice(1)}
                    iconColor={profile.pharmacy.status === 'verified' ? '#16A34A' : '#F59E42'}
                  />
                </View>
              </View>

              {/* Location Details */}
              {(profile.pharmacy.state || profile.pharmacy.lga || profile.pharmacy.ward) && (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Ionicons name="map-outline" size={20} color="#225F91" />
                    <Text style={styles.sectionTitle}>Location Details</Text>
                  </View>
                  <View style={styles.cardsContainer}>
                    {profile.pharmacy.state && (
                      <InfoCard
                        icon="globe"
                        label="State"
                        value={profile.pharmacy.state}
                        iconColor="#225F91"
                      />
                    )}
                    {profile.pharmacy.lga && (
                      <InfoCard
                        icon="location"
                        label="LGA"
                        value={profile.pharmacy.lga}
                        iconColor="#1ABA7F"
                      />
                    )}
                    {profile.pharmacy.ward && (
                      <InfoCard
                        icon="pin"
                        label="Ward"
                        value={profile.pharmacy.ward}
                        iconColor="#F59E42"
                      />
                    )}
                  </View>
                </View>
              )}
            </Animated.ScrollView>
          ) : null}

          {/* Edit Profile Modal */}
          <Modal
            visible={showEditModal}
            animationType="slide"
            transparent={true}
            onRequestClose={() => setShowEditModal(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContainer}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Edit Profile</Text>
                  <TouchableOpacity
                    style={styles.modalCloseBtn}
                    onPress={() => setShowEditModal(false)}
                  >
                    <Ionicons name="close" size={24} color="#6B7280" />
                  </TouchableOpacity>
                </View>

                <ScrollView 
                  style={styles.modalScroll}
                  showsVerticalScrollIndicator={false}
                >
                  {/* User Information Section */}
                  <View style={styles.modalSection}>
                    <View style={styles.modalSectionHeader}>
                      <Ionicons name="person" size={18} color="#225F91" />
                      <Text style={styles.modalSectionTitle}>User Information</Text>
                    </View>
                    
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Full Name *</Text>
                      <View style={styles.inputContainer}>
                        <Ionicons name="person-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
                        <TextInput
                          style={styles.input}
                          placeholder="Enter your full name"
                          value={form.userName}
                          onChangeText={v => setForm(f => ({ ...f, userName: v }))}
                          placeholderTextColor="#9CA3AF"
                        />
                      </View>
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Email Address *</Text>
                      <View style={styles.inputContainer}>
                        <Ionicons name="mail-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
                        <TextInput
                          style={styles.input}
                          placeholder="your@email.com"
                          value={form.userEmail}
                          onChangeText={v => setForm(f => ({ ...f, userEmail: v }))}
                          keyboardType="email-address"
                          autoCapitalize="none"
                          placeholderTextColor="#9CA3AF"
                        />
                      </View>
                    </View>
                  </View>

                  {/* Pharmacy Information Section */}
                  <View style={styles.modalSection}>
                    <View style={styles.modalSectionHeader}>
                      <Ionicons name="business" size={18} color="#225F91" />
                      <Text style={styles.modalSectionTitle}>Pharmacy Information</Text>
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Pharmacy Name *</Text>
                      <View style={styles.inputContainer}>
                        <Ionicons name="business-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
                        <TextInput
                          style={styles.input}
                          placeholder="Enter pharmacy name"
                          value={form.pharmacyName}
                          onChangeText={v => setForm(f => ({ ...f, pharmacyName: v }))}
                          placeholderTextColor="#9CA3AF"
                        />
                      </View>
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Address *</Text>
                      <View style={styles.inputContainer}>
                        <Ionicons name="location-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
                        <TextInput
                          style={[styles.input, styles.textArea]}
                          placeholder="Enter complete address"
                          value={form.pharmacyAddress}
                          onChangeText={v => setForm(f => ({ ...f, pharmacyAddress: v }))}
                          multiline
                          numberOfLines={3}
                          placeholderTextColor="#9CA3AF"
                        />
                      </View>
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Phone Number *</Text>
                      <View style={styles.inputContainer}>
                        <Ionicons name="call-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
                        <TextInput
                          style={styles.input}
                          placeholder="+234 XXX XXX XXXX"
                          value={form.pharmacyPhone}
                          onChangeText={v => setForm(f => ({ ...f, pharmacyPhone: v }))}
                          keyboardType="phone-pad"
                          placeholderTextColor="#9CA3AF"
                        />
                      </View>
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>License Number</Text>
                      <View style={styles.inputContainer}>
                        <Ionicons name="card-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
                        <TextInput
                          style={styles.input}
                          placeholder="Enter license number"
                          value={form.pharmacyLicense}
                          onChangeText={v => setForm(f => ({ ...f, pharmacyLicense: v }))}
                          placeholderTextColor="#9CA3AF"
                        />
                      </View>
                    </View>
                  </View>

                  <View style={styles.modalActions}>
                    <TouchableOpacity
                      style={[styles.modalButton, styles.modalButtonPrimary]}
                      onPress={handleEditProfile}
                      disabled={editLoading}
                    >
                      {editLoading ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <>
                          <Ionicons name="checkmark-circle" size={20} color="#fff" />
                          <Text style={styles.modalButtonTextPrimary}>Save Changes</Text>
                        </>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.modalButton, styles.modalButtonSecondary]}
                      onPress={() => setShowEditModal(false)}
                      disabled={editLoading}
                    >
                      <Ionicons name="close-circle-outline" size={20} color="#6B7280" />
                      <Text style={styles.modalButtonTextSecondary}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              </View>
            </View>
          </Modal>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#111827',
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  profileHeader: {
    backgroundColor: '#fff',
    paddingVertical: 32,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
  },
  statusBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
    textAlign: 'center',
  },
  profileRole: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 12,
    textAlign: 'center',
  },
  verificationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  verificationText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#225F91',
  },
  section: {
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  actionsGrid: {
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  actionIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  actionButtonText: {
    flex: 1,
    fontSize: 16,
    fontWeight: 'bold',
  },
  cardsContainer: {
    gap: 10,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  infoIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#1ABA7F',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  skeletonContainer: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
  },
  skeletonCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#E5E7EB',
  },
  skeletonLine: {
    height: 16,
    borderRadius: 8,
    backgroundColor: '#E5E7EB',
  },
  skeletonSection: {
    width: '100%',
    marginTop: 32,
    gap: 12,
  },
  skeletonCard: {
    height: 80,
    borderRadius: 12,
    backgroundColor: '#E5E7EB',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  modalCloseBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalScroll: {
    maxHeight: '100%',
  },
  modalSection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#225F91',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    paddingVertical: 14,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalActions: {
    padding: 20,
    gap: 12,
  },
  modalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  modalButtonPrimary: {
    backgroundColor: '#1ABA7F',
    shadowColor: '#1ABA7F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  modalButtonSecondary: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  modalButtonTextPrimary: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  modalButtonTextSecondary: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
});