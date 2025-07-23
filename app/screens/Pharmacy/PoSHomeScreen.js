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
    textShadowColor: 'rgba(34,95,145,0.2)', 
    textShadowOffset: { width: 0, height: 1 }, 
    textShadowRadius: 3 
  },
  actionsGrid: {
    flex: 1,
    flexDirection: 'column', // changed from 'row' to 'column'
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
    paddingHorizontal: 24,
  },
  actionCard: {
    width: '100%', // make card take full width of container
    maxWidth: 400, // optional: limit max width for better appearance on tablets
    backgroundColor: 'rgba(255,255,255,0.97)',
    borderRadius: 18,
    padding: 24,
    marginVertical: 8, // changed from marginHorizontal to marginVertical
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