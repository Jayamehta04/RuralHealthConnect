import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const DoctorDetailsScreen = ({ route, navigation }) => {
  const { doctorId, doctor } = route.params;

  return (
    <View style={styles.container}>
      {/* Header Back Button */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color="#1e293b" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile Info Section */}
        <View style={styles.profileSection}>
          <View style={styles.profileLeft}>
            <Text style={styles.docName}>Dr. {doctor?.name || 'Stefeni Albert'}</Text>
            <Text style={styles.docSpec}>{doctor?.specialization || 'Heart Specialist'}</Text>
            
            {/* Contact Action Circles */}
            <View style={styles.actionCirclesRow}>
                <TouchableOpacity style={[styles.actionCircle, {backgroundColor: '#e0f2fe'}]}>
                    <Ionicons name="mail" size={18} color="#0284c7" />
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionCircle, {backgroundColor: '#fce7f3'}]}>
                    <Ionicons name="call" size={18} color="#db2777" />
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionCircle, {backgroundColor: '#f1f5f9'}]}>
                    <Ionicons name="videocam" size={18} color="#94a3b8" />
                </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.profileRight}>
            <View style={styles.imageWrapper}>
                {/* Fallback avatar if no image provided */}
                <Ionicons name="person" size={80} color="#fff" style={{marginTop: 20}} />
            </View>
          </View>
        </View>

        {/* About Section */}
        <Text style={styles.sectionTitle}>About</Text>
        <Text style={styles.aboutText}>
          Dr. {doctor?.name || 'Stefeni Albert'} is a highly experienced {doctor?.specialization || 'Heart Specialist'} dedicated to providing excellent medical care. With {doctor?.experience || '10'} years of clinical practice, they ensure comprehensive and compassionate patient interactions.
        </Text>

        {/* Info Blocks */}
        <View style={styles.infoBlocksContainer}>
            <View style={styles.infoList}>
                <View style={styles.infoRow}>
                    <Ionicons name="location-outline" size={20} color="#64748b" style={styles.infoIcon} />
                    <View>
                        <Text style={styles.infoTitle}>Address</Text>
                        <Text style={styles.infoSub}>{doctor?.location || '123 Medical Str, CA, United States'}</Text>
                    </View>
                </View>
                <View style={[styles.infoRow, {marginTop: 24}]}>
                    <Ionicons name="time-outline" size={20} color="#64748b" style={styles.infoIcon} />
                    <View>
                        <Text style={styles.infoTitle}>Daily Practice</Text>
                        <Text style={styles.infoSub}>Monday - Friday{'\n'}Open 10am - 7pm</Text>
                    </View>
                </View>
            </View>

            {/* Simulated Map Snippet */}
            <View style={styles.mapSnippet}>
                <Ionicons name="location" size={32} color="#0f766e" />
            </View>
        </View>

        {/* Activity Section */}
        <Text style={styles.sectionTitle}>Activity</Text>
        <View style={styles.activityRow}>
            <TouchableOpacity 
                style={styles.activityBtnDark}
                onPress={() => navigation.navigate('Booking', { doctorId: doctor?._id || doctorId, doctorName: doctor?.name })}
            >
                <Ionicons name="calendar" size={20} color="#fff" style={{marginRight: 8}} />
                <Text style={styles.activityBtnDarkText}>List of{'\n'}Schedule</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.activityBtnLight}>
                <Ionicons name="document-text" size={20} color="#0f766e" style={{marginRight: 8}} />
                <Text style={styles.activityBtnLightText}>Doctor's{'\n'}Daily Post</Text>
            </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 10, backgroundColor: '#fff' },
  backButton: { padding: 4 },
  
  scrollContent: { paddingHorizontal: 28, paddingBottom: 40 },
  
  profileSection: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30, marginTop: 10 },
  profileLeft: { flex: 1, justifyContent: 'center' },
  docName: { fontSize: 26, fontWeight: 'bold', color: '#111827', marginBottom: 8 },
  docSpec: { fontSize: 16, color: '#64748b', fontWeight: '500', marginBottom: 24 },
  actionCirclesRow: { flexDirection: 'row', gap: 12 },
  actionCircle: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  
  profileRight: { marginLeft: 20 },
  imageWrapper: { width: 120, height: 150, backgroundColor: '#0f766e', borderTopLeftRadius: 60, borderTopRightRadius: 60, borderBottomLeftRadius: 20, borderBottomRightRadius: 20, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  
  sectionTitle: { fontSize: 22, fontWeight: 'bold', color: '#111827', marginBottom: 16 },
  aboutText: { fontSize: 15, color: '#94a3b8', lineHeight: 24, marginBottom: 30 },
  
  infoBlocksContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 40 },
  infoList: { flex: 1, paddingRight: 20 },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start' },
  infoIcon: { marginTop: 2, marginRight: 16 },
  infoTitle: { fontSize: 16, color: '#1e293b', fontWeight: 'bold', marginBottom: 6 },
  infoSub: { fontSize: 14, color: '#94a3b8', lineHeight: 20 },
  
  mapSnippet: { width: 110, height: 130, backgroundColor: '#f1f5f9', borderRadius: 20, justifyContent: 'center', alignItems: 'center' },

  activityRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 16 },
  activityBtnDark: { flex: 1, backgroundColor: '#115e59', paddingVertical: 20, paddingHorizontal: 16, borderRadius: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  activityBtnDarkText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  
  activityBtnLight: { flex: 1, backgroundColor: '#f0fdfa', paddingVertical: 20, paddingHorizontal: 16, borderRadius: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  activityBtnLightText: { color: '#0f766e', fontWeight: 'bold', fontSize: 15 },
});

export default DoctorDetailsScreen;
