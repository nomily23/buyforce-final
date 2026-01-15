import React, { useState } from 'react';
import { 
  StyleSheet, View, Text, TouchableOpacity, ActivityIndicator, Alert, 
  SafeAreaView, ScrollView, Linking, Platform // <--- הוספנו את Platform
} from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router'; 
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { addDoc, collection, doc, updateDoc, increment } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig'; 

export default function PaymentScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const { amount, productName, productId, regularPrice } = params;

  const [loading, setLoading] = useState(false);

  const MY_EMAIL = "nomilydaniely4@gmail.com"; 
  
  const currentAmount = amount ? amount.toString() : '1.00';
  const isMembershipFee = parseFloat(currentAmount) === 1;

  const regPrice = parseFloat(regularPrice as string || '0');
  const potentialSavings = regPrice > 0 ? regPrice - parseFloat(params.groupPrice as string || currentAmount) : 0;

  const PAYPAL_LINK = `https://www.paypal.com/cgi-bin/webscr?cmd=_xclick&business=${MY_EMAIL}&currency_code=ILS&amount=${currentAmount}&item_name=${productName}`;
  const CARD_LINK = `https://www.paypal.com/cgi-bin/webscr?cmd=_xclick&business=${MY_EMAIL}&currency_code=ILS&amount=${currentAmount}&item_name=${productName}&landing_page=billing&solution_type=Sole`;

  const processPaymentSuccess = async () => {
    setLoading(true);
    try {
        const user = auth.currentUser;
        if (!user) {
            Alert.alert("Error", "You must be logged in.");
            setLoading(false);
            return;
        }

        await addDoc(collection(db, 'orders'), {
            userId: user.uid,
            productId: productId || 'unknown',
            productName: productName || 'Payment',
            amountPaid: parseFloat(currentAmount), 
            currency: 'ILS',
            status: 'paid',
            timestamp: new Date(),
            isBalancePayment: !isMembershipFee 
        });

        if (productId && isMembershipFee) {
            const productRef = doc(db, 'products', String(productId));
            await updateDoc(productRef, {
                currentBuyers: increment(1) 
            });
        }

        setTimeout(() => {
            setLoading(false);
            if (isMembershipFee) {
                // בדיקה אם אנחנו במחשב או בטלפון עבור ההודעה
                if (Platform.OS === 'web') {
                    alert("Welcome! You joined the group successfully.");
                    router.push('/(tabs)/my-group');
                } else {
                    Alert.alert("Welcome! ", "You joined the group successfully.", [
                        { text: "Go to My Groups", onPress: () => router.push('/(tabs)/my-group') }
                    ]);
                }
            } else {
                if (Platform.OS === 'web') {
                    alert("Payment Received! The product is on its way!");
                    router.push('/(tabs)/my-group');
                } else {
                    Alert.alert("Payment Received! ", "The product is on its way!", [
                        { text: "Awesome!", onPress: () => router.push('/(tabs)/my-group') }
                    ]);
                }
            }
        }, 1500);
        
    } catch (error: any) {
        setLoading(false);
        console.error("Payment Error:", error);
        const errMsg = error.message && error.message.includes("network") 
            ? "Network error. Please check your internet connection." 
            : "Payment failed. Please try again.";
        Alert.alert("Error", errMsg);
    }
  };

  const openPaymentLink = async (link: string) => {
    const supported = await Linking.canOpenURL(link);
    if (supported) {
        await Linking.openURL(link);
        
        if (Platform.OS === 'web') {
            const confirmed = window.confirm("Page opened in browser.\nDid you complete the payment?");
            if (confirmed) processPaymentSuccess();
        } else {
            Alert.alert(
                "Secure Payment",
                "Page opened in browser.\nComplete payment and return here.",
                [
                    { text: "Cancel", style: "cancel" },
                    { text: "I Paid! ", onPress: () => processPaymentSuccess() }
                ]
            );
        }
    } else {
        Alert.alert("Error", "Cannot open link.");
    }
  };

  // --- התיקון הגדול למחשב ---
  const handleSavedCardPayment = () => {
      if (Platform.OS === 'web') {
          // במחשב: משתמשים בחלונית דפדפן רגילה
          const confirmed = window.confirm(`Confirm Payment:\nCharge ₪${currentAmount} to Visa •••• 4242?`);
          if (confirmed) {
              processPaymentSuccess();
          }
      } else {
          // בטלפון: משתמשים ב-Alert המעוצב
          Alert.alert(
              "Confirm Payment",
              `Charge ₪${currentAmount} to Visa •••• 4242?`,
              [
                  { text: "Cancel", style: "cancel" },
                  { text: "Pay Now", onPress: processPaymentSuccess } 
              ]
          );
      }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        {/* כפתור חזור - עובד גם במחשב וגם בטלפון */}
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Secure Checkout</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        
        <View style={styles.iconContainer}>
            <FontAwesome5 name="lock" size={32} color="#4CAF50" />
            <Text style={styles.trustText}>256-bit SSL Encrypted Transaction</Text>
        </View>

        <View style={styles.card}>
            <Text style={styles.label}>PAYMENT FOR</Text>
            <Text style={styles.productName}>{productName}</Text>
            
            {potentialSavings > 0 && !isMembershipFee && (
                <View style={styles.savingsTag}>
                    <Text style={styles.savingsText}>✨ You are saving ₪{potentialSavings.toFixed(0)}!</Text>
                </View>
            )}

            <View style={styles.divider} />
            <Text style={styles.label}>{isMembershipFee ? "MEMBERSHIP FEE" : "TOTAL AMOUNT"}</Text>
            <Text style={styles.amount}>₪{currentAmount}</Text>
        </View>

        <View style={styles.savedCardSection}>
            <Text style={styles.sectionTitle}>SAVED METHOD</Text>
            <TouchableOpacity style={styles.savedCardButton} onPress={handleSavedCardPayment}>
                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                    <FontAwesome5 name="cc-visa" size={24} color="#1A237E" style={{marginRight: 10}} />
                    <View>
                        <Text style={styles.savedCardText}>Visa ending in 4242</Text>
                        <Text style={styles.savedCardSub}>Expires 12/26</Text>
                    </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#ccc" />
            </TouchableOpacity>
        </View>

        <Text style={styles.orText}>OR PAY WITH</Text>

        <TouchableOpacity style={styles.paypalButton} onPress={() => openPaymentLink(PAYPAL_LINK)}>
            <FontAwesome5 name="paypal" size={24} color="white" style={{marginRight: 10}} />
            <Text style={styles.buttonText}>PayPal</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.creditCardButton} onPress={() => openPaymentLink(CARD_LINK)}>
            <FontAwesome5 name="credit-card" size={20} color="#333" style={{marginRight: 10}} />
            <Text style={[styles.buttonText, {color: '#333'}]}>New Credit Card</Text>
        </TouchableOpacity>

        {/* כפתור ביטול - משתמש גם הוא ב-router.back() */}
        <TouchableOpacity onPress={() => router.back()} style={styles.cancelLink}>
            <Text style={styles.cancelText}>Cancel Transaction</Text>
        </TouchableOpacity>

        <View style={styles.trustBadgesContainer}>
            <Text style={styles.trustFooterText}>We accept secure payments via:</Text>
            <View style={styles.cardIconsRow}>
                <FontAwesome5 name="cc-visa" size={30} color="#1A1F71" style={styles.cardIcon} />
                <FontAwesome5 name="cc-mastercard" size={30} color="#EB001B" style={styles.cardIcon} />
                <FontAwesome5 name="cc-amex" size={30} color="#006FCF" style={styles.cardIcon} />
                <FontAwesome5 name="cc-apple-pay" size={30} color="#000" style={styles.cardIcon} />
            </View>
        </View>

      </ScrollView>

        {loading && (
            <View style={styles.loaderOverlay}>
                <ActivityIndicator size="large" color="#E91E63" />
                <Text style={styles.loaderText}>Processing Payment...</Text>
            </View>
        )}

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9f9f9' },
  header: { 
    flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 50, 
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee', elevation: 2
  },
  backButton: { padding: 5, marginRight: 15, cursor: 'pointer' }, // הוספתי cursor למחשב
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  content: { padding: 20, alignItems: 'center', paddingBottom: 50 },
  
  iconContainer: { alignItems: 'center', marginBottom: 20, marginTop: 10 },
  trustText: { marginTop: 8, color: '#4CAF50', fontWeight: 'bold', fontSize: 13 },
  
  card: {
    backgroundColor: 'white', width: '100%', borderRadius: 16, padding: 25,
    alignItems: 'center', marginBottom: 25,
    elevation: 4, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 10, shadowOffset: {width:0, height:4}
  },
  label: { fontSize: 13, color: '#888', marginBottom: 5, textTransform: 'uppercase', letterSpacing: 1, fontWeight: '600' },
  productName: { fontSize: 22, fontWeight: 'bold', color: '#333', textAlign: 'center', marginBottom: 5 },
  
  savingsTag: {
      backgroundColor: '#E8F5E9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, marginBottom: 15
  },
  savingsText: { color: '#2E7D32', fontWeight: 'bold', fontSize: 14 },

  divider: { height: 1, width: '100%', backgroundColor: '#f0f0f0', marginVertical: 15 },
  amount: { fontSize: 48, fontWeight: 'bold', color: '#E91E63' },

  savedCardSection: { width: '100%', marginBottom: 25 },
  sectionTitle: { fontSize: 12, fontWeight: 'bold', color: '#999', marginBottom: 8, marginLeft: 5 },
  savedCardButton: {
      backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      padding: 16, borderRadius: 14, borderWidth: 1.5, borderColor: '#E91E63', elevation: 1,
      // הוספה למחשב:
      cursor: 'pointer'
  },
  savedCardText: { fontWeight: 'bold', color: '#333', fontSize: 16 },
  savedCardSub: { color: '#666', fontSize: 13 },

  orText: { color: '#bbb', fontSize: 13, marginBottom: 15, fontWeight: 'bold', letterSpacing: 0.5 },

  paypalButton: {
    backgroundColor: '#0070BA', flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    width: '100%', padding: 16, borderRadius: 30, marginBottom: 15, elevation: 2,
    shadowColor: '#0070BA', shadowOpacity: 0.3, shadowOffset: {width:0, height:4}, shadowRadius: 6,
    cursor: 'pointer'
  },
  creditCardButton: {
    backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    width: '100%', padding: 16, borderRadius: 30, marginBottom: 20, elevation: 1, borderWidth: 1, borderColor: '#ddd',
    cursor: 'pointer'
  },
  buttonText: { fontSize: 16, fontWeight: 'bold', color: 'white' },
  cancelLink: { padding: 10, marginBottom: 20, cursor: 'pointer' },
  cancelText: { color: '#888', fontSize: 14, textDecorationLine: 'underline' },

  trustBadgesContainer: { alignItems: 'center', marginTop: 10, opacity: 0.7 },
  trustFooterText: { fontSize: 12, color: '#888', marginBottom: 8 },
  cardIconsRow: { flexDirection: 'row', gap: 15 },
  cardIcon: { opacity: 0.8 },
  
  loaderOverlay: {
      position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(255,255,255,0.9)', justifyContent: 'center', alignItems: 'center', zIndex: 10
  },
  loaderText: { marginTop: 15, fontSize: 16, fontWeight: 'bold', color: '#333' }
});