import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import colors from '../theme/colors';
import spacing from '../theme/spacing';

export default function ProgressDots({ total, current }) {
  return (
    <View style={styles.container}>
      <Text style={styles.stepText}>{current + 1} / {total}</Text>
      <View style={styles.dotsRow}>
        {Array.from({ length: total }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              i === current && styles.activeDot,
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', marginVertical: spacing.medium },
  stepText: {
    color: '#1ABA7F',
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: spacing.small,
  },
  dotsRow: { flexDirection: 'row', justifyContent: 'center' },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginHorizontal: 5,
    backgroundColor: '#1ABA7F',
    opacity: 0.18,
  },
  activeDot: {
    width: 18,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#1ABA7F',
    opacity: 1,
  },
}); 