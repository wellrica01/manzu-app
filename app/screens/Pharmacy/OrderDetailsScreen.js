import React, { useState, useContext, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  Image,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { AuthContext } from '../../context/AuthContext';
import { apiRequest } from '../../services/api';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const STATUS_CONFIG = {
  CONFIRMED: { label: 'Pending', color: '#F59E42', icon: 'time-outline', bg: '#FEF3C7' },
  PROCESSING: { label: 'Processing', color: '#1ABA7F', icon: 'refresh-outline', bg: '#D1FAE5' },
  READY_FOR_PICKUP: { label: 'Ready for Pickup', color: '#225F91', icon: 'checkmark-circle-outline', bg: '#DBEAFE' },
  SHIPPED: { label: 'Shipped', color: '#8B5CF6', icon: 'airplane-outline', bg: '#EDE9FE' },
  DELIVERED: { label: 'Delivered', color: '#16A34A', icon: 'checkmark-done-outline', bg: '#DCFCE7' },
  CANCELLED: { label: 'Cancelled', color: '#DC2626', icon: 'close-circle-outline', bg: '#FEE2E2' },
  COMPLETED: { label: 'Completed', color: '#059669', icon: 'shield-checkmark-outline', bg: '#D1FAE5' },
};

const InfoCard = ({ icon, label, value, iconColor = '#225F91' }) => (
  <View style={styles.infoCard}>
    <View style={[styles.infoIconContainer, { backgroundColor: iconColor + '15' }]}>
      <Ionicons name={icon} size={20} color={iconColor} />
    </View>
    <View style={styles.infoContent}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  </View>
);

const MedicationItem = ({ item, index }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      delay: index * 100,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View style={[styles.medCard, { opacity: fadeAnim }]}>
      <View style={styles.medIconContainer}>
        <Ionicons name="medical" size={20} color="#1ABA7F" />
      </View>
      <View style={styles.medInfo}>
        <Text style={styles.medName}>{item.medication?.brandName || item.medication?.name || 'Medication'}</Text>
        {item.medication?.genericName && (
          <Text style={styles.medGeneric}>{item.medication.genericName}</Text>
        )}
      </View>
      <View style={styles.medRight}>
        <Text style={styles.medQty}>×{item.quantity}</Text>
        <Text style={styles.medPrice}>₦{item.price?.toLocaleString() || '0'}</Text>
      </View>
    </Animated.View>
  );
};

