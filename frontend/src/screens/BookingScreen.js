import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, Alert, TextInput, Pressable, TouchableOpacity, Platform, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { BASE_URL } from '../config';
import { AuthContext } from '../context/AuthContext';

const BookingScreen = ({ route, navigation }) => {
  const { t } = useTranslation();
  const { doctorId, doctorName } = route.params;
  const { token } = useContext(AuthContext);
  
  const [date, setDate] = useState('');
  const [dateObj, setDateObj] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [time, setTime] = useState('');
  const [reason, setReason] = useState('');
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotMessage, setSlotMessage] = useState('');

  const handleBooking = async () => {
    if (!date || !time) {
      Alert.alert(t('common.error'), t('booking.errorFillFields'));
      return;
    }
    
    // Basic validation for date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      Alert.alert(t('common.error'), t('booking.errorDateFormat'));
      return;
    }

    const appointmentDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (appointmentDate < today) {
      Alert.alert(t('common.error'), t('booking.errorFutureDate'));
      return;
    }
    
    // Basic validation for time format (HH:MM)
    const timeRegex = /^\d{2}:\d{2}$/;
    if (!timeRegex.test(time)) {
      Alert.alert(t('common.error'), t('booking.errorTimeFormat'));
      return;
    }
    
    try {
      await axios.post(`${BASE_URL}/api/appointments/book`, {
        doctorId,
        date,
        time,
        reason
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      Alert.alert(t('common.success'), t('booking.success'));
      navigation.navigate('MyAppointments');
    } catch (error) {
      const message = error.response?.data?.message || t('booking.fail');
      Alert.alert(t('common.error'), message);
    }
  };

  const fetchSlots = async () => {
    if (!date) {
      setSlotMessage(t('booking.slotNoDate'));
      return;
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      setSlotMessage(t('booking.slotDateFormat'));
      return;
    }

    setLoadingSlots(true);
    try {
      const response = await axios.get(`${BASE_URL}/api/appointments/slots`, {
        params: { doctorId, date },
        headers: { Authorization: `Bearer ${token}` }
      });
      setSlots(response.data.slots || []);
      setSlotMessage(response.data.slots.length ? t('booking.slotSelect') : t('booking.slotNone'));
    } catch (err) {
      setSlotMessage(t('booking.slotFetchError'));
    } finally {
      setLoadingSlots(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>{t('booking.title')}</Text>
        
        <View style={styles.docInfoBox}>
          <View style={styles.docIconBg}>
            <Ionicons name="medical" size={24} color="#14b8a6" />
          </View>
          <Text style={styles.docNameTitle}>{t('booking.doctorPrefix')} {doctorName}</Text>
        </View>
        
        <Text style={styles.sectionLabel}>{t('booking.selectDate')}</Text>
        <TouchableOpacity 
          style={styles.datePickerButton} 
          onPress={() => setShowDatePicker(true)}
        >
          <Ionicons name="calendar-outline" size={20} color="#14b8a6" style={{marginRight: 10}}/>
          <Text style={date ? styles.dateText : styles.placeholderText}>
            {date ? date : t('booking.pickDate')}
          </Text>
        </TouchableOpacity>

        {showDatePicker && (
          <DateTimePicker
            value={dateObj}
            mode="date"
            display="default"
            minimumDate={new Date()}
            onChange={(event, selectedDate) => {
              setShowDatePicker(Platform.OS === 'ios');
              if (selectedDate) {
                setDateObj(selectedDate);
                const year = selectedDate.getFullYear();
                const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
                const day = String(selectedDate.getDate()).padStart(2, '0');
                setDate(`${year}-${month}-${day}`);
                setSlots([]);
                setSlotMessage('');
              }
            }}
          />
        )}
        
        <Text style={styles.sectionLabel}>{t('booking.reasonLabel')}</Text>
        <TextInput
          style={styles.reasonInput}
          placeholder={t('booking.reasonPlaceholder')}
          placeholderTextColor="#94a3b8"
          value={reason}
          onChangeText={setReason}
        />

        <TouchableOpacity style={styles.slotButton} onPress={fetchSlots}>
          <Ionicons name="time-outline" size={18} color="#0f766e" style={{marginRight: 6}}/>
          <Text style={styles.slotButtonText}>{t('booking.checkSlots')}</Text>
        </TouchableOpacity>

        {slotMessage ? <Text style={styles.slotMessage}>{slotMessage}</Text> : null}

        {loadingSlots ? (
          <Text style={styles.loadingMessage}>{t('booking.loadingSlots')}</Text>
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
      </ScrollView>

      {/* Sticky Bottom Bar */}
      <View style={styles.bottomBar}>
        <Pressable 
          style={({ pressed }) => [styles.confirmBtn, { opacity: pressed ? 0.8 : 1 }]} 
          onPress={handleBooking}
        >
          <Text style={styles.btnText}>{t('booking.confirmButton')}</Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  scrollContent: { padding: 20, paddingBottom: 100 },
  title: { fontSize: 24, fontWeight: '800', color: '#1e293b', marginBottom: 20 },
  
  docInfoBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 16, borderRadius: 20, marginBottom: 24, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 8, elevation: 2 },
  docIconBg: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#f0fdfa', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  docNameTitle: { fontSize: 18, fontWeight: 'bold', color: '#334155' },
  
  sectionLabel: { fontSize: 14, fontWeight: '700', color: '#64748b', marginBottom: 10, marginLeft: 4 },
  
  datePickerButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 16, borderRadius: 16, marginBottom: 20, borderWidth: 1, borderColor: '#f1f5f9' },
  dateText: { color: '#1e293b', fontSize: 15, fontWeight: '600' },
  placeholderText: { color: '#94a3b8', fontSize: 15 },
  
  reasonInput: { backgroundColor: '#fff', padding: 16, borderRadius: 16, marginBottom: 20, fontSize: 15, color: '#1e293b', borderWidth: 1, borderColor: '#f1f5f9' },
  
  slotButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#ccfbf1', padding: 16, borderRadius: 16, marginBottom: 20 },
  slotButtonText: { color: '#0f766e', fontSize: 15, fontWeight: 'bold' },
  
  slotMessage: { color: '#64748b', textAlign: 'center', marginBottom: 20, fontSize: 14 },
  loadingMessage: { color: '#14b8a6', textAlign: 'center', marginBottom: 20, fontSize: 14, fontWeight: 'bold' },
  
  slotsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' },
  slotItem: { backgroundColor: '#fff', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 12, margin: 4, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  activeSlot: { backgroundColor: '#14b8a6' },
  slotText: { color: '#64748b', fontWeight: 'bold' },
  activeSlotText: { color: '#fff' },

  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', padding: 20, borderTopLeftRadius: 24, borderTopRightRadius: 24, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 10 },
  confirmBtn: { backgroundColor: '#14b8a6', padding: 18, borderRadius: 16, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});

export default BookingScreen;