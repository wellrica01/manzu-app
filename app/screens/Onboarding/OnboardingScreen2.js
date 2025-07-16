import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import colors from '../../theme/colors';
import spacing from '../../theme/spacing';

const { width, height } = Dimensions.get('window');
const IMAGE_SIZE = Math.min(width * 0.7, 220);

export default function OnboardingScreen2() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 700,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  return (
    <LinearGradient
      colors={['#1ABA7F', '#225F91']}
      style={styles.gradientBg}
    >
      <Animated.View style={[styles.centered, { opacity: fadeAnim }]}> 
        <View style={styles.emojiCircle}>
          <Text style={styles.emoji}>📦</Text>
        </View>
        <Text style={styles.title}>Real-Time Order Management</Text>
        <Text style={styles.subtitle}>
          Receive, track, and fulfill orders instantly. Stay ahead with live notifications and seamless workflow.
        </Text>
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradientBg: {
    flex: 1,
    width,
    height,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.large,
    width,
  },
  emojiCircle: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    borderRadius: IMAGE_SIZE / 2,
    backgroundColor: 'rgba(34,95,145,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.large,
    shadowColor: '#225F91',
    shadowOpacity: 0.15,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
  },
  emoji: { fontSize: IMAGE_SIZE * 0.4, color: '#1ABA7F' },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: spacing.medium,
    textAlign: 'center',
    letterSpacing: 0.2,
    textShadowColor: 'rgba(34,95,145,0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  subtitle: {
    fontSize: 17,
    color: '#fff',
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 24,
    marginBottom: spacing.large,
    textShadowColor: 'rgba(34,95,145,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
}); 