import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Animated, Easing, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';

const IncomingCallScreen = ({ callerName, callerImage, isVideo, isOutgoing, onAccept, onReject }) => {
  const [sound, setSound] = useState(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseOpacity = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    Animated.loop(
      Animated.parallel([
        Animated.timing(pulseAnim, {
          toValue: 1.5,
          duration: 1500,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseOpacity, {
          toValue: 0,
          duration: 1500,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulseAnim, pulseOpacity]);

  useEffect(() => {
    let ringSound;
    const playRingtone = async () => {
      try {
        const url = isOutgoing 
          ? 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3' 
          : 'https://assets.mixkit.co/active_storage/sfx/1359/1359-preview.mp3';
          
        const { sound: s } = await Audio.Sound.createAsync(
            { uri: url }, 
            { shouldPlay: true, isLooping: true }
        );
        ringSound = s;
        setSound(s);
      } catch (e) {
        console.log("Ringer error", e);
      }
    };
    playRingtone();

    return () => {
      if (ringSound) {
        ringSound.stopAsync();
        ringSound.unloadAsync();
      }
    };
  }, [isOutgoing]);

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.headerArea}>
           <Ionicons name="shield-checkmark" size={16} color="#4ade80" />
           <Text style={styles.secureText}>RuralHealthConnect Secure Call</Text>
        </View>

        <View style={styles.infoArea}>
          <View style={styles.avatarContainer}>
             <Animated.View style={[styles.pulseCircle, { transform: [{ scale: pulseAnim }], opacity: pulseOpacity }]} />
             <View style={styles.avatarInner}>
                {callerImage ? (
                  <Image source={{ uri: callerImage }} style={{ width: '100%', height: '100%', borderRadius: 70 }} resizeMode="cover" />
                ) : (
                  <Ionicons name="person" size={80} color="#fff" />
                )}
             </View>
          </View>
          <Text style={styles.name}>{callerName || 'Unknown Caller'}</Text>
          <Text style={styles.status}>
             {isOutgoing ? 'Calling...' : (isVideo ? 'Incoming Video Call...' : 'Incoming Voice Call...')}
          </Text>
        </View>

        <View style={styles.actionArea}>
          <View style={styles.btnWrapper}>
            <TouchableOpacity style={[styles.btn, styles.rejectBtn]} onPress={onReject}>
               <Ionicons name={isOutgoing ? "call" : "close"} size={36} color="#fff" style={isOutgoing ? {transform: [{rotate: '135deg'}]} : {}} />
            </TouchableOpacity>
            <Text style={styles.btnLabel}>{isOutgoing ? "End Call" : "Decline"}</Text>
          </View>
          
          {!isOutgoing && (
             <View style={styles.btnWrapper}>
               <TouchableOpacity style={[styles.btn, styles.acceptBtn]} onPress={onAccept}>
                  <Ionicons name={isVideo ? "videocam" : "call"} size={36} color="#fff" />
               </TouchableOpacity>
               <Text style={styles.btnLabel}>Accept</Text>
             </View>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0f172a',
    zIndex: 9999,
  },
  safeArea: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: 40,
  },
  headerArea: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20
  },
  secureText: {
    color: '#94a3b8',
    marginLeft: 8,
    fontSize: 13,
    letterSpacing: 1,
    fontWeight: '600'
  },
  infoArea: {
    alignItems: 'center',
    marginTop: 60,
  },
  avatarContainer: {
    width: 140,
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pulseCircle: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#3b82f6',
  },
  avatarInner: {
     width: 140,
     height: 140,
     borderRadius: 70,
     backgroundColor: '#1e293b',
     justifyContent: 'center',
     alignItems: 'center',
     borderWidth: 2,
     borderColor: '#3b82f6',
     zIndex: 2,
     shadowColor: '#000',
     shadowOpacity: 0.5,
     shadowRadius: 10,
     elevation: 10
  },
  name: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '700',
    marginTop: 30,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 5,
    letterSpacing: 0.5
  },
  status: {
    color: '#cbd5e1',
    fontSize: 18,
    marginTop: 12,
    fontWeight: '500'
  },
  actionArea: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    paddingHorizontal: 30,
    marginBottom: 60,
  },
  btnWrapper: {
     alignItems: 'center'
  },
  btn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8
  },
  rejectBtn: {
    backgroundColor: '#ef4444',
  },
  acceptBtn: {
    backgroundColor: '#22c55e',
  },
  btnLabel: {
    color: '#fff',
    marginTop: 12,
    fontSize: 16,
    fontWeight: '600'
  }
});

export default IncomingCallScreen;
