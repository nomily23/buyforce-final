import React, { useState, useEffect } from 'react';
import { 
  View, Text, FlatList, Image, StyleSheet, TouchableOpacity, 
  ActivityIndicator, SafeAreaView, Platform, StatusBar, Alert, 
  useWindowDimensions, Modal, TextInput 
} from 'react-native';
import { auth, db } from '../../firebaseConfig'; 
import { collection, onSnapshot, query, where, doc, deleteDoc } from 'firebase/firestore';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons'; 
import HeartButton from '../../components/HeartButton'; 

export default function WishlistScreen() {
  const [wishlistItems, setWishlistItems] = useState<any[]>([]);
  const [userOrders, setUserOrders] = useState<string[]>([]); 
  const [loading, setLoading] = useState(true);
  
  // 👇 משתנים לחיפוש
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = width > 768;
  const numColumns = isDesktop ? 3 : 1;

  // 1. טעינת הווישליסט
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
        setLoading(false);
        return;
    }

    const wishlistRef = collection(db, 'users', user.uid, 'wishlist');

    const unsubscribe = onSnapshot(wishlistRef, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setWishlistItems(items);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 2. בדיקת קבוצות שהמשתמש כבר הצטרף
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const q = query(collection(db, 'orders'), where("userId", "==", user.uid));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const purchasedIds = snapshot.docs.map(doc => doc.data().productId);
      setUserOrders(purchasedIds);
    });
    return () => unsubscribe();
  }, []);

  // מחיקה מהווישליסט
  const removeFromWishlist = async (docId: string) => {
      const user = auth.currentUser;
      if (!user) return;
      try {
          await deleteDoc(doc(db, 'users', user.uid, 'wishlist', docId));
      } catch (error) {
          console.error("Error removing item:", error);
      }
  };

  const handleJoinGroup = (item: any) => {
      if (!auth.currentUser) {
          Alert.alert("Login Required", "Please log in to join a group.");
          return;
      }
      
      if (userOrders.includes(item.id)) {
          Alert.alert("Already Joined", "You have already joined this group.");
          return; 
      }

      router.push({
          pathname: '/payment', 
          params: { 
            amount: '1.00', 
            currency: 'ILS', 
            productName: item.title || item.name,
            productId: String(item.id),
            productImage: item.imageUrl || item.image || ''
          }
      });
  };

  // 👇 סינון הפריטים לפי החיפוש
  const filteredItems = wishlistItems.filter(item => 
      (item.title || item.name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  // רכיב כרטיס (משמש גם לרשימה הרגילה וגם לחיפוש)
  const renderCard = ({ item }: { item: any }) => {
    const imgLink = item.imageUrl || item.image;
    const imageSource = (imgLink && imgLink !== "") 
        ? { uri: imgLink } 
        : { uri: 'https://dummyimage.com/100x100/cccccc/000000.png&text=No+Img' };
    
    const isAlreadyJoined = userOrders.includes(item.id);

    return (
        <View style={[styles.card, isDesktop && { margin: 10, maxWidth: '32%' }]}>
            <Image source={imageSource} style={styles.image} resizeMode="cover" />
            
            <View style={styles.details}>
                <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
                    <Text style={styles.name} numberOfLines={2}>{item.title || item.name}</Text>
                    {/* כפתור מחיקה מהיר */}
                    <TouchableOpacity onPress={() => removeFromWishlist(item.id)} style={{padding: 5}}>
                        <Ionicons name="trash-outline" size={20} color="#ff4444" />
                    </TouchableOpacity>
                </View>
                
                <Text style={styles.price}>₪{item.groupPrice || item.price}</Text>

                <TouchableOpacity 
                    style={[
                        styles.joinButton, 
                        isAlreadyJoined && styles.disabledButton
                    ]}
                    onPress={() => handleJoinGroup(item)}
                    disabled={isAlreadyJoined}
                >
                    <Text style={styles.joinButtonText}>
                        {isAlreadyJoined ? 'Joined ✅' : 'Join Group (Pay ₪1)'}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
  };

  if (loading) {
    return <ActivityIndicator size="large" color="#E91E63" style={{marginTop: 50}} />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.webContainer}> 
        
        {/* Header עם כפתור חיפוש */}
        <View style={styles.header}>
            <Text style={styles.headerTitle}>My Wishlist ❤️</Text>
            <TouchableOpacity onPress={() => setIsSearchVisible(true)} style={styles.searchIconBtn}>
                <Ionicons name="search" size={26} color="#333" />
            </TouchableOpacity>
        </View>

        <View style={styles.contentContainer}>
            {wishlistItems.length === 0 ? (
            <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Your wishlist is empty.</Text>
                <TouchableOpacity onPress={() => router.push('/(tabs)/home')}> 
                    <Text style={styles.linkText}>Go Shopping!</Text>
                </TouchableOpacity>
            </View>
            ) : (
            <FlatList
                key={numColumns}
                data={filteredItems} // מציג את המסוננים (אם יש חיפוש, אם לא אז הכל)
                numColumns={numColumns}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                renderItem={renderCard}
                contentContainerStyle={{ paddingBottom: 50 }}
            />
            )}
        </View>
      </View>

      {/* 👇 מודל החיפוש */}
      <Modal visible={isSearchVisible} animationType="fade" onRequestClose={() => setIsSearchVisible(false)}>
        <SafeAreaView style={styles.modalContainer}>
              <View style={styles.searchHeader}>
                <TouchableOpacity onPress={() => setIsSearchVisible(false)}>
                    <Text style={{fontSize: 16, color: '#E91E63', fontWeight: 'bold'}}>Close</Text>
                </TouchableOpacity>
                <TextInput 
                    style={styles.searchInput} 
                    value={searchQuery} 
                    onChangeText={setSearchQuery} 
                    placeholder="Search in wishlist..." 
                    autoFocus={true}
                />
              </View>
              
              <FlatList
                key={numColumns} 
                data={filteredItems}
                numColumns={numColumns}
                keyExtractor={(item) => item.id} 
                renderItem={renderCard}
                contentContainerStyle={styles.list}
                ListEmptyComponent={
                    <Text style={{textAlign: 'center', marginTop: 50, color: 'gray'}}>No items found</Text>
                }
              />
        </SafeAreaView>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0, 
  },
  webContainer: {
    flex: 1,
    width: '100%',
    maxWidth: 800, 
    alignSelf: 'center', 
  },
  header: { 
      padding: 20, 
      backgroundColor: '#fff', 
      flexDirection: 'row', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      elevation: 2,
      borderBottomWidth: 1,
      borderBottomColor: '#f0f0f0'
  },
  headerTitle: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    color: '#333', 
  },
  searchIconBtn: { padding: 5 },
  contentContainer: {
    flex: 1,
    padding: 20,
  },
  
  card: { 
    flexDirection: 'row', 
    backgroundColor: '#f9f9f9', 
    padding: 15, 
    borderRadius: 15, 
    marginBottom: 15, 
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    alignItems: 'center'
  },
  image: { width: 80, height: 80, borderRadius: 10, marginRight: 15, backgroundColor: '#eee' },
  details: { flex: 1, justifyContent: 'center' },
  name: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 4, width: '90%' },
  price: { fontSize: 16, color: '#E91E63', fontWeight: 'bold', marginBottom: 8 },
  
  joinButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  disabledButton: {
    backgroundColor: '#B0BEC5', 
  },
  joinButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  
  emptyContainer: { alignItems: 'center', marginTop: 100 },
  emptyText: { fontSize: 18, color: '#888' },
  linkText: { fontSize: 18, color: '#E91E63', fontWeight: 'bold', marginTop: 10 },

  // עיצוב למודל חיפוש
  modalContainer: { flex: 1, backgroundColor: '#f5f5f5' },
  searchHeader: { padding: 20, flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', elevation: 2 },
  searchInput: { flex: 1, borderWidth: 1, borderColor: '#ccc', padding: 10, borderRadius: 5, marginLeft: 10, textAlign: 'left' },
  list: { padding: 15 },
});