import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, View, Text, TextInput, Pressable, Image, 
  Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, useWindowDimensions, SafeAreaView
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { createUserWithEmailAndPassword, updateProfile, GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore'; 
import { auth, db } from '../firebaseConfig';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';

WebBrowser.maybeCompleteAuthSession();

export default function RegisterScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = width > 768;

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);

  const redirectUri = Platform.select({
      web: typeof window !== 'undefined' ? window.location.origin : '',
      default: 'https://auth.expo.io/@nomilydaniely/buyforce-app'
  });

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    webClientId: '266182462184-f6ibkl4s2vu4beiuhridt27jp963ltfi.apps.googleusercontent.com',
    iosClientId: '266182462184-f6ibkl4s2vu4beiuhridt27jp963ltfi.apps.googleusercontent.com',
    androidClientId: '266182462184-f6ibkl4s2vu4beiuhridt27jp963ltfi.apps.googleusercontent.com',
    redirectUri: redirectUri,
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      const credential = GoogleAuthProvider.credential(id_token);
      setLoading(true);
      signInWithCredential(auth, credential)
        .then(async (userCredential) => {
           const user = userCredential.user;
           const userDoc = await getDoc(doc(db, 'users', user.uid));
           
           if (!userDoc.exists()) {
               await setDoc(doc(db, 'users', user.uid), {
                   uid: user.uid,
                   displayName: user.displayName || 'Google User',
                   email: user.email,
                   createdAt: new Date(),
               });
           }
           router.replace('/(tabs)/home');
        })
        .catch((error) => {
           setLoading(false);
           Alert.alert("Google Signup Error", error.message);
        });
    }
  }, [response]);

  const handleRegister = async () => {
    // 👇 בדיקות תקינות לפני שפונים לפיירבייס
    if (name === '' || email === '' || password === '') {
      if (Platform.OS === 'web') window.alert('Please fill in all fields.');
      else Alert.alert('Error', 'Please fill in all fields.');
      return;
    }

    // 👇 בדיקה חדשה: האם יש שטרודל באימייל?
    if (!email.includes('@')) {
        if (Platform.OS === 'web') window.alert('Invalid Email: You are missing the "@" symbol.');
        else Alert.alert('Error', 'Invalid Email: You are missing the "@" symbol.');
        return;
    }

    if (password.length < 6) {
        if (Platform.OS === 'web') window.alert('Password too short: Must be at least 6 characters.');
        else Alert.alert('Error', 'Password too short: Must be at least 6 characters.');
        return;
    }
    
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await updateProfile(user, { displayName: name });

      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        displayName: name,
        email: email,
        createdAt: new Date(),
      });

      if (Platform.OS === 'web') {
          setTimeout(() => {
              window.alert("Account created successfully!");
              router.replace('/(tabs)/home');
          }, 100);
      } else {
          Alert.alert("Success", "Account created successfully!", [
            { text: "OK", onPress: () => router.replace('/(tabs)/home') }
          ]);
      }
      
    } catch (error: any) {
      console.error(error);
      let msg = error.message;
      if (error.code === 'auth/email-already-in-use') msg = 'This email is already registered.';
      if (error.code === 'auth/invalid-email') msg = 'The email address is invalid.';
      
      if (Platform.OS === 'web') window.alert('Registration Failed: ' + msg);
      else Alert.alert('Registration Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleAppleLoginPlaceholder = () => {
    if (Platform.OS === 'web') window.alert("Apple Signup coming soon.");
    else Alert.alert("Apple Signup", "Coming soon.");
  };

  const content = (
    <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="always">
        <View style={[styles.formContainer, isDesktop && styles.desktopContainer]}>
            
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join us and start saving together!</Text>

            <View style={[styles.inputContainer, focusedInput === 'name' && styles.inputFocused]}>
                <Ionicons name="person-outline" size={20} color="#333" style={styles.inputIcon} />
                <TextInput
                    style={styles.input}
                    placeholder="Full Name"
                    placeholderTextColor="#555"
                    value={name}
                    onChangeText={setName}
                    cursorColor="#333"
                    onFocus={() => setFocusedInput('name')}
                    onBlur={() => setFocusedInput(null)}
                />
            </View>

            <View style={[styles.inputContainer, focusedInput === 'email' && styles.inputFocused]}>
                <Ionicons name="mail-outline" size={20} color="#333" style={styles.inputIcon} />
                <TextInput
                    style={styles.input}
                    placeholder="Email Address"
                    placeholderTextColor="#555"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    cursorColor="#333"
                    onFocus={() => setFocusedInput('email')}
                    onBlur={() => setFocusedInput(null)}
                />
            </View>

            <View style={[styles.inputContainer, focusedInput === 'password' && styles.inputFocused]}>
                <Ionicons name="lock-closed-outline" size={20} color="#333" style={styles.inputIcon} />
                <TextInput
                    style={styles.input}
                    placeholder="Password"
                    placeholderTextColor="#555"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    cursorColor="#333"
                    onFocus={() => setFocusedInput('password')}
                    onBlur={() => setFocusedInput(null)}
                />
            </View>

            <Pressable 
                style={({ pressed }) => [
                    styles.registerButton, 
                    isDesktop && { cursor: 'pointer' },
                    pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] }
                ]} 
                onPress={handleRegister} 
                disabled={loading}
            >
            {loading ? (
                <ActivityIndicator color="#fff" />
            ) : (
                <Text style={styles.registerButtonText}>Sign Up</Text>
            )}
            </Pressable>

             <View style={styles.dividerContainer}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OR Sign Up With</Text>
                <View style={styles.dividerLine} />
            </View>
            
            <View style={styles.socialRow}>
                <Pressable 
                    style={({ pressed }) => [
                        styles.socialButton, 
                        isDesktop && { cursor: 'pointer' },
                        pressed && { backgroundColor: '#f0f0f0' }
                    ]}
                    onPress={() => { if (request) promptAsync(); }}
                >
                    <Image source={{ uri: 'https://cdn-icons-png.flaticon.com/512/2991/2991148.png' }} style={styles.socialIcon} />
                    <Text style={styles.socialText}>Google</Text>
                </Pressable>

                <Pressable 
                    style={({ pressed }) => [
                        styles.socialButton, 
                        isDesktop && { cursor: 'pointer' },
                        pressed && { backgroundColor: '#f0f0f0' }
                    ]} 
                    onPress={handleAppleLoginPlaceholder}
                >
                    <FontAwesome5 name="apple" size={22} color="black" style={{marginRight: 10}} />
                    <Text style={styles.socialText}>Apple</Text>
                </Pressable>
            </View>

            <View style={styles.loginContainer}>
                <Text style={styles.loginText}>Already have an account? </Text>
                <Pressable onPress={() => router.back()} style={isDesktop && { cursor: 'pointer' } as any}>
                    <Text style={styles.loginButtonLink}>Sign In</Text>
                </Pressable>
            </View>
        </View>
    </ScrollView>
  );

  if (Platform.OS === 'web') {
      return (
        <SafeAreaView style={styles.safeArea}>
            <Stack.Screen options={{ headerTitle: "" }} /> 
            <View style={styles.container}>{content}</View>
        </SafeAreaView>
      );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
        <Stack.Screen options={{ headerTitle: "" }} /> 
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
          {content}
        </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f0f2f5' },
  container: { flex: 1 },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  formContainer: {
    width: '100%', backgroundColor: '#fff', padding: 30, borderRadius: 20,
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 5,
  },
  desktopContainer: { maxWidth: 450, alignSelf: 'center', marginTop: 40 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#333', textAlign: 'center', marginBottom: 5 },
  subtitle: { fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 30 },
  inputContainer: { 
      flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9f9f9', 
      borderRadius: 10, marginBottom: 15, paddingHorizontal: 15, borderWidth: 1, borderColor: '#ddd', height: 50
  },
  inputFocused: { borderColor: '#E91E63', borderWidth: 2, backgroundColor: '#fff' },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, height: '100%', fontSize: 16, textAlign: 'left', fontWeight: '500', outlineStyle: 'none' as any },
  registerButton: {
    backgroundColor: '#E91E63', borderRadius: 10, height: 50, justifyContent: 'center', alignItems: 'center',
    marginBottom: 20, marginTop: 10, shadowColor: "#E91E63", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 4,
  },
  registerButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  dividerContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 25 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#eee' },
  dividerText: { marginHorizontal: 10, color: '#888', fontSize: 14 },
  socialRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25 },
  socialButton: { 
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd',
      borderRadius: 10, paddingVertical: 12, width: '48%'
  },
  socialIcon: { width: 22, height: 22, marginRight: 10 },
  socialText: { fontSize: 16, fontWeight: '600', color: '#333' },
  loginContainer: { flexDirection: 'row', justifyContent: 'center' },
  loginText: { color: '#666', fontSize: 16 },
  loginButtonLink: { color: '#E91E63', fontSize: 16, fontWeight: 'bold' },
});