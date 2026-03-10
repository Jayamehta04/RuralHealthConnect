import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, Platform } from 'react-native';
import Constants from 'expo-constants';
import DateTimePicker from '@react-native-community/datetimepicker';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

const BookingScreen = ({ route, navigation }) => {
  const { doctorId, doctorName } = route.params;
  const { token } = useContext(AuthContext);

  const isExpoGo = Constants.appOwnership === 'expo';
  const canUseNativePicker = !isExpoGo && Platform.OS !== 'web';

  const [reason, setReason] = useState('');
  const [date, setDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);

  // Fallback input state for Expo Go (where native picker is unavailable)
  const [expoDate, setExpoDate] = useState(new Date().toISOString().split('T')[0]);
  const [expoTime, setExpoTime] = useState(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

  const onDateChange = (event, selectedDate) => {
    // If it's a dismiss event, just close it and stop
    if (event.type === 'dismissed') {
      setShowPicker(false);
      return;
    }

    if (selectedDate) {
      setDate(selectedDate);
    }

    // Android: Wait for the native picker to finish its animation 
    // before updating the React state to 'false'
    if (Platform.OS === 'android') {
      setTimeout(() => {
        setShowPicker(false);
      }, 0); // Even a 0ms delay pushes the state update to the next event loop
    } else {
      // iOS: Close immediately if the user clicked 'set'
      if (event.type === 'set') {
        setShowPicker(false);
      }
    }
  };

  const handleBooking = async () => {
    if (!reason) {
      Alert.alert("Error", "Please enter a reason for the visit");
      return;
    }

    try {
      const formattedDate = date.toISOString().split('T')[0];
      const formattedTime = date.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      });

      const response = await axios.post(
        'http://192.168.29.214:5000/api/appointments/book',
        {
          doctorId: doctorId,
          date: formattedDate,
          time: formattedTime,
          reason: reason
          // REMOVED: status: 'scheduled' 
          // Let the backend assign the default status (e.g., 'Pending')
        },
        { 
          headers: { Authorization: `Bearer ${token}` } 
        }
      );

      if (response.data) {
        Alert.alert("Success", "Appointment requested successfully!");
        navigation.navigate('MyAppointments');
      }
    } catch (error) {
      console.error("Booking Error Detail:", error.response?.data);
      Alert.alert("Booking Failed", error.response?.data?.message || "Validation Error");
    }
  };
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.label}>Booking with:</Text>
      <Text style={styles.doctorName}>Dr. {doctorName}</Text>

      <View style={styles.form}>
        <Text style={styles.inputLabel}>Select Date & Time</Text>

        {canUseNativePicker ? (
          <>
            <TouchableOpacity style={styles.dateSelector} onPress={() => setShowPicker(true)}>
              <Text style={styles.dateText}>
                {date.toDateString()} at {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </TouchableOpacity>

            {showPicker && (
              <DateTimePicker
                testID="dateTimePicker"
                value={date}
                mode="datetime"
                is24Hour={false}
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={onDateChange}
                minimumDate={new Date()}
              />
            )}
          </>
        ) : (
          <>
            <Text style={styles.helperText}>
              Expo Go does not support the native date picker. Please enter a date and time manually.
            </Text>

            <TextInput
              style={styles.input}
              value={expoDate}
              onChangeText={setExpoDate}
              placeholder="YYYY-MM-DD"
              keyboardType="numbers-and-punctuation"
            />
            <TextInput
              style={styles.input}
              value={expoTime}
              onChangeText={setExpoTime}
              placeholder="HH:MM"
              keyboardType="numbers-and-punctuation"
            />
          </>
        )}

        <Text style={styles.inputLabel}>Reason for Visit</Text>
        <TextInput 
          style={[styles.input, styles.textArea]} 
          value={reason} 
          onChangeText={setReason} 
          placeholder="Describe your symptoms..."
          multiline
          numberOfLines={4}
        />

        <TouchableOpacity style={styles.bookBtn} onPress={handleBooking}>
          <Text style={styles.bookBtnText}>Confirm Booking</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#fff', flexGrow: 1 },
  label: { fontSize: 14, color: '#64748b' },
  doctorName: { fontSize: 22, fontWeight: 'bold', color: '#1e293b', marginBottom: 25 },
  form: { marginTop: 10 },
  inputLabel: { fontSize: 14, fontWeight: '600', color: '#334155', marginBottom: 8 },
  helperText: { fontSize: 14, color: '#64748b', marginBottom: 10 },
  dateSelector: {
    borderWidth: 1,
    borderColor: '#3498db',
    padding: 15,
    borderRadius: 10,
    backgroundColor: '#ebf5fb',
    marginBottom: 20
  },
  dateText: { color: '#2980b9', fontWeight: 'bold', fontSize: 16 },
  input: { 
    borderWidth: 1, 
    borderColor: '#e2e8f0', 
    padding: 12, 
    borderRadius: 10, 
    marginBottom: 20,
    fontSize: 16
  },
  textArea: { height: 100, textAlignVertical: 'top' },
  bookBtn: { 
    backgroundColor: '#3498db', 
    padding: 16, 
    borderRadius: 12, 
    alignItems: 'center',
    marginTop: 10
  },
  bookBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});

export default BookingScreen;