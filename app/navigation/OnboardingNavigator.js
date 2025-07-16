import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import OnboardingCarousel from '../screens/Onboarding/OnboardingCarousel';

const Stack = createStackNavigator();

export default function OnboardingNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Onboarding" component={OnboardingCarousel} />
    </Stack.Navigator>
  );
} 