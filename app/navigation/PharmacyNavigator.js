import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import DashboardScreen from '../screens/Pharmacy/DashboardScreen';
import InventoryScreen from '../screens/Pharmacy/InventoryScreen';
import NotificationsScreen from '../screens/Pharmacy/NotificationsScreen';
import ProfileScreen from '../screens/Pharmacy/ProfileScreen';
import AnalyticsScreen from '../screens/Pharmacy/AnalyticsScreen';
import { Ionicons } from '@expo/vector-icons';
import OrdersStack from './OrdersStack';
import DashboardStack from '../navigation/DashboardStack';

const Tab = createBottomTabNavigator();

export default function PharmacyNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#1ABA7F',
        tabBarInactiveTintColor: '#225F91',
        tabBarStyle: { backgroundColor: '#F8FAFC', borderTopWidth: 0, height: 64, paddingBottom: 8 },
        tabBarIcon: ({ color, size }) => {
          let iconName;
          if (route.name === 'Dashboard') iconName = 'home';
          else if (route.name === 'Orders') iconName = 'list';
          else if (route.name === 'Inventory') iconName = 'cube';
          else if (route.name === 'Analytics') iconName = 'analytics';
          else if (route.name === 'Profile') iconName = 'person';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardStack} />
      <Tab.Screen name="Orders" component={OrdersStack} />
      <Tab.Screen name="Inventory" component={InventoryScreen} />
      <Tab.Screen name="Analytics" component={AnalyticsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
} 