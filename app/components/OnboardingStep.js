import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function OnboardingStep({ title, description }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title || 'Onboarding Step'}</Text>
      <Text style={styles.description}>{description || 'Description for this onboarding step.'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 12, textAlign: 'center' },
  description: { fontSize: 16, color: '#666', textAlign: 'center' },
}); 