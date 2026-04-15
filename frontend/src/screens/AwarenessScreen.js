import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

const awarenessData = {
  en: {
    title: 'Health Awareness',
    tipHeading: "Tip of the Day",
    tipText: 'Drink a glass of clean water in the morning to keep your body fresh.',
    categories: ['Common Diseases', 'Mother & Child', 'Nutrition', 'Hygiene', 'Emergency'],
    posts: [
      {
        id: '1',
        category: 'Common Diseases',
        title: 'Stomach ache',
        problem: 'Stomach pain can come after eating dirty food or water.',
        symptoms: ['Belly hurt', 'Feeling sick', 'Less appetite'],
        remedies: ['Drink clean water', 'Eat plain khichdi', 'Rest well'],
        doctor: ['If pain stays more than one day', 'If vomiting starts']
      },
      {
        id: '2',
        category: 'Mother & Child',
        title: 'Weak mother',
        problem: 'Mother may feel weak after hard work or little food.',
        symptoms: ['Tired easily', 'Low energy', 'Dizziness'],
        remedies: ['Eat simple dal and vegetables', 'Drink warm water', 'Rest often'],
        doctor: ['If tiredness does not go away', 'If you cannot eat or drink']
      },
      {
        id: '3',
        category: 'Nutrition',
        title: 'Eat healthy food',
        problem: 'Not eating vegetables can make body slow.',
        symptoms: ['No energy', 'Feeling heavy', 'Poor hunger'],
        remedies: ['Eat more vegetables and fruits', 'Have a small salad with meals', 'Drink fresh fruit water'],
        doctor: ['If you lose weight without reason', 'If you feel weak all day']
      },
      {
        id: '4',
        category: 'Hygiene',
        title: 'Clean hands',
        problem: 'Dirty hands can bring germs to food.',
        symptoms: ['Stomach pain', 'Loose stool', 'Fever'],
        remedies: ['Wash hands with soap before food', 'Clean under nails', 'Use clean water always'],
        doctor: ['If fever stays more than one day', 'If stomach pain is strong']
      },
      {
        id: '5',
        category: 'Emergency',
        title: 'Minor cuts',
        problem: 'A small cut can get dirty and hurt if not cleaned.',
        symptoms: ['Blood comes', 'Pain at cut', 'Swelling'],
        remedies: ['Wash the cut with clean water', 'Cover with clean cloth', 'Keep it dry'],
        doctor: ['If bleeding does not stop', 'If the cut becomes red and swollen']
      }
    ]
  },
  hi: {
    title: 'स्वास्थ्य सलाह',
    tipHeading: 'Aaj ka Tip',
    tipText: 'सुबह उठकर साफ पानी पिएं, यह शरीर को ताजा रखता है।',
    categories: ['सामान्य बीमारी', 'माँ और बच्चा', 'पोषण', 'स्वच्छता', 'आपातकाल'],
    posts: [
      {
        id: '1',
        category: 'सामान्य बीमारी',
        title: 'पेट दर्द',
        problem: 'गंदा खाना या पानी खाने से पेट दर्द हो सकता है।',
        symptoms: ['पेट में दर्द', 'मिचली', 'भूख कम लगना'],
        remedies: ['साफ पानी पिएं', 'हल्का दाल-चावल खाएं', 'आराम करें'],
        doctor: ['अगर दर्द एक दिन से ज्यादा रहे', 'अगर उल्टी शुरू हो जाए']
      },
      {
        id: '2',
        category: 'माँ और बच्चा',
        title: 'कमज़ोरी महसूस होना',
        problem: 'थका हुआ काम या कम खाना खाने से शरीर कमजोर लगता है।',
        symptoms: ['जल्दी थकना', 'ऊर्जा कम होना', 'चक्कर आना'],
        remedies: ['सादा खाना खाएं', 'गुनगुना पानी पिएं', 'अच्छा आराम लें'],
        doctor: ['अगर थकान नहीं जाती', 'अगर खाना या पानी लेना मुश्किल हो']
      },
      {
        id: '3',
        category: 'पोषण',
        title: 'अच्छा खाना',
        problem: 'हरी सब्ज़ी ना खाने से शरीर सुस्त हो जाता है।',
        symptoms: ['ऊर्जा कम होना', 'भूख कम लगना', 'थकान'],
        remedies: ['सब्ज़ी और फल खाएं', 'हर खाना थोड़ा सलाद लें', 'ताज़ा फल पानी पिएं'],
        doctor: ['अगर वजन बिना कारण घटे', 'अगर दिन भर कमजोरी लगे']
      },
      {
        id: '4',
        category: 'स्वच्छता',
        title: 'हाथ साफ रखें',
        problem: 'गंदे हाथ खाने से कीटाणु लग सकते हैं।',
        symptoms: ['पेट दर्द', 'दस्त', 'बुखार'],
        remedies: ['खाने से पहले हाथ साबुन से धोएं', 'नाखून साफ रखें', 'साफ पानी इस्तेमाल करें'],
        doctor: ['अगर बुखार एक दिन से अधिक रहे', 'अगर पेट दर्द तेज हो']
      },
      {
        id: '5',
        category: 'आपातकाल',
        title: 'छोटा घाव',
        problem: 'छोटा कट गंदा हो सकता है और तकलीफ़ दे सकता है।',
        symptoms: ['रक्त आना', 'दर्द', 'सूजन'],
        remedies: ['घाव को साफ पानी से धोएं', 'साफ कपड़ा लगाएं', 'सूखा रखें'],
        doctor: ['अगर रक्त बहना बंद न हो', 'अगर कट लाल और सूजन हो जाए']
      }
    ]
  }
};

