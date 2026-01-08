import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Share, Image, SafeAreaView, Platform } from 'react-native';
import { useRouter, Stack } from 'expo-router'; 
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

export default function ModalScreen() {
  const router = useRouter();
  const isWeb = Platform.OS === 'web';

  const onShare = async () => {
    try {
      const result = await Share.share({
        message: 'Join me on BuyForce! Let\'s buy together and save big. Use code BUY2025 for a discount! 🚀 https://buyforce.app',
      });
    } catch (error: any) {
      alert(error.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <StatusBar style={isWeb ? "dark" : "light"} />

      <View style={styles.content}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
           <Ionicons name="close" size={28} color="#fff" />
        </TouchableOpacity>

        <View style={styles.card}>
            <View style={styles.iconContainer}>
                <Ionicons name="gift-outline" size={60} color="#E91E63" />
            </View>

            <Text style={styles.title}>Invite Friends</Text>
            <Text style={styles.subtitle}>
                Group buying is better together! Invite your friends to join active groups and you'll both get a <Text style={{fontWeight: 'bold'}}>₪20 Coupon</Text>.
            </Text>

            <View style={styles.codeBox}>
                <Text style={styles.codeLabel}>YOUR REFERRAL CODE</Text>
                <Text style={styles.codeText}>BUY2025</Text>
            </View>

            <TouchableOpacity style={styles.shareButton} onPress={onShare}>
                <Ionicons name="share-social-outline" size={24} color="#fff" style={{marginRight: 10}} />
                <Text style={styles.shareButtonText}>Share Link</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                <Text style={styles.backButtonText}>Back to Home</Text>
            </TouchableOpacity>

        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E91E63', 
  },
  content: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20
  },
  closeButton: {
      position: 'absolute',
      top: 50,
      right: 20,
      zIndex: 10,
      padding: 10,
      backgroundColor: 'rgba(0,0,0,0.1)', 
      borderRadius: 20
  },
  card: {
      backgroundColor: '#fff',
      width: '100%',
      maxWidth: 400,
      borderRadius: 25,
      padding: 30,
      alignItems: 'center',
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.25,
      shadowRadius: 10,
      elevation: 10
  },
  iconContainer: {
      width: 100,
      height: 100,
      backgroundColor: '#FFF0F5',
      borderRadius: 50,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 20
  },
  title: {
      fontSize: 28,
      fontWeight: 'bold',
      color: '#333',
      marginBottom: 10
  },
  subtitle: {
      fontSize: 16,
      color: '#666',
      textAlign: 'center',
      marginBottom: 30,
      lineHeight: 24
  },
  codeBox: {
      width: '100%',
      borderWidth: 2,
      borderColor: '#E91E63',
      borderRadius: 15,
      borderStyle: 'dashed',
      padding: 15,
      alignItems: 'center',
      marginBottom: 20,
      backgroundColor: '#FAFAFA'
  },
  codeLabel: {
      fontSize: 12,
      color: '#999',
      fontWeight: 'bold',
      marginBottom: 5
  },
  codeText: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#333',
      letterSpacing: 2
  },
  shareButton: {
      backgroundColor: '#E91E63',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
      padding: 15,
      borderRadius: 15,
      shadowColor: "#E91E63",
      shadowOffset: { width: 0, height: 5 },
      shadowOpacity: 0.3,
      shadowRadius: 5,
      elevation: 5,
      marginBottom: 15 
  },
  shareButtonText: {
      color: '#fff',
      fontSize: 18,
      fontWeight: 'bold'
  },
  backButton: {
      paddingVertical: 15,
      paddingHorizontal: 30,
      borderRadius: 15,
      borderWidth: 1,
      borderColor: '#ddd',
      width: '100%',
      alignItems: 'center'
  },
  backButtonText: {
      color: '#666',
      fontSize: 16,
      fontWeight: '600'
  }
});