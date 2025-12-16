import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, FlatList, Image, ActivityIndicator } from 'react-native';

// 👇👇👇 ודאי שה-IP שלך כאן מעודכן!
const API_URL = 'http://192.168.7.13:3000'; 
// 👇👇👇 ה-ID של שירה
const MY_USER_ID = 'e3fb6889-1ffb-42c1-9b9d-a27f1fb2c643'; 

export default function MyGroupsScreen() {
  const [myGroups, setMyGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyGroups();
  }, []);

  const fetchMyGroups = async () => {
    try {
      // כאן אנחנו משתמשים בכתובת החדשה שבדקת ב-Thunder Client
      const response = await fetch(`${API_URL}/users/${MY_USER_ID}/groups`);
      const data = await response.json();
      setMyGroups(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const renderGroup = ({ item }: { item: any }) => {
    const product = item.group.product; // שולפים את פרטי המוצר מתוך הקבוצה
    
    return (
      <View style={styles.card}>
        <Image source={{ uri: product.image }} style={styles.image} />
        <View style={styles.info}>
          <Text style={styles.title}>נרשמת ל: {product.name}</Text>
          
          <View style={styles.statusRow}>
            <Text style={styles.label}>סטטוס הקבוצה:</Text>
            <Text style={styles.statusValue}>
              {item.group.status === 'OPEN' ? '🟢 פעילה' : '🔴 סגורה'}
            </Text>
          </View>

          <Text style={styles.date}>
            תאריך הצטרפות: {new Date(item.joinedAt).toLocaleDateString()}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>הקבוצות שלי 🛍️</Text>
      
      {loading ? (
        <ActivityIndicator size="large" color="#e91e63" />
      ) : myGroups.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>עוד לא הצטרפת לשום קבוצה...</Text>
        </View>
      ) : (
        <FlatList
          data={myGroups}
          keyExtractor={(item) => item.id}
          renderItem={renderGroup}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', paddingTop: 60, paddingHorizontal: 15 },
  header: { fontSize: 28, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  card: { backgroundColor: 'white', borderRadius: 15, marginBottom: 15, flexDirection: 'row', overflow: 'hidden', elevation: 2 },
  image: { width: 100, height: 100, resizeMode: 'cover' },
  info: { padding: 10, flex: 1, justifyContent: 'center' },
  title: { fontSize: 16, fontWeight: 'bold', marginBottom: 5 },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
  label: { fontSize: 14, color: '#666', marginRight: 5 },
  statusValue: { fontSize: 14, fontWeight: 'bold' },
  date: { fontSize: 12, color: '#999' },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 18, color: '#666' }
});