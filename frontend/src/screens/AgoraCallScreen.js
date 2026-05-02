import React, { useEffect, useState, useRef, useContext } from 'react';
import { View, ActivityIndicator, Alert, StyleSheet, TouchableOpacity, Text, Platform, PermissionsAndroid } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import createAgoraRtcEngine, {
  ChannelProfileType,
  ClientRoleType,
  RtcSurfaceView,
  RenderModeType,
} from 'react-native-agora';
import axios from 'axios';
import { BASE_URL } from '../config';
import { AuthContext } from '../context/AuthContext';
import { CallContext } from '../context/CallContext';
import { Ionicons } from '@expo/vector-icons';

const AgoraCallScreen = ({ route, navigation }) => {
  const { channelName, peerName, isVideo } = route.params || {};
  const { endCall } = useContext(CallContext);
  const { token, user } = useContext(AuthContext);
  const engine = useRef(null);
  
  const [agoraToken, setAgoraToken] = useState(null);
  const [appId, setAppId] = useState(null);
  const [isJoined, setIsJoined] = useState(false);
  
  const [remoteUid, setRemoteUidState] = useState(0);
  const remoteUidRef = useRef(0);
  
  const [loading, setLoading] = useState(true);
  const [micMuted, setMicMuted] = useState(false);
  const [camMuted, setCamMuted] = useState(!isVideo);
  const [timer, setTimer] = useState(0);
  const [hasPermissions, setHasPermissions] = useState(false);
  
  const uid = useRef(Math.floor(Math.random() * 10000) + 1).current;

  const setRemoteUid = (id) => {
    remoteUidRef.current = id;
    setRemoteUidState(id);
  };

  // 1. Setup permissions first
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
            endCall();
            return;
          }
        } catch (err) {
          console.warn(err);
          endCall();
          return;
        }
      }
      setHasPermissions(true);
    };
    requestPermissions();
  }, [isVideo]);

  // 2. Fetch token only after permissions are granted
  useEffect(() => {
    if (!hasPermissions) return;

    let isMounted = true;
    const fetchToken = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/api/agora/token?channelName=${channelName}&uid=${uid}`);
        if (isMounted) {
          setAgoraToken(res.data.token);
          setAppId(res.data.appId);
        }
      } catch (e) {
        console.warn("Failed to fetch Agora token.", e);
        if (isMounted) {
           Alert.alert("Error", "Could not connect to Agora server.");
           endCall();
        }
      }
    };
    fetchToken();
    return () => { isMounted = false; };
  }, [hasPermissions, channelName, uid]);

  // 3. Initialize engine only after token is fetched
  useEffect(() => {
    if (!appId || !agoraToken) return;

    let eventHandler;

    const initEngine = async () => {
      try {
        engine.current = createAgoraRtcEngine();
        engine.current.initialize({ appId: appId });
        
        eventHandler = {
          onJoinChannelSuccess: (_connection, elapsed) => {
            setIsJoined(true);
            setLoading(false);
          },
          onUserJoined: (_connection, joinedUid, elapsed) => {
            setRemoteUid(joinedUid);
          },
          onUserOffline: (_connection, offlineUid, reason) => {
            // Only end call if the person leaving is our actual remote partner
            if (remoteUidRef.current === offlineUid) {
              setRemoteUid(0);
              endCall(); 
            }
          },
          onError: (err, msg) => {
            console.log("Agora error:", err, msg);
          }
        };

        engine.current.registerEventHandler(eventHandler);
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
        console.log("Init Engine Error:", e);
        Alert.alert("Error", "Failed to start call");
        endCall();
      }
    };

    initEngine();

    return () => {
      if (engine.current) {
        try {
          if (eventHandler) {
             engine.current.unregisterEventHandler(eventHandler);
          }
          engine.current.leaveChannel();
          setTimeout(() => {
            if (engine.current) {
              engine.current.release();
              engine.current = null;
            }
          }, 100);
        } catch (e) {
          console.log("Cleanup Error:", e);
        }
      }
    };
  }, [appId, agoraToken]);

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
        <Text style={styles.loadingText}>Connecting to secure call...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.videoContainer}>
        {remoteUid !== 0 && isVideo ? (
          <RtcSurfaceView
            canvas={{ uid: remoteUid, renderMode: RenderModeType.RenderModeHidden }}
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

        {isJoined && isVideo && !camMuted && (
          <RtcSurfaceView
            canvas={{ uid: 0, renderMode: RenderModeType.RenderModeHidden }}
            style={styles.localVideo}
            zOrderMediaOverlay={true}
          />
        )}
      </View>

      <View style={styles.headerOverlay} pointerEvents="none">
        <Text style={styles.topPeerName}>{peerName || 'Unknown Contact'}</Text>
        <Text style={styles.timer}>{formatTime(timer)}</Text>
      </View>

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

        <TouchableOpacity style={[styles.btn, styles.btnRed]} onPress={endCall}>
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
