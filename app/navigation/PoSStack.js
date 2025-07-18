import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import PoSHomeScreen from '../screens/Pharmacy/PoSHomeScreen';
import NewSaleScreen from '../screens/Pharmacy/NewSaleScreen';
import SalesHistoryScreen from '../screens/Pharmacy/SalesHistoryScreen';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native';

const Stack = createStackNavigator();

function withBackButton(Component) {
  return function Wrapped({ navigation, ...props }) {
    return (
      <>
        {navigation.canGoBack() && (
          <TouchableOpacity style={{ position: 'absolute', top: 44, left: 16, zIndex: 10 }} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={28} color="#225F91" />
          </TouchableOpacity>
        )}
        <Component navigation={navigation} {...props} />
      </>
    );
  };
}

const PoSStack = () => (
  <Stack.Navigator initialRouteName="PoSHome" screenOptions={{ headerShown: false }}>
    <Stack.Screen name="PoSHome" component={PoSHomeScreen} />
    <Stack.Screen name="NewSale" component={withBackButton(NewSaleScreen)} />
    <Stack.Screen name="SalesHistory" component={withBackButton(SalesHistoryScreen)} />
  </Stack.Navigator>
);

export default PoSStack; 