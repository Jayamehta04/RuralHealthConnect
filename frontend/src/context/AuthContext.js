import React, { createContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { io } from 'socket.io-client';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [socket, setSocket] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Check if a user is already logged in when app starts
  useEffect(() => {
    const loadStoredData = async () => {
      const storedToken = await SecureStore.getItemAsync('userToken');
      const storedUser = await SecureStore.getItemAsync('userData');
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
      setLoading(false);
    };
    loadStoredData();
  }, []);

  const login = async (userData, userToken) => {
    setUser(userData);
    setToken(userToken);
    await SecureStore.setItemAsync('userToken', userToken);
    await SecureStore.setItemAsync('userData', JSON.stringify(userData));
  };

  useEffect(() => {
    if (token && user) {
      const socketClient = io('http://192.168.29.214:5000', {
        transports: ['websocket'],
        auth: { token },
      });

      socketClient.emit('join', { userId: user.id || user._id });
      socketClient.on('notification', (notification) => {
        console.log('Realtime notification received', notification);
        setUnreadCount((value) => value + 1);
      });

      setSocket(socketClient);

      return () => {
        socketClient.disconnect();
      };
    }
  }, [token, user]);

  const logout = async () => {
    setUser(null);
    setToken(null);
    await SecureStore.deleteItemAsync('userToken');
    await SecureStore.deleteItemAsync('userData');
  };

  return (
    <AuthContext.Provider value={{ user, token, unreadCount, setUnreadCount, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};