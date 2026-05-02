import React, { useState } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, 
  StyleSheet, Alert, ScrollView, Platform 
} from 'react-native';
import { useTranslation } from 'react-i18next';
import * as Notifications from 'expo-notifications';
import { AuthContext } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import axios from 'axios';
import { BASE_URL } from '../config';
import { addMedicineLocal } from '../utils/medicineStorage';

const COMMON_MEDICINES = [
  'Paracetamol', 'Crocin', 'Dolo', 'Azithromycin', 
  'Aspirin', 'Ibuprofen', 'Amoxicillin', 'Cetirizine', 'Omez'
];

const DOSAGE_OPTIONS = ['1 Tablet', '2 Tablets', '5 ml', '10 ml'];

const getNextHour = () => {
  const d = new Date();
  d.setHours(d.getHours() + 1, 0, 0, 0);
  return d;
};

const formatTime = (dateObj) => {
  let h = dateObj.getHours();
  let m = dateObj.getMinutes();
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  h = h ? h : 12; 
  m = m < 10 ? '0' + m : m;
  return `${h}:${m} ${ampm}`;
};

const AddMedicineScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const { token, user } = React.useContext(AuthContext);
  const [name, setName] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const [dosage, setDosage] = useState('1 Tablet');
  
  const [reminderTimes, setReminderTimes] = useState([getNextHour()]);
  const [showPicker, setShowPicker] = useState(false);
  
  const [duration, setDuration] = useState(5);
  const [loading, setLoading] = useState(false);

  const filteredMedicines = COMMON_MEDICINES.filter(m => 
    m.toLowerCase().includes(name.toLowerCase())
  );

  const handleTimeChange = (event, selectedDate) => {
    setShowPicker(false);
    if (selectedDate) {
      const now = new Date();
      if (selectedDate.getHours() < now.getHours() || 
         (selectedDate.getHours() === now.getHours() && selectedDate.getMinutes() < now.getMinutes())) {
         Alert.alert(t('common.error', 'Error'), 'Cannot select past time for today.');
         return;
      }
      setReminderTimes([...reminderTimes, selectedDate]);
    }
  };

  const removeTime = (indexToRemove) => {
    setReminderTimes(reminderTimes.filter((_, idx) => idx !== indexToRemove));
  };

  const incDuration = () => { if (duration < 30) setDuration(d => d + 1); };
  const decDuration = () => { if (duration > 1) setDuration(d => d - 1); };

  const handleAdd = async () => {
    if (!name.trim()) {
      Alert.alert(t('common.error', 'Error'), t('medicine.errorFields', 'Please enter a medicine name.'));
      return;
    }
    if (reminderTimes.length === 0) {
      Alert.alert(t('common.error', 'Error'), t('medicine.errorTime', 'Please select at least one reminder time.'));
      return;
    }

    setLoading(true);
    let notificationIds = [];

    try {
      const { status } = await Notifications.requestPermissionsAsync();
      
      if (status === 'granted') {
          let currentDate = new Date();
          
          for (let day = 0; day < duration; day++) {
             for (const timeObj of reminderTimes) {
               const scheduleDate = new Date(currentDate);
               scheduleDate.setDate(currentDate.getDate() + day);
               scheduleDate.setHours(timeObj.getHours(), timeObj.getMinutes(), 0, 0);

               if (scheduleDate > new Date()) {
                 const nid = await Notifications.scheduleNotificationAsync({
                   content: {
                     title: t('medicine.notifTitle', 'Medicine Reminder'),
                     body: t('medicine.notifBody', `It's time to take ${dosage} of ${name}`),
                     sound: true,
                   },
                   trigger: {
                     type: 'date',
                     date: scheduleDate,
                   },
                 });
                 notificationIds.push(nid);
               }
             }
          }
      }

      const formattedTimeArr = reminderTimes.map(t => formatTime(t));

      if (token) {
        try {
          await axios.post(`${BASE_URL}/api/medicines/add`, {
            name,
            dosage,
            times: formattedTimeArr,
            duration: parseInt(duration)
          }, {
            headers: { Authorization: `Bearer ${token}` }
          });
        } catch(e) {
          console.log('Backend save error:', e);
        }
      }

      await addMedicineLocal({
        name,
        dosage,
        times: formattedTimeArr,
        time: formattedTimeArr.join(', '),
        duration: parseInt(duration),
        notificationIds,
        startDate: new Date().toISOString()
      });

      Alert.alert(t('common.success', 'Success'), t('medicine.success', 'Medicine added successfully!'));
      navigation.goBack(); 
    } catch (error) {
      console.error(error);
      Alert.alert(t('common.error', 'Error'), t('medicine.fail', 'Failed to add medicine.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.screenTitle}>{t('medicine.newTitle', 'Add New Medicine')}</Text>

      {/* Medicine Name Section */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="medkit-outline" size={24} color="#2ecc71" />
          <Text style={styles.cardTitle}>{t('medicine.name', 'Medicine Name')}</Text>
        </View>
        <TextInput 
          style={styles.input} 
          placeholder="e.g. Paracetamol" 
          value={name} 
          onChangeText={(txt) => { setName(txt); setShowSuggestions(true); }} 
        />
        {showSuggestions && name.length > 0 && filteredMedicines.length > 0 && (
          <View style={styles.suggestionsContainer}>
            {filteredMedicines.map((item, idx) => (
              <TouchableOpacity 
                key={idx} 
                style={styles.suggestionItem}
                onPress={() => { setName(item); setShowSuggestions(false); }}
              >
                <Text style={styles.suggestionText}>{item}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Dosage Presets Section */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="medical-outline" size={24} color="#3498db" />
          <Text style={styles.cardTitle}>{t('medicine.dosage', 'Dosage')}</Text>
        </View>
        <View style={styles.dosageRow}>
          {DOSAGE_OPTIONS.map((opt) => (
            <TouchableOpacity 
              key={opt}
              style={[styles.dosageBtn, dosage === opt && styles.dosageBtnActive]}
              onPress={() => setDosage(opt)}
            >
              <Text style={[styles.dosageBtnText, dosage === opt && styles.dosageBtnTextActive]}>
                {opt}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Reminder Time Section */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="time-outline" size={24} color="#e74c3c" />
          <Text style={styles.cardTitle}>{t('medicine.timeLabel', 'Reminder Times')}</Text>
        </View>
        
        {reminderTimes.map((timeObj, index) => (
          <View key={index} style={styles.timeTag}>
            <Text style={styles.timeTagText}>{formatTime(timeObj)}</Text>
            <TouchableOpacity onPress={() => removeTime(index)}>
              <Ionicons name="close-circle" size={24} color="#e74c3c" />
            </TouchableOpacity>
          </View>
        ))}

        <TouchableOpacity style={styles.addTimeBtn} onPress={() => setShowPicker(true)}>
          <Ionicons name="add" size={20} color="#e74c3c" />
          <Text style={styles.addTimeBtnText}>Add Time</Text>
        </TouchableOpacity>

        {showPicker && (
          <DateTimePicker
            value={new Date()}
            mode="time"
            display="default"
            onChange={handleTimeChange}
          />
        )}
      </View>

      {/* Duration Stepper Section */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="calendar-outline" size={24} color="#f39c12" />
          <Text style={styles.cardTitle}>{t('medicine.duration', 'Duration')}</Text>
        </View>
        <View style={styles.stepperContainer}>
          <TouchableOpacity style={styles.stepperBtn} onPress={decDuration}>
            <Ionicons name="remove" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.stepperValue}>{duration} {duration === 1 ? 'day' : 'days'}</Text>
          <TouchableOpacity style={styles.stepperBtn} onPress={incDuration}>
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity 
        style={[styles.submitBtn, loading && { backgroundColor: '#95a5a6' }]} 
        onPress={handleAdd}
        disabled={loading}
      >
        <Text style={styles.submitBtnText}>
          {loading ? t('medicine.saving', 'Saving...') : t('medicine.addBtn', 'Save Medicine')}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { 
    padding: 20, 
    backgroundColor: '#f8fafc', 
    flexGrow: 1, 
    paddingTop: 50 
  },
  screenTitle: { 
    fontSize: 28, 
    fontWeight: 'bold', 
    color: '#1e293b', 
    marginBottom: 20,
    textAlign: 'center'
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 15,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#334155',
    marginLeft: 10
  },
  input: { 
    borderWidth: 1, 
    borderColor: '#e2e8f0', 
    padding: 12, 
    borderRadius: 12, 
    fontSize: 16,
    backgroundColor: '#f8fafc'
  },
  suggestionsContainer: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderTopWidth: 0,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    maxHeight: 150,
    overflow: 'hidden'
  },
  suggestionItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9'
  },
  suggestionText: {
    fontSize: 16,
    color: '#475569'
  },
  dosageRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 5
  },
  dosageBtn: {
    backgroundColor: '#f1f5f9',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#cbd5e1'
  },
  dosageBtnActive: {
    backgroundColor: '#3498db',
    borderColor: '#2980b9'
  },
  dosageBtnText: {
    color: '#475569',
    fontWeight: '600'
  },
  dosageBtnTextActive: {
    color: '#fff'
  },
  timeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fef2f2',
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#fecaca'
  },
  timeTagText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#b91c1c'
  },
  addTimeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#fff5f5',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderStyle: 'dashed'
  },
  addTimeBtnText: {
    color: '#e74c3c',
    fontWeight: 'bold',
    marginLeft: 5
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 10
  },
  stepperBtn: {
    backgroundColor: '#f39c12',
    padding: 10,
    borderRadius: 10
  },
  stepperValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#334155',
    marginHorizontal: 30
  },
  submitBtn: { 
    backgroundColor: '#2ecc71', 
    padding: 18, 
    borderRadius: 15, 
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 40,
    elevation: 3
  },
  submitBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});

export default AddMedicineScreen;