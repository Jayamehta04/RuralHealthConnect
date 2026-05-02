import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider } from './src/context/AuthContext'; 
import { CallProvider } from './src/context/CallContext';
import AppNavigator from './src/navigation/AppNavigator';
import './src/i18n';
import * as Notifications from 'expo-notifications';
import { LogBox, Platform } from 'react-native';

// Suppress the expected Expo Go warning about remote push notifications (we are only using Local Notifications)
LogBox.ignoreLogs(['expo-notifications: Android Push notifications']);

const originalConsoleError = console.error;
console.error = (...args) => {
  if (typeof args[0] === 'string' && args[0].includes('expo-notifications: Android Push notifications')) {
    return;
  }
  originalConsoleError(...args);
};

// Setup notification handler so they show up even when app is open
try {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
} catch (e) {
  console.log('Notifications setup skipped in Expo Go');
}

export default function App() {
  useEffect(() => {
    if (Platform.OS === 'android') {
      try {
        Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        }).catch(() => {});
      } catch (error) {
        // Ignore error
      }
    }
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider> 
        <CallProvider>
          <NavigationContainer>
            <AppNavigator />
          </NavigationContainer>
        </CallProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}