import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import axios from 'axios';
import { BASE_URL } from '../config';
import { AuthContext } from '../context/AuthContext';

const RateDoctorScreen = ({ route, navigation }) => {
  const { appointmentId, doctorId, doctorName } = route.params;
  const { token } = useContext(AuthContext);

  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    try {
      await axios.post(`${BASE_URL}/api/feedback`, {
        appointmentId,
        doctorId,
        comment
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      Alert.alert('Success', 'Feedback submitted');
      navigation.goBack();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to submit feedback');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Review Dr. {doctorName}</Text>

      <Text style={styles.label}>Comments</Text>
      <TextInput
        style={[styles.input, { height: 100 }]}
        multiline
        value={comment}
        onChangeText={setComment}
      />

      <TouchableOpacity style={styles.btn} onPress={submit} disabled={loading}>
        <Text style={styles.btnText}>{loading ? 'Submitting...' : 'Submit'}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  label: { marginTop: 10, marginBottom: 5, fontSize: 16, color: '#4b5563' },
  input: { borderWidth: 1, borderColor: '#cbd5e1', padding: 12, borderRadius: 10, fontSize: 16 },
  btn: { marginTop: 25, backgroundColor: '#10b981', paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});

export default RateDoctorScreen;
