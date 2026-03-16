import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, Alert, TextInput, Pressable, TouchableOpacity } from 'react-native';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

const BookingScreen = ({ route, navigation }) => {
  const { doctorId, doctorName } = route.params;
  const { token } = useContext(AuthContext);
  
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [reason, setReason] = useState('');
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotMessage, setSlotMessage] = useState('');

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
    } catch (error) {
      const message = error.response?.data?.message || 'Booking failed';
      Alert.alert("Error", message);
    }
  };

  const fetchSlots = async () => {
    if (!date) {
      setSlotMessage('Please select a date first');
      return;
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      setSlotMessage('Please use YYYY-MM-DD date format');
      return;
    }

    setLoadingSlots(true);
    try {
      const response = await axios.get(`http://192.168.29.214:5000/api/appointments/slots`, {
        params: { doctorId, date },
        headers: { Authorization: `Bearer ${token}` }
      });
      setSlots(response.data.slots || []);
      setSlotMessage(response.data.slots.length ? 'Select a free slot below' : 'No free slots for this date');
    } catch (err) {
      setSlotMessage('Unable to fetch slots');
    } finally {
      setLoadingSlots(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Book Appointment with Dr. {doctorName}</Text>
      
      <TextInput
        style={styles.input}
        placeholder="Date (YYYY-MM-DD)"
        value={date}
        onChangeText={(text) => {
          setDate(text);
          setSlots([]);
          setSlotMessage('');
        }}
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

      <TouchableOpacity style={styles.slotButton} onPress={fetchSlots}>
        <Text style={styles.slotButtonText}>Check Available Slots</Text>
      </TouchableOpacity>

      {slotMessage ? <Text style={styles.slotMessage}>{slotMessage}</Text> : null}

      {loadingSlots ? (
        <Text style={styles.slotMessage}>Checking slots...</Text>
      ) : (
        slots.length > 0 ? (
          <View style={styles.slotsContainer}>
            {slots.map((slot) => (
              <TouchableOpacity
                key={slot}
                style={[styles.slotItem, time === slot && styles.activeSlot]}
                onPress={() => setTime(slot)}
              >
                <Text style={[styles.slotText, time === slot && styles.activeSlotText]}>{slot}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : null
      )}

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
  btnText: { color: '#fff', fontWeight: 'bold' },
  slotButton: { backgroundColor: '#3498db', padding: 12, borderRadius: 10, alignItems: 'center', marginBottom: 12 },
  slotButtonText: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
  slotMessage: { color: '#6b7280', marginBottom: 10, textAlign: 'center' },
  slotsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  slotItem: { backgroundColor: '#fff', borderColor: '#d1d5db', borderWidth: 1, paddingVertical: 8, paddingHorizontal: 10, borderRadius: 8, margin: 4 },
  activeSlot: { backgroundColor: '#34d399', borderColor: '#059669' },
  slotText: { color: '#1f2937' },
  activeSlotText: { color: '#fff', fontWeight: 'bold' }
});

export default BookingScreen;