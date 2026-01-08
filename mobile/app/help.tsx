import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Linking, Platform, LayoutAnimation, UIManager } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Ionicons, FontAwesome } from '@expo/vector-icons';

// הפעלת אנימציה באנדרואיד
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// נתוני השאלות והתשובות
const faqData = [
  {
    id: 1,
    question: "🛍️ How do group buys work?",
    answer: "You join a group by paying a small deposit (usually ₪1). Once the group reaches the target number of buyers, the deal is unlocked! You then pay the remaining balance, and the product is shipped."
  },
  {
    id: 2,
    question: "💰 What if the group isn't completed?",
    answer: "No worries! We have a 100% Money-Back Guarantee. If a group fails to reach the target within the time limit, your deposit is automatically refunded to your original payment method."
  },
  {
    id: 3,
    question: "🚚 Shipping & Delivery",
    answer: "After the group is completed and you pay the balance, the supplier processes your order. Shipping usually takes 3-7 business days. You will receive a tracking number via email."
  },
  {
    id: 4,
    question: "🔒 Is my payment secure?",
    answer: "Yes. We use industry-standard SSL encryption and secure payment gateways (like PayPal and Credit Cards) to ensure your financial data is never exposed."
  },
  {
    id: 5,
    question: "undo Return Policy",
    answer: "You can return any product within 14 days of receipt, provided it is in its original packaging. Contact support to initiate a return."
  }
];

export default function HelpScreen() {
  const router = useRouter();
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const toggleExpand = (id: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedId(expandedId === id ? null : id); // סגור אם פתוח, פתח אם סגור
  };

  const handleContactSupport = () => {
    const email = 'support@buyforce.com'; 
    const subject = 'Help Request';
    const url = `mailto:${email}?subject=${subject}`;
    Linking.openURL(url).catch(() => alert('Cannot open email client'));
  };

  const handleWhatsApp = () => {
      // דמו לפתיחת וואטסאפ
      const url = "https://wa.me/972500000000"; 
      Linking.openURL(url).catch(() => alert('Cannot open WhatsApp'));
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & Support</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        
        {/* Contact Buttons */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Need help?</Text>
          <Text style={styles.cardText}>
            Our team is available Sunday-Thursday, 9:00-18:00.
          </Text>
          
          <View style={styles.contactRow}>
              <TouchableOpacity style={[styles.contactButton, {backgroundColor: '#E91E63'}]} onPress={handleContactSupport}>
                <Ionicons name="mail-outline" size={20} color="#fff" style={{marginRight: 8}} />
                <Text style={styles.contactButtonText}>Email Us</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.contactButton, {backgroundColor: '#25D366'}]} onPress={handleWhatsApp}>
                <FontAwesome name="whatsapp" size={20} color="#fff" style={{marginRight: 8}} />
                <Text style={styles.contactButtonText}>Chat</Text>
              </TouchableOpacity>
          </View>
        </View>

        {/* FAQ Section - Accordion */}
        <Text style={styles.sectionHeader}>Frequently Asked Questions</Text>

        {faqData.map((item) => {
            const isExpanded = expandedId === item.id;
            return (
                <TouchableOpacity 
                    key={item.id} 
                    style={[styles.faqItem, isExpanded && styles.faqItemExpanded]} 
                    onPress={() => toggleExpand(item.id)}
                    activeOpacity={0.8}
                >
                    <View style={styles.questionRow}>
                        <Text style={styles.question}>{item.question}</Text>
                        <Ionicons 
                            name={isExpanded ? "chevron-up" : "chevron-down"} 
                            size={20} 
                            color="#999" 
                        />
                    </View>
                    {isExpanded && (
                        <Text style={styles.answer}>{item.answer}</Text>
                    )}
                </TouchableOpacity>
            );
        })}

        <View style={styles.footer}>
            <Text style={styles.versionText}>BuyForce App Version 1.0.2</Text>
            <Text style={styles.footerLink}>Terms of Service | Privacy Policy</Text>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9f9f9' },
  header: { 
    flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 60, 
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' 
  },
  backButton: { padding: 5, marginRight: 10 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  
  content: { padding: 20, paddingBottom: 50 },
  
  card: { 
    backgroundColor: '#fff', borderRadius: 12, padding: 20, marginBottom: 25, 
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5 
  },
  cardTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 5, color: '#333' },
  cardText: { fontSize: 14, color: '#666', marginBottom: 15 },
  
  contactRow: { flexDirection: 'row', gap: 10 },
  contactButton: { 
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', 
    padding: 12, borderRadius: 8 
  },
  contactButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },

  sectionHeader: { fontSize: 16, fontWeight: 'bold', color: '#666', marginBottom: 15, textTransform: 'uppercase', letterSpacing: 1 },
  
  faqItem: { 
      backgroundColor: '#fff', borderRadius: 10, marginBottom: 10, 
      borderWidth: 1, borderColor: '#eee', overflow: 'hidden' 
  },
  faqItemExpanded: { borderColor: '#E91E63', backgroundColor: '#FFF0F5' }, // צבע רקע עדין כשפתוח
  
  questionRow: { 
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', 
      padding: 15 
  },
  question: { fontSize: 15, fontWeight: 'bold', color: '#333', flex: 1 },
  answer: { 
      fontSize: 14, color: '#555', lineHeight: 22, 
      paddingHorizontal: 15, paddingBottom: 15 
  },

  footer: { alignItems: 'center', marginTop: 30 },
  versionText: { color: '#ccc', fontSize: 12 },
  footerLink: { color: '#E91E63', fontSize: 12, marginTop: 5, textDecorationLine: 'underline' }
});