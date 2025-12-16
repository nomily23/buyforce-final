import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';

export default function ProfileScreen() {
  const router = useRouter();

  const handleLogout = () => {
    Alert.alert(
      'התנתקות',
      'האם את בטוחה שברצונך להתנתק?',
      [
        { text: 'ביטול', style: 'cancel' },
        { 
          text: 'כן, צא', 
          style: 'destructive',
          onPress: () => {
            router.replace('/'); 
          }
        }
      ]
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <Image 
            source={{ uri: 'https://cdn-icons-png.flaticon.com/512/6858/6858504.png' }} 
            style={styles.avatar} 
          />
        </View>
        <Text style={styles.name}>Shira Developer</Text>
        <Text style={styles.email}>shira@test.com</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>הגדרות</Text>
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuText}>🔔 התראות</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuText}>💳 אמצעי תשלום</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuText}>❓ עזרה ותמיכה</Text>
        </TouchableOpacity>
      </View>

      {/* 👇👇👇 כפתור ההתנתקות - בולט וברור */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>התנתקות מהמערכת</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#f5f5f5', padding: 20, paddingTop: 60, paddingBottom: 40 },
  header: { alignItems: 'center', marginBottom: 30 },
  avatarContainer: { 
    width: 100, 
    height: 100, 
    borderRadius: 50, 
    backgroundColor: 'white', 
    justifyContent: 'center', 
    alignItems: 'center',
    marginBottom: 15,
    elevation: 5,
  },
  avatar: { width: 80, height: 80 },
  name: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  email: { fontSize: 16, color: '#666', marginTop: 5 },
  section: { backgroundColor: 'white', borderRadius: 15, padding: 20, marginBottom: 30 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, textAlign: 'left' },
  menuItem: { paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  menuText: { fontSize: 16, textAlign: 'left' },
  
  // עיצוב כפתור ההתנתקות
  logoutButton: { 
    backgroundColor: '#ffebee', 
    padding: 15, 
    borderRadius: 10, 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ffcdd2'
  },
  logoutText: { color: '#d32f2f', fontWeight: 'bold', fontSize: 16 },
});