import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import DashboardScreen from '../screens/Pharmacy/DashboardScreen';
import NotificationsScreen from '../screens/Pharmacy/NotificationsScreen';
import NewSaleScreen from '../screens/Pharmacy/NewSaleScreen'; // Add this import
import SalesHistoryScreen from '../screens/Pharmacy/SalesHistoryScreen'; // Add this import

const Stack = createStackNavigator();

export default function DashboardStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="DashboardMain" component={DashboardScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      {/* Add PoS screens to make them accessible from Dashboard */}
      <Stack.Screen 
        name="NewSale" 
        component={NewSaleScreen}
      />
      <Stack.Screen 
        name="SalesHistory" 
        component={SalesHistoryScreen}
      />
    </Stack.Navigator>
  );
}