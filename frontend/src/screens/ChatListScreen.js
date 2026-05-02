import React, { useState, useEffect, useContext } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
      peerRole: user?.role === 'doctor' ? 'patient' : 'doctor',
      peerImage: peer.profilePicture || peer.image || null
    });
  };

  const renderItem = ({ item }) => {
    const isDoctor = !!item.specialization;
    const avatarBg = isDoctor ? '#eff6ff' : '#f0fdf4';
    const avatarIconColor = isDoctor ? '#3b82f6' : '#22c55e';

    return (
      <TouchableOpacity style={styles.card} onPress={() => startChat(item)}>
        <View style={styles.cardLeft}>
          {item.profilePicture || item.image ? (
            <Image source={{ uri: item.profilePicture || item.image }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, { backgroundColor: avatarBg }]}>
              <Ionicons name="person" size={24} color={avatarIconColor} />
            </View>
          )}
          <View style={styles.textContainer}>
            <Text style={styles.name}>{item.name || 'Unknown'}</Text>
            <Text style={styles.meta}>
              {item.specialization ? `${item.specialization}` : `${item.email || 'Patient'}`}
            </Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
      </TouchableOpacity>
    );
  };

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
      
      <TouchableOpacity style={styles.aiCard} onPress={() => navigation.navigate('AIChat')}>
        <View style={styles.cardLeft}>
          <View style={[styles.avatar, { backgroundColor: '#e0e7ff' }]}>
            <Ionicons name="sparkles" size={24} color="#6366f1" />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.name}>AI Health Assistant</Text>
            <Text style={styles.meta}>Available 24/7 for you</Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
      </TouchableOpacity>

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
    padding: 16,
    marginBottom: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2
  },
  aiCard: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#c7d2fe',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14
  },
  textContainer: {
    justifyContent: 'center'
  },
  name: { fontSize: 17, fontWeight: '700', color: '#1e293b', marginBottom: 4 },
  meta: { fontSize: 13, color: '#64748b' },
  empty: { textAlign: 'center', marginTop: 40, color: '#9ca3af', fontSize: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' }
});

export default ChatListScreen;
