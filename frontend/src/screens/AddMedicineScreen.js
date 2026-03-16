import React, { useState, useContext } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, 
  StyleSheet, Alert, ScrollView 
} from 'react-native';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

import * as Notifications from 'expo-notifications';

const parseTime = (timeStr) => {
  const match = timeStr.match(/(\d+):(\d+)\s?(AM|PM)/i);
  if (!match) return null;
  let hours = parseInt(match[1]);
  const minutes = parseInt(match[2]);
  const modifier = match[3].toUpperCase();

  if (hours === 12) {
    hours = modifier === 'AM' ? 0 : 12;
  } else if (modifier === 'PM') {
    hours += 12;
  }
  return { hour: hours, minute: minutes };
};

const AddMedicineScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [time, setTime] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { token } = useContext(AuthContext);

  const handleAdd = async () => {
    if (!name || !dosage || !time) {
      Alert.alert("Error", "Please fill in all fields (e.g., Paracetamol, 1 Tab, 08:00 AM)");
      return;
    }

    const parsed = parseTime(time);
    if (!parsed) {
        Alert.alert("Error", "Invalid time format. Please use format like '08:00 AM'");
        return;
    }

    setLoading(true);
    let notificationId = null;

    try {
      const { status } = await Notifications.requestPermissionsAsync();
      
      if (status === 'granted') {
          notificationId = await Notifications.scheduleNotificationAsync({
            content: {
              title: "Time for your Medicine! 💊",
              body: `It's time to take ${dosage} of ${name}.`,
              sound: true,
            },
            trigger: {
              type: 'daily',
              hour: parsed.hour,
              minute: parsed.minute,
            },
          });
      }

      await axios.post('http://192.168.29.214:5000/api/medicines/add', {
        name,
        dosage,
        time,
        days: ["Everyday"],
        notificationId 
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      Alert.alert("Success", "Medicine added to your vault!");
      navigation.goBack(); 
    } catch (error) {
      console.error(error);
      Alert.alert("Failed", "Could not save medicine.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>New Medication</Text>
      
      <Text style={styles.label}>Medicine Name</Text>
      <TextInput 
        style={styles.input} 
        placeholder="e.g. Paracetamol" 
        value={name} 
        onChangeText={setName} 
      />

      <Text style={styles.label}>Dosage</Text>
      <TextInput 
        style={styles.input} 
        placeholder="e.g. 1 Tablet or 5ml" 
        value={dosage} 
        onChangeText={setDosage} 
      />

      <Text style={styles.label}>Reminder Time</Text>
      <TextInput 
        style={styles.input} 
        placeholder="e.g. 08:00 AM" 
        value={time} 
        onChangeText={setTime} 
      />

      <TouchableOpacity 
        style={[styles.btn, loading && { backgroundColor: '#95a5a6' }]} 
        onPress={handleAdd}
        disabled={loading}
      >
        <Text style={styles.btnText}>{loading ? 'Saving...' : 'Add to Vault'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 25, backgroundColor: '#fff', flexGrow: 1 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#2ecc71', marginBottom: 30 },
  label: { fontSize: 16, fontWeight: '600', color: '#334155', marginBottom: 8 },
  input: { 
    borderWidth: 1, 
    borderColor: '#e2e8f0', 
    padding: 15, 
    borderRadius: 12, 
    marginBottom: 25,
    fontSize: 16,
    backgroundColor: '#f8fafc'
  },
  btn: { 
    backgroundColor: '#2ecc71', 
    padding: 18, 
    borderRadius: 15, 
    alignItems: 'center',
    marginTop: 10,
    elevation: 3
  },
  btnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});

export default AddMedicineScreen;