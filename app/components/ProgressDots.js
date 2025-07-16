import React from 'react';
import { View, StyleSheet } from 'react-native';

export default function ProgressDots({ total = 3, current = 0 }) {
  return (
    <View style={styles.dotsContainer}>
      {[...Array(total)].map((_, i) => (
        <View
          key={i}
          style={[styles.dot, i === current && styles.activeDot]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  dotsContainer: { flexDirection: 'row', justifyContent: 'center', marginVertical: 16 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#ccc', marginHorizontal: 4 },
  activeDot: { backgroundColor: '#007bff' },
}); 