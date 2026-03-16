import React, { useState, useEffect, useContext } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, 
  TextInput, Alert, ActivityIndicator, Image 
} from 'react-native';
import axios from 'axios';
import * as ImagePicker from 'expo-image-picker';
import { AuthContext } from '../context/AuthContext';

const ProfileScreen = () => {
  const { user, token } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    phoneNumber: '',
    specialization: '',
    experience: '',
    location: '',
    diseaseSpecialty: '',
    profilePicture: null
  });

  const [localImage, setLocalImage] = useState(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await axios.get('http://192.168.29.214:5000/api/users/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = res.data;
      setFormData({
        name: data.name || '',
        phoneNumber: data.phoneNumber || '',
        specialization: data.specialization || '',
        experience: data.experience ? data.experience.toString() : '',
        location: data.location || '',
        diseaseSpecialty: data.diseaseSpecialty ? data.diseaseSpecialty.join(', ') : '',
        profilePicture: data.profilePicture || null
      });
    } catch (err) {
      console.error('Fetch profile error:', err);
      Alert.alert('Error', 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Camera roll permissions are required!');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false, // Turned off to skip the confusing crop screen
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setLocalImage(result.assets[0]);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      let bodyData;
      let headers = { Authorization: `Bearer ${token}` };

      if (localImage) {
        bodyData = new FormData();
        bodyData.append('name', formData.name);
        bodyData.append('phoneNumber', formData.phoneNumber);
        
        if (user?.role === 'doctor') {
            bodyData.append('specialization', formData.specialization);
            bodyData.append('experience', formData.experience);
            bodyData.append('location', formData.location);
            bodyData.append('diseaseSpecialty', formData.diseaseSpecialty);
        }

        const filename = localImage.uri.split('/').pop();
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image`;

        bodyData.append('profilePicture', {
          uri: localImage.uri,
          name: filename,
          type
        });

        headers['Content-Type'] = 'multipart/form-data';
      } else {
        bodyData = { ...formData };
      }

      await axios.put('http://192.168.29.214:5000/api/users/profile', bodyData, { headers });
      Alert.alert('Success', 'Profile updated successfully');
      
      // Clear local image explicitly to default to showing internet URL fetched on next reload
      setLocalImage(null);
      fetchProfile();
    } catch (err) {
      console.error('Save profile error:', err);
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.avatarSection}>
        <TouchableOpacity onPress={pickImage} style={styles.avatarWrapper}>
            {(localImage || formData.profilePicture) ? (
                <Image 
                    source={{ uri: localImage ? localImage.uri : formData.profilePicture }} 
                    style={styles.avatarImage} 
                />
            ) : (
                <View style={[styles.avatarImage, styles.avatarPlaceholder]}>
                    <Text style={styles.avatarInitial}>{formData.name ? formData.name.charAt(0).toUpperCase() : 'U'}</Text>
                </View>
            )}
            <View style={styles.editIconContainer}>
                <Text style={styles.editIconText}>✏️</Text>
            </View>
        </TouchableOpacity>
        <Text style={styles.roleText}>{user?.role === 'doctor' ? 'Doctor Profile' : 'Patient Profile'}</Text>
      </View>

      <View style={styles.formSection}>
        <Text style={styles.label}>Full Name</Text>
        <TextInput
            style={styles.input}
            value={formData.name}
            onChangeText={(text) => setFormData({...formData, name: text})}
        />

        <Text style={styles.label}>Phone Number</Text>
        <TextInput
            style={styles.input}
            value={formData.phoneNumber}
            onChangeText={(text) => setFormData({...formData, phoneNumber: text})}
            keyboardType="phone-pad"
        />

        {user?.role === 'doctor' && (
            <>
                <Text style={styles.label}>Specialization</Text>
                <TextInput
                    style={styles.input}
                    value={formData.specialization}
                    onChangeText={(text) => setFormData({...formData, specialization: text})}
                />
                
                <Text style={styles.label}>Years of Experience</Text>
                <TextInput
                    style={styles.input}
                    value={formData.experience}
                    onChangeText={(text) => setFormData({...formData, experience: text})}
                    keyboardType="numeric"
                />

                <Text style={styles.label}>Location / Clinic Details</Text>
                <TextInput
                    style={styles.input}
                    value={formData.location}
                    onChangeText={(text) => setFormData({...formData, location: text})}
                />

                <Text style={styles.label}>Disease Specialties (comma separated)</Text>
                <TextInput
                    style={[styles.input, { height: 80 }]}
                    value={formData.diseaseSpecialty}
                    onChangeText={(text) => setFormData({...formData, diseaseSpecialty: text})}
                    multiline
                />
            </>
        )}

        <TouchableOpacity 
            style={styles.saveBtn} 
            onPress={handleSave} 
            disabled={saving}
        >
            {saving ? (
                <ActivityIndicator color="#fff" />
            ) : (
                <Text style={styles.saveBtnText}>Save Profile</Text>
            )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 20 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  avatarSection: { alignItems: 'center', marginBottom: 30, marginTop: 10 },
  avatarWrapper: { position: 'relative' },
  avatarImage: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#e2e8f0' },
  avatarPlaceholder: { justifyContent: 'center', alignItems: 'center', backgroundColor: '#bfdbfe' },
  avatarInitial: { fontSize: 48, fontWeight: 'bold', color: '#1d4ed8' },
  editIconContainer: { 
      position: 'absolute', right: 0, bottom: 0, 
      backgroundColor: '#fff', borderRadius: 20, 
      width: 36, height: 36, justifyContent: 'center', alignItems: 'center',
      borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 3
  },
  editIconText: { fontSize: 16 },
  roleText: { marginTop: 12, fontSize: 14, color: '#64748b', textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: 1 },
  formSection: { backgroundColor: '#fff', padding: 20, borderRadius: 16, elevation: 2 },
  label: { fontSize: 13, color: '#475569', marginBottom: 6, fontWeight: '600' },
  input: { 
      backgroundColor: '#f8fafc',
      borderWidth: 1, borderColor: '#e2e8f0', 
      borderRadius: 10, padding: 14, 
      marginBottom: 16, fontSize: 15, color: '#1e293b'
  },
  saveBtn: { backgroundColor: '#3b82f6', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});

export default ProfileScreen;
