import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function NotificationBanner({ message }) {
  return (
    <View style={styles.banner}>
      <Text style={styles.text}>{message || 'NotificationBanner Component'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: { backgroundColor: '#ffc107', padding: 12, borderRadius: 6, marginVertical: 8 },
  text: { color: '#212529', fontWeight: 'bold' },
}); 