const AwarenessScreen = () => {
  const { i18n } = useTranslation();
  const lang = i18n.language === 'hi' ? 'hi' : 'en';
  const content = awarenessData[lang];
  const [selectedCategory, setSelectedCategory] = useState(content.categories[0]);

  const filteredPosts = content.posts.filter((post) => post.category === selectedCategory);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.pageTitle}>{content.title}</Text>

        <View style={styles.tipCard}>
          <View style={styles.tipHeader}>
            <Ionicons name="flame" size={20} color="#0f766e" />
            <Text style={styles.tipLabel}>{content.tipHeading}</Text>
          </View>
          <Text style={styles.tipText}>{content.tipText}</Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesRow}>
          {content.categories.map((category) => {
            const isActive = selectedCategory === category;
            return (
              <TouchableOpacity
                key={category}
                style={[styles.categoryPill, isActive ? styles.categoryPillActive : styles.categoryPillInactive]}
                onPress={() => setSelectedCategory(category)}
              >
                <Text style={[styles.categoryText, isActive ? styles.categoryTextActive : styles.categoryTextInactive]}>
                  {category}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={styles.postsContainer}>
          {filteredPosts.map((post) => (
            <View key={post.id} style={styles.postCard}>
              <Text style={styles.postTitle}>{post.title}</Text>
              <View style={styles.postRow}>
                <Text style={styles.postLabel}>{lang === 'hi' ? 'समस्या' : 'Problem'}:</Text>
                <Text style={styles.postValue}>{post.problem}</Text>
              </View>
              <View style={styles.postRow}>
                <Text style={styles.postLabel}>{lang === 'hi' ? 'लक्षण' : 'Symptoms'}:</Text>
                <View style={styles.bulletList}>
                  {post.symptoms.map((symptom, idx) => (
                    <View key={idx} style={styles.bulletItem}>
                      <Text style={styles.bulletDot}>•</Text>
                      <Text style={styles.bulletText}>{symptom}</Text>
                    </View>
                  ))}
                </View>
              </View>
              <View style={styles.postRow}>
                <Text style={styles.postLabel}>{lang === 'hi' ? 'घरेलू उपाय' : 'Home Remedies'}:</Text>
                <View style={styles.bulletList}>
                  {post.remedies.map((item, idx) => (
                    <View key={idx} style={styles.bulletItem}>
                      <Text style={styles.bulletDot}>•</Text>
                      <Text style={styles.bulletText}>{item}</Text>
                    </View>
                  ))}
                </View>
              </View>
              <View style={styles.postRow}>
                <Text style={styles.postLabel}>{lang === 'hi' ? 'डॉक्टर को कब दिखाएं' : 'When to see a doctor'}:</Text>
                <View style={styles.bulletList}>
                  {post.doctor.map((item, idx) => (
                    <View key={idx} style={styles.bulletItem}>
                      <Text style={styles.bulletDot}>•</Text>
                      <Text style={styles.bulletText}>{item}</Text>
                    </View>
                  ))}
                </View>
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
  content: { padding: 20, paddingBottom: 40 },
  pageTitle: { fontSize: 22, fontWeight: '800', color: '#0f172a', marginBottom: 18 },
  tipCard: {
    backgroundColor: '#fff', borderRadius: 18, padding: 18,
    marginBottom: 20, borderWidth: 1, borderColor: '#d1fae5',
    shadowColor: '#000', shadowOpacity: 0.05, shadowOffset: { width: 0, height: 2 }, shadowRadius: 6, elevation: 2
  },
  tipHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  tipLabel: { marginLeft: 10, fontSize: 15, fontWeight: '800', color: '#0f766e' },
  tipText: { fontSize: 14, color: '#334155', lineHeight: 20 },
  categoriesRow: { marginBottom: 20 },
  categoryPill: {
    paddingVertical: 10, paddingHorizontal: 16, borderRadius: 24,
    marginRight: 12, borderWidth: 1
  },
  categoryPillActive: {
    backgroundColor: '#0f766e', borderColor: '#0f766e'
  },
  categoryPillInactive: {
    backgroundColor: '#fff', borderColor: '#cbd5e1'
  },
  categoryText: { fontSize: 13, fontWeight: '700' },
  categoryTextActive: { color: '#fff' },
  categoryTextInactive: { color: '#334155' },
  postsContainer: { paddingBottom: 10 },
  postCard: {
    backgroundColor: '#fff', borderRadius: 18, padding: 18,
    marginBottom: 16, borderWidth: 1, borderColor: '#e2e8f0',
    shadowColor: '#000', shadowOpacity: 0.05, shadowOffset: { width: 0, height: 2 }, shadowRadius: 6, elevation: 2
  },
  postTitle: { fontSize: 16, fontWeight: '800', color: '#075985', marginBottom: 12 },
  postRow: { marginBottom: 12 },
  postLabel: { fontSize: 14, fontWeight: '700', color: '#0f766e', marginBottom: 6 },
  postValue: { fontSize: 14, color: '#334155', lineHeight: 20 },
  bulletList: { paddingLeft: 10 },
  bulletItem: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 6 },
  bulletDot: { fontSize: 12, color: '#0f766e', lineHeight: 18, marginRight: 6 },
  bulletText: { fontSize: 14, color: '#334155', lineHeight: 18, flex: 1 }
});

export default AwarenessScreen;
