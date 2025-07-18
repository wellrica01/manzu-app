import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const ACTIONS = [
  {
    key: 'newSale',
    label: 'New Sale',
    icon: 'add-circle',
    color: '#1ABA7F',
    nav: 'NewSale',
    desc: 'Start a new walk-in sale and update inventory in real time.'
  },
  {
    key: 'salesHistory',
    label: 'Sales History',
    icon: 'time',
    color: '#225F91',
    nav: 'SalesHistory',
    desc: 'View and search all PoS sales made today.'
  },
];

const PoSHomeScreen = ({ navigation }) => {
  return (
    <LinearGradient colors={["#1ABA7F", "#225F91"]} style={styles.gradientBg}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          <Ionicons name="cash" size={32} color="#fff" style={{ marginRight: 12 }} />
          <View>
            <Text style={styles.title}>Point of Sale</Text>
            <Text style={styles.subtitle}>Manage walk-in sales and sales history</Text>
          </View>
        </View>
        <View style={styles.actionsGrid}>
          {ACTIONS.map(action => (
            <TouchableOpacity
              key={action.key}
              style={[styles.actionCard, { shadowColor: action.color }]}
              activeOpacity={0.85}
              onPress={() => navigation.navigate(action.nav)}
            >
              <View style={[styles.iconCircle, { backgroundColor: action.color + '22' }]}> 
                <Ionicons name={action.icon} size={32} color={action.color} />
              </View>
              <Text style={styles.actionLabel}>{action.label}</Text>
              <Text style={styles.actionDesc}>{action.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradientBg: { flex: 1 },
  safeArea: { flex: 1, paddingHorizontal: 0 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 2,
  },
  subtitle: {
    color: '#e0f2f1',
    fontSize: 15,
    fontWeight: '500',
  },
  actionsGrid: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
    paddingHorizontal: 24,
  },
  actionCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.97)',
    borderRadius: 18,
    padding: 24,
    marginHorizontal: 8,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.13,
    shadowRadius: 8,
    elevation: 3,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  actionLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#225F91',
    marginBottom: 4,
  },
  actionDesc: {
    color: '#555',
    fontSize: 14,
    textAlign: 'center',
  },
});

export default PoSHomeScreen; 