import React, { useState, useEffect, useContext } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

const DoctorReviewsScreen = ({ route }) => {
  const { doctorId, doctorName } = route.params;
  const { token } = useContext(AuthContext);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const response = await axios.get(`http://192.168.29.214:5000/api/feedback/doctor/${doctorId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setReviews(response.data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching reviews:", error);
        setLoading(false);
      }
    };
    fetchReviews();
  }, [doctorId, token]);

  const renderReview = ({ item }) => (
    <View style={styles.reviewCard}>
      <Text style={styles.patientName}>{item.patient?.name || 'Anonymous'}</Text>
      <Text style={styles.rating}>⭐ {item.rating}</Text>
      <Text style={styles.comment}>"{item.comment}"</Text>
      <Text style={styles.date}>{new Date(item.createdAt).toLocaleDateString()}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Reviews for Dr. {doctorName}</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#3498db" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={reviews}
          keyExtractor={(item) => item._id}
          renderItem={renderReview}
          contentContainerStyle={{ paddingBottom: 20 }}
          ListEmptyComponent={
            <Text style={styles.empty}>No reviews for this doctor yet.</Text>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 15, backgroundColor: '#f8f9fa' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#2c3e50', marginBottom: 15 },
  reviewCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  patientName: { fontSize: 16, fontWeight: 'bold', color: '#34495e' },
  rating: { fontSize: 14, color: '#f39c12', marginVertical: 4 },
  comment: { fontSize: 15, color: '#555', fontStyle: 'italic', marginBottom: 6 },
  date: { fontSize: 12, color: '#95a5a6', textAlign: 'right' },
  empty: { textAlign: 'center', marginTop: 30, color: '#7f8c8d', fontSize: 16 }
});

export default DoctorReviewsScreen;
