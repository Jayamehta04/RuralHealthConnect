import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { Audio, Video } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { BASE_URL } from '../config';
import { useNetwork } from '../context/NetworkContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const windowHeight = Dimensions.get('window').height;
const ITEM_HEIGHT = windowHeight - 110;
const AUDIO_CACHE_DIR = FileSystem.documentDirectory + 'healthShortsAudio/';

const HealthShortsScreen = () => {
  const { t, i18n } = useTranslation();
  const { isOnline } = useNetwork();
  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [likes, setLikes] = useState({});
  const [saved, setSaved] = useState({});
  const [playingAudioId, setPlayingAudioId] = useState(null);
  const [offlineReady, setOfflineReady] = useState(false);
  const soundRef = useRef(null);

  useEffect(() => {
    loadFeed();
    return () => {
      unloadAudio();
    };
  }, []);

  const loadFeed = async () => {
    try {
      if (!isOnline) {
         const cached = await AsyncStorage.getItem('cached_health_shorts');
         if (cached) {
           const parsed = JSON.parse(cached);
           setFeed(parsed);
           setOfflineReady(true);
           setLoading(false);
           return;
         }
      }

      const response = await axios.get(`${BASE_URL}/api/healthshorts`);
      const items = response.data.map((item) => ({ ...item }));
      setFeed(items);
      await AsyncStorage.setItem('cached_health_shorts', JSON.stringify(items));
      await prepareOfflineAssets(items);
    } catch (error) {
      console.warn('HealthShorts fetch failed, using local fallback:', error.message);
      const cached = await AsyncStorage.getItem('cached_health_shorts');
      const fallback = cached ? JSON.parse(cached) : getLocalSample();
      setFeed(fallback);
      await prepareOfflineAssets(fallback);
    } finally {
      setLoading(false);
    }
  };

  const prepareOfflineAssets = async (items) => {
    try {
      await FileSystem.makeDirectoryAsync(AUDIO_CACHE_DIR, { intermediates: true });
      const cached = await Promise.all(
        items.map(async (item) => {
          if (!item.audio_url) return item;
          const cachePath = `${AUDIO_CACHE_DIR}${item.id}.mp3`;
          const info = await FileSystem.getInfoAsync(cachePath);
          if (!info.exists) {
            await FileSystem.downloadAsync(item.audio_url, cachePath);
          }
          return { ...item, cachedAudioUri: cachePath };
        })
      );
      setFeed(cached);
      setOfflineReady(true);
    } catch (err) {
      console.warn('Audio cache failed:', err.message);
    }
  };

  const unloadAudio = async () => {
    if (soundRef.current) {
      try {
        await soundRef.current.unloadAsync();
      } catch (e) {
        console.warn('Failed to unload audio:', e.message);
      }
      soundRef.current = null;
    }
  };

  const playAudio = async (item) => {
    try {
      if (soundRef.current) {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
      const sound = new Audio.Sound();
      soundRef.current = sound;
      const source = {
        uri: item.cachedAudioUri || item.audio_url
      };
      await sound.loadAsync(source, { shouldPlay: true });
      setPlayingAudioId(item.id);
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          setPlayingAudioId(null);
        }
      });
    } catch (error) {
      console.warn('Audio play failed:', error.message);
      Alert.alert(t('common.error'), error.message || 'Unable to play audio');
    }
  };

  const toggleLike = (id) => {
    setLikes((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleSave = (id) => {
    setSaved((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const shareItem = async (item) => {
    try {
      await Share.share({
        message: `${item.text_hi}\n\n${item.text_en}`
      });
    } catch (error) {
      console.warn('Share failed:', error.message);
    }
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>{t('healthShorts.title')}</Text>
      <Text style={styles.headerSubtitle}>{i18n.language === 'hi' ? 'हिंदी / English' : 'Hindi / अंग्रेज़ी'}</Text>
      <View style={styles.statusRow}>
        <View style={styles.badgeRow}>
          <Ionicons name="checkmark-done-circle-outline" size={16} color="#10b981" />
          <Text style={styles.statusText}>{t('healthShorts.doctorVerified')}</Text>
        </View>
        {offlineReady && (
          <Text style={styles.offlineText}>{t('healthShorts.offlineMode')}</Text>
        )}
      </View>
    </View>
  );

  const renderItem = ({ item, index }) => {
    const isActive = index === activeIndex;
    return (
      <View style={[styles.itemContainer, { height: ITEM_HEIGHT }]}>
        {item.type === 'video' ? (
          <Video
            source={{ uri: item.video_url }}
            style={styles.video}
            resizeMode="cover"
            shouldPlay={isActive}
            isLooping
            isMuted={false}
            useNativeControls={true}
            playsInline
            onError={(error) => console.warn('Video playback error:', error)}
          />
        ) : (
          <View style={styles.tipBackground}>
            <View style={styles.tipBanner}>
              <Text style={styles.tipBannerText}>{t('healthShorts.tipOfDay')}</Text>
              <Text style={styles.tipBannerSmall}>{t('healthShorts.tipOfDaySubtitle')}</Text>
            </View>
          </View>
        )}

        <View style={styles.overlay}>
          <View style={styles.categoryRow}>
            <View style={styles.categoryBadge}><Text style={styles.categoryText}>{item.category}</Text></View>
            {item.doctor_verified && (
              <View style={styles.doctorBadge}><Text style={styles.doctorBadgeText}>{t('healthShorts.doctorVerified')}</Text></View>
            )}
          </View>
          <View style={styles.textPanel}>
            <Text style={styles.primaryText}>{item.text_hi}</Text>
            <Text style={styles.secondaryText}>{item.text_en}</Text>
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.iconButton} onPress={() => toggleLike(item.id)}>
              <Ionicons name={likes[item.id] ? 'heart' : 'heart-outline'} size={24} color={likes[item.id] ? '#ef4444' : '#fff'} />
              <Text style={styles.actionLabel}>{t('healthShorts.like')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton} onPress={() => toggleSave(item.id)}>
              <Ionicons name={saved[item.id] ? 'bookmark' : 'bookmark-outline'} size={24} color={saved[item.id] ? '#fde68a' : '#fff'} />
              <Text style={styles.actionLabel}>{t('healthShorts.save')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton} onPress={() => shareItem(item)}>
              <Ionicons name="share-social" size={24} color="#fff" />
              <Text style={styles.actionLabel}>{t('healthShorts.share')}</Text>
            </TouchableOpacity>
            {item.audio_url ? (
              <TouchableOpacity style={styles.iconButton} onPress={() => playAudio(item)}>
                <Ionicons name={playingAudioId === item.id ? 'volume-high' : 'volume-medium'} size={24} color="#fff" />
                <Text style={styles.actionLabel}>{t('healthShorts.audio')}</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      </View>
    );
  };

  const handleScrollEnd = (event) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const newIndex = Math.round(offsetY / ITEM_HEIGHT);
    setActiveIndex(newIndex);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0f766e" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderHeader()}
      <FlatList
        data={feed}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        pagingEnabled
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        showsVerticalScrollIndicator={false}
        onMomentumScrollEnd={handleScrollEnd}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a' },
  header: { paddingHorizontal: 20, paddingTop: 52, paddingBottom: 16, backgroundColor: '#020617' },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#f8fafc' },
  headerSubtitle: { marginTop: 6, fontSize: 14, color: '#94a3b8' },
  statusRow: { marginTop: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  badgeRow: { flexDirection: 'row', alignItems: 'center' },
  statusText: { marginLeft: 8, color: '#d1fae5', fontSize: 12, fontWeight: '600' },
  offlineText: { color: '#86efac', fontSize: 12, fontWeight: '600' },
  itemContainer: { width: '100%', overflow: 'hidden' },
  video: { width: '100%', height: ITEM_HEIGHT, backgroundColor: '#000' },
  tipBackground: {
    width: '100%',
    height: ITEM_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#111827'
  },
  tipBanner: { backgroundColor: '#f8fafc', padding: 18, borderRadius: 24, width: '90%', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.18, shadowOffset: { width: 0, height: 4 }, shadowRadius: 12 },
  tipBannerText: { fontSize: 20, fontWeight: '900', color: '#0f172a' },
  tipBannerSmall: { fontSize: 14, color: '#475569', marginTop: 6 },
  overlay: { position: 'absolute', left: 0, right: 0, bottom: 24, paddingHorizontal: 20 },
  categoryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  categoryBadge: { backgroundColor: 'rgba(255,255,255,0.16)', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 18 },
  categoryText: { color: '#f8fafc', fontWeight: '700', fontSize: 12 },
  doctorBadge: { backgroundColor: '#10b981', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 18 },
  doctorBadgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  textPanel: { backgroundColor: 'rgba(15,23,42,0.74)', borderRadius: 22, padding: 16, marginBottom: 18 },
  primaryText: { fontSize: 22, lineHeight: 30, color: '#f8fafc', fontWeight: '800', marginBottom: 10 },
  secondaryText: { fontSize: 16, lineHeight: 24, color: '#cbd5e1' },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(15,23,42,0.86)', borderRadius: 22, padding: 10 },
  iconButton: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 10 },
  actionLabel: { marginTop: 6, color: '#f8fafc', fontSize: 12, fontWeight: '700' },
  listContent: { paddingBottom: 32 }
});

const getLocalSample = () => [
  {
    id: 'hs1',
    type: 'video',
    category: 'Hydration',
    text_hi: 'दिन में कम से कम 8 ग्लास पानी पियें।',
    text_en: 'Drink at least 8 glasses of clean water every day.',
    video_url: 'https://www.learningcontainer.com/wp-content/uploads/2020/05/sample-mp4-file.mp4',
    audio_url: 'https://www.learningcontainer.com/wp-content/uploads/2020/02/Kalimba.mp3',
    doctor_verified: true
  },
  {
    id: 'hs2',
    type: 'tip',
    category: 'Nutrition',
    text_hi: 'हर भोजन में ताजे फल और सब्ज़ियाँ शामिल करें।',
    text_en: 'Include fresh fruits and vegetables in every meal.',
    video_url: null,
    audio_url: 'https://www.learningcontainer.com/wp-content/uploads/2020/02/Kalimba.mp3',
    doctor_verified: true
  },
  {
    id: 'hs3',
    type: 'video',
    category: 'Prevention',
    text_hi: 'हाथों को सही तरीके से साबून से धोएं।',
    text_en: 'Wash your hands thoroughly with soap and water.',
    video_url: 'https://www.learningcontainer.com/wp-content/uploads/2020/05/sample-mp4-file.mp4',
    audio_url: 'https://www.learningcontainer.com/wp-content/uploads/2020/02/Kalimba.mp3',
    doctor_verified: true
  },
  {
    id: 'hs4',
    type: 'tip',
    category: 'Sleep',
    text_hi: 'रात में 7-8 घंटे की नींद लें।',
    text_en: 'Get 7-8 hours of sleep every night.',
    video_url: null,
    audio_url: 'https://www.learningcontainer.com/wp-content/uploads/2020/02/Kalimba.mp3',
    doctor_verified: true
  }
];
export default HealthShortsScreen;
