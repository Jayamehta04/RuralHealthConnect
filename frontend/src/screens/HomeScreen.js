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
import { useIsFocused } from '@react-navigation/native';
import * as Location from 'expo-location';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';

const HomeScreen = ({ navigation }) => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const isFocused = useIsFocused();
  
  const { token, logout, user, unreadCount, setUnreadCount } = useContext(AuthContext);

  useEffect(() => {
    fetchDoctors();
  }, []);

  useEffect(() => {
    if (isFocused) fetchNotificationCount();
  }, [isFocused]);

  const fetchNotificationCount = async () => {
    if (!token) return;
    try {
      const res = await axios.get('http://192.168.29.214:5000/api/notifications', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const unread = res.data.filter((n) => !n.isRead).length;
      setUnreadCount(unread);    
    } catch (err) {
      console.error('Notification count fetch:', err);
    }
  };

  const fetchDoctors = async () => {
    if (!token) {
      setLoading(false);
      setRefreshing(false);
      return;
    }
    try {
      const response = await axios.get('http://192.168.29.214:5000/api/doctors', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDoctors(response.data);
    } catch (error) {
      console.error("Fetch Error:", error.message);
      if (error.response && error.response.status === 401) {
        Alert.alert("Session Expired", "Please log in again.");
        logout();
      } else {
        Alert.alert("Error", "Failed to load doctors. Please try again.");
      }
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
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
          <Text style={{ fontSize: 13, color: '#f39c12', fontWeight: 'bold' }}>⭐ {item.averageRating ?? 0}</Text>
          <Text style={{ fontSize: 12, color: '#94a3b8', marginLeft: 4 }}>({item.totalReviews ?? 0} reviews)</Text>
        </View>
        {item.recentFeedback && item.recentFeedback.length > 0 && (
          <View style={{ marginTop: 6, backgroundColor: '#f8fafc', padding: 6, borderRadius: 6, borderWidth: 1, borderColor: '#f1f5f9' }}>
            <Text style={{ fontSize: 11, color: '#64748b', fontStyle: 'italic' }} numberOfLines={1}>"{item.recentFeedback[0]}"</Text>
          </View>
        )}
      </View>
      <View style={{ alignItems: 'flex-end', justifyContent: 'space-between', paddingVertical: 2 }}>
        <View style={[styles.statusBadge, { backgroundColor: item.isAvailable ? '#e8f5e9' : '#ffebee' }]}>
          <Text style={[styles.statusText, { color: item.isAvailable ? '#2e7d32' : '#c62828' }]}>
            {item.isAvailable ? 'Available' : 'Busy'}
          </Text>
        </View>
        <TouchableOpacity 
          style={{ marginTop: 8, paddingVertical: 5, paddingHorizontal: 10, backgroundColor: '#f0f9ff', borderRadius: 6, borderWidth: 1, borderColor: '#bae6fd' }}
          onPress={() => navigation.navigate('DoctorReviews', { doctorId: item._id, doctorName: item.name })}
        >
          <Text style={{ fontSize: 11, color: '#0284c7', fontWeight: 'bold' }}>Reviews</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderDashboardContent = () => (
    <>
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

      {/* WELLNESS / HEALTH SERVICES SECTION */}
      <View style={styles.wellnessContainer}>
        {/* Medicine Vault Card */}
        <TouchableOpacity 
          style={styles.wellnessCard} 
          onPress={() => navigation.navigate('MedicineVault')}
        >
          <View style={[styles.iconCircle, { backgroundColor: '#e8f5e9' }]}>
            <Text style={{fontSize: 22}}>💊</Text>
          </View>
          <View style={styles.wellnessTextContainer}>
            <Text style={styles.cardTitle}>Medicine Vault</Text>
            <Text style={styles.cardSub}>Track your daily dosage</Text>
          </View>
          <Text style={styles.arrow}>→</Text>
        </TouchableOpacity>

        {/* Medical Records Card */}
        <TouchableOpacity 
          style={[styles.wellnessCard, { marginTop: 10 }]} 
          onPress={() => navigation.navigate('MedicalRecords')}
        >
          <View style={[styles.iconCircle, { backgroundColor: '#f0f9ff' }]}>
            <Text style={{fontSize: 22}}>📁</Text>
          </View>
          <View style={styles.wellnessTextContainer}>
            <Text style={styles.cardTitle}>Medical Records</Text>
            <Text style={styles.cardSub}>View your patient history</Text>
          </View>
          <Text style={styles.arrow}>→</Text>
        </TouchableOpacity>

        {/* Prescription History Card */}
        <TouchableOpacity 
          style={[styles.wellnessCard, { marginTop: 10 }]} 
          onPress={() => navigation.navigate('PrescriptionHistory')}
        >
          <View style={[styles.iconCircle, { backgroundColor: '#f0f7ff' }]}>
            <Text style={{fontSize: 22}}>🧾</Text>
          </View>
          <View style={styles.wellnessTextContainer}>
            <Text style={styles.cardTitle}>Prescriptions</Text>
            <Text style={styles.cardSub}>View all issued medicines</Text>
          </View>
          <Text style={styles.arrow}>→</Text>
        </TouchableOpacity>

        {/* Chat with doctor */}
        <TouchableOpacity 
          style={[styles.wellnessCard, { marginTop: 10 }]} 
          onPress={() => navigation.navigate('ChatList')}
        >
          <View style={[styles.iconCircle, { backgroundColor: '#e0f2fe' }]}>
            <Text style={{fontSize: 22}}>💬</Text>
          </View>
          <View style={styles.wellnessTextContainer}>
            <Text style={styles.cardTitle}>Messages</Text>
            <Text style={styles.cardSub}>Chat with doctor</Text>
          </View>
          <Text style={styles.arrow}>→</Text>
        </TouchableOpacity>

        {/* Medicine Store Card */}
        <TouchableOpacity 
          style={[styles.wellnessCard, { marginTop: 10 }]} 
          onPress={() => navigation.navigate('Pharmacy')}
        >
          <View style={[styles.iconCircle, { backgroundColor: '#e1f5fe' }]}>
            <Text style={{fontSize: 22}}>🛒</Text>
          </View>
          <View style={styles.wellnessTextContainer}>
            <Text style={styles.cardTitle}>Order Medicines</Text>
            <Text style={styles.cardSub}>Home delivery for rural areas</Text>
          </View>
          <Text style={styles.arrow}>→</Text>
        </TouchableOpacity>
      </View>
      
      <Text style={styles.listTitle}>Available Doctors</Text>
    </>
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
      
      {/* HEADER SECTION */}
      <View style={styles.header}>
        <View style={styles.headerTitleArea}>
          <Text style={styles.welcomeText}>Hello, {user?.name || 'User'}</Text>
          <Text style={styles.title} numberOfLines={1}>RuralHealth</Text>
          <TouchableOpacity 
            style={styles.bookingLink}
            onPress={() => navigation.navigate('MyAppointments')}
          >
            <Text style={styles.subLink}>View My Bookings →</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.headerRightIcons}>
          <TouchableOpacity
            onPress={() => navigation.navigate('Profile')}
            style={styles.headerIconBtn}
          >
            <Ionicons name="person-circle-outline" size={32} color="#8b5cf6" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate('Notifications')}
            style={styles.headerIconBtn}
          >
            <View>
              <Ionicons name="notifications-outline" size={26} color="#3b82f6" />
              {unreadCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{unreadCount}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerIconBtn} onPress={logout}>
            <Ionicons name="log-out-outline" size={30} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={doctors}
        keyExtractor={(item) => item._id}
        renderItem={renderDoctor}
        contentContainerStyle={styles.list}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListHeaderComponent={renderDashboardContent}
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
    alignItems: 'center',
    paddingHorizontal: 16, 
    paddingBottom: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingTop: 55 
  },
  headerTitleArea: { flex: 1, paddingRight: 10 },
  headerRightIcons: { flexDirection: 'row', alignItems: 'center' },
  welcomeText: { fontSize: 13, color: '#64748b', fontWeight: '500', marginBottom: 2 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#1e293b' },
  bookingLink: { marginTop: 4 },
  subLink: { color: '#3498db', fontSize: 13, fontWeight: '700' },
  headerIconBtn: {
    padding: 6,
    marginLeft: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: -4,
    right: -4,
    borderWidth: 1,
    borderColor: '#fff',
  },
  badgeText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 10,
  },
  
  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    paddingBottom: 8,
  },
  sosButton: {
    backgroundColor: '#e74c3c',
    flex: 0.32,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.15,
  },
  ambulanceButton: {
    backgroundColor: '#f39c12',
    flex: 0.64,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.15,
  },
  sosText: { color: '#fff', fontSize: 18, fontWeight: '900' },
  ambulanceText: { color: '#fff', fontSize: 16, fontWeight: '900' },
  actionSubtext: { color: 'rgba(255,255,255,0.85)', fontSize: 11, fontWeight: '600', marginTop: 2 },

  // Wellness Container Styles
  wellnessContainer: { paddingHorizontal: 16, marginBottom: 4, marginTop: 4 },
  wellnessCard: { 
    backgroundColor: '#fff', 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 14, 
    borderRadius: 16, 
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6
  },
  iconCircle: { 
    width: 42, 
    height: 42, 
    borderRadius: 21, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginRight: 14 
  },
  wellnessTextContainer: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
  cardSub: { fontSize: 12, color: '#64748b', marginTop: 2 },
  arrow: { fontSize: 18, color: '#cbd5e1', fontWeight: 'bold' },
  
  listTitle: { fontSize: 16, fontWeight: '700', color: '#64748b', marginTop: 12, marginBottom: 8, marginLeft: 20 },
  list: { paddingBottom: 30 },
  card: { 
    backgroundColor: '#fff', 
    padding: 16, 
    borderRadius: 14, 
    marginBottom: 12,
    marginHorizontal: 16,
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    elevation: 2, 
    shadowColor: '#000', 
    shadowOpacity: 0.05, 
    shadowRadius: 5,
  },
  cardInfo: { flex: 1 },
  name: { fontSize: 16, fontWeight: 'bold', color: '#334155' },
  spec: { fontSize: 14, color: '#3498db', fontWeight: '600', marginTop: 2 },
  exp: { fontSize: 12, color: '#94a3b8', marginTop: 4 },
  statusBadge: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
  emptyContainer: { marginTop: 40, alignItems: 'center' },
  empty: { color: '#94a3b8', fontSize: 14, textAlign: 'center' }
});

export default HomeScreen;