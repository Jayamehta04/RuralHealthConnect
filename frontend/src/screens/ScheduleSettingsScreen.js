import React, { useState, useEffect, useContext } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, 
  Switch, Alert, ActivityIndicator, StatusBar 
} from 'react-native';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { Picker } from '@react-native-picker/picker';

const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const generateTimeOptions = () => {
    const options = [];
    for(let i=0; i<24; i++) {
        for(let j=0; j<60; j+=30) {
            const h = i.toString().padStart(2, '0');
            const m = j.toString().padStart(2, '0');
            options.push(`${h}:${m}`);
        }
    }
    return options;
};

const timeOptions = generateTimeOptions();

const ScheduleSettingsScreen = ({ navigation }) => {
  const { token, user } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Default schedule state
  const [schedule, setSchedule] = useState(
    daysOfWeek.reduce((acc, day) => {
        acc[day] = { start: '09:00', end: '17:00', isDayOff: false };
        return acc;
    }, {})
  );

  useEffect(() => {
    fetchCurrentSchedule();
  }, []);

  const fetchCurrentSchedule = async () => {
    try {
      
      const res = await axios.get('http://192.168.29.214:5000/api/doctors', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const me = res.data.find(d => d._id === user.id);
      
      if (me && me.workingHours) {
          
          setSchedule(prev => ({
              ...prev,
              ...me.workingHours
          }));
      }
    } catch (err) {
      console.error('Fetch schedule error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.put('http://192.168.29.214:5000/api/doctors/schedule', 
        { workingHours: schedule },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Alert.alert('Success', 'Schedule updated successfully');
      navigation.goBack();
    } catch (err) {
      console.error('Save schedule error:', err);
      Alert.alert('Error', 'Failed to update schedule');
    } finally {
      setSaving(false);
    }
  };

  const updateDay = (day, field, value) => {
      setSchedule(prev => ({
          ...prev,
          [day]: {
              ...prev[day],
              [field]: value
          }
      }));
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Schedule Settings</Text>
        <Text style={styles.headerSub}>Customize your working hours for appointments</Text>
      </View>

      <ScrollView style={styles.scrollContent}>
        {daysOfWeek.map(day => (
            <View key={day} style={[styles.dayCard, schedule[day].isDayOff && styles.dayCardOff]}>
                <View style={styles.dayHeader}>
                    <Text style={styles.dayText}>{day}</Text>
                    <View style={styles.toggleRow}>
                        <Text style={styles.toggleText}>Day Off</Text>
                        <Switch 
                            value={schedule[day].isDayOff} 
                            onValueChange={(val) => updateDay(day, 'isDayOff', val)}
                            trackColor={{ false: "#d1d5db", true: "#fca5a5" }}
                            thumbColor={schedule[day].isDayOff ? "#ef4444" : "#f3f4f6"}
                        />
                    </View>
                </View>

                {!schedule[day].isDayOff && (
                    <View style={styles.timeSelectionRow}>
                        <View style={styles.timePickerContainer}>
                            <Text style={styles.label}>Start Time</Text>
                            <View style={styles.pickerWrapper}>
                                <Picker
                                    selectedValue={schedule[day].start}
                                    style={styles.picker}
                                    onValueChange={(val) => updateDay(day, 'start', val)}
                                >
                                    {timeOptions.map(time => (
                                        <Picker.Item key={`start-${time}`} label={time} value={time} />
                                    ))}
                                </Picker>
                            </View>
                        </View>
                        
                        <View style={styles.timePickerContainer}>
                            <Text style={styles.label}>End Time</Text>
                            <View style={styles.pickerWrapper}>
                                <Picker
                                    selectedValue={schedule[day].end}
                                    style={styles.picker}
                                    onValueChange={(val) => updateDay(day, 'end', val)}
                                >
                                    {timeOptions.map(time => (
                                        <Picker.Item key={`end-${time}`} label={time} value={time} />
                                    ))}
                                </Picker>
                            </View>
                        </View>
                    </View>
                )}
            </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
            style={styles.saveBtn} 
            onPress={handleSave} 
            disabled={saving}
        >
            {saving ? (
                <ActivityIndicator color="#fff" />
            ) : (
                <Text style={styles.saveBtnText}>Save Schedule</Text>
            )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { padding: 20, paddingTop: 60, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#1e293b' },
  headerSub: { fontSize: 14, color: '#64748b', marginTop: 4 },
  scrollContent: { padding: 16 },
  dayCard: { 
      backgroundColor: '#fff', 
      borderRadius: 12, 
      padding: 16, 
      marginBottom: 16,
      borderLeftWidth: 4,
      borderLeftColor: '#3b82f6',
      elevation: 2,
      shadowColor: '#000',
      shadowOpacity: 0.05,
      shadowRadius: 5
  },
  dayCardOff: {
      borderLeftColor: '#cbd5e1',
      backgroundColor: '#f1f5f9'
  },
  dayHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dayText: { fontSize: 18, fontWeight: 'bold', color: '#334155' },
  toggleRow: { flexDirection: 'row', alignItems: 'center' },
  toggleText: { marginRight: 8, fontSize: 14, color: '#64748b', fontWeight: '500' },
  timeSelectionRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 },
  timePickerContainer: { flex: 0.48 },
  label: { fontSize: 12, color: '#64748b', marginBottom: 4, fontWeight: '600' },
  pickerWrapper: { 
      borderWidth: 1, 
      borderColor: '#e2e8f0', 
      borderRadius: 8,
      backgroundColor: '#f8fafc',
      overflow: 'hidden'
  },
  picker: { height: 50, width: '100%' },
  footer: { padding: 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e2e8f0' },
  saveBtn: { backgroundColor: '#3b82f6', padding: 16, borderRadius: 12, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});

export default ScheduleSettingsScreen;
