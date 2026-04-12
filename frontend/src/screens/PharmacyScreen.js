import React, { useState, useEffect, useContext } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, TextInput } from 'react-native';
import axios from 'axios';
import { BASE_URL } from '../config';
import { AuthContext } from '../context/AuthContext';

const PharmacyScreen = ({ navigation }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState([]);
  const [address, setAddress] = useState('');
  const { token } = useContext(AuthContext);

  useEffect(() => {
    fetchStore();
  }, []);

  const fetchStore = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/pharmacy/store`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setItems(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (item) => {
    setCart([...cart, item]);
    Alert.alert("Added", `${item.name} added to cart!`);
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return Alert.alert("Empty", "Add items to cart first.");
    if (!address.trim()) return Alert.alert("Address", "Please enter delivery address.");

    const total = cart.reduce((sum, item) => sum + item.price, 0);

    try {
      await axios.post(`${BASE_URL}/api/pharmacy/order`, {
        items: cart.map(i => ({ medicine: i._id, quantity: 1 })),
        totalAmount: total,
        address: address
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      Alert.alert("Success", "Order placed! We will deliver to your rural location soon.");
      setCart([]);
      setAddress('');
      navigation.goBack();
    } catch (err) {
      Alert.alert("Error", "Order failed.");
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.itemCard}>
      <View>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemPrice}>₹{item.price}</Text>
      </View>
      <TouchableOpacity style={styles.addBtn} onPress={() => addToCart(item)}>
        <Text style={styles.addBtnText}>+ Add</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#3498db" />
      ) : (
        <>
          <FlatList
            data={items}
            keyExtractor={item => item._id}
            renderItem={renderItem}
            ListHeaderComponent={<Text style={styles.sectionTitle}>Available Medicines</Text>}
          />
          
          <View style={styles.checkoutContainer}>
            <Text style={styles.cartCount}>Items in Cart: {cart.length}</Text>
            <TextInput 
              style={styles.input} 
              placeholder="Enter Delivery Address" 
              value={address} 
              onChangeText={setAddress}
            />
            <TouchableOpacity style={styles.checkoutBtn} onPress={handleCheckout}>
              <Text style={styles.checkoutBtnText}>Confirm Order</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', padding: 20 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 15, color: '#1e293b' },
  itemCard: { backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 2 },
  itemName: { fontSize: 16, fontWeight: 'bold' },
  itemPrice: { color: '#2ecc71', fontWeight: 'bold', marginTop: 4 },
  addBtn: { backgroundColor: '#3498db', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8 },
  addBtnText: { color: '#fff', fontWeight: 'bold' },
  checkoutContainer: { backgroundColor: '#fff', padding: 20, borderRadius: 15, elevation: 5, marginTop: 10 },
  cartCount: { fontWeight: 'bold', marginBottom: 10 },
  input: { borderWidth: 1, borderColor: '#ddd', padding: 10, borderRadius: 8, marginBottom: 10 },
  checkoutBtn: { backgroundColor: '#2ecc71', padding: 15, borderRadius: 10, alignItems: 'center' },
  checkoutBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});

export default PharmacyScreen;