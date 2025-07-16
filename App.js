import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider } from './app/context/AuthContext';
import { OnboardingProvider } from './app/context/OnboardingContext';
import RootNavigator from './app/navigation/RootNavigator';

export default function App() {
  return (
    <OnboardingProvider>
      <AuthProvider>
        <NavigationContainer>
          <RootNavigator />
        </NavigationContainer>
      </AuthProvider>
    </OnboardingProvider>
  );
}
