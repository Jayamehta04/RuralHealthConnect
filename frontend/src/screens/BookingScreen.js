import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, Alert, TextInput, Pressable } from 'react-native';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

const BookingScreen = ({ route, navigation }) => {
  const { doctorId, doctorName } = route.params;
  const { token } = useContext(AuthContext);
  
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [reason, setReason] = useState('');

  const handleBooking = async () => {
    if (!date || !time) {
      Alert.alert("Error", "Please enter both date and time");
      return;
    }
    
    // Basic validation for date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      Alert.alert("Error", "Please enter date in YYYY-MM-DD format");
      return;
    }
    
    // Basic validation for time format (HH:MM)
    const timeRegex = /^\d{2}:\d{2}$/;
    if (!timeRegex.test(time)) {
      Alert.alert("Error", "Please enter time in HH:MM format");
      return;
    }
    
    try {
      await axios.post('http://192.168.29.214:5000/api/appointments/book', {
        doctorId,
        date,
        time,
        reason
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      Alert.alert("Success", "Appointment Requested!");
      navigation.navigate('MyAppointments');
    } catch (_error) {
      Alert.alert("Error", "Booking failed");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Book Appointment with Dr. {doctorName}</Text>
      
      <TextInput
        style={styles.input}
        placeholder="Date (YYYY-MM-DD)"
        value={date}
        onChangeText={setDate}
      />
      
      <TextInput
        style={styles.input}
        placeholder="Time (HH:MM)"
        value={time}
        onChangeText={setTime}
      />

      <TextInput
        style={styles.input}
        placeholder="Reason for visit (e.g. Fever)"
        value={reason}
        onChangeText={setReason}
      />

      <Pressable style={({ pressed }) => [styles.confirmBtn, { opacity: pressed ? 0.8 : 1 }]} onPress={handleBooking}>
        <Text style={styles.btnText}>Confirm Booking</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
  selected: { marginVertical: 10, color: '#34495e' },
  input: { borderBottomWidth: 1, borderColor: '#ccc', marginVertical: 20, padding: 8 },
  confirmBtn: { backgroundColor: '#27ae60', padding: 15, borderRadius: 10, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: 'bold' }
});

export default BookingScreen;