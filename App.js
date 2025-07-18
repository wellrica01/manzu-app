import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider } from './app/context/AuthContext';
import { OnboardingProvider } from './app/context/OnboardingContext';
import { PoSProvider } from './app/context/PoSContext';
import RootNavigator from './app/navigation/RootNavigator';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function App() {
  useEffect(() => {
    AsyncStorage.removeItem('onboardingComplete');
  }, []);

  return (
    <OnboardingProvider>
      <AuthProvider>
        <PoSProvider>
          <NavigationContainer>
            <RootNavigator />
          </NavigationContainer>
        </PoSProvider>
      </AuthProvider>
    </OnboardingProvider>
  );
}
