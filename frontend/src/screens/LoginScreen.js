import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

const LoginScreen = ({ navigation }) => { 
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useContext(AuthContext);

  const handleLogin = async () => {
    // Basic validation
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      const response = await axios.post('http://192.168.29.214:5000/api/auth/login', {
        email,
        password,
      });

      if (response.data.token) {
       
        login(response.data.user, response.data.token);
      }
    } catch (error) {
      // Improved error logging for debugging
      console.log('Login Error:', error.message);
      Alert.alert('Error', error.response?.data?.message || 'Cannot connect to server');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>RuralHealthConnect</Text>
      
      <TextInput 
        style={styles.input} 
        placeholder="Email" 
        value={email} 
        onChangeText={setEmail} 
        autoCapitalize="none"
        keyboardType="email-address"
      />
      
      <TextInput 
        style={styles.input} 
        placeholder="Password" 
        value={password} 
        onChangeText={setPassword} 
        secureTextEntry
      />
      
      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate('Register')}>
  <Text style={{ color: '#3498db', textAlign: 'center', marginTop: 20 }}>
    Don't have an account? Register here
  </Text>
</TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#fff' },
  header: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginBottom: 30, color: '#2c3e50' },
  input: { borderWidth: 1, borderColor: '#ddd', padding: 15, borderRadius: 10, marginBottom: 15 },
  button: { backgroundColor: '#3498db', padding: 15, borderRadius: 10, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});

export default LoginScreen;