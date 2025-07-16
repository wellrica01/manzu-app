import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function NotificationsScreen({ navigation }) {
  // Mock notifications data - replace with real API call
  const notifications = [
    { id: 1, type: 'order', title: 'New Order', message: 'Order #1234 has been placed', time: '2 min ago', unread: true },
    { id: 2, type: 'inventory', title: 'Low Stock Alert', message: 'Paracetamol is running low', time: '1 hour ago', unread: true },
    { id: 3, type: 'system', title: 'System Update', message: 'App has been updated to v2.1', time: '3 hours ago', unread: false },
  ];

  const renderNotification = ({ item }) => (
    <View style={[styles.notificationCard, item.unread && styles.unreadCard]}>
      <View style={styles.notificationIcon}>
        <Ionicons 
          name={
            item.type === 'order' ? 'list' : 
            item.type === 'inventory' ? 'cube' : 
            'notifications'
          } 
          size={20} 
          color="#1ABA7F" 
        />
      </View>
      <View style={styles.notificationContent}>
        <Text style={styles.notificationTitle}>{item.title}</Text>
        <Text style={styles.notificationMessage}>{item.message}</Text>
        <Text style={styles.notificationTime}>{item.time}</Text>
      </View>
      {item.unread && <View style={styles.unreadDot} />}
    </View>
  );

  return (
    <LinearGradient colors={['#1ABA7F', '#225F91']} style={styles.gradientBg}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>Notifications</Text>
          <View style={styles.placeholder} />
        </View>
        <FlatList
          data={notifications}
          keyExtractor={item => item.id.toString()}
          renderItem={renderNotification}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradientBg: { flex: 1 },
  safeArea: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 16 },
  backBtn: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 12, padding: 8 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#fff', textAlign: 'center', flex: 1 },
  placeholder: { width: 40 },
  listContent: { paddingHorizontal: 16, paddingBottom: 32 },
  notificationCard: { 
    flexDirection: 'row', 
    backgroundColor: 'rgba(255,255,255,0.97)', 
    borderRadius: 16, 
    padding: 16, 
    marginBottom: 12,
    shadowColor: '#1ABA7F',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  unreadCard: { borderLeftWidth: 4, borderLeftColor: '#1ABA7F' },
  notificationIcon: { marginRight: 12, marginTop: 2 },
  notificationContent: { flex: 1 },
  notificationTitle: { fontSize: 16, fontWeight: 'bold', color: '#225F91', marginBottom: 4 },
  notificationMessage: { fontSize: 14, color: '#4B5563', marginBottom: 4 },
  notificationTime: { fontSize: 12, color: '#9CA3AF' },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#1ABA7F', marginLeft: 8 },
}); 