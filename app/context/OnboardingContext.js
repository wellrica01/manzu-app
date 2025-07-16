import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const OnboardingContext = createContext();

export function OnboardingProvider({ children }) {
  const [onboardingComplete, setOnboardingComplete] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('onboardingComplete').then(value => {
      setOnboardingComplete(value === 'true');
    });
  }, []);

  const completeOnboarding = async () => {
    setOnboardingComplete(true);
    await AsyncStorage.setItem('onboardingComplete', 'true');
  };

  return (
    <OnboardingContext.Provider value={{ onboardingComplete, completeOnboarding }}>
      {children}
    </OnboardingContext.Provider>
  );
} 