import React, { useState, useEffect } from 'react';
import { 
  View, Text, FlatList, StyleSheet, 
  TouchableOpacity, ActivityIndicator, Alert 
} from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import { getMedicines, toggleMedicineLocal, deleteMedicineLocal } from '../utils/medicineStorage';
import { useTranslation } from 'react-i18next';

const MedicineScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const isFocused = useIsFocused();

  useEffect(() => {
    if (isFocused) fetchMedicines();
  }, [isFocused]);

  const fetchMedicines = async () => {
    setLoading(true);
    try {
      const meds = await getMedicines();
      setMedicines(meds);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (id) => {
    try {
      await toggleMedicineLocal(id);
      fetchMedicines(); 
    } catch (err) {
      Alert.alert("Error", "Could not update status");
    }
  };

  const confirmDelete = (item) => {
    Alert.alert(
      "Remove Medicine",
      "Are you sure you want to delete this reminder permanently?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive", 
          onPress: async () => {
            try {
              if (item.notificationIds && item.notificationIds.length > 0) {
                 for (const notifId of item.notificationIds) {
                   await Notifications.cancelScheduledNotificationAsync(notifId);
                 }
              } else if (item.notificationId) {
                 await Notifications.cancelScheduledNotificationAsync(item.notificationId);
              }
              await deleteMedicineLocal(item._id);
              fetchMedicines(); 
            } catch (err) {
              Alert.alert("Error", "Could not delete medicine.");
            }
          }
        }
      ]
    );
  };

  const renderMed = ({ item }) => {
    const today = new Date().toDateString();
    const isTaken = item.lastTakenDate === today;

    return (
      <TouchableOpacity 
        style={[styles.card, isTaken && styles.cardTaken]} 
        onPress={() => handleToggle(item._id)}
        onLongPress={() => confirmDelete(item)} 
        delayLongPress={500} 
      >
        <View style={styles.timeBox}>
          <Text style={[styles.timeText, isTaken && styles.textTaken]}>{item.time}</Text>
        </View>
        <View style={styles.infoBox}>
          <Text style={[styles.medName, isTaken && styles.textTaken]}>{item.name}</Text>
          <Text style={styles.dosageText}>{item.dosage}</Text>
        </View>
        <View style={styles.statusIcon}>
          <Text style={{fontSize: 24}}>{isTaken ? '✅' : '⭕'}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>{t('medicine.vaultTitle')}</Text>
      <Text style={styles.headerSub}>{t('medicine.vaultSub')}</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#2ecc71" />
      ) : (
        <FlatList
          data={medicines}
          keyExtractor={(item) => item._id}
          renderItem={renderMed}
          contentContainerStyle={{ paddingBottom: 100 }}
          ListEmptyComponent={<Text style={styles.empty}>{t('medicine.empty')}</Text>}
        />
      )}

      <TouchableOpacity 
        style={styles.fab} 
        onPress={() => navigation.navigate('AddMedicine')}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', padding: 20, paddingTop: 60 },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#1e293b' },
  headerSub: { fontSize: 16, color: '#64748b', marginBottom: 20 },
  card: { backgroundColor: '#fff', flexDirection: 'row', padding: 20, borderRadius: 16, marginBottom: 15, elevation: 2, alignItems: 'center' },
  cardTaken: { backgroundColor: '#e8f5e9', elevation: 0, opacity: 0.8 },
  timeBox: { borderRightWidth: 1, borderRightColor: '#f1f5f9', paddingRight: 15 },
  timeText: { fontSize: 16, fontWeight: 'bold', color: '#2ecc71' },
  infoBox: { paddingLeft: 15, flex: 1 },
  medName: { fontSize: 18, fontWeight: 'bold', color: '#334155' },
  dosageText: { color: '#64748b', marginTop: 4 },
  textTaken: { color: '#94a3b8', textDecorationLine: 'line-through' },
  statusIcon: { paddingLeft: 10 },
  fab: { position: 'absolute', bottom: 30, right: 30, backgroundColor: '#2ecc71', width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', elevation: 5 },
  fabText: { color: '#fff', fontSize: 30, fontWeight: 'bold' },
  empty: { textAlign: 'center', marginTop: 50, color: '#94a3b8' }
});

export default MedicineScreen;