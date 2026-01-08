import React, { useState } from 'react';
import { StyleSheet, View, Text, FlatList, SafeAreaView, TouchableOpacity, Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

// נתונים התחלתיים
const initialNotifications = [
  {
    id: '1',
    type: 'success', 
    title: 'Group Completed!',
    message: 'The Coffee Machine group reached its target. Tap to pay the remainder.',
    time: '2 hours ago',
    read: false,
    targetScreen: '/(tabs)/my-group' // לאן זה לוקח
  },
  {
    id: '5',
    type: 'refund',
    title: 'Group Failed - Refund Issued',
    message: 'The Premium Wine Cooler group ended without reaching the target. Your ₪1.00 deposit has been refunded successfully.',
    time: '3 hours ago',
    read: false,
    targetScreen: '/(tabs)/my-group'
  },
  {
    id: '2',
    type: 'info',
    title: 'Payment Successful',
    message: 'We received your deposit for the Gaming Laptop.',
    time: '1 day ago',
    read: true,
    targetScreen: '/(tabs)/my-group'
  },
  {
    id: '3',
    type: 'alert',
    title: 'Hurry Up!',
    message: 'Only 2 buyers needed to complete the Dyson V15 group.',
    time: '2 days ago',
    read: true,
    targetScreen: '/(tabs)/home' // לוקח לקטלוג
  },
  {
    id: '4',
    type: 'system',
    title: 'Welcome to GroupBuy',
    message: 'Thanks for joining! Start browsing our deals.',
    time: '1 week ago',
    read: true,
    targetScreen: '/(tabs)/home'
  },
];

export default function NotificationsScreen() {
  const router = useRouter();
  
  // שימוש ב-useState כדי שנוכל למחוק התראות או לסמן כנקראו
  const [notifications, setNotifications] = useState(initialNotifications);

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return 'checkmark-circle';
      case 'alert': return 'alert-circle';
      case 'info': return 'information-circle';
      case 'refund': return 'close-circle';
      default: return 'notifications';
    }
  };

  const getColor = (type: string) => {
    switch (type) {
      case 'success': return '#4CAF50'; 
      case 'alert': return '#FF9800';   
      case 'info': return '#2196F3';    
      case 'refund': return '#D32F2F';  
      default: return '#757575';        
    }
  };

  // פונקציה לטיפול בלחיצה על התראה
  const handleNotificationPress = (item: any) => {
      // 1. מסמנים כנקרא (מוריד את הרקע הכחול)
      const updatedList = notifications.map(n => 
          n.id === item.id ? { ...n, read: true } : n
      );
      setNotifications(updatedList);

      // 2. מעבירים למסך הרלוונטי
      if (item.targetScreen) {
          router.push(item.targetScreen);
      }
  };

  // פונקציה לניקוי הכל
  const clearAll = () => {
      if (notifications.length === 0) return;
      
      Alert.alert(
          "Clear Notifications",
          "Are you sure you want to delete all notifications?",
          [
              { text: "Cancel", style: "cancel" },
              { text: "Clear All", style: "destructive", onPress: () => setNotifications([]) }
          ]
      );
  };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
        activeOpacity={0.7}
        onPress={() => handleNotificationPress(item)}
        style={[styles.card, !item.read && styles.unreadCard]}
    >
      <View style={styles.iconContainer}>
        <Ionicons name={getIcon(item.type) as any} size={28} color={getColor(item.type)} />
      </View>
      <View style={styles.textContainer}>
        <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
            <Text style={styles.title}>{item.title}</Text>
            {!item.read && <View style={styles.dot} />}
        </View>
        <Text style={styles.message}>{item.message}</Text>
        <Text style={styles.time}>{item.time}</Text>
      </View>
      
      {/* חץ קטן שמסמן שאפשר ללחוץ */}
      <Ionicons name="chevron-forward" size={20} color="#ccc" style={{marginLeft: 10}} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header עם כפתור מחיקה */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
        {notifications.length > 0 && (
            <TouchableOpacity onPress={clearAll} style={styles.clearButton}>
                <Text style={styles.clearText}>Clear All</Text>
            </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={notifications}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
            <View style={{alignItems: 'center', marginTop: 100}}>
                <Ionicons name="notifications-off-outline" size={60} color="#ccc" />
                <Text style={{color: '#999', marginTop: 10, fontSize: 16}}>No notifications yet</Text>
            </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 20, paddingTop: 50, 
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee',
    position: 'relative'
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  
  clearButton: { position: 'absolute', right: 20, bottom: 20 },
  clearText: { color: '#E91E63', fontWeight: '600', fontSize: 14 },

  list: { padding: 15 },
  
  card: {
    flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12, padding: 15, marginBottom: 12,
    elevation: 2, alignItems: 'center'
  },
  unreadCard: { backgroundColor: '#F0F7FF', borderLeftWidth: 4, borderLeftColor: '#2196F3' },
  
  iconContainer: { marginRight: 15 },
  textContainer: { flex: 1 },
  
  title: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 2 },
  message: { fontSize: 14, color: '#666', lineHeight: 20 },
  time: { fontSize: 12, color: '#999', marginTop: 5 },
  
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#2196F3' }
});