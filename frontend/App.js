import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider } from './src/context/AuthContext'; 
import AppNavigator from './src/navigation/AppNavigator';
import * as Notifications from 'expo-notifications';
import { LogBox, Platform } from 'react-native';

// Suppress the expected Expo Go warning about remote push notifications (we are only using Local Notifications)
LogBox.ignoreLogs(['expo-notifications: Android Push notifications']);

// Setup notification handler so they show up even when app is open
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function App() {
  useEffect(() => {
    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }
  }, []);

  return (
    <AuthProvider> 
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}