import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import axios from 'axios';

const RegisterScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'patient', // Default role
    specialization: '', // Only for doctors
    experience: ''      // Only for doctors
  });

  const handleRegister = async () => {
    // 1. Validation check
    if (!formData.name || !formData.email || !formData.password) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }

    try {
      // 2. Ensure your IP matches your backend server
      const response = await axios.post('http://192.168.29.214:5000/api/auth/register', formData);
      
      if (response.data) {
        Alert.alert("Success", "Account created! Please login.");
        navigation.navigate('Login'); // This requires the navigation prop to be passed correctly
      }
    } catch (error) {
      console.log("Registration Error:", error.response?.data);
      Alert.alert("Registration Failed", error.response?.data?.message || "Something went wrong");
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Create Account</Text>
      
      <TextInput 
        style={styles.input} 
        placeholder="Full Name" 
        onChangeText={(val) => setFormData({...formData, name: val})} 
      />
      
      <TextInput 
        style={styles.input} 
        placeholder="Email" 
        autoCapitalize="none" 
        keyboardType="email-address"
        onChangeText={(val) => setFormData({...formData, email: val})} 
      />
      
      <TextInput 
        style={styles.input} 
        placeholder="Password" 
        secureTextEntry 
        onChangeText={(val) => setFormData({...formData, password: val})} 
      />

      <Text style={styles.label}>Register as:</Text>
      <View style={styles.roleGroup}>
        <TouchableOpacity 
          style={[styles.roleBtn, formData.role === 'patient' && styles.activeRole]} 
          onPress={() => setFormData({...formData, role: 'patient'})}
        >
          <Text style={formData.role === 'patient' ? styles.activeText : styles.roleText}>Patient</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.roleBtn, formData.role === 'doctor' && styles.activeRole]} 
          onPress={() => setFormData({...formData, role: 'doctor'})}
        >
          <Text style={formData.role === 'doctor' ? styles.activeText : styles.roleText}>Doctor</Text>
        </TouchableOpacity>
      </View>

      {/* Show extra fields ONLY if registering as a doctor */}
      {formData.role === 'doctor' && (
        <>
          <TextInput 
            style={styles.input} 
            placeholder="Specialization (e.g. Cardiology)" 
            onChangeText={(val) => setFormData({...formData, specialization: val})} 
          />
          <TextInput 
            style={styles.input} 
            placeholder="Years of Experience" 
            keyboardType="numeric" 
            onChangeText={(val) => setFormData({...formData, experience: val})} 
          />
        </>
      )}

      <TouchableOpacity style={styles.button} onPress={handleRegister}>
        <Text style={styles.buttonText}>Sign Up</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Login')}>
        <Text style={styles.footerText}>Already have an account? Login</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#fff', flexGrow: 1, justifyContent: 'center' },
  header: { fontSize: 28, fontWeight: 'bold', marginBottom: 30, color: '#2c3e50', textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#ddd', padding: 15, borderRadius: 10, marginBottom: 15 },
  label: { fontSize: 16, marginBottom: 10, fontWeight: '600' },
  roleGroup: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  roleBtn: { flex: 0.48, padding: 12, borderWidth: 1, borderColor: '#3498db', borderRadius: 10, alignItems: 'center' },
  activeRole: { backgroundColor: '#3498db' },
  roleText: { color: '#3498db', fontWeight: 'bold' },
  activeText: { color: '#fff', fontWeight: 'bold' },
  button: { backgroundColor: '#2ecc71', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  footerText: { textAlign: 'center', marginTop: 20, color: '#3498db', fontWeight: 'bold' }
});

export default RegisterScreen;