import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';

// וודאי שכתובת ה-IP כאן זהה לזו שיש לך בקובץ index.tsx
const API_URL = 'http://192.168.7.12:3000'; 

export default function RegisterScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleRegister = async () => {
    try {
      // שימי לב: אנחנו פונים ל-auth/register לפי מה שבנינו בשרת
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        Alert.alert('הצלחה', 'ההרשמה בוצעה בהצלחה! כעת ניתן להתחבר.');
        router.back(); // מחזיר אותך למסך הכניסה
      } else {
        Alert.alert('שגיאה', 'ההרשמה נכשלה. נסי שוב.');
      }
    } catch (error) {
      console.log(error);
      Alert.alert('שגיאה', 'שגיאת תקשורת עם השרת');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>הרשמה למערכת</Text>

      <Text style={styles.label}>אימייל</Text>
      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <Text style={styles.label}>סיסמה</Text>
      <TextInput
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity style={styles.button} onPress={handleRegister}>
        <Text style={styles.buttonText}>הירשמי עכשיו</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.back()} style={styles.linkButton}>
        <Text style={styles.linkText}>כבר רשומה? התחברי כאן</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center', color: '#E91E63' },
  label: { fontSize: 16, marginBottom: 5, fontWeight: 'bold' },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 10, marginBottom: 15, borderRadius: 5, backgroundColor: '#f9f9f9' },
  button: { backgroundColor: '#E91E63', padding: 15, borderRadius: 5, alignItems: 'center', marginTop: 10 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  linkButton: { marginTop: 15, alignItems: 'center' },
  linkText: { color: '#E91E63', fontSize: 14 }
});