const StatusTimeline = ({ status }) => {
  const statusFlow = ['CONFIRMED', 'PROCESSING', 'READY_FOR_PICKUP', 'DELIVERED'];
  const currentIndex = statusFlow.indexOf(status);
  
  if (status === 'CANCELLED' || status === 'COMPLETED') {
    return null;
  }

  return (
    <View style={styles.timeline}>
      {statusFlow.map((s, index) => {
        const config = STATUS_CONFIG[s];
        const isActive = index <= currentIndex;
        const isCurrent = index === currentIndex;
        
        return (
          <View key={s} style={styles.timelineItem}>
            <View style={styles.timelineStep}>
              <View style={[
                styles.timelineDot,
                isActive && { backgroundColor: config.color },
                isCurrent && styles.timelineDotActive
              ]}>
                {isActive && <Ionicons name={config.icon} size={16} color="#fff" />}
              </View>
              {index < statusFlow.length - 1 && (
                <View style={[
                  styles.timelineLine,
                  isActive && { backgroundColor: config.color }
                ]} />
              )}
            </View>
            <Text style={[
              styles.timelineLabel,
              isActive && { color: config.color, fontWeight: '600' }
            ]}>
              {config.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
};

const ActionButton = ({ label, onPress, disabled, variant = 'primary', icon }) => {
  const colors = {
    primary: { bg: '#1ABA7F', text: '#fff' },
    secondary: { bg: '#225F91', text: '#fff' },
    danger: { bg: '#DC2626', text: '#fff' },
    outline: { bg: 'transparent', text: '#225F91', border: '#225F91' }
  };
  
  const style = colors[variant] || colors.primary;
  
  return (
    <TouchableOpacity
      style={[
        styles.actionButton,
        { backgroundColor: style.bg },
        style.border && { borderWidth: 2, borderColor: style.border },
        disabled && styles.actionButtonDisabled
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
    >
      {icon && <Ionicons name={icon} size={20} color={style.text} style={styles.actionIcon} />}
      <Text style={[styles.actionButtonText, { color: style.text }]}>{label}</Text>
    </TouchableOpacity>
  );
};

export default function OrderDetailsScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { token } = useContext(AuthContext);
  const [order, setOrder] = useState(route.params?.order || null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [imageError, setImageError] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const refreshOrder = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await apiRequest(`/pharmacy/orders`, 'GET', undefined, token);
      const updated = res.orders.find(o => o.id === order.id);
      if (updated) {
        setOrder(updated);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (newStatus, confirmMessage) => {
    Alert.alert(
      'Confirm Action',
      confirmMessage || `Mark this order as ${STATUS_CONFIG[newStatus]?.label || newStatus}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            setActionLoading(true);
            setError('');
            try {
              await apiRequest(`/pharmacy/orders/${order.id}`, 'PATCH', { status: newStatus }, token);
              await refreshOrder();
              Alert.alert('Success', `Order marked as ${STATUS_CONFIG[newStatus]?.label || newStatus}`);
            } catch (err) {
              setError(err.message);
              Alert.alert('Error', err.message);
            } finally {
              setActionLoading(false);
            }
          }
        }
      ]
    );
  };

  const openPrescriptionModal = () => {
    setImageError(false);
    setModalVisible(true);
  };

  const getImageUri = () => {
    if (!order.prescription?.fileUrl) return null;
    return order.prescription.fileUrl.startsWith('http')
      ? order.prescription.fileUrl
      : `${process.env.EXPO_PUBLIC_API_URL || 'https://manzu-backend.onrender.com'}/${order.prescription.fileUrl.replace(/^\/+/, '')}`;
  };

  if (!order) {
    return (
      <View style={styles.centered}>
        <Ionicons name="alert-circle-outline" size={64} color="#DC2626" />
        <Text style={styles.errorTitle}>Order Not Found</Text>
        <Text style={styles.errorText}>This order could not be loaded</Text>
        <TouchableOpacity style={styles.errorButton} onPress={() => navigation.goBack()}>
          <Text style={styles.errorButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const config = STATUS_CONFIG[order.status] || STATUS_CONFIG.CONFIRMED;
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#F8FAFC', '#F1F5F9']} style={styles.gradientBg}>
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          {/* Animated Header */}
          <Animated.View style={[styles.header, { opacity: headerOpacity }]}>
            <TouchableOpacity style={styles.headerBackBtn} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color="#111827" />
            </TouchableOpacity>
            <Text style={styles.headerTitle} numberOfLines={1}>Order #{order.id}</Text>
            <View style={styles.headerSpacer} />
          </Animated.View>

          <Animated.ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { y: scrollY } } }],
              { useNativeDriver: true }
            )}
            scrollEventThrottle={16}
          >
            <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
              {/* Hero Section */}
              <View style={styles.heroSection}>
                <TouchableOpacity style={styles.floatingBackBtn} onPress={() => navigation.goBack()}>
                  <Ionicons name="arrow-back" size={24} color="#225F91" />
                </TouchableOpacity>
                
                <View style={styles.heroContent}>
                  <View style={[styles.statusIconLarge, { backgroundColor: config.bg }]}>
                    <Ionicons name={config.icon} size={48} color={config.color} />
                  </View>
                  <Text style={styles.orderTitle}>Order #{order.id}</Text>
                  <View style={[styles.statusBadgeLarge, { backgroundColor: config.color }]}>
                    <Text style={styles.statusBadgeText}>{config.label}</Text>
                  </View>
                  <Text style={styles.orderDate}>
                    {new Date(order.createdAt).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </Text>
                </View>
              </View>

              {/* Status Timeline */}
              <StatusTimeline status={order.status} />

              {/* Customer Information */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="person-outline" size={20} color="#225F91" />
                  <Text style={styles.sectionTitle}>Customer Information</Text>
                </View>
                <View style={styles.sectionContent}>
                  <InfoCard
                    icon="person"
                    label="Name"
                    value={order.name || 'N/A'}
                    iconColor="#225F91"
                  />
                  <InfoCard
                    icon="finger-print"
                    label="User ID"
                    value={order.userIdentifier || 'N/A'}
                    iconColor="#6B7280"
                  />
                  {order.phoneNumber && (
                    <InfoCard
                      icon="call"
                      label="Phone"
                      value={order.phoneNumber}
                      iconColor="#1ABA7F"
                    />
                  )}
                </View>
              </View>

              {/* Delivery Information */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="location-outline" size={20} color="#225F91" />
                  <Text style={styles.sectionTitle}>Delivery Details</Text>
                </View>
                <View style={styles.sectionContent}>
                  <InfoCard
                    icon="bicycle"
                    label="Delivery Method"
                    value={order.deliveryMethod || 'N/A'}
                    iconColor="#8B5CF6"
                  />
                  {order.address && (
                    <InfoCard
                      icon="location"
                      label="Delivery Address"
                      value={order.address}
                      iconColor="#F59E42"
                    />
                  )}
                </View>
              </View>

              {/* Medications */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="medical-outline" size={20} color="#1ABA7F" />
                  <Text style={styles.sectionTitle}>
                    Medications ({order.items?.length || 0})
                  </Text>
                </View>
                <View style={styles.medicationsList}>
                  {order.items && order.items.length > 0 ? (
                    order.items.map((item, index) => (
                      <MedicationItem key={item.id} item={item} index={index} />
                    ))
                  ) : (
                    <View style={styles.emptyMeds}>
                      <Ionicons name="medical-outline" size={48} color="#D1D5DB" />
                      <Text style={styles.emptyMedsText}>No medications</Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Prescription */}
              {order.prescription?.fileUrl && (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Ionicons name="document-text-outline" size={20} color="#225F91" />
                    <Text style={styles.sectionTitle}>Prescription</Text>
                  </View>
                  <TouchableOpacity style={styles.prescriptionCard} onPress={openPrescriptionModal}>
                    <View style={styles.prescriptionIcon}>
                      <Ionicons name="document-text" size={32} color="#225F91" />
                    </View>
                    <View style={styles.prescriptionInfo}>
                      <Text style={styles.prescriptionTitle}>View Prescription Document</Text>
                      <Text style={styles.prescriptionSubtitle}>Tap to view full image</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={24} color="#9CA3AF" />
                  </TouchableOpacity>
                </View>
              )}

              {/* Order Summary */}
              <View style={styles.summarySection}>
                <View style={styles.summaryHeader}>
                  <Ionicons name="receipt-outline" size={20} color="#225F91" />
                  <Text style={styles.summaryTitle}>Order Summary</Text>
                </View>
                <View style={styles.summaryCard}>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Subtotal</Text>
                    <Text style={styles.summaryValue}>₦{order.totalPrice?.toLocaleString() || '0'}</Text>
                  </View>
                  <View style={styles.summaryDivider} />
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryTotalLabel}>Total Amount</Text>
                    <Text style={styles.summaryTotal}>₦{order.totalPrice?.toLocaleString() || '0'}</Text>
                  </View>
                </View>
              </View>

              {/* Error Message */}
              {error && (
                <View style={styles.errorBanner}>
                  <Ionicons name="alert-circle" size={20} color="#DC2626" />
                  <Text style={styles.errorBannerText}>{error}</Text>
                </View>
              )}

              {/* Actions */}
              <View style={styles.actionsSection}>
                <ActionButton
                  label={loading ? 'Refreshing...' : 'Refresh Order'}
                  onPress={refreshOrder}
                  disabled={loading || actionLoading}
                  variant="outline"
                  icon="refresh-outline"
                />

                {order.status === 'CONFIRMED' && (
                  <ActionButton
                    label="Start Processing"
                    onPress={() => updateStatus('PROCESSING', 'Start processing this order?')}
                    disabled={actionLoading}
                    variant="primary"
                    icon="play-outline"
                  />
                )}

                {order.status === 'PROCESSING' && (
                  <ActionButton
                    label="Mark as Ready"
                    onPress={() => updateStatus('READY_FOR_PICKUP', 'Mark this order as ready for pickup?')}
                    disabled={actionLoading}
                    variant="secondary"
                    icon="checkmark-circle-outline"
                  />
                )}

                {order.status === 'READY_FOR_PICKUP' && order.deliveryMethod !== 'PICKUP' && (
                  <ActionButton
                    label="Mark as Shipped"
                    onPress={() => updateStatus('SHIPPED', 'Mark this order as shipped?')}
                    disabled={actionLoading}
                    variant="secondary"
                    icon="airplane-outline"
                  />
                )}

                {(order.status === 'READY_FOR_PICKUP' || order.status === 'SHIPPED') && (
                  <ActionButton
                    label="Mark as Delivered"
                    onPress={() => updateStatus('DELIVERED', 'Confirm that this order has been delivered?')}
                    disabled={actionLoading}
                    variant="primary"
                    icon="checkmark-done-outline"
                  />
                )}

                {!['CANCELLED', 'DELIVERED', 'COMPLETED'].includes(order.status) && (
                  <ActionButton
                    label="Cancel Order"
                    onPress={() => updateStatus('CANCELLED', 'Are you sure you want to cancel this order?')}
                    disabled={actionLoading}
                    variant="danger"
                    icon="close-circle-outline"
                  />
                )}
              </View>
            </Animated.View>
          </Animated.ScrollView>
        </SafeAreaView>
      </LinearGradient>

      {/* Prescription Modal */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Prescription Document</Text>
            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setModalVisible(false)}>
              <Ionicons name="close" size={28} color="#fff" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalContent}>
            {!imageError ? (
              <Image
                source={{ uri: getImageUri() }}
                style={styles.prescriptionImage}
                resizeMode="contain"
                onError={(e) => {
                  console.log('Image load error:', e.nativeEvent.error, 'for URL:', getImageUri());
                  setImageError(true);
                }}
              />
            ) : (
              <View style={styles.imageErrorContainer}>
                <View style={styles.imageErrorIcon}>
                  <Ionicons name="image-outline" size={64} color="#9CA3AF" />
                </View>
                <Text style={styles.imageErrorTitle}>Failed to Load Image</Text>
                <Text style={styles.imageErrorText}>The prescription image could not be loaded</Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
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
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  headerBackBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
    marginHorizontal: 12,
  },
  headerSpacer: {
    width: 40,
  },
  scrollContent: {
    paddingTop: 80,
    paddingBottom: 40,
  },
  content: {
    flex: 1,
  },
  heroSection: {
    backgroundColor: '#fff',
    paddingTop: 60,
    paddingBottom: 32,
    paddingHorizontal: 20,
    alignItems: 'center',
    position: 'relative',
  },
  floatingBackBtn: {
    position: 'absolute',
    top: 16,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  heroContent: {
    alignItems: 'center',
  },
  statusIconLarge: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  orderTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  statusBadgeLarge: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 12,
  },
  statusBadgeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  orderDate: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  timeline: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 24,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  timelineItem: {
    flex: 1,
    alignItems: 'center',
  },
  timelineStep: {
    alignItems: 'center',
    marginBottom: 8,
  },
  timelineDot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  timelineDotActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  timelineLine: {
    position: 'absolute',
    top: 20,
    left: '50%',
    width: 100,
    height: 2,
    backgroundColor: '#E5E7EB',
  },
  timelineLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    textAlign: 'center',
    fontWeight: '500',
  },
  section: {
    backgroundColor: '#fff',
    paddingVertical: 20,
    paddingHorizontal: 20,
    marginBottom: 12,
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
  sectionContent: {
    gap: 12,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  infoIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
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
  medicationsList: {
    gap: 10,
  },
  medCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  medIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#D1FAE5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  medInfo: {
    flex: 1,
  },
  medName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  medGeneric: {
    fontSize: 12,
    color: '#6B7280',
  },
  medRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  medQty: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1ABA7F',
  },
  medPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#225F91',
  },
  emptyMeds: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyMedsText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 12,
  },
  prescriptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DBEAFE',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  prescriptionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  prescriptionInfo: {
    flex: 1,
  },
  prescriptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#225F91',
    marginBottom: 4,
  },
  prescriptionSubtitle: {
    fontSize: 12,
    color: '#6B7280',
  },
  summarySection: {
    backgroundColor: '#fff',
    paddingVertical: 20,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  summaryCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '600',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 12,
  },
  summaryTotalLabel: {
    fontSize: 16,
    color: '#111827',
    fontWeight: 'bold',
  },
  summaryTotal: {
    fontSize: 24,
    color: '#1ABA7F',
    fontWeight: 'bold',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 12,
    gap: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#DC2626',
  },
  errorBannerText: {
    flex: 1,
    fontSize: 14,
    color: '#DC2626',
    fontWeight: '500',
  },
  actionsSection: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
  actionIcon: {
    marginRight: 8,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#F9FAFB',
  },
  errorTitle: {
    fontSize: 20,
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
  errorButton: {
    backgroundColor: '#1ABA7F',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  errorButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  modalCloseBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  prescriptionImage: {
    width: width - 40,
    height: '100%',
    borderRadius: 12,
  },
  imageErrorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  imageErrorIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  imageErrorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  imageErrorText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    lineHeight: 20,
  },
});

