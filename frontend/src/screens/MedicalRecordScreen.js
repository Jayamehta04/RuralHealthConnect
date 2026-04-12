import React, { useState, useEffect, useContext } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, Alert, TextInput, ScrollView, Image } from 'react-native';
import axios from 'axios';
import { BASE_URL } from '../config';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { AuthContext } from '../context/AuthContext';

const MedicalRecordScreen = ({ route, navigation }) => {
  const { user, token } = useContext(AuthContext);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);
  const [diagnosis, setDiagnosis] = useState('');
  const [notes, setNotes] = useState('');
  const [prescription, setPrescription] = useState('');
  const [attachment, setAttachment] = useState(null);

  const patientId = route.params?.patientId;

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const url = user?.role === 'doctor' && patientId
        ? `${BASE_URL}/api/medical-records/patient/${patientId}`
        : `${BASE_URL}/api/medical-records/me`;

      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRecords(res.data);
    } catch (err) {
      console.error('Medical records fetch:', err);
      Alert.alert('Error', 'Could not load medical records.');
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Sorry, we need camera roll permissions to make this work!');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.8,
    });

    if (!result.canceled) {
      setAttachment(result.assets[0]);
    }
  };

  const submitRecord = async () => {
    if (!diagnosis.trim()) {
      Alert.alert('Validation', 'Diagnosis is required.');
      return;
    }
    if (!patientId) {
      Alert.alert('Doctor Only', 'Select a patient first.');
      return;
    }

    setCreating(true);
    try {
      let headers = { Authorization: `Bearer ${token}` };
      let bodyData;

      if (attachment) {
        bodyData = new FormData();
        bodyData.append('patientId', patientId);
        bodyData.append('diagnosis', diagnosis);
        bodyData.append('notes', notes);
        bodyData.append('prescription', prescription);
        
        const filename = attachment.uri.split('/').pop();
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image`;

        bodyData.append('attachment', {
          uri: attachment.uri,
          name: filename,
          type
        });

        headers['Content-Type'] = 'multipart/form-data';
      } else {
        bodyData = { patientId, diagnosis, notes, prescription };
      }

      await axios.post(`${BASE_URL}/api/medical-records`, bodyData, { headers });

      setDiagnosis('');
      setNotes('');
      setPrescription('');
      setAttachment(null);
      Alert.alert('Success', 'Medical record added.');
      fetchRecords();
    } catch (err) {
      console.error('Create record error:', err);
      Alert.alert('Error', err.response?.data?.message || 'Could not save record.');
    } finally {
      setCreating(false);
    }
  };

  const downloadPrescription = async (recordId) => {
    try {
      setDownloadingId(recordId);
      const url = `${BASE_URL}/api/medical-records/${recordId}/pdf`;
      const fileUri = `${FileSystem.documentDirectory}prescription-${recordId}.pdf`;

      // Download the PDF from the backend
      const { uri } = await FileSystem.downloadAsync(
        url,
        fileUri,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Open the native share / view dialog
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(uri, { UTI: 'com.adobe.pdf', mimeType: 'application/pdf' });
      } else {
        Alert.alert('Success', 'PDF downloaded but sharing is not available on this device.');
      }
    } catch (err) {
      console.error('PDF download error:', err);
      Alert.alert('Error', 'Failed to generate and download PDF.');
    } finally {
      setDownloadingId(null);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [patientId, user, token]);

  const renderRecord = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.patientName}>Date: {new Date(item.date).toLocaleString()}</Text>
        <Text style={styles.itemSmallText}>Dr. {item.doctor?.name || '—'}</Text>
      </View>
      <Text style={styles.fieldLabel}>Diagnosis:</Text>
      <Text style={styles.fieldValue}>{item.diagnosis}</Text>
      {item.notes ? <><Text style={styles.fieldLabel}>Notes:</Text><Text style={styles.fieldValue}>{item.notes}</Text></> : null}
      {item.prescription ? <><Text style={styles.fieldLabel}>Prescription:</Text><Text style={styles.fieldValue}>{item.prescription}</Text></> : null}
      
      {item.attachments && item.attachments.length > 0 && (
        <View style={styles.attachmentContainer}>
            <Text style={styles.fieldLabel}>Attachments:</Text>
            {item.attachments.map((url, index) => (
                <Image 
                    key={index} 
                    source={{ uri: url }} 
                    style={styles.attachmentImage} 
                    resizeMode="cover"
                />
            ))}
        </View>
      )}

      <TouchableOpacity 
        style={[styles.attachBtn, { marginTop: 12, backgroundColor: '#3b82f6', alignItems: 'center' }]}
        onPress={() => downloadPrescription(item._id)}
        disabled={downloadingId === item._id}
      >
        {downloadingId === item._id ? (
            <ActivityIndicator color="#fff" size="small" />
        ) : (
            <Text style={[styles.attachBtnText, { color: '#fff' }]}>⬇️ Download PDF</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Medical Records</Text>
      <Text style={styles.subtitle}>{user?.role === 'doctor' ? 'Doctor view' : 'Your records'}</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#3498db" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={records}
          keyExtractor={(item) => item._id}
          renderItem={renderRecord}
          contentContainerStyle={{ paddingBottom: 100 }}
          ListEmptyComponent={<Text style={styles.emptyText}>No medical records available.</Text>}
        />
      )}

      {user?.role === 'doctor' && patientId ? (
        <View style={styles.formContainer}>
          <Text style={styles.formTitle}>Add record for patient</Text>
          <ScrollView style={{ width: '100%' }}>
            <TextInput
              style={styles.input}
              placeholder="Diagnosis"
              value={diagnosis}
              onChangeText={setDiagnosis}
            />
            <TextInput
              style={[styles.input, { height: 80 }]}
              placeholder="Notes"
              value={notes}
              multiline
              onChangeText={setNotes}
            />
            <TextInput
              style={[styles.input, { height: 80 }]}
              placeholder="Prescription details"
              value={prescription}
              multiline
              onChangeText={setPrescription}
            />

            <View style={styles.attachmentPickRow}>
                <TouchableOpacity style={styles.attachBtn} onPress={pickImage}>
                    <Text style={styles.attachBtnText}>{attachment ? 'Change Image' : '📎 Attach Document'}</Text>
                </TouchableOpacity>
                {attachment && (
                    <Text style={styles.attachmentName} numberOfLines={1} ellipsizeMode="middle">
                        {attachment.uri.split('/').pop()}
                    </Text>
                )}
            </View>

            <TouchableOpacity
              style={[styles.submitButton, creating && { backgroundColor: '#95a5a6' }]}
              onPress={submitRecord}
              disabled={creating}
            >
              <Text style={styles.submitButtonText}>{creating ? 'Saving...' : 'Save Record'}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', padding: 15 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1e293b' },
  subtitle: { color: '#64748b', marginBottom: 16 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 12, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  patientName: { fontSize: 15, fontWeight: '600', color: '#1f2937' },
  itemSmallText: { fontSize: 12, color: '#94a3b8' },
  fieldLabel: { fontWeight: '700', color: '#334155', marginTop: 4 },
  fieldValue: { color: '#475569', marginBottom: 4 },
  emptyText: { textAlign: 'center', marginTop: 40, color: '#94a3b8' },
  formContainer: { marginTop: 20, borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingTop: 12 },
  formTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 8, color: '#1e293b' },
  input: { backgroundColor: '#fff', borderColor: '#dbe4f0', borderWidth: 1, borderRadius: 10, padding: 12, marginBottom: 10 },
  submitButton: { backgroundColor: '#10b981', padding: 14, borderRadius: 12, alignItems: 'center', marginTop: 15 },
  submitButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  attachmentContainer: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  attachmentImage: { width: '100%', height: 200, borderRadius: 8, marginTop: 8, backgroundColor: '#e2e8f0' },
  attachmentPickRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
  attachBtn: { backgroundColor: '#e2e8f0', paddingVertical: 10, paddingHorizontal: 15, borderRadius: 8, marginRight: 10 },
  attachBtnText: { color: '#334155', fontWeight: '600' },
  attachmentName: { flex: 1, fontSize: 12, color: '#64748b' }
});

export default MedicalRecordScreen;
