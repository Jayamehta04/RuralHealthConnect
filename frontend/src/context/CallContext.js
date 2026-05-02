import React, { createContext, useState, useEffect, useContext } from 'react';
import { AuthContext } from './AuthContext';
import AgoraCallScreen from '../screens/AgoraCallScreen';
import IncomingCallScreen from '../screens/IncomingCallScreen';

export const CallContext = createContext();

export const CallProvider = ({ children }) => {
  const { user, socket } = useContext(AuthContext);
  const [incomingCallData, setIncomingCallData] = useState(null);
  const [activeCallData, setActiveCallData] = useState(null);

  useEffect(() => {
    if (!socket || !user) return;

    // Note: register-user is now robustly handled inside AuthContext on socket 'connect'

    socket.on('incoming-call', (data) => {
      console.log("✅ Incoming call received:", data);
      setIncomingCallData({
        patientId: data.patientId,
        patientName: data.patientName,
        patientImage: data.patientImage,
        channelName: data.channelName,
        isVideo: data.isVideo
      });
    });

    socket.on('call-accepted', () => {
       setActiveCallData(prev => ({ ...prev, accepted: true }));
    });

    socket.on('call-rejected', () => {
      setActiveCallData(null);
      setIncomingCallData(null);
    });

    socket.on('call-ended', () => {
      setActiveCallData(null);
      setIncomingCallData(null);
    });

    return () => {
      socket.off('incoming-call');
      socket.off('call-accepted');
      socket.off('call-rejected');
      socket.off('call-ended');
    };
  }, [socket, user]);

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

    setIncomingCallData(null);
  };

  const rejectCall = () => {
    if (incomingCallData) {
      socket.emit('reject-call', { to: incomingCallData.patientId || incomingCallData.from });
    }
    setIncomingCallData(null);
  };

  const endCall = () => {
     if (activeCallData) {
        socket.emit('end-call', { to: activeCallData.peerId });
     } else if (incomingCallData) {
         socket.emit('reject-call', { to: incomingCallData.patientId || incomingCallData.from });
     }
     setActiveCallData(null);
     setIncomingCallData(null);
  };

  return (
    <CallContext.Provider value={{ startCall, endCall }}>
      {children}
      {incomingCallData && !activeCallData && (
         <IncomingCallScreen 
            callerName={incomingCallData.patientName || incomingCallData.callerName} 
            callerImage={incomingCallData.patientImage}
            isVideo={incomingCallData.isVideo}
            onAccept={acceptCall}
            onReject={rejectCall}
         />
      )}
      {activeCallData && (!activeCallData.isCaller || activeCallData.accepted ? (
        <AgoraCallScreen 
            channelName={activeCallData.channelName} 
            peerName={activeCallData.peerName}
            isVideo={activeCallData.isVideo}
            onEndCall={endCall} 
        />
      ) : (
         <IncomingCallScreen 
             callerName={activeCallData.peerName}
             callerImage={activeCallData.peerImage}
             isVideo={activeCallData.isVideo}
             isOutgoing
             onReject={endCall}
         />
      ))}
    </CallContext.Provider>
  );
};
