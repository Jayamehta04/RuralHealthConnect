import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert } from 'react-native';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

const PrescriptionHistoryScreen = () => {
  const { token } = useContext(AuthContext);
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPrescriptions = async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://192.168.29.214:5000/api/appointments/my-prescriptions', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPrescriptions(res.data);
    } catch (err) {
      console.error('Fetch prescriptions error:', err);
      Alert.alert('Error', 'Could not load prescription history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.title}>{item.doctor?.name || 'Doctor'}</Text>
        <Text style={styles.sub}>{new Date(item.date).toLocaleDateString()}</Text>
      </View>
      <Text style={styles.label}>Prescription</Text>
      <Text style={styles.text}>{item.prescription || 'None'}</Text>
      {item.doctorNotes ? (
        <>
          <Text style={styles.label}>Doctor Note</Text>
          <Text style={styles.text}>{item.doctorNotes}</Text>
        </>
      ) : null}
      <Text style={styles.label}>Status</Text>
      <Text style={styles.status}>{item.status}</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#3498db" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Prescription History</Text>
      <FlatList
        data={prescriptions}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        ListEmptyComponent={<Text style={styles.empty}>No prescriptions found.</Text>}
        contentContainerStyle={{ paddingBottom: 100 }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', padding: 14 },
  heading: { fontSize: 24, fontWeight: 'bold', marginBottom: 14, color: '#1e293b' },
  card: { backgroundColor: '#fff', padding: 14, borderRadius: 12, marginBottom: 12, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  title: { fontSize: 16, fontWeight: 'bold', color: '#334155' },
  sub: { color: '#64748b', fontSize: 12 },
  label: { fontWeight: '700', color: '#1e293b', marginTop: 6 },
  text: { color: '#334155', marginTop: 2 },
  status: { color: '#2563eb', marginTop: 2, fontWeight: '700' },
  empty: { textAlign: 'center', marginTop: 60, color: '#94a3b8' },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' }
});

export default PrescriptionHistoryScreen;
