import React, { useState, useEffect, useContext } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import axios from 'axios';
import { BASE_URL } from '../config';
import { AuthContext } from '../context/AuthContext';

const ChatListScreen = ({ navigation }) => {
  const { token, user, logout } = useContext(AuthContext);
  const [peers, setPeers] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadPeerList = async () => {
    if (!token) return;
    setLoading(true);

    try {
      if (user?.role === 'doctor') {
        const result = await axios.get(`${BASE_URL}/api/appointments/doctor-appointments`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        // unique patients by id
        const unique = [];
        const map = new Map();
        result.data.forEach((appt) => {
          if (appt.patient && !map.has(appt.patient._id)) {
            map.set(appt.patient._id, appt.patient);
          }
        });
        unique.push(...map.values());
        setPeers(unique);
      } else {
        const result = await axios.get(`${BASE_URL}/api/doctors`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        setPeers(result.data || []);
      }
    } catch (error) {
      console.error('Chat list fetch error', error);
      if (error.response?.status === 401) {
        Alert.alert('Session expired', 'Please log in again');
        logout();
      } else {
        Alert.alert('Error', 'Unable to load chat contacts');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPeerList();
  }, [token, user]);

  const startChat = (peer) => {
    navigation.navigate('ChatConversation', {
      peerId: peer._id,
      peerName: peer.name,
      peerRole: user?.role === 'doctor' ? 'patient' : 'doctor'
    });
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.card} onPress={() => startChat(item)}>
      <Text style={styles.name}>{item.name || 'Unknown'}</Text>
      <Text style={styles.meta}>{item.specialization ? `${item.specialization}` : `${item.email || ''}`}</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#3498db" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Chat Contacts</Text>
      <FlatList
        data={peers}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        ListEmptyComponent={<Text style={styles.empty}>No contacts available yet.</Text>}
        contentContainerStyle={peers.length ? {} : { flex: 1, justifyContent: 'center' }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 15, backgroundColor: '#f3f4f6' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 12, color: '#1f2937' },
  card: {
    backgroundColor: '#fff',
    padding: 14,
    marginBottom: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb'
  },
  name: { fontSize: 16, fontWeight: '700', color: '#111827' },
  meta: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  empty: { textAlign: 'center', marginTop: 40, color: '#9ca3af', fontSize: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' }
});

export default ChatListScreen;
