import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function AnalyticsScreen() {
  return (
    <LinearGradient colors={['#1ABA7F', '#225F91']} style={styles.gradientBg}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          <Text style={styles.title}>Analytics</Text>
          <Text style={styles.subtitle}>View pharmacy insights and performance.</Text>
        </View>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.chartCard}>
            <View style={styles.chartHeader}>
              <Ionicons name="trending-up" size={24} color="#1ABA7F" />
              <Text style={styles.chartTitle}>Revenue Trend</Text>
            </View>
            <View style={styles.chartPlaceholder}>
              <Text style={styles.chartText}>Chart coming soon...</Text>
            </View>
          </View>
          <View style={styles.chartCard}>
            <View style={styles.chartHeader}>
              <Ionicons name="list" size={24} color="#1ABA7F" />
              <Text style={styles.chartTitle}>Order Statistics</Text>
            </View>
            <View style={styles.chartPlaceholder}>
              <Text style={styles.chartText}>Chart coming soon...</Text>
            </View>
          </View>
          <View style={styles.chartCard}>
            <View style={styles.chartHeader}>
              <Ionicons name="cube" size={24} color="#1ABA7F" />
              <Text style={styles.chartTitle}>Inventory Analytics</Text>
            </View>
            <View style={styles.chartPlaceholder}>
              <Text style={styles.chartText}>Chart coming soon...</Text>
            </View>
          </View>
        </ScrollView>
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
  scrollContent: { paddingHorizontal: 16, paddingBottom: 32 },
  chartCard: { 
    backgroundColor: 'rgba(255,255,255,0.97)', 
    borderRadius: 18, 
    padding: 20, 
    marginBottom: 16,
    shadowColor: '#1ABA7F',
    shadowOpacity: 0.13,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  chartHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  chartTitle: { fontSize: 18, fontWeight: 'bold', color: '#225F91', marginLeft: 12 },
  chartPlaceholder: { 
    height: 200, 
    backgroundColor: 'rgba(26,186,127,0.1)', 
    borderRadius: 12, 
    alignItems: 'center', 
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(26,186,127,0.2)',
    borderStyle: 'dashed',
  },
  chartText: { fontSize: 16, color: '#1ABA7F', fontWeight: '600' },
}); 