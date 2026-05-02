import React, { useState, useEffect, useContext } from 'react';
import { 
  View, Text, FlatList, StyleSheet, TouchableOpacity, 
  Alert, Modal, TextInput, StatusBar, ActivityIndicator,
  Linking, Platform, RefreshControl, Image 
} from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import axios from 'axios';
import { BASE_URL } from '../config';
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
    if (!token) return;  
    if (isFocused) {
      fetchData();
      if (viewMode === 'appointments') {
        fetchFeedbacks();
      }
      fetchNotificationCount();
      console.log('Doctor Profile Image Debug:', user?.profilePicture || user?.image);
    }
  }, [viewMode, user, token, isFocused]);

  const fetchNotificationCount = async () => {
    if (!token) return;
    try {
      const res = await axios.get(`${BASE_URL}/api/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const unread = res.data.filter((n) => !n.isRead).length;
      setUnreadCount(unread);
    } catch (err) {
      console.error('Notification fetch:', err);
    }
  };

  const fetchData = async () => {
    if (!token) return;  
    setLoading(true);
    try {
      let url = '';
      if (viewMode === 'appointments') {
        url = `${BASE_URL}/api/appointments/doctor-appointments`;
      } else if (viewMode === 'sos') {
        url = `${BASE_URL}/api/emergency/all`;
      } else if (viewMode === 'ambulance') {
        url = `${BASE_URL}/api/ambulance/all`;
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
      const res = await axios.get(`${BASE_URL}/api/feedback/doctor/${user.id}`, {
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
      await axios.put(`${BASE_URL}/api/ambulance/${id}`, 
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
        `${BASE_URL}/api/appointments/${id}/${action}`,
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

  const handleReject = (id) => {
    Alert.alert(
      "Reject Appointment",
      "Are you sure you want to reject this appointment?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Reject", style: "destructive", onPress: () => handleStatusChange(id, 'reject') }
      ]
    );
  };

  const handleAcceptWithNote = async () => {
    if (!doctorNote.trim() && !prescription.trim()) {
      Alert.alert('Required', 'Please add doctor advice or prescription before saving.');
      return;
    }

    const endpoint = selectedStatus === 'pending'
      ? `${BASE_URL}/api/appointments/${selectedId}/accept`
      : `${BASE_URL}/api/appointments/${selectedId}`;

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
    const apptDate = item.appointmentDate ? new Date(item.appointmentDate).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : new Date(item.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });

    let badgeColor = '#fef9c3';
    let badgeTextColor = '#ca8a04';
    if (status === 'accepted') { badgeColor = '#dcfce7'; badgeTextColor = '#16a34a'; }
    else if (status === 'rejected') { badgeColor = '#fee2e2'; badgeTextColor = '#dc2626'; }
    else if (status === 'completed') { badgeColor = '#f3f4f6'; badgeTextColor = '#4b5563'; }

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.patientInfoArea}>
            <View style={styles.cardIconBox}>
                <Ionicons name="person" size={24} color="#3b82f6" />
            </View>
            <View style={{ flex: 1, paddingRight: 8 }}>
              <Text style={styles.patientName}>{item.patient?.name || 'Unknown Patient'}</Text>
              <Text style={styles.timeText} numberOfLines={1}>{apptDate}</Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: badgeColor }]}>
            <Text style={[styles.statusText, { color: badgeTextColor }]}>{status}</Text>
          </View>
        </View>
        
        <View style={styles.reasonBox}>
          <Text style={styles.reasonLabel}>Reason:</Text>
          <Text style={styles.reasonText}>{item.reason}</Text>
        </View>
        
        {/* Universal Actions */}
        <View style={styles.buttonGrid}>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#3b82f6' }]} onPress={() => navigation.navigate('MedicalRecords', { patientId: item.patient?._id })}>
            <Ionicons name="document-text-outline" size={16} color="#fff" style={styles.btnIcon} />
            <Text style={styles.btnText}>Records</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#0ea5e9' }]} onPress={() => navigation.navigate('ChatConversation', { peerId: item.patient?._id, peerName: item.patient?.name })}>
             <Ionicons name="chatbubbles-outline" size={16} color="#fff" style={styles.btnIcon} />
            <Text style={styles.btnText}>Chat</Text>
          </TouchableOpacity>
        </View>

        {/* State-Specific Actions */}
        {status === 'pending' && (
          <View style={[styles.buttonGrid, { marginTop: 10 }]}>
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#22c55e' }]} onPress={() => handleStatusChange(item._id, 'accept')}>
              <Ionicons name="checkmark-circle-outline" size={16} color="#fff" style={styles.btnIcon} />
              <Text style={styles.btnText}>Accept</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#ef4444' }]} onPress={() => handleReject(item._id)}>
              <Ionicons name="close-circle-outline" size={16} color="#fff" style={styles.btnIcon} />
              <Text style={styles.btnText}>Reject</Text>
            </TouchableOpacity>
          </View>
        )}

        {status === 'accepted' && (
          <View style={[styles.buttonGrid, { marginTop: 10 }]}>
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#64748b' }]} onPress={() => openPrescriptionBox(item._id, status)}>
              <Ionicons name="medical-outline" size={16} color="#fff" style={styles.btnIcon} />
              <Text style={styles.btnText}>Rx</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#10b981' }]} onPress={() => handleStatusChange(item._id, 'complete')}>
              <Ionicons name="checkmark-done-outline" size={16} color="#fff" style={styles.btnIcon} />
              <Text style={styles.btnText}>Complete</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const renderEmergency = ({ item }) => (
    <View style={[styles.card, styles.emergencyCard]}>
      <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 8}}>
        <Ionicons name="warning" size={20} color="#e74c3c" style={{marginRight: 6}} />
        <Text style={styles.emergencyTitle}>EMERGENCY ALERT</Text>
      </View>
      <Text style={styles.patientName}>Patient: {item.patient?.name}</Text>
      <Text style={styles.reasonText}>Location: {item.latitude?.toFixed(4)}, {item.longitude?.toFixed(4)}</Text>
      <Text style={styles.timeText}>Time: {new Date(item.createdAt).toLocaleString()}</Text>
      <TouchableOpacity 
        style={styles.mapBtn} 
        onPress={() => openInMaps(item.latitude, item.longitude)}
      >
        <Ionicons name="map-outline" size={18} color="#fff" style={{marginRight: 6}} />
        <Text style={styles.btnText}>View on Map</Text>
      </TouchableOpacity>
    </View>
  );

  const renderAmbulance = ({ item }) => (
    <View style={[styles.card, styles.ambulanceCard]}>
      <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 8}}>
        <Ionicons name="medical" size={20} color="#f39c12" style={{marginRight: 6}} />
        <Text style={styles.ambulanceTitle}>AMBULANCE REQUEST</Text>
      </View>
      <Text style={styles.patientName}>{item.patient?.name}</Text>
      
      <View style={styles.reasonBox}>
        <Text style={styles.reasonText}>📍 {item.pickupAddress}</Text>
        <Text style={styles.reasonText}>📞 {item.contactNumber}</Text>
      </View>
      
      <View style={styles.row}>
        <View style={[styles.statusBadge, { backgroundColor: item.status === 'Dispatched' ? '#dcfce7' : '#fef9c3' }]}>
          <Text style={{ color: item.status === 'Dispatched' ? '#16a34a' : '#ca8a04', fontWeight: 'bold', fontSize: 12 }}>
            {item.status}
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

  const renderDashboardHeader = () => {
    // Dynamic Analytics Calculations
    const uniquePatients = new Set(appointments.map(a => a.patient?._id).filter(Boolean)).size;
    const pendingCases = appointments.filter(a => String(a.status).toLowerCase() === 'pending').length;
    const todayStr = new Date().toDateString();
    const todayAppts = appointments.filter(a => {
      const d = new Date(a.appointmentDate || a.createdAt);
      return d.toDateString() === todayStr;
    }).length;

    return (
    <>
      <View style={styles.analyticsContainer}>
        <View style={styles.analyticsCard}>
          <Text style={styles.analyticsValue}>{uniquePatients}</Text>
          <Text style={styles.analyticsLabel}>Total Patients</Text>
        </View>
        <View style={styles.analyticsCard}>
          <Text style={styles.analyticsValue}>{todayAppts}</Text>
          <Text style={styles.analyticsLabel}>Appts Today</Text>
        </View>
        <View style={[styles.analyticsCard, { borderRightWidth: 0 }]}>
          <Text style={[styles.analyticsValue, { color: pendingCases > 0 ? '#ef4444' : '#1e293b' }]}>
            {pendingCases}
          </Text>
          <Text style={styles.analyticsLabel}>Pending Cases</Text>
        </View>
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

      {viewMode === 'appointments' && (
        <View style={styles.subTabContainer}>
          {['pending', 'accepted', 'rejected', 'completed'].map((status) => (
            <TouchableOpacity
              key={status}
              style={[styles.subTab, statusFilter === status && styles.subActiveTab]}
              onPress={() => setStatusFilter(status)}
            >
              <Text style={[styles.tabText, statusFilter === status && styles.subActiveTabText]}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {viewMode === 'appointments' && (
        <View style={styles.feedbackContainer}>
          <View style={styles.feedbackTitleRow}>
            <Ionicons name="star-half" size={18} color="#f59e0b" style={{marginRight: 6}} />
            <Text style={styles.feedbackTitle}>Recent Feedback</Text>
          </View>
          {feedbackLoading ? (
             <ActivityIndicator size="small" color="#3b82f6" />
          ) : feedbacks.length === 0 ? (
            <Text style={styles.noFeedback}>No feedback yet</Text>
          ) : (
            feedbacks.slice(0, 3).map((item) => (
              <View key={item._id} style={styles.feedbackItem}>
                <Text style={styles.feedbackPatient}>{item.patient?.name}</Text>
                {item.comment ? <Text style={styles.feedbackComment}>"{item.comment}"</Text> : null}
              </View>
            ))
          )}
        </View>
      )}
    </>
    );
  };

  const filteredAppointments = appointments.filter((item) => item.status === statusFilter);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* HEADER SECTION */}
      <View style={styles.headerContainer}>
        <TouchableOpacity style={styles.headerProfileArea} onPress={() => navigation.navigate('Profile')}>
          <Image
            source={
              user?.profilePicture || user?.image
                ? { uri: user.profilePicture || user.image }
                : { uri: 'https://cdn-icons-png.flaticon.com/512/149/149071.png' }
            }
            style={{
              width: 44,
              height: 44,
              borderRadius: 22
            }}
          />
          <View style={{ marginLeft: 12 }}>
            <Text style={styles.headerSub}>DASHBOARD</Text>
            <Text style={styles.headerTitle}>Dr. {user?.name || 'Doctor'}</Text>
            <Text style={styles.headerSpec}>{user?.specialization || 'Medical Professional'}</Text>
          </View>
        </TouchableOpacity>
        
        <View style={styles.headerRightIcons}>
          <TouchableOpacity
            style={styles.headerIconBtn}
            onPress={() => navigation.navigate('ScheduleSettings')}
          >
            <Ionicons name="calendar-outline" size={26} color="#64748b" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerIconBtn}
            onPress={() => navigation.navigate('ChatList')}
          >
            <Ionicons name="chatbubbles-outline" size={26} color="#64748b" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.headerIconBtn, { marginRight: -6 }]}
            onPress={() => navigation.navigate('Notifications')}
          >
            <View>
              <Ionicons name="notifications-outline" size={26} color="#64748b" />
              {unreadCount > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>{unreadCount}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.headerIconBtn, { marginLeft: 6 }]}
            onPress={() => {
              Alert.alert('Logout', 'Are you sure you want to log out?', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Logout', style: 'destructive', onPress: () => logout() }
              ]);
            }}
          >
            <Ionicons name="log-out-outline" size={26} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>



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
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            {!loading && (viewMode === 'appointments' ? "No appointments available" : "No records found.")}
          </Text>
        }
        refreshControl={
           <RefreshControl refreshing={loading} onRefresh={fetchData} colors={['#3b82f6']} />
        }
      />

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
                <Text style={styles.btnText}>Save Document</Text>
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
    paddingHorizontal: 20, 
    paddingTop: Platform.OS === 'ios' ? 60 : 45, 
    paddingBottom: 20, 
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9'
  },
  headerProfileArea: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  headerRightIcons: { flexDirection: 'row', alignItems: 'center' },
  doctorAvatar: { width: 44, height: 44, borderRadius: 22 },
  doctorAvatarFallback: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#eff6ff', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#1e293b' },
  headerSub: { fontSize: 11, color: '#94a3b8', fontWeight: '700', marginBottom: 2, letterSpacing: 0.5 },
  headerSpec: { fontSize: 13, color: '#3b82f6', fontWeight: '500', marginTop: 2 },
  headerIconBtn: {
    padding: 6,
    marginLeft: 4,
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
  notificationBadgeText: { color: '#fff', fontWeight: 'bold', fontSize: 10 },
  
  analyticsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    paddingVertical: 18,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f1f5f9'
  },
  analyticsCard: {
    flex: 1,
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#f1f5f9'
  },
  analyticsValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 4
  },
  analyticsLabel: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '700',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },

  tabContainer: { 
    flexDirection: 'row', 
    marginHorizontal: 16, 
    marginTop: 15, 
    backgroundColor: '#e2e8f0', 
    borderRadius: 14, 
    padding: 4 
  },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 10 },
  activeTab: { backgroundColor: '#fff', elevation: 3, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 3 },
  tabText: { fontWeight: '700', color: '#64748b', fontSize: 15 },
  activeTabText: { color: '#2563eb', fontWeight: '800' },
  
  subTabContainer: { 
    flexDirection: 'row', 
    marginHorizontal: 16, 
    marginTop: 16, 
    marginBottom: 4, 
    backgroundColor: 'transparent' 
  },
  subTab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 20, backgroundColor: '#f1f5f9', marginHorizontal: 4 },
  subActiveTab: { backgroundColor: '#3b82f6' },
  subActiveTabText: { color: '#fff', fontWeight: '700' },

  feedbackContainer: { 
    backgroundColor: '#fff', 
    marginHorizontal: 16, 
    marginTop: 16, 
    marginBottom: 8,
    padding: 16, 
    borderRadius: 16, 
    borderWidth: 1, 
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 5,
    elevation: 1
  },
  feedbackTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  feedbackTitle: { fontWeight: 'bold', fontSize: 15, color: '#1e293b' },
  noFeedback: { color: '#94a3b8', fontStyle: 'italic', fontSize: 13 },
  feedbackItem: { marginBottom: 10, backgroundColor: '#f8fafc', padding: 12, borderRadius: 12 },
  feedbackPatient: { fontWeight: '700', color: '#334155', fontSize: 14 },
  feedbackComment: { color: '#475569', fontSize: 13, marginTop: 4, fontStyle: 'italic' },

  listPadding: { paddingBottom: 40 },
  card: { 
    backgroundColor: '#fff', 
    padding: 18, 
    borderRadius: 20, 
    marginTop: 14,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f8fafc'
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  patientInfoArea: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  cardIconBox: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#eff6ff', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
  
  patientName: { fontSize: 18, fontWeight: 'bold', color: '#0f172a', marginBottom: 4 },
  timeText: { fontSize: 14, color: '#475569', fontWeight: '600' },
  
  reasonBox: { backgroundColor: '#f8fafc', padding: 12, borderRadius: 12, marginTop: 16 },
  reasonLabel: { fontSize: 12, color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', marginBottom: 4 },
  reasonText: { fontSize: 14, color: '#475569', lineHeight: 20 },

  emergencyCard: { borderLeftWidth: 6, borderLeftColor: '#ef4444' },
  ambulanceCard: { borderLeftWidth: 6, borderLeftColor: '#f59e0b' },
  emergencyTitle: { color: '#ef4444', fontWeight: '800', fontSize: 14, letterSpacing: 0.5 },
  ambulanceTitle: { color: '#f59e0b', fontWeight: '800', fontSize: 14, letterSpacing: 0.5 },
  
  buttonGrid: { flexDirection: 'row', marginTop: 18, gap: 12 },
  actionBtn: { paddingVertical: 14, borderRadius: 14, flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 3, elevation: 2 },
  btnIcon: { marginRight: 8 },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  
  mapBtn: { backgroundColor: '#334155', padding: 12, borderRadius: 12, marginTop: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 },
  dispatchBtn: { backgroundColor: '#10b981', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 12 },

  modalOverlay: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(15,23,42,0.7)', padding: 20 },
  modalContent: { backgroundColor: '#fff', padding: 24, borderRadius: 24, elevation: 5 },
  modalTitle: { fontSize: 20, fontWeight: '800', marginBottom: 16, color: '#1e293b' },
  input: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 14, padding: 16, height: 100, textAlignVertical: 'top', fontSize: 15, color: '#334155', backgroundColor: '#f8fafc' },
  modalActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 24 },
  saveBtn: { backgroundColor: '#3b82f6', padding: 16, borderRadius: 14, flex: 0.65, alignItems: 'center', shadowColor: '#3b82f6', shadowOpacity: 0.3, shadowRadius: 4, elevation: 2 },
  cancelBtn: { padding: 16, flex: 0.3, alignItems: 'center', backgroundColor: '#f1f5f9', borderRadius: 14 },
  cancelBtnText: { color: '#64748b', fontWeight: '700' },
  emptyText: { textAlign: 'center', marginTop: 60, color: '#94a3b8', fontSize: 15, fontStyle: 'italic' }
});

export default DoctorDashboard;