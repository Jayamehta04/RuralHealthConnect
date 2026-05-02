import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  Image,
  RefreshControl,
  TouchableOpacity
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { BASE_URL } from '../config';

const CATEGORIES = ['Common Diseases', 'Mother & Child', 'Nutrition', 'Hygiene', 'Emergency'];

const CATEGORY_LABELS = {
  'Common Diseases': { en: 'Common Diseases', hi: 'सामान्य बीमारी' },
  'Mother & Child': { en: 'Mother & Child', hi: 'माँ और बच्चा' },
  'Nutrition': { en: 'Nutrition', hi: 'पोषण' },
  'Hygiene': { en: 'Hygiene', hi: 'स्वच्छता' },
  'Emergency': { en: 'Emergency', hi: 'आपातकाल' },
};

const HealthBlogScreen = () => {
  const { i18n } = useTranslation();
  const lang = i18n.language === 'hi' ? 'hi' : 'en';
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dailyData, setDailyData] = useState(null);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0]);

  useEffect(() => {
    fetchAwarenessData();
  }, [lang]);

  const fetchAwarenessData = async () => {
    try {
      setLoading(true);
      setError(null);
      const url = `${BASE_URL}/api/ai/daily-awareness?lang=${lang}`;
      const response = await axios.get(url);
      setDailyData(response.data);
    } catch (err) {
      console.error('Error fetching AI awareness data:', err);
      setError(lang === 'hi' ? 'जानकारी लोड करने में विफल रहा।' : 'Failed to load awareness posts.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchAwarenessData();
  };

  const pageTitle = lang === 'hi' ? 'दैनिक स्वास्थ्य सुझाव' : 'Daily Health Awareness';
  const tipHeading = lang === 'hi' ? 'आज का टिप' : 'Tip of the Day';

  if (loading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0f766e" />
        <Text style={styles.loadingText}>{lang === 'hi' ? 'सभी सुझाव प्राप्त कर रहा है...' : "Generating awareness feed..."}</Text>
      </View>
    );
  }

  if (error && !dailyData) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={fetchAwarenessData}>
          <Text style={styles.retryText}>{lang === 'hi' ? 'पुनः प्रयास करें' : 'Retry'}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const posts = dailyData?.categories?.[selectedCategory] || [];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Text style={styles.pageTitle}>{pageTitle}</Text>

        {dailyData?.tip && (
          <View style={styles.tipCard}>
            <View style={styles.tipHeader}>
              <Ionicons name="flame" size={20} color="#0f766e" />
              <Text style={styles.tipLabel}>{tipHeading}</Text>
            </View>
            {dailyData.tip.image_query && (
              <Image 
                source={{ uri: `https://image.pollinations.ai/prompt/${encodeURIComponent(dailyData.tip.image_query + " photorealistic rural")}` }} 
                style={styles.tipImage} 
                resizeMode="cover"
              />
            )}
            <Text style={styles.tipText}>{dailyData.tip.text}</Text>
          </View>
        )}

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesRow}>
          {CATEGORIES.map((category) => {
            const isActive = selectedCategory === category;
            const label = CATEGORY_LABELS[category][lang];
            return (
              <TouchableOpacity
                key={category}
                style={[styles.categoryPill, isActive ? styles.categoryPillActive : styles.categoryPillInactive]}
                onPress={() => setSelectedCategory(category)}
              >
                <Text style={[styles.categoryText, isActive ? styles.categoryTextActive : styles.categoryTextInactive]}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={styles.postsContainer}>
          {posts.length === 0 && (
             <Text style={styles.emptyText}>{lang === 'hi' ? 'इस श्रेणी में कोई पोस्ट नहीं है।' : 'No posts generated for this category.'}</Text>
          )}
          {posts.map((post, index) => (
            <View key={index} style={styles.postCard}>
              <Text style={styles.postTitle}>{post.title}</Text>
              
              {post.image_query && (
                <Image 
                  source={{ uri: `https://image.pollinations.ai/prompt/${encodeURIComponent(post.image_query + " realism detailed rural health scenario")}` }} 
                  style={styles.postImage} 
                  resizeMode="cover"
                />
              )}

              <View style={styles.postRow}>
                <Text style={styles.postLabel}>{post.problem_label || 'Problem'}:</Text>
                <Text style={styles.postValue}>{post.problem}</Text>
              </View>

              {post.symptoms && post.symptoms.length > 0 && (
                <View style={styles.postRow}>
                  <Text style={styles.postLabel}>{post.symptoms_label || 'Symptoms'}:</Text>
                  <View style={styles.bulletList}>
                    {post.symptoms.map((symptom, idx) => (
                      <View key={idx} style={styles.bulletItem}>
                        <Text style={styles.bulletDot}>•</Text>
                        <Text style={styles.bulletText}>{symptom}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {post.remedies && post.remedies.length > 0 && (
                <View style={styles.postRow}>
                  <Text style={styles.postLabel}>{post.remedy_label || 'Home Remedies'}:</Text>
                  <View style={styles.bulletList}>
                    {post.remedies.map((item, idx) => (
                      <View key={idx} style={styles.bulletItem}>
                        <Text style={styles.bulletDot}>•</Text>
                        <Text style={styles.bulletText}>{item}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              <View style={styles.postRow}>
                <Text style={styles.postLabel}>{post.doctor_label || 'When to see a doctor'}:</Text>
                <View style={styles.bulletList}>
                  {post.doctor && post.doctor.map((item, idx) => (
                    <View key={idx} style={styles.bulletItem}>
                      <Text style={styles.bulletDot}>•</Text>
                      <Text style={styles.bulletText}>{item}</Text>
                    </View>
                  ))}
                </View>
              </View>

              <View style={styles.postRow}>
                <Text style={styles.postLabel}>{post.prevention_label || 'Prevention Tip'}:</Text>
                <Text style={styles.postValue}>{post.prevention}</Text>
              </View>

            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' },
  content: { padding: 20, paddingBottom: 40 },
  pageTitle: { fontSize: 22, fontWeight: '800', color: '#0f172a', marginBottom: 18 },
  loadingText: { marginTop: 12, fontSize: 16, color: '#475569', fontWeight: '600' },
  errorText: { fontSize: 16, color: '#ef4444', marginBottom: 16 },
  retryBtn: { backgroundColor: '#0f766e', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 10 },
  retryText: { color: '#fff', fontWeight: 'bold' },
  
  tipCard: {
    backgroundColor: '#fff', borderRadius: 18, padding: 18,
    marginBottom: 20, borderWidth: 1, borderColor: '#d1fae5',
    shadowColor: '#000', shadowOpacity: 0.05, shadowOffset: { width: 0, height: 2 }, shadowRadius: 6, elevation: 2
  },
  tipHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  tipLabel: { marginLeft: 10, fontSize: 16, fontWeight: '800', color: '#0f766e' },
  tipImage: { width: '100%', height: 160, borderRadius: 12, marginBottom: 12, backgroundColor: '#f1f5f9' },
  tipText: { fontSize: 15, color: '#334155', lineHeight: 22, fontWeight: '500' },
  
  categoriesRow: { marginBottom: 20 },
  categoryPill: {
    paddingVertical: 10, paddingHorizontal: 16, borderRadius: 24,
    marginRight: 12, borderWidth: 1, minWidth: 80, alignItems: 'center'
  },
  categoryPillActive: {
    backgroundColor: '#0f766e', borderColor: '#0f766e'
  },
  categoryPillInactive: {
    backgroundColor: '#fff', borderColor: '#cbd5e1'
  },
  categoryText: { fontSize: 14, fontWeight: '700' },
  categoryTextActive: { color: '#fff' },
  categoryTextInactive: { color: '#334155' },

  postsContainer: { paddingBottom: 10 },
  emptyText: { color: '#64748b', fontSize: 15, textAlign: 'center', marginVertical: 20 },
  
  postCard: {
    backgroundColor: '#fff', borderRadius: 18, padding: 18,
    marginBottom: 16, borderWidth: 1, borderColor: '#e2e8f0',
    shadowColor: '#000', shadowOpacity: 0.05, shadowOffset: { width: 0, height: 2 }, shadowRadius: 6, elevation: 2
  },
  postImage: { width: '100%', height: 220, borderRadius: 12, marginBottom: 16, backgroundColor: '#f1f5f9' },
  postTitle: { fontSize: 18, fontWeight: '800', color: '#075985', marginBottom: 16 },
  postRow: { marginBottom: 14 },
  postLabel: { fontSize: 15, fontWeight: '700', color: '#0f766e', marginBottom: 6 },
  postValue: { fontSize: 15, color: '#334155', lineHeight: 22 },
  bulletList: { paddingLeft: 10 },
  bulletItem: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 6 },
  bulletDot: { fontSize: 14, color: '#0f766e', lineHeight: 20, marginRight: 8, fontWeight: 'bold' },
  bulletText: { fontSize: 15, color: '#334155', lineHeight: 22, flex: 1 }
});

export default HealthBlogScreen;
