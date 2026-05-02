import React, { useEffect, useState, useRef, useContext } from 'react';
import { View, ActivityIndicator, Alert, StyleSheet, SafeAreaView, TouchableOpacity, Text, Platform, PermissionsAndroid } from 'react-native';
import createAgoraRtcEngine, {
  ChannelProfileType,
  ClientRoleType,
  RtcSurfaceView,
} from 'react-native-agora';
import axios from 'axios';
import { BASE_URL } from '../config';
import { AuthContext } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';

const AgoraCallScreen = ({ channelName, peerName, isVideo, onEndCall }) => {
  const { token, user } = useContext(AuthContext);
  const engine = useRef(null);
  
  const [agoraToken, setAgoraToken] = useState(null);
  const [appId, setAppId] = useState(null);
  const [isJoined, setIsJoined] = useState(false);
  const [remoteUid, setRemoteUid] = useState(0);
  const [loading, setLoading] = useState(true);
  const [micMuted, setMicMuted] = useState(false);
  const [camMuted, setCamMuted] = useState(!isVideo);
  const [timer, setTimer] = useState(0);
  
  const uid = useRef(Math.floor(Math.random() * 10000) + 1).current;

  // Setup permissions
  useEffect(() => {
    const requestPermissions = async () => {
      if (Platform.OS === 'android') {
        try {
          const granted = await PermissionsAndroid.requestMultiple([
            PermissionsAndroid.PERMISSIONS.CAMERA,
            PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          ]);
          if (
            granted['android.permission.RECORD_AUDIO'] !== PermissionsAndroid.RESULTS.GRANTED ||
            (isVideo && granted['android.permission.CAMERA'] !== PermissionsAndroid.RESULTS.GRANTED)
          ) {
            Alert.alert("Permission Required", "Camera and Microphone are required for calls.");
            onEndCall();
          }
        } catch (err) {
          console.warn(err);
        }
      }
    };
    requestPermissions();
  }, [isVideo]);

  // Fetch token
  useEffect(() => {
    const fetchToken = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/api/agora/token?channelName=${channelName}&uid=${uid}`);
        setAgoraToken(res.data.token);
        setAppId(res.data.appId);
      } catch (e) {
        console.warn("Failed to fetch Agora token.", e);
        Alert.alert("Error", "Could not connect to Agora server.");
        onEndCall();
      } finally {
        setLoading(false);
      }
    };
    fetchToken();
  }, [channelName, uid]);

  // Initialize engine
  useEffect(() => {
    if (appId && agoraToken) {
      initEngine();
    }
    return () => {
      if (engine.current) {
        engine.current.leaveChannel();
        engine.current.release();
      }
    };
  }, [appId, agoraToken]);

  const initEngine = async () => {
    try {
      engine.current = createAgoraRtcEngine();
      engine.current.initialize({ appId: appId });
      
      // Setup event handlers
      engine.current.registerEventHandler({
        onJoinChannelSuccess: (_connection, elapsed) => {
          setIsJoined(true);
        },
        onUserJoined: (_connection, remoteUid, elapsed) => {
          setRemoteUid(remoteUid);
        },
        onUserOffline: (_connection, remoteUid, reason) => {
          setRemoteUid(0);
          onEndCall(); // End call when partner leaves
        },
        onError: (err, msg) => {
          console.log("Agora error:", err, msg);
        }
      });

      engine.current.setChannelProfile(ChannelProfileType.ChannelProfileCommunication);
      
      if (isVideo) {
        engine.current.enableVideo();
        engine.current.startPreview();
      } else {
        engine.current.enableAudio();
      }

      engine.current.joinChannel(agoraToken, channelName, uid, {
        clientRoleType: ClientRoleType.ClientRoleBroadcaster,
        publishMicrophoneTrack: true,
        publishCameraTrack: isVideo,
      });

    } catch (e) {
      console.log(e);
      Alert.alert("Error", "Failed to start call");
      onEndCall();
    }
  };

  // Timer
  useEffect(() => {
    let interval;
    if (isJoined && remoteUid !== 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isJoined, remoteUid]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const toggleMic = () => {
    engine.current?.muteLocalAudioStream(!micMuted);
    setMicMuted(!micMuted);
  };

  const toggleCam = () => {
    if (!isVideo) return;
    engine.current?.muteLocalVideoStream(!camMuted);
    setCamMuted(!camMuted);
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Connecting to server...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Video Container */}
      <View style={styles.videoContainer}>
        {/* Remote Video */}
        {remoteUid !== 0 && isVideo ? (
          <RtcSurfaceView
            canvas={{ uid: remoteUid }}
            style={styles.remoteVideo}
          />
        ) : (
          <View style={styles.remoteVideoPlaceholder}>
            {!isVideo && (
              <View style={styles.audioAvatar}>
                <Text style={styles.audioAvatarText}>📞</Text>
              </View>
            )}
            <Text style={styles.placeholderText}>
              {remoteUid === 0 ? "Waiting for partner..." : "Voice Call"}
            </Text>
          </View>
        )}

        {/* Local Video */}
        {isJoined && isVideo && !camMuted && (
          <RtcSurfaceView
            canvas={{ uid: 0 }}
            style={styles.localVideo}
          />
        )}
      </View>

      {/* Header overlay */}
      <View style={styles.headerOverlay} pointerEvents="none">
        <Text style={styles.topPeerName}>{peerName || 'Unknown Contact'}</Text>
        <Text style={styles.timer}>{formatTime(timer)}</Text>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity 
          style={[styles.btn, micMuted && styles.btnOff]} 
          onPress={toggleMic}
        >
          <Ionicons name={micMuted ? "mic-off" : "mic"} size={28} color={micMuted ? "#000" : "#fff"} />
        </TouchableOpacity>
        
        {isVideo && (
          <TouchableOpacity 
            style={[styles.btn, camMuted && styles.btnOff]} 
            onPress={toggleCam}
          >
            <Ionicons name={camMuted ? "videocam-off" : "videocam"} size={28} color={camMuted ? "#000" : "#fff"} />
          </TouchableOpacity>
        )}

        <TouchableOpacity style={[styles.btn, styles.btnRed]} onPress={onEndCall}>
          <Ionicons name="call" size={28} color="#fff" style={{ transform: [{ rotate: '135deg' }] }} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    marginTop: 10,
  },
  videoContainer: {
    flex: 1,
    position: 'relative',
  },
  remoteVideo: {
    flex: 1,
  },
  remoteVideoPlaceholder: {
    flex: 1,
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  localVideo: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    width: 110,
    height: 150,
    backgroundColor: '#000',
    borderRadius: 12,
    overflow: 'hidden',
    zIndex: 10,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  audioAvatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  audioAvatarText: {
    fontSize: 50,
  },
  placeholderText: {
    color: 'white',
    fontSize: 18,
  },
  headerOverlay: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 30,
  },
  topPeerName: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  timer: {
    color: '#cbd5e1',
    fontSize: 14,
    marginTop: 5,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  controls: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    zIndex: 20,
  },
  btn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnOff: {
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  btnRed: {
    backgroundColor: '#ef4444',
  },
});

export default AgoraCallScreen;
