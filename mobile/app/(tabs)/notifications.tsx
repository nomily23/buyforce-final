import React, { useState } from 'react';
import { 
  StyleSheet, View, Text, FlatList, SafeAreaView, TouchableOpacity, Alert, Vibration 
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

// נתונים התחלתיים
const initialNotifications = [
  {
    id: '1',
    type: 'success', 
    title: 'Group Completed! 🎉',
    message: 'The Sony Headphones group reached its target! Tap to pay the remainder.',
    time: '2 hours ago',
    read: false,
    targetScreen: '/(tabs)/my-group',
    params: { tab: 'active' }
  },
  {
    id: '2',
    type: 'alert',
    title: 'Price Drop Alert 📉',
    message: 'Ninja Blender is now 30% cheaper. Join the group before it fills up!',
    time: '5 hours ago',
    read: false,
    targetScreen: '/(tabs)/home',
  },
  {
    id: '3',
    type: 'refund',
    title: 'Group Refunded',
    message: 'The Wine Cooler group failed. Your ₪1.00 deposit has been refunded.',
    time: '1 day ago',
    read: true,
    targetScreen: '/(tabs)/my-group',
    params: { tab: 'history' }
  },
  {
    id: '4',
    type: 'info',
    title: 'Payment Received',
    message: 'We received your deposit for the Gaming Laptop.',
    time: '2 days ago',
    read: true,
    targetScreen: '/(tabs)/my-group'
  },
  {
    id: '5',
    type: 'system',
    title: 'Welcome to BuyForce 👋',
    message: 'Thanks for joining! Start your first group purchase today and save big.',
    time: '1 week ago',
    read: true,
    targetScreen: '/(tabs)/home'
  },
];

export default function NotificationsScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = useState(initialNotifications);
  
  // --- ניהול מצב בחירה (Selection Mode) ---
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const isSelectionMode = selectedIds.length > 0;

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return 'checkmark-circle';
      case 'alert': return 'trending-down';
      case 'info': return 'information-circle';
      case 'refund': return 'alert-circle';
      case 'system': return 'star';
      default: return 'notifications';
    }
  };

  const getColor = (type: string) => {
    switch (type) {
      case 'success': return '#4CAF50'; 
      case 'alert': return '#FF9800';   
      case 'info': return '#2196F3';    
      case 'refund': return '#D32F2F';  
      case 'system': return '#E91E63';      
      default: return '#757575';        
    }
  };

  // --- לוגיקה ללחיצה ארוכה (כניסה למצב בחירה) ---
  const handleLongPress = (id: string) => {
    Vibration.vibrate(50); // רטט קטן למשוב
    if (!selectedIds.includes(id)) {
        setSelectedIds([...selectedIds, id]);
    }
  };

  // --- לוגיקה ללחיצה רגילה ---
  const handlePress = (item: any) => {
    if (isSelectionMode) {
        // אם אנחנו במצב בחירה - הלחיצה רק מסמנת/מבטלת סימון
        if (selectedIds.includes(item.id)) {
            const newIds = selectedIds.filter(id => id !== item.id);
            setSelectedIds(newIds);
        } else {
            setSelectedIds([...selectedIds, item.id]);
        }
    } else {
        // מצב רגיל - פתיחת ההודעה
        const updatedList = notifications.map(n => 
            n.id === item.id ? { ...n, read: true } : n
        );
        setNotifications(updatedList);

        if (item.targetScreen) {
            router.push({
              pathname: item.targetScreen,
              params: item.params || {} 
            });
        }
    }
  };

  // מחיקת הפריטים שנבחרו
  const deleteSelected = () => {
    Alert.alert(
        "Delete Notifications",
        `Are you sure you want to delete ${selectedIds.length} items?`,
        [
            { text: "Cancel", style: "cancel" },
            { 
                text: "Delete", 
                style: "destructive", 
                onPress: () => {
                    const filtered = notifications.filter(n => !selectedIds.includes(n.id));
                    setNotifications(filtered);
                    setSelectedIds([]); // יציאה ממצב בחירה
                }
            }
        ]
    );
  };

  const markAllAsRead = () => {
    const updatedList = notifications.map(n => ({ ...n, read: true }));
    setNotifications(updatedList);
  };

  const cancelSelection = () => {
      setSelectedIds([]);
  };

  const renderItem = ({ item }: { item: any }) => {
    const isSelected = selectedIds.includes(item.id);

    return (
        <TouchableOpacity 
            activeOpacity={0.7}
            onLongPress={() => handleLongPress(item.id)}
            onPress={() => handlePress(item)}
            style={[
                styles.card, 
                !item.read && !isSelectionMode && styles.unreadCard,
                isSelected && styles.selectedCard // עיצוב מיוחד אם נבחר
            ]}
        >
          {/* אייקון סימון (מופיע רק במצב בחירה) */}
          {isSelectionMode && (
              <View style={styles.selectionIcon}>
                  <Ionicons 
                    name={isSelected ? "checkbox" : "square-outline"} 
                    size={24} 
                    color={isSelected ? "#E91E63" : "#ccc"} 
                  />
              </View>
          )}

          {/* אייקון ההודעה */}
          <View style={[styles.iconContainer, { backgroundColor: getColor(item.type) + '15' }]}>
            <Ionicons name={getIcon(item.type) as any} size={24} color={getColor(item.type)} />
          </View>

          <View style={styles.textContainer}>
            <View style={styles.headerRow}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.time}>{item.time}</Text>
            </View>
            <Text style={styles.message} numberOfLines={2}>{item.message}</Text>
          </View>
          
          {!item.read && !isSelectionMode && <View style={styles.dot} />}
        </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* --- Header דינמי --- */}
      <View style={[styles.header, isSelectionMode && styles.selectionHeader]}>
        
        {isSelectionMode ? (
            // מצב בחירה
            <>
                <TouchableOpacity onPress={cancelSelection}>
                    <Ionicons name="close" size={26} color="#333" />
                </TouchableOpacity>
                <Text style={styles.selectionTitle}>{selectedIds.length} Selected</Text>
                <TouchableOpacity onPress={deleteSelected}>
                    <Ionicons name="trash-outline" size={24} color="#D32F2F" />
                </TouchableOpacity>
            </>
        ) : (
            // מצב רגיל
            <>
                <Text style={styles.headerTitle}>Updates</Text>
                <View style={{flexDirection: 'row', gap: 15}}>
                    {notifications.some(n => !n.read) && (
                        <TouchableOpacity onPress={markAllAsRead}>
                            <Text style={styles.actionText}>Read all</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </>
        )}
      </View>

      <FlatList
        data={notifications}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
            <View style={{alignItems: 'center', marginTop: 100, opacity: 0.5}}>
                <Ionicons name="notifications-off-outline" size={80} color="#ccc" />
                <Text style={{marginTop: 20, fontSize: 16}}>No new updates</Text>
            </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9f9f9' },
  
  header: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingTop: 50, 
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee'
  },
  selectionHeader: {
      backgroundColor: '#FFE0E9', // צבע רקע עדין במצב בחירה
  },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  selectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  actionText: { color: '#E91E63', fontWeight: '600', fontSize: 14 },

  list: { padding: 15 },
  
  card: {
    flexDirection: 'row', backgroundColor: '#fff', borderRadius: 15, padding: 15, marginBottom: 12,
    elevation: 2, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, shadowOffset: {width:0, height:2}
  },
  unreadCard: { 
      backgroundColor: '#fff', 
      borderLeftWidth: 4, 
      borderLeftColor: '#E91E63' 
  },
  selectedCard: {
      backgroundColor: '#FFF0F5', // ורוד בהיר מאוד כשנבחר
      borderColor: '#E91E63',
      borderWidth: 1
  },
  
  selectionIcon: { marginRight: 10 },
  iconContainer: { 
      width: 45, height: 45, borderRadius: 25, 
      justifyContent: 'center', alignItems: 'center', marginRight: 15 
  },
  textContainer: { flex: 1 },
  
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  title: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  time: { fontSize: 12, color: '#999' },
  message: { fontSize: 14, color: '#666', lineHeight: 20 },
  
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#E91E63', marginLeft: 10 }
});