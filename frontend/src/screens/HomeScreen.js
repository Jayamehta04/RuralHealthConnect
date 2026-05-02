import React, { useEffect, useState, useContext } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  StatusBar,
  Alert,
  TextInput,
  Image,
  ScrollView,
  LayoutAnimation,
  Platform,
  UIManager,
  Linking
} from 'react-native';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}
import { useIsFocused } from '@react-navigation/native';
import axios from 'axios';
import { BASE_URL } from '../config';
import { AuthContext } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import AICard from '../components/AICard';
import ScreenWrapper from '../components/ScreenWrapper';
import { getMedicines } from '../utils/medicineStorage';

const HomeScreen = ({ navigation }) => {
  const [doctors, setDoctors] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [selectedSpecialization, setSelectedSpecialization] = useState('allDoctors');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const isFocused = useIsFocused();
  const { t, i18n } = useTranslation();

  const [currentUser, setCurrentUser] = useState(user);
  const { token, logout, user, unreadCount, setUnreadCount } = useContext(AuthContext);

  const changeLanguage = (lng) => {
    if (i18n.language !== lng) {
      i18n.changeLanguage(lng);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, [token]);

  useEffect(() => {
    if (isFocused) {
      fetchNotificationCount();
      fetchTodaysMedicines();
      fetchUserProfile();
    }
  }, [isFocused, token, user]);

  const fetchNotificationCount = async () => {
    if (!token) return;
    try {
      const res = await axios.get(`${BASE_URL}/api/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const unread = res.data.filter((n) => !n.isRead).length;
      setUnreadCount(unread);
    } catch (err) {
      console.error('Notification count fetch:', err);
    }
  };

  const fetchUserProfile = async () => {
    if (!token) return;
    try {
      const res = await axios.get(`${BASE_URL}/api/users/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCurrentUser(res.data);
    } catch (err) {
      console.error('Fetch profile error:', err);
    }
  };

  const fetchDoctors = async () => {
    if (!token) {
      setLoading(false);
      setRefreshing(false);
      return;
    }
    try {
      const response = await axios.get(`${BASE_URL}/api/doctors`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDoctors(response.data);
    } catch (error) {
      console.error("Fetch Error:", error.message);
      if (error.response && error.response.status === 401) {
        Alert.alert(t('home.sessionExpired'), t('home.pleaseLoginAgain'));
        logout();
      } else {
        Alert.alert(t('common.error'), t('home.errorLoadDoctors'));
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchTodaysMedicines = async () => {
    try {
      const allMeds = await getMedicines();
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const todaysMeds = allMeds.filter(med => {
        if (!med.startDate || !med.duration) return true;
        const start = new Date(med.startDate);
        start.setHours(0, 0, 0, 0);

        if (today < start) return false;

        const diffTime = today.getTime() - start.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        return diffDays < med.duration;
      });

      setMedicines(todaysMeds);
    } catch (error) {
      console.error('Fetch today medicines error:', error);
    }
  };

  const handleCallAmbulance = async () => {
    const phone = 'tel:108';
    try {
      await Linking.openURL(phone);
    } catch (err) {
      Alert.alert(t('common.error'), t('home.callAmbulanceFail'));
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchDoctors();
  };

  const handleLogout = () => {
    Alert.alert(t('home.logoutConfirmTitle'), t('home.logoutConfirmMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('home.logout'), style: 'destructive', onPress: () => logout() }
    ]);
  };

  const handleSOS = async () => {
    try {
      await axios.post(`${BASE_URL}/api/emergency/send`, {
        latitude: 28.7041,
        longitude: 77.1025
      }, { headers: { Authorization: `Bearer ${token}` } });
      Alert.alert("SOS Sent", "Emergency services have been notified of your location.");
    } catch (e) {
      console.log('Failed to send SOS', e);
      Alert.alert(t('common.error'), t('home.sosError'));
    }
  };

  const normalizeSpec = (spec) => {
    if (!spec) return 'general';
    const s = spec.toLowerCase().trim();
    if (s.includes('cardio')) return 'cardiology';
    if (s.includes('dermato')) return 'dermatology';
    if (s.includes('neuro')) return 'neurology';
    if (s.includes('ortho')) return 'orthopedics';
    if (s.includes('gyneco') || s.includes('gynaeco')) return 'gynecology';
    if (s.includes('pediatr') || s.includes('paediatr')) return 'pediatrics';
    if (s.includes('ent')) return 'ent';
    if (s.includes('psychiat')) return 'psychiatry';
    if (s.includes('dentist') || s.includes('dental')) return 'dentist';
    if (s.includes('general') || s.includes('physician')) return 'general';
    return s;
  };

  const getTranslatedSpec = (spec) => {
    if (spec === 'allDoctors') return t('home.allDoctors');
    const translated = t(`home.${spec}`);
    return translated !== `home.${spec}` ? translated : (spec.charAt(0).toUpperCase() + spec.slice(1));
  };

  const specializations = [
    "allDoctors",
    ...new Set(doctors.map(doc => normalizeSpec(doc.specialization)).filter(Boolean))
  ];

  const getCategoryTheme = (spec) => {
    switch (spec) {
      case 'allDoctors': return 'apps';
      case 'cardiology': return 'heart';
      case 'dermatology': return 'body';
      case 'gynecology': return 'woman';
      case 'pediatrics': return 'happy';
      case 'orthopedics': return 'fitness';
      case 'neurology': return 'pulse';
      case 'ent': return 'ear';
      case 'psychiatry': return 'headset';
      case 'dentist': return 'medical';
      case 'general': return 'medkit';
      default: return 'medical';
    }
  };

  const filteredDoctors = doctors.filter(doc => {
    const docSpec = normalizeSpec(doc.specialization);
    const matchesSpec = selectedSpecialization === 'allDoctors' || docSpec === selectedSpecialization;
    const matchesSearch = doc.name?.toLowerCase().includes(searchQuery.toLowerCase()) || doc.specialization?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSpec && matchesSearch;
  });

  const renderDoctor = ({ item }) => (
    <TouchableOpacity
      style={styles.doctorItemCard}
      onPress={() => navigation.navigate('DoctorDetails', { doctorId: item._id, doctor: item })}
    >
      <View style={styles.docItemLeft}>
        <View style={styles.docMiniAvatar}>
          <Image
            source={
              item.profilePicture || item.image
                ? { uri: item.profilePicture || item.image }
                : { uri: 'https://cdn-icons-png.flaticon.com/512/149/149071.png' }
            }
            style={{ width: 50, height: 50, borderRadius: 14 }}
          />
        </View>
        <View style={styles.docInfoCol}>
          <Text style={styles.docItemName}>{t('home.doctorPrefix')} {item.name}</Text>
          <Text style={styles.docItemSpec}>{getTranslatedSpec(normalizeSpec(item.specialization))}</Text>
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={14} color="#f59e0b" />
            <Text style={styles.docItemExp}> {item.averageRating ? item.averageRating.toFixed(1) : '4.5'} • {item.experience || '10'} {t('home.years')}</Text>
          </View>
          <View style={styles.badgeContainer}>
            <View style={styles.availableBadge}><Text style={styles.badgeText}>{t('home.available')}</Text></View>
          </View>
        </View>
      </View>
      <View style={styles.docItemRight}>
        <TouchableOpacity
          style={styles.callSmallBtn}
          onPress={() => navigation.navigate('DoctorDetails', { doctorId: item._id, doctor: item })}
        >
          <Text style={styles.callSmallBtnText}>{t('home.call')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.reviewsBtn}
          onPress={() => navigation.navigate('DoctorReviews', { doctorId: item._id, doctor: item })}
        >
          <Text style={styles.reviewsBtnText}>{t('home.reviews')}</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderDashboardContent = () => (
    <View style={styles.dashboardContainer}>
      <Text style={styles.sectionHeader}>{t('home.todayMedicines', "Today's Medicines")}</Text>
      <View style={styles.todayCard}>
        {medicines.length > 0 ? (
          medicines.map((item) => (
            <View key={item._id} style={styles.medicineRow}>
              <View style={styles.medicineDot} />
              <View style={styles.medicineItemText}>
                <Text style={styles.medicineName}>{item.name} • {item.dosage}</Text>
                <Text style={styles.medicineTime}>{item.times ? item.times.join(', ') : item.time}</Text>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>{t('home.noTodayMedicines', 'No medicines scheduled for today.')}</Text>
        )}
      </View>
      <Text style={styles.sectionHeader}>{t('home.emergencyAction')}</Text>
      <View style={styles.emergencyRow}>
        <TouchableOpacity style={styles.sosCard} onPress={handleSOS} onLongPress={handleCallAmbulance}>
          <Ionicons name="warning" size={28} color="#fff" />
          <Text style={styles.emergencyCardText}>{t('home.sosAction')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.ambulanceCard} onPress={handleCallAmbulance}>
          <Ionicons name="car" size={30} color="#fff" />
          <Text style={styles.emergencyCardText}>{t('home.callAmbulanceAction')}</Text>
        </TouchableOpacity>
      </View>

      <AICard
        onAskPress={() => navigation.navigate('AIChat')}
        onTipsPress={() => navigation.navigate('HealthAwareness')}
      />

      <Text style={styles.sectionHeader}>{t('home.quickAccess')}</Text>
      <View style={styles.featureGrid}>
        <TouchableOpacity style={styles.featureItem} onPress={() => navigation.navigate('MedicineVault')}>
          <View style={styles.featureIconWrap}><Ionicons name="medkit" size={22} color="#0f766e" /></View>
          <Text style={styles.featureItemText}>{t('home.vault')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.featureItem} onPress={() => navigation.navigate('MedicalRecords')}>
          <View style={styles.featureIconWrap}><Ionicons name="document-text" size={22} color="#0f766e" /></View>
          <Text style={styles.featureItemText}>{t('home.records')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.featureItem} onPress={() => navigation.navigate('MyAppointments')}>
          <View style={styles.featureIconWrap}><Ionicons name="calendar" size={22} color="#0f766e" /></View>
          <Text style={styles.featureItemText}>{t('home.bookings')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.featureItem} onPress={() => navigation.navigate('PrescriptionHistory')}>
          <View style={styles.featureIconWrap}><Ionicons name="receipt" size={22} color="#0f766e" /></View>
          <Text style={styles.featureItemText}>{t('home.prescriptions')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.featureItem} onPress={() => navigation.navigate('DoctorDiscovery')}>
          <View style={styles.featureIconWrap}><Ionicons name="chatbubbles" size={22} color="#0f766e" /></View>
          <Text style={styles.featureItemText}>{t('home.consultDoctorAction')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.featureItem} onPress={() => navigation.navigate('Pharmacy')}>
          <View style={styles.featureIconWrap}><Ionicons name="cart" size={22} color="#0f766e" /></View>
          <Text style={styles.featureItemText}>{t('home.buyMedicineAction')}</Text>
        </TouchableOpacity>
      </View>



      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#94a3b8" />
        <TextInput
          style={styles.searchInput}
          placeholder={t('home.searchPlaceholder')}
          placeholderTextColor="#94a3b8"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <Text style={styles.sectionHeader}>{t('home.specializations')}</Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catCardsContainer}>
        {specializations.map((spec, idx) => {
          const isSelected = selectedSpecialization === spec;
          return (
            <TouchableOpacity
              key={idx}
              style={[
                styles.catPill,
                isSelected ? styles.selectedPill : styles.unselectedPill
              ]}
              onPress={() => {
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                setSelectedSpecialization(spec);
              }}
            >
              <View style={[styles.catIconWrap, isSelected ? styles.selectedIconWrap : styles.unselectedIconWrap]}>
                <Ionicons name={getCategoryTheme(spec)} size={20} color={isSelected ? '#fff' : '#0f766e'} />
              </View>
              <Text style={[styles.catPillText, isSelected && styles.selectedPillText]}>{getTranslatedSpec(spec)}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <Text style={styles.sectionHeader}>{t('home.ourDoctors')}</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0f766e" />
      </View>
    );
  }

  return (
    <ScreenWrapper>
      <StatusBar barStyle="dark-content" />

      {/* HEADER SECTION */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.navigate('Profile')} style={styles.avatarWrap}>
            <Image
              source={
                currentUser?.profilePicture
                  ? { uri: currentUser.profilePicture }
                  : { uri: 'https://cdn-icons-png.flaticon.com/512/149/149071.png' }
              }
              style={{ width: 42, height: 42, borderRadius: 21 }}
            />
          </TouchableOpacity>
          <View>
            <Text style={styles.greetingText}>{t('home.greeting', { name: currentUser?.name || t('home.defaultUser') })}</Text>
            <Text style={styles.brandTitle}>{t('home.brandTitle')}</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={() => navigation.navigate('Notifications')} style={styles.iconBtn}>
            <Ionicons name="notifications-outline" size={24} color="#1e293b" />
            {unreadCount > 0 && <View style={styles.badge} />}
          </TouchableOpacity>
          <TouchableOpacity onPress={handleLogout} style={styles.iconBtn}>
            <Ionicons name="log-out-outline" size={24} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.languageToggle}>
        <TouchableOpacity
          style={[styles.langButton, i18n.language === 'en' && styles.langButtonActive]}
          onPress={() => changeLanguage('en')}
        >
          <Text style={[styles.langButtonText, i18n.language === 'en' && styles.langButtonTextActive]}>{t('profile.english')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.langButton, i18n.language === 'hi' && styles.langButtonActive]}
          onPress={() => changeLanguage('hi')}
        >
          <Text style={[styles.langButtonText, i18n.language === 'hi' && styles.langButtonTextActive]}>{t('profile.hindi')}</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredDoctors}
        keyExtractor={(item) => item._id}
        renderItem={renderDoctor}
        contentContainerStyle={styles.list}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListHeaderComponent={renderDashboardContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.empty}>{t('home.emptyDoctors')}</Text>
          </View>
        }
      />
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#fff',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9'
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  avatarWrap: { marginRight: 12 },
  greetingText: { fontSize: 13, color: '#64748b', fontWeight: '500' },
  brandTitle: { fontSize: 18, fontWeight: '800', color: '#1e293b' },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  iconBtn: { padding: 6, marginLeft: 8, position: 'relative' },
  badge: {
    position: 'absolute', top: 4, right: 6, width: 8, height: 8,
    borderRadius: 4, backgroundColor: '#ef4444'
  },
  languageToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0'
  },
  langButton: {
    flex: 0.48,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#fff',
    alignItems: 'center'
  },
  langButtonActive: {
    backgroundColor: '#0f766e',
    borderColor: '#0f766e'
  },
  langButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1f2937'
  },
  langButtonTextActive: {
    color: '#fff'
  },

  dashboardContainer: { paddingHorizontal: 20, paddingTop: 20 },

  emergencyRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  sosCard: {
    backgroundColor: '#ef4444', flex: 0.48, padding: 18, borderRadius: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    elevation: 3, shadowColor: '#ef4444', shadowOpacity: 0.3, shadowOffset: { width: 0, height: 2 }
  },
  ambulanceCard: {
    backgroundColor: '#f59e0b', flex: 0.48, padding: 18, borderRadius: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    elevation: 3, shadowColor: '#f59e0b', shadowOpacity: 0.3, shadowOffset: { width: 0, height: 2 }
  },
  emergencyCardText: { color: '#fff', fontWeight: 'bold', fontSize: 16, marginLeft: 8 },

  todayCard: { backgroundColor: '#f8fafc', borderRadius: 20, padding: 18, marginBottom: 20, borderWidth: 1, borderColor: '#d1fae5' },
  medicineRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 14 },
  medicineDot: { width: 10, height: 10, borderRadius: 5, marginTop: 6, backgroundColor: '#16a34a', marginRight: 12 },
  medicineItemText: { flex: 1 },
  medicineName: { fontSize: 16, fontWeight: '700', color: '#0f766e', marginBottom: 4 },
  medicineTime: { fontSize: 14, color: '#334155' },
  actionsGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
  actionButton: { flex: 0.48, borderRadius: 18, paddingVertical: 18, paddingHorizontal: 10, justifyContent: 'center', alignItems: 'center', minHeight: 110, elevation: 3 },
  actionText: { color: '#fff', fontSize: 14, fontWeight: '700', textAlign: 'center', marginTop: 10 },

  sectionHeader: { fontSize: 18, fontWeight: '800', color: '#1e293b', marginBottom: 16 },

  featureGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 24 },
  featureItem: {
    width: '30%', backgroundColor: '#fff', paddingVertical: 14, borderRadius: 16,
    alignItems: 'center', marginBottom: 12,
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowOffset: { width: 0, height: 2 }
  },
  featureIconWrap: {
    backgroundColor: '#f0fdfa', width: 44, height: 44, borderRadius: 22,
    justifyContent: 'center', alignItems: 'center', marginBottom: 8
  },
  featureItemText: { fontSize: 12, color: '#334155', fontWeight: '600', textAlign: 'center' },
  awarenessCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderRadius: 18, padding: 16, marginBottom: 24,
    borderWidth: 1, borderColor: '#d1fae5',
    shadowColor: '#000', shadowOpacity: 0.05, shadowOffset: { width: 0, height: 2 }, shadowRadius: 6, elevation: 2
  },
  awarenessIconWrap: {
    width: 52, height: 52, borderRadius: 16, backgroundColor: '#d1fae5',
    justifyContent: 'center', alignItems: 'center', marginRight: 14
  },
  awarenessInfo: { flex: 1 },
  awarenessTitle: { fontSize: 16, fontWeight: '800', color: '#0f766e' },
  awarenessSubtitle: { fontSize: 13, color: '#475569', marginTop: 4 },

  searchContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    paddingVertical: 14, paddingHorizontal: 18, borderRadius: 16, marginBottom: 24,
    borderWidth: 1, borderColor: '#e2e8f0'
  },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 15, color: '#1e293b' },

  catCardsContainer: { marginBottom: 24, paddingBottom: 4 },
  catPill: {
    flexDirection: 'row', alignItems: 'center',
    paddingRight: 22, paddingLeft: 8, paddingVertical: 8, borderRadius: 32, marginRight: 14,
    borderWidth: 1, borderColor: '#e2e8f0', backgroundColor: '#fff',
    elevation: 1, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 2
  },
  selectedPill: { backgroundColor: '#0f766e', borderColor: '#0f766e' },
  unselectedPill: { backgroundColor: '#fff' },
  catIconWrap: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  selectedIconWrap: { backgroundColor: 'rgba(255,255,255,0.2)' },
  unselectedIconWrap: { backgroundColor: '#f0fdfa' },
  catPillText: { fontSize: 15, fontWeight: '800', color: '#64748b' },
  selectedPillText: { color: '#fff' },

  list: { paddingBottom: 40 },
  doctorItemCard: {
    flexDirection: 'row', backgroundColor: '#fff', borderRadius: 16, padding: 16,
    marginBottom: 16, marginHorizontal: 20, alignItems: 'center', justifyContent: 'space-between',
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.08, shadowOffset: { width: 0, height: 2 }, shadowRadius: 4
  },
  docItemLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  docMiniAvatar: { width: 50, height: 50, borderRadius: 14, backgroundColor: '#f0fdfa', justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  docInfoCol: { justifyContent: 'center', flex: 1 },
  docItemName: { fontSize: 16, fontWeight: 'bold', color: '#115e59' },
  docItemSpec: { fontSize: 13, color: '#0f766e', marginTop: 2, fontWeight: '600' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  docItemExp: { fontSize: 12, color: '#64748b', marginLeft: 4 },
  badgeContainer: { marginTop: 6, flexDirection: 'row' },
  availableBadge: { backgroundColor: '#dcfce7', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  badgeText: { color: '#166534', fontSize: 10, fontWeight: 'bold' },

  docItemRight: { alignItems: 'flex-end', marginLeft: 10 },
  callSmallBtn: { backgroundColor: '#0f766e', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 10, minWidth: 80, alignItems: 'center', marginBottom: 8 },
  callSmallBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  reviewsBtn: { backgroundColor: '#f1f5f9', paddingVertical: 6, paddingHorizontal: 16, borderRadius: 10, minWidth: 80, alignItems: 'center' },
  reviewsBtnText: { color: '#475569', fontWeight: 'bold', fontSize: 12 },

  emptyContainer: { alignItems: 'center', marginTop: 20 },
  empty: { color: '#94a3b8', fontSize: 14 }
});

export default HomeScreen;