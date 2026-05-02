import React, { useState, useRef, useEffect, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, SafeAreaView, StatusBar, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { BASE_URL } from '../config';
import { AuthContext } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';

const AIChatScreen = ({ navigation }) => {
  const [messages, setMessages] = useState([]);
  const [inputMsg, setInputMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const flatListRef = useRef(null);
  const { token } = useContext(AuthContext);
  const { t, i18n } = useTranslation();

  useEffect(() => {
    // Initial welcome message
    const welcome = {
      _id: 'welcome_1',
      text: i18n.language === 'hi' 
        ? "नमस्ते! मैं आपका स्मार्ट स्वास्थ्य सहायक हूँ। अपने लक्षण या सवाल मुझे बताएं।" 
        : "Hello! I am your Smart Health Assistant. Please tell me your symptoms or query.",
      isSender: false,
      timestamp: new Date().toISOString(),
    };
    setMessages([welcome]);
  }, [i18n.language]);

  const sendMessage = async () => {
    if (!inputMsg.trim()) return;

    const userMessage = {
      _id: Math.random().toString(),
      text: inputMsg,
      isSender: true,
      timestamp: new Date().toISOString(),
    };

    // To provide context context for the AI, we'll keep the last 5 messages
    const recentHistory = messages.slice(-5).map(m => ({
      role: m.isSender ? 'user' : 'model',
      text: typeof m.text === 'string' ? m.text : JSON.stringify(m.text)
    }));

    setMessages((prev) => [...prev, userMessage]);
    setInputMsg("");
    setLoading(true);

    try {
      const lang = i18n.language || 'en';
      const response = await axios.post(
        `${BASE_URL}/api/ai/chat`,
        { message: userMessage.text, language: lang, history: recentHistory },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const aiReply = {
        _id: Math.random().toString(),
        text: response.data.reply, // This will be the parsed JSON from the backend
        isSender: false,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, aiReply]);
    } catch (error) {
      // Use console.log to avoid the giant red LogBox crash screen in Expo
      console.log("AI Chat Error:", error.message || error);
      // Offline / Error Fallback
      if (error.isAxiosError && !error.response) {
          Alert.alert("Offline", "Please check your internet connection. Try viewing health tips in the meantime.");
      }
      const errorReply = {
        _id: Math.random().toString(),
        text: i18n.language === 'hi' 
            ? "माफ़ करें, मुझे उत्तर देने में परेशानी हो रही है। कृपया डॉक्टर से संपर्क करें।" 
            : "Sorry, I am having trouble responding right now. Please seek professional advice.",
        isSender: false,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorReply]);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }) => {
    // 1. Render simple string messages (User or fallback/welcome)
    if (typeof item.text === 'string') {
      return (
        <View style={[styles.messageBubble, item.isSender ? styles.senderBubble : styles.receiverBubble]}>
          {!item.isSender && <Ionicons name="medical" size={16} color="#007BFF" style={{marginRight: 6}} />}
          <Text style={[styles.messageText, item.isSender ? styles.senderText : styles.receiverText]}>
            {item.text}
          </Text>
        </View>
      );
    }

    // 2. Render Structured JSON Object
    const { possible_issue, severity, advice, next_step, precautions } = item.text;
    
    // Determine color based on severity
    let severityColor = '#28a745'; 
    let severityLabel = severity ? severity.toUpperCase() : 'UNKNOWN';
    if (severity && severity.toLowerCase().includes('moderate')) {
        severityColor = '#ffc107'; // Yellow
    } else if (severity && severity.toLowerCase().includes('severe')) {
        severityColor = '#dc3545'; // Red
    }

    return (
      <View style={[styles.messageBubble, styles.aiCardBubble]}>
         <View style={styles.aiCardHeader}>
            <View style={{flexDirection: 'row', alignItems: 'center', flex: 1}}>
              <Ionicons name="medical" size={18} color="#007BFF" />
              <Text style={styles.aiCardTitle} numberOfLines={2}>
                 {possible_issue ? possible_issue : 'Health Assessment'}
              </Text>
            </View>
            <View style={[styles.severityBadge, {backgroundColor: severityColor}]}>
              <Text style={styles.severityText}>{severityLabel}</Text>
           </View>
         </View>

         <View style={styles.aiContentBox}>
             {advice && (
               <>
                 <Text style={styles.sectionHeader}>Advice / Guidance:</Text>
                 <Text style={styles.aiText}>{advice}</Text>
               </>
             )}
             
             {precautions && precautions.length > 0 && (
                <>
                <Text style={styles.sectionHeader}>Precautions:</Text>
                {precautions.map((p, idx) => (
                    <Text key={idx} style={styles.aiText}>• {p}</Text>
                ))}
                </>
             )}
             
             {next_step && (
               <>
                 <Text style={styles.sectionHeader}>Next Step:</Text>
                 <Text style={styles.aiText}>{next_step}</Text>
               </>
             )}
         </View>
         
         {/* Dynamic Action Buttons */}
         <View style={styles.actionRow}>
            {(!severityLabel.includes('MILD') && !severityLabel.includes('UNKNOWN')) && (
                <TouchableOpacity style={styles.consultBtn} onPress={() => navigation.navigate('DoctorDiscovery')}>
                   <Ionicons name="stethoscope" size={16} color="#fff" style={{marginRight:6}} />
                   <Text style={styles.btnText}>Consult Doctor</Text>
                </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.tipsBtn} onPress={() => navigation.navigate('HealthAwareness')}>
               <Ionicons name="bulb" size={16} color="#007BFF" style={{marginRight:6}} />
               <Text style={styles.tipsBtnText}>Tips</Text>
            </TouchableOpacity>
         </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Ionicons name="sparkles" size={20} color="#007BFF" style={{marginLeft: 10, marginRight: 5}} />
        <Text style={styles.headerTitle}>{i18n.language === 'hi' ? 'स्मार्ट स्वास्थ्य सहायक' : 'Smart Health Assistant'}</Text>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
        keyboardShouldPersistTaps="handled"
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      {loading && (
        <View style={styles.typingContainer}>
          <Text style={styles.typingText}>{i18n.language === 'hi' ? "विश्लेषण कर रहा है..." : "Analyzing..."}</Text>
          <ActivityIndicator size="small" color="#007BFF" />
        </View>
      )}

      <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder={i18n.language === 'hi' ? "अपने लक्षण बताएं (जैसे: मेरे सिर में दर्द है)..." : "Describe your symptoms (e.g., I have a headache)..."}
            value={inputMsg}
            onChangeText={setInputMsg}
            multiline
          />
          <TouchableOpacity 
            style={[styles.sendButton, !inputMsg.trim() && { backgroundColor: '#A0C4FF' }]} 
            onPress={sendMessage}
            disabled={!inputMsg.trim()}
          >
            <Ionicons name="send" size={20} color="#FFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8F9FA' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    elevation: 2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  listContainer: { padding: 16, paddingBottom: 20 },
  messageBubble: {
    maxWidth: '85%', padding: 12, borderRadius: 16, marginBottom: 16, flexDirection: 'row', alignItems: 'center'
  },
  senderBubble: {
    backgroundColor: '#007BFF', alignSelf: 'flex-end', borderBottomRightRadius: 4,
  },
  receiverBubble: {
    backgroundColor: '#FFF', alignSelf: 'flex-start', borderBottomLeftRadius: 4, maxWidth: '85%',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 1
  },
  messageText: { fontSize: 16, lineHeight: 22 },
  senderText: { color: '#FFF' },
  receiverText: { color: '#333' },
  
  // Structured AI Card specific styles
  aiCardBubble: {
    backgroundColor: '#FFF', alignSelf: 'flex-start', borderBottomLeftRadius: 4, flexDirection: 'column', alignItems: 'stretch',
    maxWidth: '90%', padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 2
  },
  aiCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  aiCardTitle: { fontSize: 16, fontWeight: '700', color: '#111', marginLeft: 6, flexShrink: 1 },
  severityBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginLeft: 10 },
  severityText: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },
  
  aiContentBox: { backgroundColor: '#F8F9FA', padding: 12, borderRadius: 8, marginBottom: 12 },
  sectionHeader: { fontSize: 13, fontWeight: 'bold', color: '#666', marginTop: 8, marginBottom: 2, textTransform: 'uppercase' },
  aiText: { fontSize: 15, color: '#333', lineHeight: 22, marginBottom: 6 },
  
  actionRow: { flexDirection: 'row', justifyContent: 'flex-start', gap: 10 },
  consultBtn: { flexDirection: 'row', backgroundColor: '#dc3545', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20, alignItems: 'center' },
  btnText: { color: '#FFF', fontWeight: 'bold', fontSize: 13 },
  tipsBtn: { flexDirection: 'row', backgroundColor: '#e9ecef', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, alignItems: 'center' },
  tipsBtnText: { color: '#007BFF', fontWeight: 'bold', fontSize: 13 },

  typingContainer: {
    flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginBottom: 10,
  },
  typingText: { color: '#6C757D', fontStyle: 'italic', marginRight: 8 },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center', padding: 10, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#E0E0E0',
  },
  input: {
    flex: 1, backgroundColor: '#F1F3F5', borderRadius: 20, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12, fontSize: 16, maxHeight: 100, marginRight: 8,
  },
  sendButton: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: '#007BFF', justifyContent: 'center', alignItems: 'center',
  },
});

export default AIChatScreen;
