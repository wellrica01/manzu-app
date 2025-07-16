import React, { useContext, useRef, useState } from 'react';
import { View, FlatList, Dimensions, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { OnboardingContext } from '../../context/OnboardingContext';
import OnboardingScreen1 from './OnboardingScreen1';
import OnboardingScreen2 from './OnboardingScreen2';
import OnboardingScreen3 from './OnboardingScreen3';
import ProgressDots from '../../components/ProgressDots';
import colors from '../../theme/colors';
import spacing from '../../theme/spacing';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');
const screens = [OnboardingScreen1, OnboardingScreen2, OnboardingScreen3];

export default function OnboardingCarousel({ navigation }) {
  const { completeOnboarding } = useContext(OnboardingContext);
  const [index, setIndex] = useState(0);
  const flatListRef = useRef();

  const handleNext = () => {
    if (index < screens.length - 1) {
      flatListRef.current.scrollToIndex({ index: index + 1 });
      setIndex(index + 1);
    } else {
      completeOnboarding();
      // RootNavigator will automatically show AuthNavigator
    }
  };

  const handleBack = () => {
    if (index > 0) {
      flatListRef.current.scrollToIndex({ index: index - 1 });
      setIndex(index - 1);
    }
  };

  const handleSkip = () => {
    completeOnboarding();
    // RootNavigator will automatically show AuthNavigator
  };

  return (
    <LinearGradient colors={['#1ABA7F', '#225F91']} style={{ flex: 1 }}>
      <FlatList
        ref={flatListRef}
        data={screens}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        renderItem={({ item: Screen }) => <Screen />}
        keyExtractor={(_, i) => i.toString()}
        extraData={index}
      />
      <ProgressDots total={screens.length} current={index} />
      {/* Skip button centered above navigation */}
      <View style={styles.skipCenterContainer}>
        <TouchableOpacity onPress={handleSkip}>
          <Text style={styles.skip}>Skip</Text>
        </TouchableOpacity>
      </View>
      <SafeAreaView edges={['bottom']} style={styles.buttonRowContainer}>
        <View style={styles.buttonRow}>
          {index > 0 ? (
            <TouchableOpacity onPress={handleBack}>
              <Text style={styles.back}>Back</Text>
            </TouchableOpacity>
          ) : (
            <View style={{ width: 48 }} />
          )}
          <TouchableOpacity onPress={handleNext}>
            <Text style={styles.next}>{index === screens.length - 1 ? 'Get Started' : 'Next'}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  skipCenterContainer: {
    alignItems: 'center',
    marginBottom: spacing.medium,
  },
  skip: {
    color: '#1ABA7F',
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
    paddingVertical: spacing.small,
    paddingHorizontal: spacing.large,
    borderRadius: 16,
    backgroundColor: 'rgba(34,95,145,0.18)',
    textShadowColor: 'rgba(34,95,145,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  buttonRowContainer: {
    width: '100%',
    backgroundColor: 'transparent',
    paddingBottom: spacing.large,
    paddingHorizontal: spacing.large,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  back: {
    color: '#1ABA7F',
    fontWeight: 'bold',
    fontSize: 16,
    width: 48,
    textAlign: 'left',
    textShadowColor: 'rgba(34,95,145,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  next: {
    color: '#1ABA7F',
    fontWeight: 'bold',
    fontSize: 16,
    width: 90,
    textAlign: 'right',
    textShadowColor: 'rgba(34,95,145,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
}); 