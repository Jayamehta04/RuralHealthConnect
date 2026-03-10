import React, { useEffect, useState, useContext } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

const MyAppointmentsScreen = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const { token } = useContext(AuthContext);

  useEffect(() => {
    const fetchMyAppointments = async () => {
      try {
        const response = await axios.get('http://192.168.29.214:5000/api/appointments/my-appointments', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setAppointments(response.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchMyAppointments();
  }, []);

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <Text style={styles.doctorName}>Dr. {item.doctor?.name}</Text>
      <Text>Date: {item.date} | Time: {item.time}</Text>
      <Text style={styles.reason}>Reason: {item.reason}</Text>
      
      <Text style={[styles.status, { color: item.status === 'Accepted' ? 'green' : 'orange' }]}>
        Status: {item.status}
      </Text>

      {/* Logic to show the note ONLY if it exists and is not empty */}
      {item.doctorNotes && item.doctorNotes.length > 0 ? (
        <View style={styles.noteContainer}>
          <Text style={styles.noteLabel}>Doctor's Prescription/Note:</Text>
          <Text style={styles.noteText}>{item.doctorNotes}</Text>
        </View>
      ) : (
        <Text style={styles.noNote}>No notes provided yet.</Text>
      )}
    </View>
  );
  if (loading) return <ActivityIndicator style={{flex:1}} />;

  return (
    <View style={styles.container}>
      <FlatList
        data={appointments}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        ListEmptyComponent={<Text style={{textAlign:'center', marginTop:20}}>No appointments yet.</Text>}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10, backgroundColor: '#f9f9f9' },
  card: { backgroundColor: '#fff', padding: 15, borderRadius: 8, marginBottom: 10, elevation: 2 },
  doctorName: { fontSize: 18, fontWeight: 'bold' },
  status: { fontWeight: 'bold', marginTop: 5 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  dateTime: { color: '#7f8c8d', marginBottom: 5 },
  reason: { color: '#2c3e50', fontStyle: 'italic' },
  noteBox: { 
    marginTop: 15, 
    padding: 10, 
    backgroundColor: '#ecf0f1', 
    borderRadius: 8, 
    borderLeftWidth: 4, 
    borderLeftColor: '#3498db' 
  },
  noteContainer: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#f0f7ff',
    borderRadius: 5,
    borderLeftWidth: 4,
    borderLeftColor: '#3498db',
  },
  noteLabel: { fontWeight: 'bold', color: '#2980b9', fontSize: 12 },
  noteText: { color: '#333', marginTop: 3 },
  noNote: { fontSize: 11, color: '#95a5a6', marginTop: 5, fontStyle: 'italic' }
});

export default MyAppointmentsScreen;