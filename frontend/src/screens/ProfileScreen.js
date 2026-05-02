import React, { useState, useEffect, useContext } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, 
  TextInput, Alert, ActivityIndicator, Image, Switch 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { BASE_URL } from '../config';
import * as ImagePicker from 'expo-image-picker';
import { AuthContext } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';

const ProfileScreen = () => {
  const { user, token, login } = useContext(AuthContext);
  const { t, i18n } = useTranslation();
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
  const [voiceReminderEnabled, setVoiceReminderEnabled] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/users/profile`, {
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
      Alert.alert(t('common.error'), t('profile.errorLoadProfile'));
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('common.error'), t('profile.permissionRequired'));
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

        // Use core fetch to avoid React Native Axios Form-Data Network Error bugs
        const response = await fetch(`${BASE_URL}/api/users/profile`, {
          method: 'PUT',
          headers: headers,
          body: bodyData
        });
        
        if (!response.ok) {
          throw new Error('Network Error');
        }
      } else {
        bodyData = { ...formData };
        await axios.put(`${BASE_URL}/api/users/profile`, bodyData, { headers });
      }

      Alert.alert(t('common.success'), t('profile.saveSuccess'));
      
      
      // Update Global Context exactly as instructed, isolating pure Auth headers from mutated FormData headers.
      const meRes = await axios.get(`${BASE_URL}/api/auth/me`, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      await login(meRes.data, token);

      // Clear local image explicitly to default to showing internet URL fetched on next reload
      setLocalImage(null);
      fetchProfile();
    } catch (err) {
      console.log('Save profile error:', err.message || err);
      Alert.alert(t('common.error'), t('profile.saveFail'));
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
    <View style={styles.container}>
      {/* Soft Background Banner */}
      <View style={styles.topBanner}>
        <Text style={styles.bannerTitle}>{t('profile.title')}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
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
                  <Ionicons name="camera" size={16} color="#0f766e" />
              </View>
          </TouchableOpacity>
          <Text style={styles.roleText}>{user?.role === 'doctor' ? t('profile.doctorProfile') : t('profile.patientProfile')}</Text>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.sectionHeader}>{t('profile.chooseLanguage')}</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('profile.language')}</Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
               <TouchableOpacity style={[styles.langBtn, i18n.language === 'en' && styles.langActive]} onPress={() => i18n.changeLanguage('en')}>
                  <Text style={i18n.language === 'en' ? styles.langTextActive : styles.langText}>{t('profile.english')}</Text>
               </TouchableOpacity>
               <TouchableOpacity style={[styles.langBtn, i18n.language === 'hi' && styles.langActive]} onPress={() => i18n.changeLanguage('hi')}>
                  <Text style={i18n.language === 'hi' ? styles.langTextActive : styles.langText}>{t('profile.hindi')}</Text>
               </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.toggleRow}>
              <Text style={styles.label}>{t('profile.voiceReminder')}</Text>
              <Switch
                value={voiceReminderEnabled}
                onValueChange={setVoiceReminderEnabled}
                thumbColor={voiceReminderEnabled ? '#16a34a' : '#d1d5db'}
                trackColor={{ false: '#e5e7eb', true: '#86efac' }}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('profile.fullName')}</Text>
            <TextInput
                style={styles.input}
                value={formData.name}
                onChangeText={(text) => setFormData({...formData, name: text})}
                placeholder={t('profile.fullNamePlaceholder')}
                placeholderTextColor="#94a3b8"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('profile.phoneNumber')}</Text>
            <TextInput
                style={styles.input}
                value={formData.phoneNumber}
                onChangeText={(text) => setFormData({...formData, phoneNumber: text})}
                keyboardType="phone-pad"
                placeholder={t('profile.phonePlaceholder')}
                placeholderTextColor="#94a3b8"
            />
          </View>

          {user?.role === 'doctor' && (
              <>
                  <View style={styles.inputGroup}>
<Text style={styles.label}>{t('profile.specialization')}</Text>
                  <TextInput
                      style={styles.input}
                      value={formData.specialization}
                      onChangeText={(text) => setFormData({...formData, specialization: text})}
                      placeholder={t('profile.specializationPlaceholder')}
                        placeholderTextColor="#94a3b8"
                    />
                  </View>
                  
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>{t('profile.experience')}</Text>
                    <TextInput
                        style={styles.input}
                        value={formData.experience}
                        onChangeText={(text) => setFormData({...formData, experience: text})}
                        keyboardType="numeric"
                        placeholder={t('profile.experiencePlaceholder')}
                        placeholderTextColor="#94a3b8"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>{t('profile.location')}</Text>
                    <TextInput
                        style={styles.input}
                        value={formData.location}
                        onChangeText={(text) => setFormData({...formData, location: text})}
                        placeholder={t('profile.locationPlaceholder')}
                        placeholderTextColor="#94a3b8"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>{t('profile.diseaseSpecialty')}</Text>
                    <TextInput
                        style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                        value={formData.diseaseSpecialty}
                        onChangeText={(text) => setFormData({...formData, diseaseSpecialty: text})}
                        multiline
                        placeholder={t('profile.diseaseSpecialtyPlaceholder')}
                        placeholderTextColor="#94a3b8"
                    />
                  </View>
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
                  <Text style={styles.saveBtnText}>{t('profile.saveButton')}</Text>
              )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  topBanner: { backgroundColor: '#14b8a6', height: 160, paddingTop: 60, paddingHorizontal: 20, borderBottomLeftRadius: 30, borderBottomRightRadius: 30, position: 'absolute', top: 0, left: 0, right: 0 },
  bannerTitle: { color: '#fff', fontSize: 24, fontWeight: '800', textAlign: 'center' },
  
  content: { paddingTop: 100, paddingHorizontal: 20, paddingBottom: 40 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  avatarSection: { alignItems: 'center', marginBottom: 24 },
  avatarWrapper: { position: 'relative', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
  avatarImage: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#fff', borderWidth: 4, borderColor: '#fff' },
  avatarPlaceholder: { justifyContent: 'center', alignItems: 'center', backgroundColor: '#ccfbf1' },
  avatarInitial: { fontSize: 40, fontWeight: 'bold', color: '#0f766e' },
  editIconContainer: { position: 'absolute', right: 0, bottom: 4, backgroundColor: '#ccfbf1', borderRadius: 20, width: 36, height: 36, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#fff' },
  roleText: { marginTop: 16, fontSize: 13, color: '#64748b', textTransform: 'uppercase', fontWeight: '800', letterSpacing: 1.2 },
  
  formSection: { backgroundColor: '#fff', padding: 24, borderRadius: 24, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 10, elevation: 2 },
  inputGroup: { marginBottom: 16 },
  sectionHeader: { fontSize: 18, fontWeight: '800', color: '#0f766e', marginBottom: 18 },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { fontSize: 13, color: '#64748b', marginBottom: 8, fontWeight: '700', marginLeft: 4 },
  input: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#f1f5f9', borderRadius: 16, padding: 16, fontSize: 15, color: '#1e293b' },
  
  saveBtn: { backgroundColor: '#14b8a6', padding: 18, borderRadius: 16, alignItems: 'center', marginTop: 16, shadowColor: '#14b8a6', shadowOpacity: 0.2, shadowRadius: 6, elevation: 4 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  langBtn: { flex: 1, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', alignItems: 'center' },
  langActive: { backgroundColor: '#ccfbf1', borderColor: '#14b8a6' },
  langText: { color: '#64748b', fontWeight: 'bold' },
  langTextActive: { color: '#0f766e', fontWeight: 'bold' }
});

export default ProfileScreen;
