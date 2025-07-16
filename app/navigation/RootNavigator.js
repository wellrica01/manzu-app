import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { OnboardingContext } from '../context/OnboardingContext';
import OnboardingNavigator from './OnboardingNavigator';
import AuthNavigator from './AuthNavigator';
import PharmacyNavigator from './PharmacyNavigator';

export default function RootNavigator() {
  const { user } = useContext(AuthContext);
  const { onboardingComplete } = useContext(OnboardingContext);

  if (!onboardingComplete) return <OnboardingNavigator />;
  if (!user) return <AuthNavigator />;
  return <PharmacyNavigator />;
} 