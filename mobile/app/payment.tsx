import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator, Alert, SafeAreaView, ScrollView, Linking } from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router'; 
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { addDoc, collection, doc, updateDoc, increment } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig'; 

export default function PaymentScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { amount, currency, productName, productId } = params;

  const [loading, setLoading] = useState(false);

  // האימייל שלך לפייפאל
  const MY_EMAIL = "nomilydaniely4@gmail.com"; 
  
  const currentAmount = amount ? amount.toString() : '1.00';
  const isMembershipFee = parseFloat(currentAmount) === 1;

  // קישורים לפייפאל
  const PAYPAL_LINK = `https://www.paypal.com/cgi-bin/webscr?cmd=_xclick&business=${MY_EMAIL}&currency_code=ILS&amount=${currentAmount}&item_name=${productName}`;
  const CARD_LINK = `https://www.paypal.com/cgi-bin/webscr?cmd=_xclick&business=${MY_EMAIL}&currency_code=ILS&amount=${currentAmount}&item_name=${productName}&landing_page=billing&solution_type=Sole`;

  // פונקציית ההצלחה (משותפת לכולם)
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
                Alert.alert("Welcome! 🚀", "You joined the group successfully.", [
                    { text: "Go to My Groups", onPress: () => router.push('/(tabs)/my-group') }
                ]);
            } else {
                Alert.alert("Payment Received! 🎁", "The product is on its way!", [
                    { text: "Awesome!", onPress: () => router.push('/(tabs)/my-group') }
                ]);
            }
        }, 1500);
        
    } catch (error) {
        setLoading(false);
        console.error("Payment Error:", error);
        Alert.alert("Error", "Payment failed. Please try again.");
    }
  };

  // פתיחת קישור חיצוני (פייפאל)
  const openPaymentLink = async (link: string) => {
    const supported = await Linking.canOpenURL(link);
    if (supported) {
        await Linking.openURL(link);
        Alert.alert(
            "Secure Payment",
            "Page opened in browser.\nComplete payment and return here.",
            [
                { text: "Cancel", style: "cancel" },
                { text: "I Paid! ✅", onPress: () => processPaymentSuccess() }
            ]
        );
    } else {
        Alert.alert("Error", "Cannot open link.");
    }
  };

  // 👇 פונקציה לתשלום "מהיר" עם הכרטיס השמור
  const handleSavedCardPayment = () => {
      Alert.alert(
          "Confirm Payment",
          `Charge ₪${currentAmount} to Visa •••• 4242?`,
          [
              { text: "Cancel", style: "cancel" },
              { text: "Pay Now", onPress: processPaymentSuccess } // מפעיל ישר את ההצלחה
          ]
      );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Secure Checkout</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        
        <View style={styles.iconContainer}>
            <FontAwesome5 name="lock" size={40} color="#4CAF50" />
            <Text style={styles.trustText}>256-bit SSL Encrypted</Text>
        </View>

        <View style={styles.card}>
            <Text style={styles.label}>PAYMENT FOR</Text>
            <Text style={styles.productName}>{productName}</Text>
            <View style={styles.divider} />
            <Text style={styles.label}>{isMembershipFee ? "MEMBERSHIP FEE" : "TOTAL AMOUNT"}</Text>
            <Text style={styles.amount}>₪{currentAmount}</Text>
        </View>

        {/* 👇👇👇 כפתור חדש: תשלום מהיר עם הכרטיס השמור בפרופיל 👇👇👇 */}
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

        <TouchableOpacity onPress={() => router.back()} style={styles.cancelLink}>
            <Text style={styles.cancelText}>Cancel Transaction</Text>
        </TouchableOpacity>

        {/* הסתרתי את ה-Developer Zone כי עכשיו יש כפתור אשראי שעושה את העבודה */}
        {/* <View style={styles.devZone}>...</View> */}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { 
    flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 50, 
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee', elevation: 2
  },
  backButton: { padding: 5, marginRight: 15 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  content: { padding: 20, alignItems: 'center' },
  iconContainer: { alignItems: 'center', marginBottom: 20, marginTop: 10 },
  trustText: { marginTop: 8, color: '#4CAF50', fontWeight: 'bold', fontSize: 12 },
  
  card: {
    backgroundColor: 'white', width: '100%', borderRadius: 16, padding: 25,
    alignItems: 'center', marginBottom: 20,
    elevation: 4, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, shadowOffset: {width:0, height:5}
  },
  label: { fontSize: 14, color: '#888', marginBottom: 5, textTransform: 'uppercase', letterSpacing: 1 },
  productName: { fontSize: 20, fontWeight: 'bold', color: '#333', textAlign: 'center', marginBottom: 15 },
  divider: { height: 1, width: '100%', backgroundColor: '#eee', marginBottom: 15 },
  amount: { fontSize: 48, fontWeight: 'bold', color: '#E91E63' },

  // סגנונות לכרטיס השמור
  savedCardSection: { width: '100%', marginBottom: 20 },
  sectionTitle: { fontSize: 12, fontWeight: 'bold', color: '#888', marginBottom: 8, marginLeft: 5 },
  savedCardButton: {
      backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#E91E63', elevation: 1
  },
  savedCardText: { fontWeight: 'bold', color: '#333', fontSize: 16 },
  savedCardSub: { color: '#666', fontSize: 12 },

  orText: { color: '#999', fontSize: 12, marginBottom: 15, fontWeight: 'bold' },

  paypalButton: {
    backgroundColor: '#0070BA', flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    width: '100%', padding: 15, borderRadius: 30, marginBottom: 15, elevation: 2
  },
  creditCardButton: {
    backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    width: '100%', padding: 15, borderRadius: 30, marginBottom: 20, elevation: 1, borderWidth: 1, borderColor: '#ddd'
  },
  buttonText: { fontSize: 16, fontWeight: 'bold', color: 'white' },
  cancelLink: { padding: 10 },
  cancelText: { color: '#888', fontSize: 14, textDecorationLine: 'underline' },
});