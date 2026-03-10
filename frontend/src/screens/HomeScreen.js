import React, { useEffect, useState, useContext } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  StyleSheet, 
  ActivityIndicator, 
  TouchableOpacity,
  StatusBar,
  Alert
} from 'react-native';
import * as Location from 'expo-location';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

const HomeScreen = ({ navigation }) => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const { token, logout, user } = useContext(AuthContext);

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      const response = await axios.get('http://192.168.29.214:5000/api/doctors', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDoctors(response.data);
    } catch (error) {
      console.error("Fetch Error:", error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchDoctors();
  };

  // --- SOS EMERGENCY LOGIC ---
  const handleSOS = async () => {
    Alert.alert(
      "EMERGENCY SOS",
      "Are you sure you want to send an emergency alert with your location?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "SEND ALERT",
          style: "destructive",
          onPress: async () => {
            try {
              let { status } = await Location.requestForegroundPermissionsAsync();
              if (status !== 'granted') {
                Alert.alert("Permission Denied", "Location access is required for SOS.");
                return;
              }

              let location = await Location.getCurrentPositionAsync({});
              const { latitude, longitude } = location.coords;

              const response = await axios.post(
                'http://192.168.29.214:5000/api/emergency/send', 
                { latitude, longitude },
                { headers: { Authorization: `Bearer ${token}` } }
              );

              if (response.status === 201) {
                Alert.alert(
                  "Alert Sent!",
                  `Emergency services notified. Location logged successfully.`
                );
              }
            } catch (error) {
              Alert.alert("SOS Failed", "Could not send emergency alert to server.");
            }
          }
        }
      ]
    );
  };

  const renderDoctor = ({ item }) => (
    <TouchableOpacity 
      style={styles.card} 
      onPress={() => navigation.navigate('Booking', { 
        doctorId: item._id, 
        doctorName: item.name 
      })}
    >
      <View style={styles.cardInfo}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.spec}>{item.specialization}</Text>
        <Text style={styles.exp}>{item.experience} years experience</Text>
      </View>
      <View style={[styles.statusBadge, { backgroundColor: item.isAvailable ? '#e8f5e9' : '#ffebee' }]}>
        <Text style={[styles.statusText, { color: item.isAvailable ? '#2e7d32' : '#c62828' }]}>
          {item.isAvailable ? 'Available' : 'Busy'}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>Hello, {user?.name || 'User'}</Text>
          <Text style={styles.title}>RuralHealth Dashboard</Text>
          <TouchableOpacity 
            style={styles.bookingLink}
            onPress={() => navigation.navigate('MyAppointments')}
          >
            <Text style={styles.subLink}>View My Bookings →</Text>
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* EMERGENCY ACTION BUTTONS */}
      <View style={styles.actionContainer}>
        <TouchableOpacity style={styles.sosButton} onPress={handleSOS}>
          <Text style={styles.sosText}>SOS</Text>
          <Text style={styles.actionSubtext}>Emergency</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.ambulanceButton} 
          onPress={() => navigation.navigate('Ambulance')}
        >
          <Text style={styles.ambulanceText}>AMBULANCE</Text>
          <Text style={styles.actionSubtext}>Request Transport</Text>
        </TouchableOpacity>
      </View>
      
      <FlatList
        data={doctors}
        keyExtractor={(item) => item._id}
        renderItem={renderDoctor}
        contentContainerStyle={styles.list}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListHeaderComponent={<Text style={styles.listTitle}>Available Doctors</Text>}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.empty}>No doctors available in your area yet.</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    paddingHorizontal: 20, 
    paddingBottom: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingTop: 60 
  },
  welcomeText: { fontSize: 14, color: '#64748b', fontWeight: '500', marginBottom: 4 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1e293b' },
  bookingLink: { marginTop: 8 },
  subLink: { color: '#3498db', fontSize: 14, fontWeight: '700' },
  logoutBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fee2e2',
    backgroundColor: '#fef2f2',
    alignSelf: 'flex-start'
  },
  logoutText: { color: '#ef4444', fontWeight: 'bold', fontSize: 13 },
  
  // Action Buttons Container
  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
  },
  sosButton: {
    backgroundColor: '#e74c3c',
    flex: 0.32,
    paddingVertical: 20,
    borderRadius: 16,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
  },
  ambulanceButton: {
    backgroundColor: '#f39c12',
    flex: 0.64,
    paddingVertical: 20,
    borderRadius: 16,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
  },
  sosText: { color: '#fff', fontSize: 20, fontWeight: '900' },
  ambulanceText: { color: '#fff', fontSize: 18, fontWeight: '900' },
  actionSubtext: { color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: '600', marginTop: 2 },
  
  listTitle: { fontSize: 16, fontWeight: '700', color: '#64748b', marginBottom: 12, marginLeft: 20 },
  list: { paddingHorizontal: 16 },
  card: { 
    backgroundColor: '#fff', 
    padding: 20, 
    borderRadius: 16, 
    marginBottom: 16,
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    elevation: 2, 
    shadowColor: '#000', 
    shadowOpacity: 0.05, 
    shadowRadius: 10,
  },
  cardInfo: { flex: 1 },
  name: { fontSize: 18, fontWeight: 'bold', color: '#334155' },
  spec: { fontSize: 15, color: '#3498db', fontWeight: '600', marginTop: 2 },
  exp: { fontSize: 13, color: '#94a3b8', marginTop: 6 },
  statusBadge: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
  emptyContainer: { marginTop: 100, alignItems: 'center' },
  empty: { color: '#94a3b8', fontSize: 16, textAlign: 'center' }
});

export default HomeScreen;