import React, { useState } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, 
  StyleSheet, Alert, ScrollView 
} from 'react-native';
import { useTranslation } from 'react-i18next';
import * as Notifications from 'expo-notifications';
import { addMedicineLocal } from '../utils/medicineStorage';

const parseTime = (timeStr) => {
  const match = timeStr.trim().match(/(\d+):(\d+)\s?(AM|PM)/i);
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
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [time, setTime] = useState('');
  const [duration, setDuration] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAdd = async () => {
    if (!name || !dosage || !time || !duration) {
      Alert.alert(t('common.error'), t('medicine.errorFields'));
      return;
    }

    const timeList = time.split(',').map(t => parseTime(t)).filter(t => t);
    if (timeList.length === 0) {
        Alert.alert(t('common.error'), t('medicine.errorTime'));
        return;
    }

    const durDays = parseInt(duration);
    if (isNaN(durDays) || durDays <= 0) {
        Alert.alert("Error", "Duration must be a positive number of days.");
        return;
    }

    setLoading(true);
    let notificationIds = [];

    try {
      const { status } = await Notifications.requestPermissionsAsync();
      
      if (status === 'granted') {
          let currentDate = new Date();
          
          for (let day = 0; day < durDays; day++) {
             for (const t of timeList) {
               const scheduleDate = new Date(currentDate);
               scheduleDate.setDate(currentDate.getDate() + day);
               scheduleDate.setHours(t.hour, t.minute, 0, 0);

               if (scheduleDate > new Date()) {
                 const nid = await Notifications.scheduleNotificationAsync({
                   content: {
                     title: t('medicine.notifTitle'),
                     body: t('medicine.notifBody', { dosage, name }),
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

      await addMedicineLocal({
        name,
        dosage,
        time,
        duration: `${durDays} days`,
        notificationIds 
      });

      Alert.alert(t('common.success'), t('medicine.success'));
      navigation.goBack(); 
    } catch (error) {
      console.error(error);
      Alert.alert(t('common.error'), t('medicine.fail'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{t('medicine.newTitle')}</Text>
      
      <Text style={styles.label}>{t('medicine.name')}</Text>
      <TextInput 
        style={styles.input} 
        placeholder={t('medicine.namePlaceholder')} 
        value={name} 
        onChangeText={setName} 
      />

      <Text style={styles.label}>{t('medicine.dosage')}</Text>
      <TextInput 
        style={styles.input} 
        placeholder={t('medicine.dosagePlaceholder')} 
        value={dosage} 
        onChangeText={setDosage} 
      />

      <Text style={styles.label}>{t('medicine.timeLabel')}</Text>
      <TextInput 
        style={styles.input} 
        placeholder={t('medicine.timePlaceholder')} 
        value={time} 
        onChangeText={setTime} 
      />

      <Text style={styles.label}>{t('medicine.duration')}</Text>
      <TextInput 
        style={styles.input} 
        placeholder={t('medicine.durationPlaceholder')} 
        keyboardType="numeric"
        value={duration} 
        onChangeText={setDuration} 
      />

      <TouchableOpacity 
        style={[styles.btn, loading && { backgroundColor: '#95a5a6' }]} 
        onPress={handleAdd}
        disabled={loading}
      >
        <Text style={styles.btnText}>{loading ? t('medicine.saving') : t('medicine.addBtn')}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 25, backgroundColor: '#fff', flexGrow: 1, paddingTop: 60 },
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