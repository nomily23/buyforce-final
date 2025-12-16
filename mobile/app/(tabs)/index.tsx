import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, Text, View, FlatList, Image, TouchableOpacity, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { useFocusEffect } from 'expo-router';

// 👇👇👇 ודאי שה-IP שלך כאן נכון!
const API_URL = 'http://192.168.7.13:3000'; 
const MY_USER_ID = 'e3fb6889-1ffb-42c1-9b9d-a27f1fb2c643'; 

export default function HomeScreen() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchProducts = async () => {
    try {
      const response = await fetch(`${API_URL}/groups`);
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchProducts();
    }, [])
  );

  const handleJoin = async (groupId: string) => {
    try {
      const response = await fetch(`${API_URL}/groups/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupId, userId: MY_USER_ID })
      });

      if (response.ok) {
        Alert.alert('איזה כיף!', 'הצטרפת לקבוצה בהצלחה 🛍️');
        fetchProducts(); 
      } else {
        Alert.alert('אופס', 'כבר הצטרפת לקבוצה הזו או שהיא מלאה');
      }
    } catch (error) {
      Alert.alert('שגיאה', 'לא ניתן להתחבר לשרת');
    }
  };

  const renderProduct = ({ item }: { item: any }) => {
    // 🔒 בדיקה אם הקבוצה מלאה (לפי היעד שהגדרת ב-Prisma)
    const isFull = item.currentMembers >= item.targetMembers;
    const progress = item.currentMembers / item.targetMembers;

    return (
      <View style={styles.card}>
        {/* 👇👇👇 כאן התיקון לתמונות שלא ייחתכו */}
        <Image source={{ uri: item.product.image }} style={styles.image} />
        
        <View style={styles.info}>
          <Text style={styles.name}>{item.product.name}</Text>
          <View style={styles.priceRow}>
            <Text style={styles.originalPrice}>₪{item.product.price}</Text>
            <Text style={styles.groupPrice}>₪{item.product.groupPrice}</Text>
          </View>
          
          <View style={styles.progressContainer}>
            <Text style={styles.progressText}>
              {isFull ? 'הקבוצה הגיעה ליעד!' : `${item.currentMembers} מתוך ${item.targetMembers} הצטרפו`}
            </Text>
            <View style={styles.progressBarBackground}>
              <View 
                style={[
                  styles.progressBarFill, 
                  { 
                    width: `${Math.min(progress * 100, 100)}%`, 
                    backgroundColor: isFull ? 'gray' : '#e91e63' // אפור אם מלא, ורוד אם לא
                  }
                ]} 
              />
            </View>
          </View>

          {/* כפתור ננעל אם הקבוצה מלאה */}
          <TouchableOpacity 
            style={[styles.joinButton, isFull && styles.disabledButton]} 
            onPress={() => !isFull && handleJoin(item.id)}
            disabled={isFull}
          >
            <Text style={styles.buttonText}>
              {isFull ? 'הקבוצה מלאה! 🔒' : `הצטרף לקבוצה ב-₪${item.product.groupPrice}!`}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>🔥 המוצרים החמים</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#e91e63" style={{marginTop: 50}} />
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          renderItem={renderProduct}
          contentContainerStyle={{ paddingBottom: 20 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchProducts(); }} />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', paddingTop: 60 },
  header: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginBottom: 15 },
  card: { backgroundColor: 'white', marginHorizontal: 20, marginBottom: 20, borderRadius: 15, overflow: 'hidden', elevation: 3 },
  // 👇 שיניתי ל-contain כדי שיראו את כל המוצר
  image: { width: '100%', height: 200, resizeMode: 'contain', backgroundColor: 'white', marginTop: 10 },
  info: { padding: 15 },
  name: { fontSize: 22, fontWeight: 'bold', marginBottom: 5, textAlign: 'left' },
  priceRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  originalPrice: { fontSize: 16, textDecorationLine: 'line-through', color: '#888', marginRight: 10 },
  groupPrice: { fontSize: 24, fontWeight: 'bold', color: '#e91e63' },
  progressContainer: { marginBottom: 15 },
  progressText: { fontSize: 14, color: '#666', marginBottom: 5, textAlign: 'right' },
  progressBarBackground: { height: 10, backgroundColor: '#e0e0e0', borderRadius: 5, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 5 },
  joinButton: { backgroundColor: '#e91e63', padding: 15, borderRadius: 10, alignItems: 'center' },
  disabledButton: { backgroundColor: '#9e9e9e' }, // צבע אפור כשהכפתור נעול
  buttonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
});