import React, { createContext, useState, useEffect, useContext } from 'react';
import { View, StyleSheet } from 'react-native';
import { useNavigation, StackActions } from '@react-navigation/native';
import { AuthContext } from './AuthContext';

export const CallContext = createContext();

export const CallProvider = ({ children }) => {
  const { user, socket } = useContext(AuthContext);
  const navigation = useNavigation();
  const [incomingCallData, setIncomingCallData] = useState(null);
  const [activeCallData, setActiveCallData] = useState(null);

  useEffect(() => {
    if (!socket || !user) return;

    socket.on('incoming-call', (data) => {
      console.log("✅ Incoming call received:", data);
      const callData = {
        patientId: data.patientId,
        patientName: data.patientName,
        patientImage: data.patientImage,
        channelName: data.channelName,
        isVideo: data.isVideo
      };
      setIncomingCallData(callData);
      navigation.navigate('IncomingCall', {
        callerName: data.patientName,
        callerImage: data.patientImage,
        isVideo: data.isVideo,
        isOutgoing: false
      });
    });

    socket.on('call-accepted', () => {
       setActiveCallData(prev => {
         if (prev) {
            navigation.dispatch(StackActions.replace('AgoraCall', {
               channelName: prev.channelName,
               peerName: prev.peerName,
               isVideo: prev.isVideo
            }));
            return { ...prev, accepted: true };
         }
         return prev;
       });
    });

    socket.on('call-rejected', () => {
      setActiveCallData(null);
      setIncomingCallData(null);
      navigation.goBack();
    });

    socket.on('call-ended', () => {
      setActiveCallData(null);
      setIncomingCallData(null);
      // Wait to go back, the screen itself should handle goBack if it receives this, or we can just pop to top
      if (navigation.canGoBack()) {
         navigation.goBack();
      }
    });

    return () => {
      socket.off('incoming-call');
      socket.off('call-accepted');
      socket.off('call-rejected');
      socket.off('call-ended');
    };
  }, [socket, user, navigation]);

  const startCall = (partnerId, partnerName, isVideo, partnerImage) => {
    const channelName = `call_${Date.now()}`;
    const myId = user.id || user._id;

    setActiveCallData({
      peerId: partnerId,
      peerName: partnerName,
      peerImage: partnerImage,
      channelName,
      isVideo,
      isCaller: true,
      accepted: false
    });

    socket.emit('call-doctor', {
      doctorId: partnerId,
      patientId: myId,
      patientName: user.name,
      patientImage: user?.profilePicture || user?.image || null,
      channelName,
      isVideo
    });
    
    navigation.navigate('IncomingCall', {
      callerName: partnerName,
      callerImage: partnerImage,
      isVideo: isVideo,
      isOutgoing: true
    });
  };

  const acceptCall = () => {
    if (!incomingCallData) return;
    
    socket.emit('accept-call', { to: incomingCallData.patientId || incomingCallData.from });
    
    setActiveCallData({
      peerId: incomingCallData.patientId || incomingCallData.from,
      peerName: incomingCallData.patientName || incomingCallData.callerName,
      peerImage: incomingCallData.patientImage,
      channelName: incomingCallData.channelName,
      isVideo: incomingCallData.isVideo,
      isCaller: false,
      accepted: true
    });

    const channel = incomingCallData.channelName;
    const peer = incomingCallData.patientName || incomingCallData.callerName;
    const isVid = incomingCallData.isVideo;
    
    setIncomingCallData(null);
    navigation.dispatch(StackActions.replace('AgoraCall', {
       channelName: channel,
       peerName: peer,
       isVideo: isVid
    }));
  };

  const rejectCall = () => {
    if (incomingCallData) {
      socket.emit('reject-call', { to: incomingCallData.patientId || incomingCallData.from });
    }
    setIncomingCallData(null);
    if (navigation.canGoBack()) navigation.goBack();
  };

  const endCall = () => {
     if (activeCallData) {
        socket.emit('end-call', { to: activeCallData.peerId });
     } else if (incomingCallData) {
         socket.emit('reject-call', { to: incomingCallData.patientId || incomingCallData.from });
     }
     setActiveCallData(null);
     setIncomingCallData(null);
     if (navigation.canGoBack()) navigation.goBack();
  };

  return (
    <CallContext.Provider value={{ startCall, endCall, acceptCall, rejectCall }}>
      {children}
    </CallContext.Provider>
  );
};
