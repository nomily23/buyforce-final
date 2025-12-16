import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, Image } from 'react-native';
import { useRouter } from 'expo-router';

// 👇👇👇 ודאי שה-IP כאן מעודכן (בלי /products בסוף!)
const API_URL = 'http://192.168.7.13:3000'; 

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    try {
      // שליחת הפרטים לשרת לבדיקה
      const response = await fetch(`${API_URL}/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok) {
        // ✅ התחברות מוצלחת!
        Alert.alert('התחברת בהצלחה!', `ברוכה הבאה, ${data.fullName}`);
        
        // כאן אנחנו "עוברים" למסך הראשי (הטאבים שבנינו קודם)
        router.replace('/(tabs)'); 
      } else {
        // ❌ פרטים שגויים
        Alert.alert('שגיאה', 'אימייל או סיסמה לא נכונים');
      }
    } catch (error) {
      Alert.alert('שגיאה', 'לא ניתן להתחבר לשרת');
      console.log(error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>🛍️ BuyForce</Text>
      <Text style={styles.subtitle}>התחברי כדי להתחיל לחסוך</Text>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>אימייל</Text>
        <TextInput
          style={styles.input}
          placeholder="email@test.com"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>סיסמה</Text>
        <TextInput
          style={styles.input}
          placeholder="********"
          value={password}
          onChangeText={setPassword}
          secureTextEntry // מסתיר את הטקסט בכוכביות
        />
      </View>

      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>כניסה למערכת</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white', justifyContent: 'center', padding: 20 },
  logo: { fontSize: 40, fontWeight: 'bold', color: '#e91e63', textAlign: 'center', marginBottom: 10 },
  subtitle: { fontSize: 18, color: '#666', textAlign: 'center', marginBottom: 40 },
  inputContainer: { marginBottom: 20 },
  label: { fontSize: 16, fontWeight: 'bold', marginBottom: 5, color: '#333' },
  input: { 
    borderWidth: 1, 
    borderColor: '#ddd', 
    borderRadius: 10, 
    padding: 15, 
    fontSize: 16, 
    backgroundColor: '#f9f9f9' 
  },
  button: { 
    backgroundColor: '#e91e63', 
    padding: 15, 
    borderRadius: 10, 
    alignItems: 'center', 
    marginTop: 20,
    elevation: 3 
  },
  buttonText: { color: 'white', fontWeight: 'bold', fontSize: 18 }
});