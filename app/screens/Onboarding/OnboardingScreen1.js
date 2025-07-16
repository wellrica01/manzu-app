import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function OnboardingScreen1() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to Manzu Pharmacy Portal</Text>
      <Text style={styles.subtitle}>Manage orders, inventory, and notifications seamlessly from your mobile device.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  subtitle: { fontSize: 16, color: '#666', textAlign: 'center' },
}); 