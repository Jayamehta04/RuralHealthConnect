import React, { useContext } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { AuthContext } from '../context/AuthContext';

// 1. Import your new screen
import HomeScreen from '../screens/HomeScreen';
import BookingScreen from '../screens/BookingScreen';
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

const Stack = createStackNavigator();

const AppNavigator = () => {
  const { user, token } = useContext(AuthContext);

  return (
    <Stack.Navigator>
      {token ? (
       
        user?.role === 'doctor' ? (
          <>
            <Stack.Screen name="DoctorHome" component={DoctorDashboard} />
            <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'My Profile' }} />
            <Stack.Screen name="ScheduleSettings" component={ScheduleSettingsScreen} options={{ title: 'Schedule Settings' }} />
            <Stack.Screen name="ChatList" component={ChatListScreen} options={{ title: 'Messages' }} />
            <Stack.Screen name="ChatConversation" component={ChatConversationScreen} options={{ title: 'Conversation' }} />
            <Stack.Screen name="MedicalRecords" component={MedicalRecordScreen} options={{ title: 'Medical Records' }} />
            <Stack.Screen name="PrescriptionHistory" component={PrescriptionHistoryScreen} options={{ title: 'Prescription History' }} />
            <Stack.Screen name="Notifications" component={NotificationScreen} options={{ title: 'Notifications' }} />
          </>
        ) : (
          <>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'My Profile' }} />
            <Stack.Screen name="Booking" component={BookingScreen} />
            <Stack.Screen name="MyAppointments" component={MyAppointmentsScreen} />
            <Stack.Screen name="Ambulance" component={AmbulanceScreen} options={{ title: 'Emergency Transport' }} />
            <Stack.Screen name="MedicineVault" component={MedicineScreen} options={{ title: 'My Medicine Vault' }} />
            <Stack.Screen name="AddMedicine" component={AddMedicineScreen} options={{ title: 'Add Medicine' }} />
            <Stack.Screen name="Pharmacy" component={PharmacyScreen} options={{ title: 'Medicine Store' }} />
            <Stack.Screen name="DoctorDiscovery" component={DoctorDiscoveryScreen} options={{ title: 'Find Doctors' }} />
            <Stack.Screen name="ChatList" component={ChatListScreen} options={{ title: 'Messages' }} />
            <Stack.Screen name="ChatConversation" component={ChatConversationScreen} options={{ title: 'Conversation' }} />
            <Stack.Screen name="MedicalRecords" component={MedicalRecordScreen} options={{ title: 'Medical Records' }} />
            <Stack.Screen name="PrescriptionHistory" component={PrescriptionHistoryScreen} options={{ title: 'Prescription History' }} />
            <Stack.Screen name="Notifications" component={NotificationScreen} options={{ title: 'Notifications' }} />
            <Stack.Screen name="RateDoctor" component={RateDoctorScreen} options={{ title: 'Rate Doctor' }} />
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