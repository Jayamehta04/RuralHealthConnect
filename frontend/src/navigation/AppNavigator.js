import React, { useContext } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';
import { AuthContext } from '../context/AuthContext';

// 1. Import your new screen
import HomeScreen from '../screens/HomeScreen';
import BookingScreen from '../screens/BookingScreen';
import DoctorDetailsScreen from '../screens/DoctorDetailsScreen';
import MyAppointmentsScreen from '../screens/MyAppointmentsScreen';
import DoctorDashboard from '../screens/DoctorDashboard';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import AmbulanceScreen from '../screens/AmbulanceScreen';
import MedicineScreen from '../screens/MedicineScreen';
import AddMedicineScreen from '../screens/AddMedicineScreen';
import PharmacyScreen from '../screens/PharmacyScreen';
import MedicalRecordScreen from '../screens/MedicalRecordScreen';
import PrescriptionHistoryScreen from '../screens/PrescriptionHistoryScreen';
import NotificationScreen from '../screens/NotificationScreen';
import DoctorDiscoveryScreen from '../screens/DoctorDiscoveryScreen';
import ChatListScreen from '../screens/ChatListScreen';
import ChatConversationScreen from '../screens/ChatConversationScreen';
import RateDoctorScreen from '../screens/RateDoctorScreen';
import ScheduleSettingsScreen from '../screens/ScheduleSettingsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import DoctorReviewsScreen from '../screens/DoctorReviewsScreen';
import HealthShortsScreen from '../screens/HealthShortsScreen';
import HealthAwarenessScreen from '../screens/HealthAwarenessScreen';
import AIChatScreen from '../screens/AIChatScreen';
import HealthBlogScreen from '../screens/HealthBlogScreen';
import AgoraCallScreen from '../screens/AgoraCallScreen';
import IncomingCallScreen from '../screens/IncomingCallScreen';

const Stack = createStackNavigator();

const AppNavigator = () => {
  const { user, token } = useContext(AuthContext);
  const { t } = useTranslation();

  return (
    <Stack.Navigator>
      {token ? (

        user?.role === 'doctor' ? (
          <>
            <Stack.Screen name="DoctorHome" component={DoctorDashboard} options={{ title: t('navigation.doctorDashboard') }} />
            <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: t('navigation.profile') }} />
            <Stack.Screen name="ScheduleSettings" component={ScheduleSettingsScreen} options={{ title: t('navigation.schedule') }} />
            <Stack.Screen name="ChatList" component={ChatListScreen} options={{ title: t('navigation.chat') }} />
            <Stack.Screen name="ChatConversation" component={ChatConversationScreen} options={{ title: t('navigation.chatConversation') }} />
            <Stack.Screen name="MedicalRecords" component={MedicalRecordScreen} options={{ title: t('navigation.medicalRecords') }} />
            <Stack.Screen name="PrescriptionHistory" component={PrescriptionHistoryScreen} options={{ title: t('navigation.prescriptions') }} />
            <Stack.Screen name="Notifications" component={NotificationScreen} options={{ title: t('navigation.notifications') }} />
            <Stack.Screen name="AIChat" component={AIChatScreen} options={{ headerShown: false }} />
            <Stack.Screen name="IncomingCall" component={IncomingCallScreen} options={{ headerShown: false }} />
            <Stack.Screen name="AgoraCall" component={AgoraCallScreen} options={{ headerShown: false }} />
          </>
        ) : (
          <>
            <Stack.Screen name="Home" component={HomeScreen} options={{ title: t('navigation.home') }} />
            <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: t('navigation.profile') }} />
            <Stack.Screen name="Booking" component={BookingScreen} options={{ title: t('navigation.booking') }} />
            <Stack.Screen name="MyAppointments" component={MyAppointmentsScreen} options={{ title: t('navigation.appointments') }} />
            <Stack.Screen name="Ambulance" component={AmbulanceScreen} options={{ title: t('navigation.ambulance') }} />
            <Stack.Screen name="MedicineVault" component={MedicineScreen} options={{ title: t('navigation.vault') }} />
            <Stack.Screen name="AddMedicine" component={AddMedicineScreen} options={{ title: t('navigation.addMedicine') }} />
            <Stack.Screen name="Pharmacy" component={PharmacyScreen} options={{ title: t('navigation.pharmacy') }} />
            <Stack.Screen name="DoctorDiscovery" component={DoctorDiscoveryScreen} options={{ title: t('navigation.discoverDoctors') }} />
            <Stack.Screen name="HealthShorts" component={HealthShortsScreen} options={{ title: t('navigation.healthShorts') }} />
            <Stack.Screen name="HealthAwareness" component={HealthAwarenessScreen} options={{ headerShown: false }} />
            <Stack.Screen name="HealthBlog" component={HealthBlogScreen} options={{ title: t('navigation.awareness') || 'Health Tips' }} />
            <Stack.Screen name="DoctorDetails" component={DoctorDetailsScreen} options={{ headerShown: false }} />
            <Stack.Screen name="ChatList" component={ChatListScreen} options={{ title: t('navigation.chat') }} />
            <Stack.Screen name="ChatConversation" component={ChatConversationScreen} options={{ title: t('navigation.chatConversation') }} />
            <Stack.Screen name="MedicalRecords" component={MedicalRecordScreen} options={{ title: t('navigation.medicalRecords') }} />
            <Stack.Screen name="PrescriptionHistory" component={PrescriptionHistoryScreen} options={{ title: t('navigation.prescriptions') }} />
            <Stack.Screen name="Notifications" component={NotificationScreen} options={{ title: t('navigation.notifications') }} />
            <Stack.Screen name="RateDoctor" component={RateDoctorScreen} options={{ title: t('navigation.rateDoctor') }} />
            <Stack.Screen name="DoctorReviews" component={DoctorReviewsScreen} options={{ title: t('navigation.doctorReviews') }} />
            <Stack.Screen name="AIChat" component={AIChatScreen} options={{ headerShown: false }} />
            <Stack.Screen name="IncomingCall" component={IncomingCallScreen} options={{ headerShown: false }} />
            <Stack.Screen name="AgoraCall" component={AgoraCallScreen} options={{ headerShown: false }} />
          </>
        )
      ) : (

        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      )}
    </Stack.Navigator>
  );
};

export default AppNavigator;