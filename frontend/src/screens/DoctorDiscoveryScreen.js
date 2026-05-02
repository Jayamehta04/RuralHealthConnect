import React, { useState, useEffect, useContext } from 'react';
import { View, Text, TextInput, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { BASE_URL } from '../config';
import { useNavigation } from '@react-navigation/native';
import { AuthContext } from '../context/AuthContext';
import { useNetwork } from '../context/NetworkContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DoctorDiscoveryScreen = () => {
  const { t } = useTranslation();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [location, setLocation] = useState('');
  const [minExperience, setMinExperience] = useState('');
  const [maxExperience, setMaxExperience] = useState('');
  const [disease, setDisease] = useState('');
  const { token } = useContext(AuthContext);
  const { isOnline } = useNetwork();
  const navigation = useNavigation();

  useEffect(() => {
    fetchDoctors();
  }, [token, search, specialization, location, minExperience, maxExperience, disease, isOnline]);

  const fetchDoctors = async () => {
    if (!token) {
      setDoctors([]);
      setLoading(false);
      return;
    }

    try {
      if (!isOnline) {
        const cached = await AsyncStorage.getItem('cached_doctors');
        if (cached) {
          let data = JSON.parse(cached);
          // Simple offline filtering
          if (search) data = data.filter(d => d.name.toLowerCase().includes(search.toLowerCase()));
          if (specialization) data = data.filter(d => d.specialization?.toLowerCase().includes(specialization.toLowerCase()));
          if (location) data = data.filter(d => d.location?.toLowerCase().includes(location.toLowerCase()));
          setDoctors(data);
        }
        setLoading(false);
        return;
      }

      const params = new URLSearchParams();
      if (search) params.append('name', search);
      if (specialization) params.append('specialization', specialization);
      if (location) params.append('location', location);
      if (minExperience) params.append('minExperience', minExperience);
      if (maxExperience) params.append('maxExperience', maxExperience);
      if (disease) params.append('disease', disease);

      const url = `${BASE_URL}/api/doctors?${params.toString()}`;
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setDoctors(response.data);
      // Only cache unfiltered results to have full list offline
      if (!search && !specialization && !location && !minExperience && !maxExperience && !disease) {
        await AsyncStorage.setItem('cached_doctors', JSON.stringify(response.data));
      }
      setLoading(false);
    } catch (error) {
      console.error("Error fetching doctors:", error);
      // Fallback to cache on error
      const cached = await AsyncStorage.getItem('cached_doctors');
      if (cached) setDoctors(JSON.parse(cached));
      setLoading(false);
    }
  };

  const renderDoctor = ({ item }) => (
    <View style={styles.doctorCard}>
      <View style={styles.doctorTopRow}>
         <View style={styles.doctorAvatar}>
            <Ionicons name="person" size={24} color="#fff" />
         </View>
         <View style={styles.doctorInfo}>
            <Text style={styles.doctorName}>{t('doctorDiscovery.doctorPrefix')} {item.name}</Text>
            <Text style={styles.doctorSpec}>{item.specialization}</Text>
            <Text style={styles.doctorSub}>{item.experience} {t('doctorDiscovery.yearsExp')} • {item.totalReviews ?? 0} {t('doctorDiscovery.reviews')}</Text>
         </View>
      </View>
      
      <View style={styles.doctorMiddleRow}>
         <View style={styles.iconText}>
            <Ionicons name="location-outline" size={16} color="#64748b" style={{marginRight: 4}}/>
            <Text style={styles.metaText}>{item.location}</Text>
         </View>
         <View style={styles.iconText}>
            <Ionicons name="cash-outline" size={16} color="#64748b" style={{marginRight: 4}}/>
            <Text style={styles.metaText}>₹{item.fees}</Text>
         </View>
      </View>

      {item.recentFeedback && item.recentFeedback.length > 0 && (
         <View style={styles.feedbackContainer}>
           <Text style={styles.feedbackText} numberOfLines={2}>"{item.recentFeedback[0]}"</Text>
         </View>
      )}

      <View style={styles.doctorBottomRow}>
         <TouchableOpacity 
           style={styles.reviewBtn}
           onPress={() => navigation.navigate('DoctorReviews', { doctorId: item._id, doctorName: item.name })}
         >
           <Text style={styles.reviewBtnText}>{t('doctorDiscovery.reviews')}</Text>
         </TouchableOpacity>
         <TouchableOpacity 
           style={styles.bookBtn}
           onPress={() => navigation.navigate('Booking', { doctorId: item._id, doctorName: item.name })}
         >
           <Text style={styles.bookBtnText}>{t('doctorDiscovery.bookNow')}</Text>
         </TouchableOpacity>
      </View>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <Text style={styles.headerTitle}>{t('doctorDiscovery.findSpecialist')}</Text>
      
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#94a3b8" />
        <TextInput
          style={styles.searchInput}
          placeholder={t('doctorDiscovery.searchPlaceholder')}
          placeholderTextColor="#94a3b8"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <Text style={styles.filterTitle}>{t('doctorDiscovery.advancedFilters')}</Text>
      
      <View style={styles.filterGrid}>
        <View style={styles.inputWrapper}>
           <Ionicons name="medical-outline" size={18} color="#14b8a6" />
           <TextInput
             style={styles.filterInput}
             placeholder={t('doctorDiscovery.specialty')}
             placeholderTextColor="#94a3b8"
             value={specialization}
             onChangeText={setSpecialization}
           />
        </View>
        <View style={styles.inputWrapper}>
           <Ionicons name="location-outline" size={18} color="#14b8a6" />
           <TextInput
             style={styles.filterInput}
             placeholder={t('doctorDiscovery.location')}
             placeholderTextColor="#94a3b8"
             value={location}
             onChangeText={setLocation}
           />
        </View>
        <View style={styles.inputWrapper}>
           <Ionicons name="time-outline" size={18} color="#14b8a6" />
           <TextInput
             style={styles.filterInput}
             placeholder={t('doctorDiscovery.minExperience')}
             placeholderTextColor="#94a3b8"
             keyboardType="numeric"
             value={minExperience}
             onChangeText={setMinExperience}
           />
        </View>
        <View style={styles.inputWrapper}>
           <Ionicons name="bug-outline" size={18} color="#14b8a6" />
           <TextInput
             style={styles.filterInput}
             placeholder={t('doctorDiscovery.disease')}
             placeholderTextColor="#94a3b8"
             value={disease}
             onChangeText={setDisease}
           />
        </View>
      </View>

      <TouchableOpacity style={styles.clearButton} onPress={() => {
        setSearch(''); setSpecialization(''); setLocation('');
        setMinExperience(''); setMaxExperience(''); setDisease('');
      }}>
        <Text style={styles.clearButtonText}>{t('doctorDiscovery.resetFilters')}</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>


      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#14b8a6" />
          <Text style={styles.loadingText}>{t('doctorDiscovery.loading')}</Text>
        </View>
      ) : (
        <FlatList
          data={doctors}
          keyExtractor={(item) => item._id}
          renderItem={renderDoctor}
          ListHeaderComponent={renderHeader}
          contentContainerStyle={{ paddingBottom: 40 }}
          ListEmptyComponent={
            <Text style={styles.empty}>{t('doctorDiscovery.noResults')}</Text>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  headerContainer: { padding: 20, paddingBottom: 10 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#1e293b', marginBottom: 16 },
  
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 16, borderRadius: 24, marginBottom: 20, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 8, elevation: 2 },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 16, color: '#1e293b' },
  
  filterTitle: { fontSize: 14, fontWeight: '700', color: '#64748b', marginBottom: 12 },
  filterGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  inputWrapper: { width: '48%', flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 12, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: '#f1f5f9' },
  filterInput: { flex: 1, marginLeft: 8, fontSize: 14, color: '#334155' },
  
  clearButton: { backgroundColor: '#f1f5f9', padding: 14, borderRadius: 16, alignItems: 'center', marginBottom: 10, marginTop: 4 },
  clearButtonText: { color: '#64748b', fontWeight: 'bold', fontSize: 14 },

  doctorCard: { backgroundColor: '#fff', borderRadius: 24, padding: 20, marginBottom: 16, marginHorizontal: 20, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 10, elevation: 2 },
  doctorTopRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  doctorAvatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#14b8a6', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  doctorInfo: { flex: 1 },
  doctorName: { fontSize: 17, fontWeight: 'bold', color: '#1e293b' },
  doctorSpec: { fontSize: 13, color: '#14b8a6', marginTop: 2, fontWeight: '600' },
  doctorSub: { fontSize: 12, color: '#94a3b8', marginTop: 4, fontWeight: '500' },
  
  doctorMiddleRow: { flexDirection: 'row', gap: 16, marginBottom: 16, paddingLeft: 4 },
  iconText: { flexDirection: 'row', alignItems: 'center' },
  metaText: { fontSize: 13, color: '#64748b', fontWeight: '500' },

  feedbackContainer: { backgroundColor: '#f8fafc', padding: 12, borderRadius: 12, marginBottom: 16, borderWidth: 1, borderColor: '#f1f5f9' },
  feedbackText: { fontStyle: 'italic', color: '#64748b', fontSize: 12 },

  doctorBottomRow: { flexDirection: 'row', gap: 12 },
  reviewBtn: { flex: 1, paddingVertical: 12, backgroundColor: '#f8fafc', borderRadius: 16, alignItems: 'center' },
  reviewBtnText: { color: '#64748b', fontWeight: '700', fontSize: 14 },
  bookBtn: { flex: 1, paddingVertical: 12, backgroundColor: '#ccfbf1', borderRadius: 16, alignItems: 'center' },
  bookBtnText: { color: '#0f766e', fontWeight: '800', fontSize: 14 },

  center: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 100 },
  loadingText: { marginTop: 16, color: '#94a3b8', fontSize: 14 },
  empty: { textAlign: 'center', color: '#94a3b8', fontSize: 14, marginTop: 40 }
});

export default DoctorDiscoveryScreen;