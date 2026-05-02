import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, ImageBackground } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

const AICard = ({ onAskPress, onTipsPress }) => {
  const { t } = useTranslation();
  const scaleValue = useRef(new Animated.Value(0.95)).current;
  const opacityValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacityValue, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(scaleValue, {
        toValue: 1,
        friction: 5,
        tension: 40,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  return (
    <Animated.View style={[styles.cardContainer, { opacity: opacityValue, transform: [{ scale: scaleValue }] }]}>
      <ImageBackground 
        source={require('../../assets/images/ai_assistant_card.png')} 
        style={styles.imageBackground}
        imageStyle={{ borderRadius: 20 }}
        resizeMode="cover"
      >
        <View style={styles.overlay}>
          <View style={styles.leftSpacer} />
          <View style={styles.rightContent}>
            <View style={styles.buttonContainer}>
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: 'rgba(255, 255, 255, 0.95)' }]} onPress={onAskPress}>
                <View style={styles.actionBtnInner}>
                  <View style={[styles.iconCircle, { backgroundColor: '#10b981' }]}>
                      <Ionicons name="chatbubble-ellipses" size={18} color="#fff" />
                  </View>
                  <View style={styles.btnTextWrap}>
                      <Text style={[styles.btnTitle, { color: '#0f766e' }]}>{t('home.askHealthQuestions')}</Text>
                      <Text style={styles.btnDesc} numberOfLines={1}>{t('home.chatWithAI')}</Text>
                  </View>
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: 'rgba(255, 255, 255, 0.95)' }]} onPress={onTipsPress}>
                <View style={styles.actionBtnInner}>
                  <View style={[styles.iconCircle, { backgroundColor: '#f97316' }]}>
                      <Ionicons name="book" size={18} color="#fff" />
                  </View>
                  <View style={styles.btnTextWrap}>
                      <Text style={[styles.btnTitle, { color: '#c2410c' }]}>{t('home.healthTipsBlogs')}</Text>
                      <Text style={styles.btnDesc} numberOfLines={1}>{t('home.viewAwarenessTips')}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ImageBackground>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    borderRadius: 20,
    marginVertical: 16,
    elevation: 5,
    shadowColor: '#0f766e',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    backgroundColor: '#fff',
  },
  imageBackground: {
    width: '100%',
    minHeight: 180,
    borderRadius: 20,
  },
  overlay: {
    flexDirection: 'row',
    flex: 1,
    padding: 16,
  },
  leftSpacer: {
    flex: 0.45,
  },
  rightContent: {
    flex: 0.55,
    justifyContent: 'center',
  },
  buttonContainer: {
    flexDirection: 'column',
    gap: 12,
  },
  actionBtn: {
    borderRadius: 16,
    padding: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  actionBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  btnTextWrap: {
    flex: 1,
    justifyContent: 'center',
  },
  btnTitle: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 3,
  },
  btnDesc: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '500',
  },
});

export default AICard;
