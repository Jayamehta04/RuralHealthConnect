import React, { useState, useEffect, useContext, useRef } from 'react';
import { View, Text, TextInput, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { BASE_URL } from '../config';
import { AuthContext } from '../context/AuthContext';
import { CallContext } from '../context/CallContext';
import { useNetwork } from '../context/NetworkContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useHeaderHeight } from '@react-navigation/elements';

const ChatConversationScreen = ({ route }) => {
  const { peerId, peerName, peerImage } = route.params;
  const { token, user } = useContext(AuthContext);
  const { startCall } = useContext(CallContext);
  const { isOnline } = useNetwork();

  
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [language, setLanguage] = useState('en');
  
  // Audio states removed
  const [soundPlay, setSoundPlay] = useState(null);

  const polling = useRef(null);
  const flatListRef = useRef(null);
  const headerHeight = useHeaderHeight();

  const translations = {
    en: { placeholder: 'Type a message...', send: 'Send', header: 'Chat with' },
    hi: { placeholder: 'अपना संदेश लिखें...', send: 'भेजें', header: 'से बात करें' }
  };

  const quickReplies = [
    { id: 1, text_en: 'Fever', text_hi: 'बुखार' },
    { id: 2, text_en: 'Cold', text_hi: 'सर्दी' },
    { id: 3, text_en: 'Headache', text_hi: 'सिर दर्द' },
    { id: 4, text_en: 'Consult Doctor', text_hi: 'डॉक्टर से बात करें' }
  ];

  const mockTranslations = {
    'Fever': 'मुझे बुखार है',
    'Cold': 'मुझे सर्दी है',
    'Headache': 'मुझे सिर दर्द है',
    'Consult Doctor': 'मुझे डॉक्टर से बात करनी है'
  };

  useEffect(() => {
    return soundPlay
      ? () => {
          soundPlay.unloadAsync();
        }
      : undefined;
  }, [soundPlay]);

  const fetchConversation = async () => {
    if (!token || !peerId) return;
    
    if (!isOnline) {
      const cached = await AsyncStorage.getItem(`chat_${peerId}`);
      if (cached) setMessages(JSON.parse(cached));
      setLoading(false);
      return;
    }

    try {
      const response = await axios.get(`${BASE_URL}/api/chat/conversation`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { withUserId: peerId }
      });
      const data = (response.data || []).reverse();
      setMessages(data);
      await AsyncStorage.setItem(`chat_${peerId}`, JSON.stringify(data));
    } catch (error) {
      console.error('Chat fetch failed', error);
    } finally {
      setLoading(false);
    }
  };

  const syncOfflineMessages = async () => {
    try {
      const offlineQueue = await AsyncStorage.getItem(`offline_queue_${peerId}`);
      if (offlineQueue) {
        const messages = JSON.parse(offlineQueue);
        for (let msg of messages) {
           await axios.post(`${BASE_URL}/api/chat/send`, msg, {
             headers: { Authorization: `Bearer ${token}` }
           });
        }
        await AsyncStorage.removeItem(`offline_queue_${peerId}`);
        fetchConversation(); // refresh
      }
    } catch (e) {
      console.error("Failed to sync offline messages", e);
    }
  };

  useEffect(() => {
    if (isOnline) {
      syncOfflineMessages();
    }
  }, [isOnline]);

  const handleQuickReply = (reply) => {
    const payloadText = language === 'en' ? reply.text_en : reply.text_hi;
    sendMessage(payloadText, reply.text_en, reply.text_hi);
  };

  const sendMessage = async (overrideText = null, textEn = null, textHi = null, audioUri = null) => {
    if (audioUri) {
      try {
        const payload = {
          receiverId: peerId,
          text: '',
          text_en: '',
          text_hi: '',
          type: 'audio',
          audio: audioUri,
          senderImage: user?.profilePicture || user?.image || null
        };
        const res = await axios.post(`${BASE_URL}/api/chat/send`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const deliveredMsg = res.data;
        deliveredMsg.type = 'audio';
        deliveredMsg.audio = audioUri; 

        setMessages(prev => [deliveredMsg, ...prev]);
        setTimeout(() => flatListRef.current?.scrollToOffset({ offset: 0, animated: true }), 100);
      } catch (err) { console.error('Audio message send failed', err); }
      return;
    }

    const textToSend = overrideText || text;
    if (!textToSend?.trim()) return;

    let simulated_en = textEn || textToSend.trim();
    let simulated_hi = textHi || mockTranslations[textToSend.trim()] || textToSend.trim();

    const payload = { 
      receiverId: peerId, 
      text: textToSend.trim(),
      text_en: simulated_en,
      text_hi: simulated_hi,
      type: 'text',
      senderImage: user?.profilePicture || user?.image || null
    };

    if (!isOnline) {
      if (!overrideText) setText('');
      const offlineMsg = { ...payload, _id: Date.now().toString(), sender: user?.id || user?._id, createdAt: new Date().toISOString(), isOffline: true };
      
      setMessages(prev => {
        const newMessages = [offlineMsg, ...prev];
        AsyncStorage.setItem(`chat_${peerId}`, JSON.stringify(newMessages));
        return newMessages;
      });
      
      const offlineQueue = await AsyncStorage.getItem(`offline_queue_${peerId}`);
      const queue = offlineQueue ? JSON.parse(offlineQueue) : [];
      queue.push(payload);
      await AsyncStorage.setItem(`offline_queue_${peerId}`, JSON.stringify(queue));
      
      setTimeout(() => flatListRef.current?.scrollToOffset({ offset: 0, animated: true }), 100);
      return;
    }

    try {
      const res = await axios.post(`${BASE_URL}/api/chat/send`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!overrideText) {
        setText('');
      }

      const deliveredMsg = res.data;
      if (!deliveredMsg.text_en) deliveredMsg.text_en = payload.text_en;
      if (!deliveredMsg.text_hi) deliveredMsg.text_hi = payload.text_hi;
      deliveredMsg.type = payload.type || 'text';
      
      setMessages(prev => {
        const newMessages = [deliveredMsg, ...prev];
        AsyncStorage.setItem(`chat_${peerId}`, JSON.stringify(newMessages));
        return newMessages;
      });
      setTimeout(() => flatListRef.current?.scrollToOffset({ offset: 0, animated: true }), 100);
    } catch (error) {
      console.error('Send message failed', error);
    }
  };

  const playAudio = async (uri) => {
    try {
      const { sound } = await Audio.Sound.createAsync({ uri });
      setSoundPlay(sound);
      await sound.playAsync();
    } catch (e) {
      console.error('Error playing audio', e);
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
    let displayFormat = language === 'hi' 
      ? (item.text_hi || item.text) 
      : (item.text_en || item.text);

    return (
      <View style={[styles.messageRow, isMine ? styles.myMessageRow : styles.theirMessageRow]}>
        {!isMine && (
           <View style={[styles.bubbleAvatar, {marginRight: 8, overflow: 'visible', backgroundColor: 'transparent'}]}>
             <Image
               source={
                 item.senderImage || peerImage
                   ? { uri: item.senderImage || peerImage }
                   : { uri: 'https://cdn-icons-png.flaticon.com/512/149/149071.png' }
               }
               style={{ width: 30, height: 30, borderRadius: 15 }}
             />
           </View>
        )}
        <View style={[styles.messageContainer, isMine ? styles.myMessage : styles.theirMessage]}>
          {item.type === 'audio' || item.audio ? (
             <TouchableOpacity style={styles.audioBubble} onPress={() => playAudio(item.audio)}>
               <Ionicons name="play-circle" size={28} color={isMine ? '#1e3a8a' : '#0f172a'} />
               <Text style={[styles.messageText, isMine ? styles.myText : styles.theirText, {marginLeft: 8, fontWeight: '600'}]}>
                 Audio Message
               </Text>
             </TouchableOpacity>
          ) : (
             <Text style={[styles.messageText, isMine ? styles.myText : styles.theirText]}>
               {displayFormat}
             </Text>
          )}
          <Text style={styles.timeText}>
            {new Date(item.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
          </Text>
        </View>
        {isMine && (
           <View style={[styles.bubbleAvatar, {marginLeft: 8, overflow: 'visible', backgroundColor: 'transparent'}]}>
             <Image
               source={
                 item.senderImage || user?.profilePicture || user?.image
                   ? { uri: item.senderImage || user?.profilePicture || user?.image }
                   : { uri: 'https://cdn-icons-png.flaticon.com/512/149/149071.png' }
               }
               style={{ width: 30, height: 30, borderRadius: 15 }}
             />
           </View>
        )}
      </View>
    );
  };

  const t = translations[language];

  return (
    <KeyboardAvoidingView 
      style={styles.screen} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
      keyboardVerticalOffset={headerHeight}
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.headerAvatar, {overflow: 'visible', backgroundColor: 'transparent'}]}>
            <Image
              source={
                 peerImage
                   ? { uri: peerImage }
                   : { uri: 'https://cdn-icons-png.flaticon.com/512/149/149071.png' }
              }
              style={{ width: 38, height: 38, borderRadius: 19 }}
            />
          </View>
          <Text style={styles.headerText}>
            {language === 'en' ? `${t.header} ${peerName || 'Contact'}` : `${peerName || 'Contact'} ${t.header}`}
          </Text>
        </View>
        <View style={styles.headerRightArea}>

          <TouchableOpacity 
            style={styles.langToggle} 
            onPress={() => setLanguage(prev => prev === 'en' ? 'hi' : 'en')}
          >
            <Text style={styles.langToggleText}>{language === 'en' ? 'हिंदी' : 'EN'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#3498db" />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          inverted
          keyboardShouldPersistTaps="handled"
        />
      )}

      <View style={styles.inputArea}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickReplyContainer}>
          {quickReplies.map((qr) => (
            <TouchableOpacity key={qr.id} style={styles.quickReplyBtn} onPress={() => handleQuickReply(qr)}>
              <Text style={styles.quickReplyText}>{language === 'en' ? qr.text_en : qr.text_hi}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        
        <View style={styles.inputRow}>
          <View style={styles.inputWrapper}>
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder={t.placeholder}
              style={styles.input}
              multiline
            />
          </View>
          <TouchableOpacity style={styles.sendButton} onPress={() => sendMessage()}>
            <Text style={styles.sendText}>{t.send}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#eff6ff' },
  header: { padding: 15, backgroundColor: '#1d4ed8', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerText: { color: '#fff', fontWeight: '700', fontSize: 18 },
  headerRightArea: { flexDirection: 'row', alignItems: 'center' },
  headerCallBtn: { marginRight: 12, padding: 4 },
  langToggle: { backgroundColor: '#ffffff30', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 16 },
  langToggleText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  headerAvatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: 12, flexGrow: 1, justifyContent: 'flex-end' },
  messageRow: { flexDirection: 'row', alignItems: 'flex-end', marginVertical: 5 },
  myMessageRow: { justifyContent: 'flex-end' },
  theirMessageRow: { justifyContent: 'flex-start' },
  bubbleAvatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#94a3b8', justifyContent: 'center', alignItems: 'center', marginRight: 8, marginBottom: 2 },
  messageContainer: { 
    maxWidth: '80%', padding: 10, borderRadius: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 1
  },
  audioBubble: { flexDirection: 'row', alignItems: 'center' },
  myMessage: { alignSelf: 'flex-end', backgroundColor: '#dbeafe' },
  theirMessage: { alignSelf: 'flex-start', backgroundColor: '#ffffff' },
  messageText: { fontSize: 15, lineHeight: 20 },
  myText: { color: '#1e3a8a' },
  theirText: { color: '#0f172a' },
  timeText: { fontSize: 11, color: '#64748b', marginTop: 4, textAlign: 'right' },
  inputArea: { backgroundColor: '#fff', borderTopWidth: 1, borderColor: '#e2e8f0', paddingBottom: Platform.OS === 'ios' ? 20 : 0 },
  quickReplyContainer: { paddingHorizontal: 10, paddingVertical: 10, flexDirection: 'row', borderBottomWidth: 1, borderColor: '#f1f5f9' },
  quickReplyBtn: { backgroundColor: '#f8fafc', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginRight: 8, borderWidth: 1, borderColor: '#e2e8f0' },
  quickReplyText: { fontSize: 13, color: '#475569', fontWeight: '500' },
  inputRow: { flexDirection: 'row', padding: 10, alignItems: 'flex-end' },
  inputWrapper: { flex: 1, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 20, marginRight: 8, backgroundColor: '#f8fafc', paddingRight: 8 },
  recordingIndicator: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 12 },
  input: { flex: 1, padding: 12, paddingTop: 12, maxHeight: 100 },
  micButton: { padding: 4, marginRight: 4 },
  sendButton: { backgroundColor: '#2563eb', borderRadius: 20, justifyContent: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  sendText: { color: '#fff', fontWeight: '700' }
});

export default ChatConversationScreen;
