import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function OrderCard() {
  return (
    <View style={styles.card}>
      <Text style={styles.text}>OrderCard Component</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: 16, backgroundColor: '#fff', borderRadius: 8, marginVertical: 8, elevation: 2 },
  text: { fontSize: 16 },
}); 