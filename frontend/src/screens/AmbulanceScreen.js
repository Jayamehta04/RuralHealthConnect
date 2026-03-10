import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import * as Location from 'expo-location';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

const AmbulanceScreen = ({ navigation }) => {
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const { token } = useContext(AuthContext);

  const handleRequest = async () => {
    if (!address || !phone) {
      Alert.alert("Error", "Please fill in all details");
      return;
    }

    setLoading(true);
    try {
      // 1. Get Location for the driver
      let { status } = await Location.requestForegroundPermissionsAsync();
      let locationData = null;
      if (status === 'granted') {
        locationData = await Location.getCurrentPositionAsync({});
      }

      // 2. Send Request
      await axios.post('http://192.168.29.214:5000/api/ambulance/request', {
        pickupAddress: address,
        contactNumber: phone,
        latitude: locationData?.coords.latitude,
        longitude: locationData?.coords.longitude
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      Alert.alert("Success", "Ambulance request sent! Stay calm, help is on the way.");
      navigation.goBack();
    } catch (error) {
      Alert.alert("Failed", "Could not process request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Request Ambulance</Text>
      <TextInput 
        style={styles.input} 
        placeholder="Pickup Address (House No, Landmark)" 
        value={address} 
        onChangeText={setAddress} 
      />
      <TextInput 
        style={styles.input} 
        placeholder="Contact Number" 
        keyboardType="phone-pad"
        value={phone} 
        onChangeText={setPhone} 
      />
      
      <TouchableOpacity style={styles.btn} onPress={handleRequest} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Confirm Request</Text>}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center', backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#e74c3c', marginBottom: 30, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#ddd', padding: 15, borderRadius: 10, marginBottom: 20 },
  btn: { backgroundColor: '#e74c3c', padding: 18, borderRadius: 10, alignItems: 'center' },
  btnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});

export default AmbulanceScreen;