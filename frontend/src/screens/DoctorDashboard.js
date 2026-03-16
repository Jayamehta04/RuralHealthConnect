import React, { useState, useEffect, useContext } from 'react';
import { 
  View, Text, FlatList, StyleSheet, TouchableOpacity, 
  Alert, Modal, TextInput, StatusBar, ActivityIndicator,
  Linking, Platform 
} from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';

const DoctorDashboard = ({ navigation }) => {
  const [appointments, setAppointments] = useState([]);
  const [emergencies, setEmergencies] = useState([]);
  const [ambulances, setAmbulances] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState('appointments'); // appointments, sos, or ambulance
  const [statusFilter, setStatusFilter] = useState('pending'); // pending/accepted/rejected/completed

  const { user, token, logout, unreadCount, setUnreadCount } = useContext(AuthContext);
  
  // Modal states for prescriptions
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState('pending');
  const [doctorNote, setDoctorNote] = useState('');
  const [prescription, setPrescription] = useState('');

  const isFocused = useIsFocused();

  useEffect(() => {
    if (!token) return;  // wait for auth token to be available
    if (isFocused) {
      fetchData();
      if (viewMode === 'appointments') {
        fetchFeedbacks();
      }
      fetchNotificationCount();
    }
  }, [viewMode, user, token, isFocused]);

  const fetchNotificationCount = async () => {
    if (!token) return;
    try {
      const res = await axios.get('http://192.168.29.214:5000/api/notifications', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const unread = res.data.filter((n) => !n.isRead).length;
      setUnreadCount(unread);
    } catch (err) {
      console.error('Notification fetch:', err);
    }
  };

  const fetchData = async () => {
    if (!token) return;  // require login token
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

  const fetchFeedbacks = async () => {
    if (!token || !user?.id) return;
    setFeedbackLoading(true);
    try {
      const res = await axios.get(`http://192.168.29.214:5000/api/feedback/doctor/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFeedbacks(res.data);
    } catch (err) {
      console.error('Fetch Feedback Error:', err);
    } finally {
      setFeedbackLoading(false);
    }
  };

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

  const openPrescriptionBox = (id, status = 'pending') => {
    setSelectedId(id);
    setSelectedStatus(status);
    setDoctorNote('');
    setPrescription('');
    setModalVisible(true);
  };

  const handleStatusChange = async (id, action) => {
    try {
      await axios.put(
        `http://192.168.29.214:5000/api/appointments/${id}/${action}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchData();
    } catch (err) {
      const message = err?.response?.data?.message || err.message || 'Unknown error';
      console.error('Status change failed', err.response?.data || err);
      Alert.alert('Error', `Could not ${action} appointment: ${message}`);
    }
  };

  const handleAcceptWithNote = async () => {
    if (!doctorNote.trim() && !prescription.trim()) {
      Alert.alert('Required', 'Please add doctor advice or prescription before saving.');
      return;
    }

    const endpoint = selectedStatus === 'pending'
      ? `http://192.168.29.214:5000/api/appointments/${selectedId}/accept`
      : `http://192.168.29.214:5000/api/appointments/${selectedId}`;

    const body = selectedStatus === 'pending'
      ? { doctorNotes: doctorNote, prescription }
      : { status: selectedStatus, doctorNotes: doctorNote, prescription };

    try {
      await axios.put(endpoint, body, { headers: { Authorization: `Bearer ${token}` } });
      setModalVisible(false);
      fetchData();
    } catch (err) {
      const message = err?.response?.data?.message || err.message || 'Unknown error';
      console.error('Save note failed', err.response?.data || err);
      Alert.alert('Error', `Update failed: ${message}`);
    }
  };

  const renderAppointment = ({ item }) => {
    const status = String(item.status || '').toLowerCase();
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.patientName}>Patient: {item.patient?.name}</Text>
          <View style={[styles.statusBadge, { backgroundColor: status === 'accepted' ? '#e8f5e9' : '#fff3e0' }]}>
            <Text style={[styles.statusText, { color: status === 'accepted' ? '#2e7d32' : '#ef6c00' }]}>{status}</Text>
          </View>
        </View>
      <Text style={styles.reasonText}>Reason: {item.reason}</Text>
      
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: '#7c3aed' }]}
          onPress={() => navigation.navigate('MedicalRecords', { patientId: item.patient?._id })}
        >
          <Text style={styles.btnText}>Records</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: '#0ea5e9' }]}
          onPress={() => navigation.navigate('ChatConversation', {
            peerId: item.patient?._id,
            peerName: item.patient?.name
          })}
        >
          <Text style={styles.btnText}>Chat</Text>
        </TouchableOpacity>

        {status === 'pending' && (
          <>
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#22c55e' }]} onPress={() => handleStatusChange(item._id, 'accept')}>
              <Text style={styles.btnText}>Accept</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#ef4444' }]} onPress={() => handleStatusChange(item._id, 'reject')}>
              <Text style={styles.btnText}>Reject</Text>
            </TouchableOpacity>
          </>
        )}

        {status === 'accepted' && (
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#0ea5e9' }]} onPress={() => handleStatusChange(item._id, 'complete')}>
            <Text style={styles.btnText}>Complete</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: '#6b7280' }]}
          onPress={() => openPrescriptionBox(item._id, status)}
        >
          <Text style={styles.btnText}>Rx</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

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
        <View style={[styles.statusBadge, { backgroundColor: item.status === 'Dispatched' ? '#e8f5e9' : '#fff3e0' }]}>
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

  const renderDashboardHeader = () => (
    <>
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

      {viewMode === 'appointments' && (
        <View style={styles.subTabContainer}>
          {['pending', 'accepted', 'rejected', 'completed'].map((status) => (
            <TouchableOpacity
              key={status}
              style={[styles.subTab, statusFilter === status && styles.subActiveTab]}
              onPress={() => setStatusFilter(status)}
            >
              <Text style={[styles.tabText, statusFilter === status && styles.subActiveTabText]}>{status}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {viewMode === 'appointments' && (
        <View style={styles.feedbackContainer}>
          <Text style={styles.feedbackTitle}>Recent Feedback</Text>
          {feedbackLoading ? (
            <ActivityIndicator size="small" color="#3498db" />
          ) : feedbacks.length === 0 ? (
            <Text style={styles.noFeedback}>No feedback yet</Text>
          ) : (
            feedbacks.slice(0, 3).map((item) => (
              <View key={item._id} style={styles.feedbackItem}>
                <Text style={styles.feedbackPatient}>Patient: {item.patient?.name}</Text>
                <Text style={styles.feedbackRating}>Rating: {item.rating} / 5</Text>
                {item.comment ? <Text style={styles.feedbackComment}>"{item.comment}"</Text> : null}
              </View>
            ))
          )}
        </View>
      )}
    </>
  );

  const filteredAppointments = appointments.filter((item) => item.status === statusFilter);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* HEADER SECTION */}
      <View style={styles.headerContainer}>
        <View style={styles.headerTitleArea}>
          <Text style={styles.headerTitle}>Doctor Panel</Text>
          <Text style={styles.headerSub}>RuralHealthConnect</Text>
        </View>
        <View style={styles.headerRightIcons}>
          <TouchableOpacity
            style={styles.headerIconBtn}
            onPress={() => navigation.navigate('Profile')}
          >
            <Ionicons name="person-circle-outline" size={30} color="#8b5cf6" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerIconBtn}
            onPress={() => navigation.navigate('ScheduleSettings')}
          >
            <Ionicons name="calendar-outline" size={26} color="#6366f1" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerIconBtn}
            onPress={() => navigation.navigate('ChatList')}
          >
            <Ionicons name="chatbubbles-outline" size={26} color="#10b981" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerIconBtn}
            onPress={() => navigation.navigate('Notifications')}
          >
            <View>
              <Ionicons name="notifications-outline" size={26} color="#3b82f6" />
              {unreadCount > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>{unreadCount}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerIconBtn} onPress={logout}>
            <Ionicons name="log-out-outline" size={28} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#3498db" style={{ marginTop: 50 }} />
      ) : (
        <FlatList 
          data={viewMode === 'appointments' ? filteredAppointments : viewMode === 'sos' ? emergencies : ambulances} 
          keyExtractor={item => item._id} 
          renderItem={
            viewMode === 'appointments' ? renderAppointment : 
            viewMode === 'sos' ? renderEmergency : 
            renderAmbulance
          }
          contentContainerStyle={styles.listPadding}
          ListHeaderComponent={renderDashboardHeader}
          ListEmptyComponent={<Text style={styles.emptyText}>No records found.</Text>}
        />
      )}

      <Modal visible={modalVisible} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Prescription & Notes</Text>
            <TextInput 
              style={styles.input}
              placeholder="Doctor advice..."
              multiline
              value={doctorNote}
              onChangeText={setDoctorNote}
            />
            <TextInput 
              style={[styles.input, { marginTop: 12, height: 120 }]}
              placeholder="Prescription (medicines and dosages)"
              multiline
              value={prescription}
              onChangeText={setPrescription}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleAcceptWithNote}>
                <Text style={styles.btnText}>Save Prescription</Text>
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
  headerContainer: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    paddingHorizontal: 16, 
    paddingTop: 55, 
    paddingBottom: 15, 
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9'
  },
  headerTitleArea: { flex: 1 },
  headerRightIcons: { flexDirection: 'row', alignItems: 'center' },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#1e293b' },
  headerSub: { fontSize: 13, color: '#64748b' },
  headerIconBtn: {
    padding: 6,
    marginLeft: 2,
    justifyContent: 'center',
    alignItems: 'center'
  },
  notificationBadge: {
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: -4,
    right: -4,
    borderWidth: 1,
    borderColor: '#fff',
  },
  notificationBadgeText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 10,
  },
  
  tabContainer: { 
    flexDirection: 'row', 
    marginHorizontal: 16, 
    marginTop: 15, 
    backgroundColor: '#e2e8f0', 
    borderRadius: 12, 
    padding: 4 
  },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  activeTab: { backgroundColor: '#fff', elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 3 },
  tabText: { fontWeight: '600', color: '#64748b', fontSize: 13 },
  activeTabText: { color: '#3498db', fontWeight: '800' },
  
  subTabContainer: { 
    flexDirection: 'row', 
    marginHorizontal: 16, 
    marginTop: 12, 
    marginBottom: 4, 
    backgroundColor: '#f1f5f9', 
    borderRadius: 10, 
    padding: 4 
  },
  subTab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  subActiveTab: { backgroundColor: '#3b82f6', elevation: 1 },
  subActiveTabText: { color: '#fff', fontWeight: '700' },

  feedbackContainer: { 
    backgroundColor: '#fff', 
    marginHorizontal: 16, 
    marginTop: 12, 
    marginBottom: 8,
    padding: 15, 
    borderRadius: 16, 
    borderWidth: 1, 
    borderColor: '#e2e8f0',
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
  },
  feedbackTitle: { fontWeight: 'bold', fontSize: 16, marginBottom: 12, color: '#1e293b' },
  noFeedback: { color: '#94a3b8', fontStyle: 'italic' },
  feedbackItem: { marginBottom: 10, backgroundColor: '#f8fafc', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#f1f5f9' },
  feedbackPatient: { fontWeight: '700', color: '#334155' },
  feedbackRating: { color: '#10b981', marginTop: 4, fontWeight: '600' },
  feedbackComment: { color: '#475569', fontSize: 13, marginTop: 6, fontStyle: 'italic' },

  listPadding: { paddingBottom: 30 },
  card: { 
    backgroundColor: '#fff', 
    padding: 16, 
    borderRadius: 16, 
    marginTop: 12,
    marginHorizontal: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  emergencyCard: { borderLeftWidth: 6, borderLeftColor: '#e74c3c' },
  ambulanceCard: { borderLeftWidth: 6, borderLeftColor: '#f39c12' },
  emergencyTitle: { color: '#e74c3c', fontWeight: '900', marginBottom: 6, fontSize: 13, letterSpacing: 0.5 },
  ambulanceTitle: { color: '#f39c12', fontWeight: '900', marginBottom: 6, fontSize: 13, letterSpacing: 0.5 },
  patientName: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
  reasonText: { fontSize: 14, color: '#475569', marginTop: 8, lineHeight: 20 },
  timeText: { fontSize: 13, color: '#94a3b8', marginTop: 6 },
  buttonRow: { flexDirection: 'row', marginTop: 16, gap: 8 },
  mapBtn: { backgroundColor: '#334155', padding: 12, borderRadius: 10, marginTop: 16, alignItems: 'center' },
  actionBtn: { padding: 10, borderRadius: 8, flex: 1, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  dispatchBtn: { backgroundColor: '#10b981', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8 },

  modalOverlay: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(15,23,42,0.6)', padding: 20 },
  modalContent: { backgroundColor: '#fff', padding: 24, borderRadius: 24, elevation: 5 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 16, color: '#1e293b' },
  input: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 12, padding: 16, height: 100, textAlignVertical: 'top', fontSize: 15, color: '#334155' },
  modalActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 24 },
  saveBtn: { backgroundColor: '#10b981', padding: 16, borderRadius: 12, flex: 0.65, alignItems: 'center' },
  cancelBtn: { padding: 16, flex: 0.3, alignItems: 'center', backgroundColor: '#f1f5f9', borderRadius: 12 },
  cancelBtnText: { color: '#64748b', fontWeight: '700' },
  emptyText: { textAlign: 'center', marginTop: 60, color: '#94a3b8', fontSize: 15 }
});

export default DoctorDashboard;