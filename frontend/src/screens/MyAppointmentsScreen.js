import React, { useEffect, useState, useContext } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Pressable, Modal, Alert, TextInput } from 'react-native';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';

const MyAppointmentsScreen = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rescheduleModal, setRescheduleModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const { token, user } = useContext(AuthContext);
  const navigation = useNavigation();

  useEffect(() => {
    fetchMyAppointments();

    const unsubscribe = navigation.addListener('focus', () => {
      fetchMyAppointments();
    });

    return unsubscribe;
  }, [navigation, token]);

  const fetchMyAppointments = async () => {
    if (!token) return;
    try {
      const response = await axios.get('http://192.168.29.214:5000/api/appointments/my-appointments', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAppointments(response.data);
    } catch (error) {
      console.error("Fetch Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (appointmentId) => {
    Alert.alert(
      "Cancel Appointment",
      "Are you sure you want to cancel this appointment?",
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes, Cancel",
          style: "destructive",
          onPress: async () => {
            try {
              await axios.put(`http://192.168.29.214:5000/api/appointments/cancel/${appointmentId}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
              });
              Alert.alert("Success", "Appointment cancelled");
              fetchMyAppointments(); // Refresh list
            } catch (error) {
              Alert.alert("Error", "Failed to cancel appointment");
            }
          }
        }
      ]
    );
  };

  const handleReschedule = (appointment) => {
    setSelectedAppointment(appointment);
    setSelectedDate(new Date(appointment.date).toISOString().split('T')[0]);
    setSelectedTime(appointment.time);
    setRescheduleModal(true);
  };

  const confirmReschedule = async () => {
    if (!selectedDate || !selectedTime) {
      Alert.alert("Error", "Please enter both date and time");
      return;
    }

    try {
      await axios.put(
        `http://192.168.29.214:5000/api/appointments/reschedule/${selectedAppointment._id}`,
        { date: selectedDate, time: selectedTime },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      Alert.alert("Success", "Appointment rescheduled");
      setRescheduleModal(false);
      fetchMyAppointments(); // Refresh list
    } catch (error) {
      Alert.alert("Error", "Failed to reschedule appointment");
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.doctorName}>Dr. {item.doctor?.name || 'Unknown Doctor'}</Text>
        <Text style={[styles.status, { color: item.status === 'Accepted' ? '#2ecc71' : '#e67e22' }]}>
          {item.status}
        </Text>
      </View>

      <Text style={styles.dateTime}>📅 {new Date(item.date).toLocaleDateString()} at {item.time}</Text>
      {item.reason && <Text style={styles.reason}>" {item.reason} "</Text>}

      {/* Note Section */}
      {item.doctorNotes ? (
        <View style={styles.noteContainer}>
          <Text style={styles.noteLabel}>DOCTOR'S NOTE:</Text>
          <Text style={styles.noteText}>{item.doctorNotes}</Text>
        </View>
      ) : (
        <Text style={styles.noNote}>No notes from doctor yet.</Text>
      )}

      {/* Prescription Section */}
      {item.prescription ? (
        <View style={[styles.noteContainer, { borderLeftColor: '#16a34a' }]}>
          <Text style={styles.noteLabel}>PRESCRIPTION:</Text>
          <Text style={styles.noteText}>{item.prescription}</Text>
        </View>
      ) : (
        <Text style={styles.noNote}>No prescription issued yet.</Text>
      )}

      {/* Action buttons */}
      <View style={styles.buttonRow}>
        {item.status !== 'completed' && item.status !== 'cancelled' ? (
          <>
            <Pressable 
              style={({ pressed }) => [styles.actionBtn, { backgroundColor: pressed ? '#c0392b' : '#e74c3c' }]} 
              onPress={() => handleCancel(item._id)}
            >
              <Text style={styles.btnText}>Cancel</Text>
            </Pressable>
            
            <Pressable 
              style={({ pressed }) => [styles.actionBtn, { backgroundColor: pressed ? '#2980b9' : '#3498db' }]} 
              onPress={() => handleReschedule(item)}
            >
              <Text style={styles.btnText}>Reschedule</Text>
            </Pressable>
          </>
        ) : item.status === 'completed' && !item.hasFeedback ? (
          <Pressable 
            style={({ pressed }) => [styles.actionBtn, { backgroundColor: pressed ? '#9b59b6' : '#8e44ad' }]} 
            onPress={() => navigation.navigate('RateDoctor', {
              appointmentId: item._id,
              doctorId: item.doctor?._id,
              doctorName: item.doctor?.name
            })}
          >
            <Text style={styles.btnText}>Rate Doctor</Text>
          </Pressable>
        ) : (
          <View style={[styles.actionBtn, { backgroundColor: '#16a34a' }]}>
            <Text style={styles.btnText}>{item.status === 'completed' ? 'Rated' : 'Closed'}</Text>
          </View>
        )}
      </View>
    </View>
  );

  if (loading) return (
    <View style={styles.loaderContainer}>
      <ActivityIndicator size="large" color="#3498db" />
      <Text style={{marginTop: 10}}>Loading appointments...</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={appointments}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 20 }}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No appointments found.</Text>
        }
      />

      {/* Reschedule Modal */}
      {rescheduleModal && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={rescheduleModal}
          onRequestClose={() => setRescheduleModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Reschedule Appointment</Text>

              <Text style={styles.label}>Date (YYYY-MM-DD):</Text>
              <TextInput
                style={styles.input}
                placeholder="2026-03-15"
                value={selectedDate}
                onChangeText={setSelectedDate}
              />

              <Text style={styles.label}>Time (HH:MM):</Text>
              <TextInput
                style={styles.input}
                placeholder="10:00"
                value={selectedTime}
                onChangeText={setSelectedTime}
              />

              <View style={styles.modalButtons}>
                <Pressable 
                  style={({ pressed }) => [styles.modalBtn, { backgroundColor: pressed ? '#7f8c8d' : '#95a5a6' }]} 
                  onPress={() => setRescheduleModal(false)}
                >
                  <Text style={styles.modalBtnText}>Cancel</Text>
                </Pressable>

                <Pressable 
                  style={({ pressed }) => [styles.modalBtn, { backgroundColor: pressed ? '#1e8449' : '#27ae60' }]} 
                  onPress={confirmReschedule}
                >
                  <Text style={styles.modalBtnText}>Confirm</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10, backgroundColor: '#f4f7f6' },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: { 
    backgroundColor: '#fff', 
    padding: 15, 
    borderRadius: 12, 
    marginBottom: 15, 
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  doctorName: { fontSize: 18, fontWeight: 'bold', color: '#2c3e50' },
  status: { fontWeight: 'bold', fontSize: 14, textTransform: 'uppercase' },
  dateTime: { color: '#7f8c8d', fontSize: 14, marginBottom: 8 },
  reason: { color: '#34495e', fontStyle: 'italic', marginBottom: 10, fontSize: 13 },
  noteContainer: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#ebf5fb',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#3498db',
  },
  noteLabel: { fontWeight: 'bold', color: '#2980b9', fontSize: 11, marginBottom: 2 },
  noteText: { color: '#2c3e50', fontSize: 13 },
  noNote: { fontSize: 12, color: '#bdc3c7', marginTop: 10, fontStyle: 'italic' },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 15 },
  actionBtn: { flex: 1, padding: 10, borderRadius: 8, alignItems: 'center', marginHorizontal: 5 },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  emptyText: { textAlign: 'center', marginTop: 50, color: '#95a5a6', fontSize: 16 },
  input: { borderWidth: 1, borderColor: '#ddd', padding: 10, borderRadius: 5, fontSize: 16 },
  modalOverlay: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)', padding: 20 },
  modalContent: { backgroundColor: '#fff', padding: 20, borderRadius: 10 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  label: { fontSize: 16, fontWeight: '600', marginTop: 15, marginBottom: 10 },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
  modalBtn: { flex: 1, padding: 12, borderRadius: 8, alignItems: 'center', marginHorizontal: 5 },
  modalBtnText: { color: '#fff', fontWeight: 'bold' },
});

export default MyAppointmentsScreen;