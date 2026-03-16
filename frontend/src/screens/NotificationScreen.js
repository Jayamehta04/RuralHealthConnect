import React, { useState, useEffect, useContext } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

const NotificationScreen = () => {
  const { token, setUnreadCount } = useContext(AuthContext);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://192.168.29.214:5000/api/notifications', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(res.data);
      const unread = res.data.filter((n) => !n.isRead).length;
      setUnreadCount(unread);
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Could not load notifications.');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      await axios.put(`http://192.168.29.214:5000/api/notifications/read/${id}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchNotifications();
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Could not mark as read.');
    }
  };

  const markAllAsRead = async () => {
    try {
      await axios.put('http://192.168.29.214:5000/api/notifications/read-all', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchNotifications();
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Could not mark all as read.');
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const renderItem = ({ item }) => (
    <TouchableOpacity style={[styles.card, item.isRead ? styles.read : styles.unread]} onPress={() => markAsRead(item._id)}>
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.body}>{item.body}</Text>
      <Text style={styles.meta}>{new Date(item.createdAt).toLocaleString()}</Text>
    </TouchableOpacity>
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
      <View style={styles.toolbar}>
        <Text style={styles.header}>Notifications</Text>
        <TouchableOpacity style={styles.markAllBtn} onPress={markAllAsRead}>
          <Text style={styles.markAllText}>Mark all as read</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={notifications}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        ListEmptyComponent={<Text style={styles.empty}>No notifications yet.</Text>}
        contentContainerStyle={{ paddingBottom: 100 }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', padding: 12 },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 15, color: '#1e293b' },
  card: { backgroundColor: '#fff', padding: 14, borderRadius: 12, marginBottom: 10, borderWidth: 1 },
  unread: { borderColor: '#60a5fa' },
  read: { borderColor: '#d1d5db' },
  title: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
  body: { color: '#334155', marginTop: 4 },
  meta: { color: '#94a3b8', marginTop: 8, fontSize: 12 },
  empty: { textAlign: 'center', marginTop: 50, color: '#94a3b8' },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  toolbar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  markAllBtn: { backgroundColor: '#3b82f6', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8 },
  markAllText: { color: '#fff', fontWeight: '700', fontSize: 13 }
});

export default NotificationScreen;
