import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function ErrorMessage({ message }) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{message || 'Error occurred.'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#dc3545', padding: 10, borderRadius: 6, marginVertical: 8 },
  text: { color: '#fff', fontWeight: 'bold' },
}); 