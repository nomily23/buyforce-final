import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, View, Text, TextInput, Pressable, Image, 
  Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, useWindowDimensions, SafeAreaView, Modal, TouchableOpacity 
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithCredential, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import * as LocalAuthentication from 'expo-local-authentication'; // ספריית ביומטרי

WebBrowser.maybeCompleteAuthSession();

const logoImg = require('./logo.png'); 

export default function LoginScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = width > 768; 

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  
  const [resetModalVisible, setResetModalVisible] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  const [isBiometricSupported, setIsBiometricSupported] = useState(false);

  const [failedAttempts, setFailedAttempts] = useState(0);

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
    (async () => {
      try {
        const compatible = await LocalAuthentication.hasHardwareAsync();
        const enrolled = await LocalAuthentication.isEnrolledAsync();
        setIsBiometricSupported(compatible && enrolled);
      } catch (e) {
        console.log("Biometric check error:", e);
      }
    })();
  }, []);

  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      const credential = GoogleAuthProvider.credential(id_token);
      signInWithCredential(auth, credential)
        .then(() => {
           router.replace('/(tabs)/home');
        })
        .catch((error) => {
           Alert.alert("Google Login Error", error.message);
        });
    }
  }, [response]);

  const handleBiometricLogin = async () => {
      console.log("Starting biometric login...");
      
      try {
          const hasHardware = await LocalAuthentication.hasHardwareAsync();
          const isEnrolled = await LocalAuthentication.isEnrolledAsync();

          if (!hasHardware || !isEnrolled) {
              Alert.alert("Error", "Face ID / Touch ID is not set up on this device.");
              return;
          }

          const result = await LocalAuthentication.authenticateAsync({
              promptMessage: 'Login with Face ID',
              fallbackLabel: '',   
              disableDeviceFallback: true, 
              cancelLabel: 'Cancel'
          });

          if (result.success) {
              setLoading(true);
              // דיליי קטן לאפקט טעינה
              setTimeout(() => {
                  setLoading(false);
                  Alert.alert("Success", "Welcome back! 🔓", [
                      { text: "Enter App", onPress: () => router.replace('/(tabs)/home') }
                  ]);
              }, 500);
          }
      } catch (error: any) {
          console.log("Biometric error:", error);
      }
  };

  const handleLogin = async () => {
    if (failedAttempts >= 5) {
        const msg = "Too many failed attempts. Please reset your password.";
        if (Platform.OS === 'web') window.alert(msg);
        else Alert.alert("Account Locked", msg);
        return;
    }

    if (email === '' || password === '') {
      if (Platform.OS === 'web') window.alert('Please enter email and password.');
      else Alert.alert('Error', 'Please enter email and password.');
      return;
    }

    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setFailedAttempts(0); 
      router.replace('/(tabs)/home'); 
    } catch (error: any) {
      const newAttempts = failedAttempts + 1;
      setFailedAttempts(newAttempts);
      
      let errorMessage = "Invalid email or password.";
      if (newAttempts >= 5) errorMessage = "Too many failed attempts. You are temporarily locked out.";
      else errorMessage = `Invalid email or password. (${newAttempts}/5 attempts)`;

      if (Platform.OS === 'web') window.alert(errorMessage);
      else Alert.alert('Login Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const performPasswordReset = async () => {
      if (resetEmail === '' || !resetEmail.includes('@')) {
          const msg = "Please enter a valid email address.";
          if (Platform.OS === 'web') window.alert(msg);
          else Alert.alert("Invalid Email", msg);
          return;
      }

      setResetLoading(true);
      try {
          await sendPasswordResetEmail(auth, resetEmail);
          setResetModalVisible(false); 
          setResetEmail(''); 
          
          const successMsg = "Reset link sent! Please check your email inbox.";
          if (Platform.OS === 'web') window.alert(successMsg);
          else Alert.alert("Email Sent", successMsg);
          
      } catch (error: any) {
          const errorMsg = error.message;
          if (Platform.OS === 'web') window.alert(errorMsg);
          else Alert.alert("Error", errorMsg);
      } finally {
          setResetLoading(false);
      }
  };

  const handleAppleLoginPlaceholder = () => {
    if (Platform.OS === 'web') window.alert("Apple Login coming soon.");
    else Alert.alert("Apple Login", "Feature coming soon.");
  };

  const content = (
    <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="always">
        <View style={[styles.formContainer, isDesktop && styles.desktopContainer]}>
            <View style={styles.logoContainer}>
                <Image source={logoImg} style={styles.logo} resizeMode="contain" />
            </View>

            <Text style={styles.title}>BuyForce</Text> 
            <Text style={styles.subtitle}>Welcome Back! Sign in to continue.</Text>

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

            <View style={styles.forgotContainer}>
                <Pressable 
                    onPress={() => setResetModalVisible(true)} 
                    style={({pressed}) => [
                        styles.forgotButton, 
                        pressed && { opacity: 0.6 },
                        isDesktop && { cursor: 'pointer' }
                    ]}
                >
                    <Text style={styles.forgotText}>Forgot Password?</Text>
                </Pressable>
            </View>

            <Pressable 
                style={({ pressed }) => [
                    styles.loginButton, 
                    isDesktop && { cursor: 'pointer' },
                    pressed && { opacity: 0.8 }
                ]} 
                onPress={handleLogin} 
                disabled={loading}
            >
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.loginButtonText}>Sign In</Text>}
            </Pressable>
            
            {isBiometricSupported && (
                <TouchableOpacity style={styles.biometricButton} onPress={handleBiometricLogin}>
                    <Ionicons name="finger-print-outline" size={28} color="#E91E63" />
                    <Text style={styles.biometricText}>Login with Face ID</Text>
                </TouchableOpacity>
            )}

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

            <View style={styles.signupContainer}>
                <Text style={styles.signupText}>Don't have an account? </Text>
                <Pressable onPress={() => router.push('/register')} style={isDesktop && { cursor: 'pointer' } as any}>
                    <Text style={styles.signupButton}>Sign Up</Text>
                </Pressable>
            </View>

            <View style={styles.secureContainer}>
                <Ionicons name="shield-checkmark-outline" size={14} color="#888" />
                <Text style={styles.secureText}>100% Secure Login</Text>
            </View>

        </View>

        <Modal
            animationType="slide"
            transparent={true}
            visible={resetModalVisible}
            onRequestClose={() => setResetModalVisible(false)}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Reset Password</Text>
                        <Pressable onPress={() => setResetModalVisible(false)}>
                            <Ionicons name="close" size={24} color="#333" />
                        </Pressable>
                    </View>
                    
                    <Text style={styles.modalSubText}>
                        Enter your email address and we'll send you a link to reset your password.
                    </Text>

                    <View style={[styles.inputContainer, { marginBottom: 20 }]}>
                        <Ionicons name="mail-outline" size={20} color="#666" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Enter your email"
                            placeholderTextColor="#888"
                            value={resetEmail}
                            onChangeText={setResetEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoFocus={true} 
                        />
                    </View>

                    <Pressable 
                        style={({pressed}) => [
                            styles.resetSubmitButton, 
                            pressed && { opacity: 0.9 },
                            isDesktop && { cursor: 'pointer' }
                        ]}
                        onPress={performPasswordReset}
                        disabled={resetLoading}
                    >
                        {resetLoading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.resetSubmitText}>Send Reset Link</Text>
                        )}
                    </Pressable>
                </View>
            </View>
        </Modal>

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
  formContainer: { width: '100%', backgroundColor: '#fff', padding: 30, borderRadius: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
  desktopContainer: { maxWidth: 450, alignSelf: 'center' },
  logoContainer: { alignItems: 'center', marginBottom: 20 },
  logo: { width: 150, height: 150 }, 
  title: { fontSize: 32, fontWeight: 'bold', color: '#E91E63', textAlign: 'center', marginBottom: 5 }, 
  subtitle: { fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 30 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9f9f9', borderRadius: 10, marginBottom: 15, paddingHorizontal: 15, borderWidth: 1, borderColor: '#ddd', height: 50 },
  inputFocused: { borderColor: '#E91E63', borderWidth: 2, backgroundColor: '#fff' },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, height: '100%', fontSize: 16, textAlign: 'left', color: '#000', fontWeight: '500', outlineStyle: 'none' as any }, 
  
  forgotContainer: { alignItems: 'flex-end', marginBottom: 20 },
  forgotButton: { padding: 5 },
  forgotText: { color: '#E91E63', fontSize: 14, fontWeight: '600' },

  loginButton: { backgroundColor: '#E91E63', borderRadius: 10, height: 50, justifyContent: 'center', alignItems: 'center', marginBottom: 15, shadowColor: "#E91E63", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 4 },
  loginButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  
  biometricButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 25, gap: 10, padding: 10 },
  biometricText: { color: '#E91E63', fontSize: 16, fontWeight: 'bold' },

  socialRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25 },
  socialButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', borderRadius: 10, paddingVertical: 12, width: '48%' },
  socialIcon: { width: 22, height: 22, marginRight: 10 },
  socialText: { fontSize: 16, fontWeight: '600', color: '#333' },
  signupContainer: { flexDirection: 'row', justifyContent: 'center' },
  signupText: { color: '#666', fontSize: 16 },
  signupButton: { color: '#E91E63', fontSize: 16, fontWeight: 'bold' },

  secureContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 30, gap: 5 },
  secureText: { color: '#888', fontSize: 12 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: '#fff', borderRadius: 20, padding: 25, width: '100%', maxWidth: 400, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 5 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  modalSubText: { fontSize: 14, color: '#666', marginBottom: 20, lineHeight: 20 },
  resetSubmitButton: { backgroundColor: '#E91E63', borderRadius: 10, height: 50, justifyContent: 'center', alignItems: 'center' },
  resetSubmitText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});