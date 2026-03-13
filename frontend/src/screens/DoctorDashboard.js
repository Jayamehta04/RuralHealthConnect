import React, { useState, useEffect, useContext } from 'react';
import { 
  View, Text, FlatList, StyleSheet, TouchableOpacity, 
  Alert, Modal, TextInput, StatusBar, ActivityIndicator,
  Linking, Platform 
} from 'react-native';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

const DoctorDashboard = ({ navigation }) => {
  const [appointments, setAppointments] = useState([]);
  const [emergencies, setEmergencies] = useState([]);
  const [ambulances, setAmbulances] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState('appointments'); // appointments, sos, or ambulance

  const { token, logout } = useContext(AuthContext);
  
  // Modal states for prescriptions
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [note, setNote] = useState('');

  useEffect(() => {
    fetchData();
  }, [viewMode]);

  const fetchData = async () => {
    setLoading(true);
    try {
      let url = '';
      if (viewMode === 'appointments') {
        url = 'http://192.168.29.214:5000/api/appointments/doctor-appointments';
      } else if (viewMode === 'sos') {
        url = 'http://192.168.29.214:5000/api/emergency/all';
      } else if (viewMode === 'ambulance') {
        url = 'http://192.168.29.214:5000/api/ambulance/all';
      }

      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (viewMode === 'appointments') setAppointments(res.data);
      else if (viewMode === 'sos') setEmergencies(res.data);
      else if (viewMode === 'ambulance') setAmbulances(res.data);
      
    } catch (err) {
      console.error("Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };

  // --- MAP REDIRECTION 
  const openInMaps = (lat, lng) => {
    const scheme = Platform.select({ ios: 'maps:0,0?q=', android: 'geo:0,0?q=' });
    const latLng = `${lat},${lng}`;
    const label = 'Emergency Location';
    const url = Platform.select({
      ios: `${scheme}${label}@${latLng}`,
      android: `${scheme}${latLng}(${label})`
    });

    Linking.openURL(url);
  };

  // --- AMBULANCE DISPATCH 
  const handleDispatch = async (id) => {
    try {
      await axios.put(`http://192.168.29.214:5000/api/ambulance/${id}`, 
        { status: 'Dispatched' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Alert.alert("Success", "Ambulance has been dispatched!");
      fetchData(); 
    } catch (err) {
      console.error("Dispatch Error:", err);
      Alert.alert("Error", "Could not update ambulance status");
    }
  };

  const openPrescriptionBox = (id) => {
    setSelectedId(id);
    setNote('');
    setModalVisible(true);
  };

  const handleAcceptWithNote = async () => {
    if (!note.trim()) {
      Alert.alert("Required", "Please write advice before accepting.");
      return;
    }
    try {
      await axios.put(`http://192.168.29.214:5000/api/appointments/${selectedId}`, 
        { status: 'Accepted', doctorNotes: note },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setModalVisible(false);
      fetchData();
    } catch (err) {
      Alert.alert("Error", "Update failed.");
    }
  };

  const renderAppointment = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.patientName}>Patient: {item.patient?.name}</Text>
        <View style={[styles.badge, { backgroundColor: item.status === 'Accepted' ? '#e8f5e9' : '#fff3e0' }]}>
          <Text style={[styles.statusText, { color: item.status === 'Accepted' ? '#2e7d32' : '#ef6c00' }]}>{item.status}</Text>
        </View>
      </View>
      <Text style={styles.reasonText}>Reason: {item.reason}</Text>
      
      <View style={styles.buttonRow}>
        
        {item.status === 'Pending' ? (
          <TouchableOpacity style={styles.acceptBtn} onPress={() => openPrescriptionBox(item._id)}>
            <Text style={styles.btnText}>Accept & Advice</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={[styles.acceptBtn, { backgroundColor: '#34495e' }]} 
            onPress={() => openPrescriptionBox(item._id)}
          >
            <Text style={styles.btnText}>📝 Notes</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderEmergency = ({ item }) => (
    <View style={[styles.card, styles.emergencyCard]}>
      <Text style={styles.emergencyTitle}>🚨 EMERGENCY ALERT</Text>
      <Text style={styles.patientName}>Patient: {item.patient?.name}</Text>
      <Text style={styles.reasonText}>Location: {item.latitude?.toFixed(4)}, {item.longitude?.toFixed(4)}</Text>
      <Text style={styles.timeText}>Time: {new Date(item.createdAt).toLocaleString()}</Text>
      <TouchableOpacity 
        style={styles.mapBtn} 
        onPress={() => openInMaps(item.latitude, item.longitude)}
      >
        <Text style={styles.btnText}>View on Real Map</Text>
      </TouchableOpacity>
    </View>
  );

  const renderAmbulance = ({ item }) => (
    <View style={[styles.card, styles.ambulanceCard]}>
      <Text style={styles.ambulanceTitle}>🚑 AMBULANCE REQUEST</Text>
      <Text style={styles.patientName}>Patient: {item.patient?.name}</Text>
      <Text style={styles.reasonText}>📍 Address: {item.pickupAddress}</Text>
      <Text style={styles.reasonText}>📞 Contact: {item.contactNumber}</Text>
      
      <View style={styles.row}>
        <View style={[styles.badge, { backgroundColor: item.status === 'Dispatched' ? '#e8f5e9' : '#fff3e0' }]}>
          <Text style={{ color: item.status === 'Dispatched' ? 'green' : '#e67e22', fontWeight: 'bold', fontSize: 12 }}>
            Status: {item.status}
          </Text>
        </View>

        {item.status === 'Pending' && (
          <TouchableOpacity 
            style={styles.dispatchBtn} 
            onPress={() => handleDispatch(item._id)}
          >
            <Text style={styles.btnText}>Dispatch Now</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.headerContainer}>
        <View>
          <Text style={styles.headerTitle}>Doctor Panel</Text>
          <Text style={styles.headerSub}>RuralHealthConnect</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, viewMode === 'appointments' && styles.activeTab]} 
          onPress={() => setViewMode('appointments')}
        >
          <Text style={[styles.tabText, viewMode === 'appointments' && styles.activeTabText]}>Appts</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, viewMode === 'sos' && styles.activeTab]} 
          onPress={() => setViewMode('sos')}
        >
          <Text style={[styles.tabText, viewMode === 'sos' && styles.activeTabText]}>SOS</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, viewMode === 'ambulance' && styles.activeTab]} 
          onPress={() => setViewMode('ambulance')}
        >
          <Text style={[styles.tabText, viewMode === 'ambulance' && styles.activeTabText]}>Ambulance</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#3498db" style={{ marginTop: 50 }} />
      ) : (
        <FlatList 
          data={viewMode === 'appointments' ? appointments : viewMode === 'sos' ? emergencies : ambulances} 
          keyExtractor={item => item._id} 
          renderItem={
            viewMode === 'appointments' ? renderAppointment : 
            viewMode === 'sos' ? renderEmergency : 
            renderAmbulance
          }
          contentContainerStyle={styles.listPadding}
          ListEmptyComponent={<Text style={styles.emptyText}>No records found.</Text>}
        />
      )}

      <Modal visible={modalVisible} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Consultation Notes</Text>
            <TextInput 
              style={styles.input}
              placeholder="Advice..."
              multiline
              value={note}
              onChangeText={setNote}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleAcceptWithNote}>
                <Text style={styles.btnText}>Send Advice</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  headerContainer: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20, backgroundColor: '#fff' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#1e293b' },
  headerSub: { fontSize: 14, color: '#64748b' },
  logoutBtn: { padding: 8, borderRadius: 8, borderWidth: 1, borderColor: '#fee2e2' },
  logoutText: { color: '#ef4444', fontWeight: 'bold' },
  tabContainer: { flexDirection: 'row', marginHorizontal: 20, marginTop: 15, backgroundColor: '#e2e8f0', borderRadius: 12, padding: 4 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  activeTab: { backgroundColor: '#fff', elevation: 2 },
  tabText: { fontWeight: '600', color: '#64748b', fontSize: 13 },
  activeTabText: { color: '#3498db' },
  listPadding: { padding: 16 },
  card: { backgroundColor: '#fff', padding: 20, borderRadius: 16, marginBottom: 16, elevation: 3 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  emergencyCard: { borderLeftWidth: 6, borderLeftColor: '#e74c3c' },
  ambulanceCard: { borderLeftWidth: 6, borderLeftColor: '#f39c12' },
  emergencyTitle: { color: '#e74c3c', fontWeight: '900', marginBottom: 5, fontSize: 12 },
  ambulanceTitle: { color: '#f39c12', fontWeight: '900', marginBottom: 5, fontSize: 12 },
  patientName: { fontSize: 18, fontWeight: 'bold', color: '#334155' },
  reasonText: { fontSize: 15, color: '#475569', marginTop: 8 },
  timeText: { fontSize: 13, color: '#94a3b8', marginTop: 4 },
  buttonRow: { flexDirection: 'row', marginTop: 15, gap: 10 },
  mapBtn: { backgroundColor: '#34495e', padding: 12, borderRadius: 10, marginTop: 15, alignItems: 'center' },
  acceptBtn: { backgroundColor: '#3498db', padding: 12, borderRadius: 10, flex: 1, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: 'bold' },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusText: { fontSize: 12, fontWeight: 'bold' },
  modalOverlay: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.4)', padding: 20 },
  modalContent: { backgroundColor: '#fff', padding: 25, borderRadius: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 15 },
  input: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 15, height: 100, textAlignVertical: 'top' },
  modalActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
  saveBtn: { backgroundColor: '#2ecc71', padding: 15, borderRadius: 12, flex: 0.6, alignItems: 'center' },
  cancelBtn: { padding: 15, flex: 0.35, alignItems: 'center' },
  cancelBtnText: { color: '#64748b', fontWeight: '600' },
  emptyText: { textAlign: 'center', marginTop: 50, color: '#94a3b8' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  dispatchBtn: { backgroundColor: '#27ae60', paddingVertical: 8, paddingHorizontal: 15, borderRadius: 8 },
});

export default DoctorDashboard;