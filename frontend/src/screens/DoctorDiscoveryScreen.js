import React, { useState, useEffect, useContext } from 'react';
import { View, Text, TextInput, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import { AuthContext } from '../context/AuthContext';

const DoctorDiscoveryScreen = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [location, setLocation] = useState('');
  const [minExperience, setMinExperience] = useState('');
  const [maxExperience, setMaxExperience] = useState('');
  const [minRating, setMinRating] = useState('');
  const [disease, setDisease] = useState('');
  const { token } = useContext(AuthContext);
  const navigation = useNavigation();

  useEffect(() => {
    fetchDoctors();
  }, [token, search, specialization, location, minExperience, maxExperience, minRating, disease]);

  const fetchDoctors = async () => {
    if (!token) {
      setDoctors([]);
      setLoading(false);
      return;
    }

    try {
      const params = new URLSearchParams();
      if (search) params.append('name', search);
      if (specialization) params.append('specialization', specialization);
      if (location) params.append('location', location);
      if (minExperience) params.append('minExperience', minExperience);
      if (maxExperience) params.append('maxExperience', maxExperience);
      if (minRating) params.append('minRating', minRating);
      if (disease) params.append('disease', disease);

      const url = `http://192.168.29.214:5000/api/doctors?${params.toString()}`;
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setDoctors(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching doctors:", error);
      setLoading(false);
    }
  };

  const renderDoctor = ({ item }) => (
      <View style={styles.card}>
      <View style={styles.info}>
        <Text style={styles.name}>Dr. {item.name}</Text>
        <Text style={styles.subText}>{item.specialization} • {item.experience} yrs exp</Text>
        <Text style={styles.subText}>⭐ {item.averageRating ?? 0} ({item.totalReviews ?? 0} reviews)</Text>
        <Text style={styles.location}>📍 {item.location}</Text>
        <Text style={styles.fees}>Fees: ₹{item.fees}</Text>
      </View>
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={styles.bookButton}
          onPress={() => navigation.navigate('Booking', { doctorId: item._id, doctorName: item.name })}
        >
          <Text style={styles.buttonText}>Book</Text>
        </TouchableOpacity>
      </View>
    </View>
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

      <View style={styles.filterRow}>
        <TextInput
          style={[styles.searchBar, styles.filterInput]}
          placeholder="Specialization"
          value={specialization}
          onChangeText={(text) => setSpecialization(text)}
        />
        <TextInput
          style={[styles.searchBar, styles.filterInput]}
          placeholder="Location"
          value={location}
          onChangeText={(text) => setLocation(text)}
        />
      </View>

      <View style={styles.filterRow}>
        <TextInput
          style={[styles.searchBar, styles.filterInput]}
          placeholder="Min Exp"
          keyboardType="numeric"
          value={minExperience}
          onChangeText={(text) => setMinExperience(text)}
        />
        <TextInput
          style={[styles.searchBar, styles.filterInput]}
          placeholder="Max Exp"
          keyboardType="numeric"
          value={maxExperience}
          onChangeText={(text) => setMaxExperience(text)}
        />
      </View>

      <View style={styles.filterRow}>
        <TextInput
          style={[styles.searchBar, styles.filterInput]}
          placeholder="Minimum Rating"
          keyboardType="numeric"
          value={minRating}
          onChangeText={(text) => setMinRating(text)}
        />
        <TextInput
          style={[styles.searchBar, styles.filterInput]}
          placeholder="Disease"
          value={disease}
          onChangeText={(text) => setDisease(text)}
        />
      </View>

      <TouchableOpacity style={styles.clearButton} onPress={() => {
        setSearch('');
        setSpecialization('');
        setLocation('');
        setMinExperience('');
        setMaxExperience('');
        setMinRating('');
        setDisease('');
      }}>
        <Text style={styles.clearButtonText}>Clear Filters</Text>
      </TouchableOpacity>

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
    elevation: 3,
    borderLeftWidth: 5,
    borderLeftColor: '#3498db'
  },
  buttonRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12 },
  bookButton: { backgroundColor: '#10b981', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, marginRight: 8 },
  buttonText: { color: '#fff', fontWeight: 'bold' },
  info: { flex: 1 },
  name: { fontSize: 19, fontWeight: 'bold', color: '#2c3e50' },
  subText: { color: '#7f8c8d', marginVertical: 4, fontSize: 14 },
  location: { color: '#3498db', fontSize: 14, fontWeight: '500' },
  fees: { marginTop: 8, fontWeight: 'bold', color: '#27ae60', fontSize: 15 },
  arrowContainer: { marginLeft: 10 },
  arrow: { fontSize: 20, color: '#bdc3c7', fontWeight: 'bold' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, color: '#7f8c8d' },
  filterRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  filterInput: { flex: 1, marginRight: 8 },
  clearButton: { backgroundColor: '#f39c12', padding: 12, borderRadius: 10, marginBottom: 15, alignItems: 'center' },
  clearButtonText: { color: '#fff', fontWeight: 'bold' },
  empty: { textAlign: 'center', marginTop: 50, color: '#95a5a6', fontSize: 16 }
});

export default DoctorDiscoveryScreen;