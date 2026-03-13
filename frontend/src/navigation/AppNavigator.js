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
import DoctorDiscoveryScreen from '../screens/DoctorDiscoveryScreen';

const Stack = createStackNavigator();

const AppNavigator = () => {
  const { user, token } = useContext(AuthContext);

  return (
    <Stack.Navigator>
      {token ? (
       
        user?.role === 'doctor' ? (
          <Stack.Screen name="DoctorHome" component={DoctorDashboard} />
        ) : (
          <>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Booking" component={BookingScreen} />
            <Stack.Screen name="MyAppointments" component={MyAppointmentsScreen} />
            <Stack.Screen name="Ambulance" component={AmbulanceScreen} options={{ title: 'Emergency Transport' }} />
            <Stack.Screen name="MedicineVault" component={MedicineScreen} options={{ title: 'My Medicine Vault' }} />
            <Stack.Screen name="AddMedicine" component={AddMedicineScreen} options={{ title: 'Add Medicine' }} />
            <Stack.Screen name="Pharmacy" component={PharmacyScreen} options={{ title: 'Medicine Store' }} />
            <Stack.Screen name="DoctorDiscovery" component={DoctorDiscoveryScreen} options={{ title: 'Find Doctors' }} />
            
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