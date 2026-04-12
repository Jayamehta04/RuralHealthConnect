import React, { createContext, useState, useEffect } from 'react';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { io } from 'socket.io-client';
import { BASE_URL } from '../config';

const saveSecurely = async (key, value) => {
  if (Platform.OS === 'web') {
    try { localStorage.setItem(key, value); } catch (e) {}
  } else {
    await SecureStore.setItemAsync(key, value);
  }
};

const getSecurely = async (key) => {
  if (Platform.OS === 'web') {
    try { return localStorage.getItem(key); } catch (e) { return null; }
  } else {
    return await SecureStore.getItemAsync(key);
  }
};

const deleteSecurely = async (key) => {
  if (Platform.OS === 'web') {
    try { localStorage.removeItem(key); } catch (e) {}
  } else {
    await SecureStore.deleteItemAsync(key);
  }
};

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
      const storedToken = await getSecurely('userToken');
      const storedUser = await getSecurely('userData');
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
    await saveSecurely('userToken', userToken);
    await saveSecurely('userData', JSON.stringify(userData));
  };

  useEffect(() => {
    if (token && user) {
      const socketClient = io(BASE_URL, {
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
    await deleteSecurely('userToken');
    await deleteSecurely('userData');
  };

  return (
    <AuthContext.Provider value={{ user, token, unreadCount, setUnreadCount, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};