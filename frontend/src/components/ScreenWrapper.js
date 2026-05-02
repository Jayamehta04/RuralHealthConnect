import React from 'react';
import { View, Image, StyleSheet, SafeAreaView } from 'react-native';

const ScreenWrapper = ({ children, style }) => {
  return (
    <View style={styles.container}>
      <Image
        // Replace with require('../../assets/images/shield-bg.png') once you add the image
        source={{ uri: 'https://chatgpt.com/backend-api/estuary/content?id=5c14ad7c4ac99a8%23file_00000000fddc71faba85fe3f59fc1fd6%23md&ts=493564&p=fs&cid=1&sig=3f01cdd6ef6185ee5205bfb03b989db74d7a9c11475815d2e1b09ce6d82a5201&v=0' }}
        style={styles.backgroundImage}
        resizeMode="contain"
      />
      <View style={styles.overlay}>
        <SafeAreaView style={[styles.content, style]}>
          {children}
        </SafeAreaView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff', // Ensures the absolute bottom layer is white behind the shield
  },
  backgroundImage: {
    position: 'absolute',
    top: 40,
    right: -30,
    width: 250,
    height: 250,
    opacity: 0.15,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
  },
  content: {
    flex: 1,
  }
});

export default ScreenWrapper;


