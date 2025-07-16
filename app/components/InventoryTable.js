import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function InventoryTable() {
  return (
    <View style={styles.table}>
      <Text style={styles.text}>InventoryTable Component</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  table: { padding: 16, backgroundColor: '#fff', borderRadius: 8, marginVertical: 8, elevation: 2 },
  text: { fontSize: 16 },
}); 