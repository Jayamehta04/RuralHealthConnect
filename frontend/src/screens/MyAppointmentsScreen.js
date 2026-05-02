import React, { useEffect, useState, useContext } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Pressable, Modal, Alert, TextInput, TouchableOpacity, RefreshControl, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { BASE_URL } from '../config';
import { AuthContext } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';

const MyAppointmentsScreen = () => {
  const { t, i18n } = useTranslation();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('All');
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

    navigation.setOptions({
      title: i18n.language === 'hi' ? 'मेरी बुकिंग' : 'My Bookings',
    });

    return unsubscribe;
  }, [navigation, token]);

  const fetchMyAppointments = async () => {
    if (!token) return;
    try {
      const response = await axios.get(`${BASE_URL}/api/appointments/my-appointments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAppointments(response.data);
    } catch (error) {
      console.error("Fetch Error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchMyAppointments();
  };

  const handleCancel = async (appointmentId) => {
    Alert.alert(
      t('appointments.cancelAppointment'),
      t('appointments.cancelConfirm'),
      [
        { text: t('common.no'), style: 'cancel' },
        {
          text: t('appointments.yesCancel'),
          style: 'destructive',
          onPress: async () => {
            try {
              await axios.put(`${BASE_URL}/api/appointments/cancel/${appointmentId}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
              });
              Alert.alert(t('common.success'), t('appointments.cancelled'));
              fetchMyAppointments(); // Refresh list
            } catch (error) {
              Alert.alert(t('common.error'), t('appointments.cancelFail'));
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
      Alert.alert(t('common.error'), t('appointments.errorFillFields'));
      return;
    }

    try {
      await axios.put(
        `${BASE_URL}/api/appointments/reschedule/${selectedAppointment._id}`,
        { date: selectedDate, time: selectedTime },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      Alert.alert(t('common.success'), t('appointments.rescheduleSuccess'));
      setRescheduleModal(false);
      fetchMyAppointments(); // Refresh list
    } catch (error) {
      Alert.alert(t('common.error'), t('appointments.rescheduleFail'));
    }
  };

  const getStatusColor = (status) => {
    const s = String(status || '').toLowerCase();
    switch (s) {
      case 'accepted': return { bg: '#dcfce7', text: '#166534' };
      case 'completed': return { bg: '#dbeafe', text: '#1e40af' };
      case 'rejected': return { bg: '#fee2e2', text: '#991b1b' };
      case 'cancelled': return { bg: '#fee2e2', text: '#991b1b' };
      case 'pending': default: return { bg: '#fef08a', text: '#854d0e' };
    }
  };

  const renderItem = ({ item }) => {
    const statusStyle = getStatusColor(item.status);

    return (
      <View style={styles.ticketCard}>
        <View style={styles.ticketHeader}>
          <View style={styles.docInfo}>
            <View style={[styles.avatarMini, { overflow: 'visible', backgroundColor: 'transparent' }]}>
              <Image
                source={
                  item.doctor?.profilePicture || item.doctor?.image
                    ? { uri: item.doctor.profilePicture || item.doctor.image }
                    : { uri: 'https://cdn-icons-png.flaticon.com/512/149/149071.png' }
                }
                style={{ width: 32, height: 32, borderRadius: 16 }}
              />
            </View>
            <Text style={styles.doctorName}>Dr. {item.doctor?.name || 'Unknown Doctor'}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
            <Text style={[styles.statusText, { color: statusStyle.text }]}>{item.status}</Text>
          </View>
        </View>

        <View style={styles.ticketBody}>
          <View style={styles.dateTimeRow}>
            <Ionicons name="calendar-outline" size={16} color="#64748b" />
            <Text style={styles.dateTimeText}>{new Date(item.date).toLocaleDateString()}</Text>
            <Ionicons name="time-outline" size={16} color="#64748b" style={{ marginLeft: 16 }} />
            <Text style={styles.dateTimeText}>{item.time}</Text>
          </View>
          {item.reason && <Text style={styles.reasonText}>For: {item.reason}</Text>}
        </View>

        {item.doctorNotes ? (
          <View style={styles.noteContainer}>
            <Text style={styles.noteLabel}>{t('appointments.doctorNote')}</Text>
            <Text style={styles.noteText}>{item.doctorNotes}</Text>
          </View>
        ) : null}

        {item.prescription ? (
          <View style={[styles.noteContainer, { backgroundColor: '#f0fdfa' }]}>
            <Text style={[styles.noteLabel, { color: '#0f766e' }]}>{t('appointments.prescription')}</Text>
            <Text style={styles.noteText}>{item.prescription}</Text>
          </View>
        ) : null}

        <View style={styles.buttonRow}>
          {item.status !== 'completed' && item.status !== 'cancelled' ? (
            <>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: '#fef2f2' }]}
                onPress={() => handleCancel(item._id)}
              >
                <Text style={[styles.btnText, { color: '#dc2626' }]}>{t('appointments.cancel')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: '#f0f9ff' }]}
                onPress={() => handleReschedule(item)}
              >
                <Text style={[styles.btnText, { color: '#0284c7' }]}>{t('appointments.reschedule')}</Text>
              </TouchableOpacity>
            </>
          ) : item.status === 'completed' && !item.hasFeedback ? (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: '#fdf4ff' }]}
              onPress={() => navigation.navigate('RateDoctor', {
                appointmentId: item._id,
                doctorId: item.doctor?._id,
                doctorName: item.doctor?.name
              })}
            >
              <Text style={[styles.btnText, { color: '#a21caf' }]}>{t('appointments.writeReview')}</Text>
            </TouchableOpacity>
          ) : (
            <View style={[styles.actionBtn, { backgroundColor: '#f1f5f9' }]}>
              <Text style={[styles.btnText, { color: '#64748b' }]}>{item.status === 'completed' ? t('appointments.reviewed') : t('appointments.closed')}</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  if (loading) return (
    <View style={styles.loaderContainer}>
      <ActivityIndicator size="large" color="#3498db" />
      <Text style={{ marginTop: 10 }}>{t('appointments.loading')}</Text>
    </View>
  );

  const filteredAppointments = appointments.filter(appt => {
    if (activeTab === 'All') return true;
    return String(appt.status).toLowerCase() === activeTab.toLowerCase();
  });

  return (
    <View style={styles.container}>
      {/* FILTER TABS */}
      <View style={styles.tabScrollContainer}>
        {['All', 'Pending', 'Accepted', 'Completed'].map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabBtn, activeTab === tab && styles.activeTabBtn]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabBtnText, activeTab === tab && styles.activeTabBtnText]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredAppointments}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 20 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#3498db']} />}
        ListEmptyComponent={
          <Text style={styles.emptyText}>{loading ? t('appointments.loading') : t('appointments.empty')}</Text>
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
              <Text style={styles.modalTitle}>{t('appointments.rescheduleTitle')}</Text>

              <Text style={styles.label}>{t('appointments.dateLabel')}</Text>
              <TextInput
                style={styles.input}
                placeholder="2026-03-15"
                value={selectedDate}
                onChangeText={setSelectedDate}
              />

              <Text style={styles.label}>{t('appointments.timeLabel')}</Text>
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
                  <Text style={styles.modalBtnText}>{t('common.cancel')}</Text>
                </Pressable>

                <Pressable
                  style={({ pressed }) => [styles.modalBtn, { backgroundColor: pressed ? '#1e8449' : '#27ae60' }]}
                  onPress={confirmReschedule}
                >
                  <Text style={styles.modalBtnText}>{t('common.confirm')}</Text>
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
  container: { flex: 1, padding: 20, backgroundColor: '#f8fafc' },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  ticketCard: { backgroundColor: '#fff', borderRadius: 24, padding: 20, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 10, elevation: 2 },
  ticketHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  docInfo: { flexDirection: 'row', alignItems: 'center' },
  avatarMini: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#f0fdfa', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  doctorName: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
  statusBadge: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 12 },
  statusText: { fontSize: 12, fontWeight: '800', textTransform: 'uppercase' },

  ticketBody: { backgroundColor: '#f8fafc', padding: 16, borderRadius: 16, marginBottom: 16 },
  dateTimeRow: { flexDirection: 'row', alignItems: 'center' },
  dateTimeText: { marginLeft: 6, color: '#334155', fontWeight: '600', fontSize: 14 },
  reasonText: { color: '#64748b', fontSize: 13, marginTop: 8, fontStyle: 'italic' },

  noteContainer: { backgroundColor: '#f1f5f9', padding: 14, borderRadius: 16, marginBottom: 16 },
  noteLabel: { fontWeight: '700', color: '#475569', fontSize: 12, marginBottom: 4, textTransform: 'uppercase' },
  noteText: { color: '#334155', fontSize: 14 },

  buttonRow: { flexDirection: 'row', gap: 10 },
  actionBtn: { flex: 1, paddingVertical: 14, borderRadius: 16, alignItems: 'center' },
  btnText: { fontWeight: '700', fontSize: 14 },

  emptyText: { textAlign: 'center', marginTop: 50, color: '#94a3b8', fontSize: 15, fontStyle: 'italic' },

  tabScrollContainer: { flexDirection: 'row', backgroundColor: '#e2e8f0', borderRadius: 12, padding: 4, marginBottom: 16 },
  tabBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  activeTabBtn: { backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 2, elevation: 1 },
  tabBtnText: { color: '#64748b', fontWeight: '600', fontSize: 13 },
  activeTabBtnText: { color: '#0f172a', fontWeight: '800' },

  modalOverlay: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(15, 23, 42, 0.4)', padding: 20 },
  modalContent: { backgroundColor: '#fff', padding: 24, borderRadius: 24, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 20, elevation: 10 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#1e293b', marginBottom: 20, textAlign: 'center' },
  label: { fontSize: 14, fontWeight: '600', color: '#64748b', marginBottom: 8, marginTop: 12 },
  input: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#f1f5f9', padding: 16, borderRadius: 16, fontSize: 15, color: '#1e293b' },

  modalButtons: { flexDirection: 'row', gap: 12, marginTop: 24 },
  modalBtn: { flex: 1, paddingVertical: 16, borderRadius: 16, alignItems: 'center' },
  modalBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
});

export default MyAppointmentsScreen;