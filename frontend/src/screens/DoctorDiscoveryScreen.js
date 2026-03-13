import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';

const DoctorDiscoveryScreen = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const navigation = useNavigation();

  useEffect(() => {
    fetchDoctors();
  }, [search]);

  const fetchDoctors = async () => {
    try {
      // Note: Use your current local IP address here
      const response = await axios.get(`http://192.168.29.214:5000/api/doctors?name=${search}`);
      setDoctors(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching doctors:", error);
      setLoading(false);
    }
  };

  const renderDoctor = ({ item }) => (
    <TouchableOpacity 
      style={styles.card} 
      onPress={() => navigation.navigate('BookingScreen', { 
        doctorId: item._id, 
        doctorName: item.name 
      })}
    >
      <View style={styles.info}>
        <Text style={styles.name}>Dr. {item.name}</Text>
        <Text style={styles.subText}>{item.specialization} • {item.experience} yrs exp</Text>
        <Text style={styles.location}>📍 {item.location}</Text>
        <Text style={styles.fees}>Fees: ₹{item.fees}</Text>
      </View>
      <View style={styles.arrowContainer}>
        <Text style={styles.arrow}>〉</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Find Your Doctor</Text>
      <TextInput
        style={styles.searchBar}
        placeholder="Search by name (e.g. Arjun)..."
        value={search}
        onChangeText={(text) => setSearch(text)}
      />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#3498db" />
          <Text style={styles.loadingText}>Loading doctors...</Text>
        </View>
      ) : (
        <FlatList
          data={doctors}
          keyExtractor={(item) => item._id}
          renderItem={renderDoctor}
          contentContainerStyle={{ paddingBottom: 20 }}
          ListEmptyComponent={
            <Text style={styles.empty}>No doctors found matching "{search}"</Text>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 15, backgroundColor: '#f8f9fa' },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#2c3e50', marginBottom: 15 },
  searchBar: { 
    backgroundColor: '#fff', 
    padding: 14, 
    borderRadius: 12, 
    marginBottom: 20, 
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    fontSize: 16
  },
  card: { 
    backgroundColor: '#fff', 
    padding: 18, 
    borderRadius: 15, 
    marginBottom: 15, 
    flexDirection: 'row', 
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 3,
    borderLeftWidth: 5,
    borderLeftColor: '#3498db'
  },
  info: { flex: 1 },
  name: { fontSize: 19, fontWeight: 'bold', color: '#2c3e50' },
  subText: { color: '#7f8c8d', marginVertical: 4, fontSize: 14 },
  location: { color: '#3498db', fontSize: 14, fontWeight: '500' },
  fees: { marginTop: 8, fontWeight: 'bold', color: '#27ae60', fontSize: 15 },
  arrowContainer: { marginLeft: 10 },
  arrow: { fontSize: 20, color: '#bdc3c7', fontWeight: 'bold' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, color: '#7f8c8d' },
  empty: { textAlign: 'center', marginTop: 50, color: '#95a5a6', fontSize: 16 }
});

export default DoctorDiscoveryScreen;