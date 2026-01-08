import React from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Linking, Platform } from 'react-native';
import { useRouter, Stack } from 'expo-router'; // <--- הוספנו את Stack
import { Ionicons } from '@expo/vector-icons';

export default function HelpScreen() {
  const router = useRouter();

  const handleContactSupport = () => {
    const email = 'support@buygroup.com'; 
    const subject = 'Help Request';
    const url = `mailto:${email}?subject=${subject}`;

    Linking.canOpenURL(url).then(supported => {
      if (supported) {
        Linking.openURL(url);
      } else {
        alert('Cannot open email client');
      }
    });
  };

  return (
    <View style={styles.container}>
      {/* 👇👇👇 השורה הזו מעלימה את הכותרת המכוערת עם ה-tabs */}
      <Stack.Screen options={{ headerShown: false }} />

      {/* Custom Header - הכותרת היפה שבנינו */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & Support</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        
        {/* Contact Section */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Need help?</Text>
          <Text style={styles.cardText}>
            Our support team is here for you. If you have issues with an order or payment, please contact us.
          </Text>
          <TouchableOpacity style={styles.contactButton} onPress={handleContactSupport}>
            <Ionicons name="mail-outline" size={20} color="#fff" style={{marginRight: 8}} />
            <Text style={styles.contactButtonText}>Contact Support</Text>
          </TouchableOpacity>
        </View>

        {/* FAQ Section */}
        <Text style={styles.sectionHeader}>Frequently Asked Questions</Text>

        <View style={styles.faqItem}>
          <Text style={styles.question}>🛍️ How do group buys work?</Text>
          <Text style={styles.answer}>
            You join a group by paying a small deposit. Once the group reaches the target number of buyers, the deal is unlocked! You then pay the remaining balance, and the product is shipped to you.
          </Text>
        </View>

        <View style={styles.faqItem}>
          <Text style={styles.question}>💰 What if the group isn't completed?</Text>
          <Text style={styles.answer}>
            No worries! If a group fails to reach the target within the time limit, your deposit will be fully refunded to your account automatically.
          </Text>
        </View>

        <View style={styles.faqItem}>
          <Text style={styles.question}>🚚 When will I receive my product?</Text>
          <Text style={styles.answer}>
            After the group is completed and you pay the remaining balance, the supplier will process your order. Shipping usually takes 3-7 business days depending on your location.
          </Text>
        </View>

        <View style={styles.faqItem}>
          <Text style={styles.question}>🔒 Is my payment secure?</Text>
          <Text style={styles.answer}>
            Yes. We use secure payment gateways to process all transactions. Your financial data is encrypted and safe.
          </Text>
        </View>

        <Text style={styles.versionText}>App Version 1.0.0</Text>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9f9f9' },
  header: { 
    flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 60, // גובה מותאם לסטטוס בר
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' 
  },
  backButton: { padding: 5, marginRight: 10 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  
  content: { padding: 20 },
  
  card: { 
    backgroundColor: '#fff', borderRadius: 12, padding: 20, marginBottom: 25, 
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5 
  },
  cardTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 8, color: '#333' },
  cardText: { fontSize: 14, color: '#666', marginBottom: 15, lineHeight: 20 },
  contactButton: { 
    backgroundColor: '#E91E63', flexDirection: 'row', alignItems: 'center', 
    justifyContent: 'center', padding: 12, borderRadius: 8 
  },
  contactButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },

  sectionHeader: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 15, marginLeft: 5 },
  
  faqItem: { backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 15, borderWidth: 1, borderColor: '#eee' },
  question: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 8 },
  answer: { fontSize: 14, color: '#666', lineHeight: 20 },

  versionText: { textAlign: 'center', color: '#999', fontSize: 12, marginTop: 20, marginBottom: 40 }
});