import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function OnboardingScreen2() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Feature Highlight</Text>
      <Text style={styles.subtitle}>Find and compare medications from nearby pharmacies, and fill orders quickly.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  subtitle: { fontSize: 16, color: '#666', textAlign: 'center' },
}); 