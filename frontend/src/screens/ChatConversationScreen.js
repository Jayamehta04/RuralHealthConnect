import React, { useState, useEffect, useContext, useRef } from 'react';
import { View, Text, TextInput, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import axios from 'axios';
import { BASE_URL } from '../config';
import { AuthContext } from '../context/AuthContext';

const ChatConversationScreen = ({ route }) => {
  const { peerId, peerName } = route.params;
  const { token, user } = useContext(AuthContext);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const polling = useRef(null);

  const fetchConversation = async () => {
    if (!token || !peerId) return;

    try {
      const response = await axios.get(`${BASE_URL}/api/chat/conversation`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { withUserId: peerId }
      });
      setMessages(response.data || []);
    } catch (error) {
      console.error('Chat fetch failed', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!text.trim()) return;
    try {
      const payload = { receiverId: peerId, text: text.trim() };
      const res = await axios.post(`${BASE_URL}/api/chat/send`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setText('');
      setMessages(prev => [...prev, res.data]);
    } catch (error) {
      console.error('Send message failed', error);
    }
  };

  useEffect(() => {
    fetchConversation();
    polling.current = setInterval(fetchConversation, 4500);

    return () => {
      if (polling.current) clearInterval(polling.current);
    };
  }, [peerId, token]);

  const renderItem = ({ item }) => {
    const isMine = item.sender === (user?.id || user?._id);
    return (
      <View style={[styles.messageContainer, isMine ? styles.myMessage : styles.theirMessage]}>
        <Text style={[styles.messageText, isMine ? styles.myText : styles.theirText]}>{item.text}</Text>
        <Text style={styles.timeText}>{new Date(item.createdAt).toLocaleTimeString()}</Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Chat with {peerName || 'Contact'}</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#3498db" />
        </View>
      ) : (
        <FlatList
          data={messages}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          inverted
        />
      )}

      <View style={styles.inputRow}>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Type a message..."
          style={styles.input}
          multiline
        />
        <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
          <Text style={styles.sendText}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#eff6ff' },
  header: { padding: 15, backgroundColor: '#1d4ed8' },
  headerText: { color: '#fff', fontWeight: '700', fontSize: 18 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: 12, flexGrow: 1, justifyContent: 'flex-end' },
  messageContainer: { marginVertical: 5, maxWidth: '80%', padding: 10, borderRadius: 12 },
  myMessage: { alignSelf: 'flex-end', backgroundColor: '#dbeafe' },
  theirMessage: { alignSelf: 'flex-start', backgroundColor: '#ffffff' },
  messageText: { fontSize: 15, lineHeight: 20 },
  myText: { color: '#1e3a8a' },
  theirText: { color: '#0f172a' },
  timeText: { fontSize: 11, color: '#64748b', marginTop: 4, textAlign: 'right' },
  inputRow: { flexDirection: 'row', padding: 10, backgroundColor: '#fff', borderTopWidth: 1, borderColor: '#e2e8f0' },
  input: { flex: 1, padding: 10, borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 10, marginRight: 8, backgroundColor: '#f8fafc' },
  sendButton: { backgroundColor: '#2563eb', borderRadius: 10, justifyContent: 'center', paddingHorizontal: 12, paddingVertical: 10 },
  sendText: { color: '#fff', fontWeight: '700' }
});

export default ChatConversationScreen;
