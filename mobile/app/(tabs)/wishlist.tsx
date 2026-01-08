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

export default function WishlistScreen() {
  const [wishlistItems, setWishlistItems] = useState<any[]>([]);
  const [userOrders, setUserOrders] = useState<string[]>([]); 
  const [loading, setLoading] = useState(true);
  
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = width > 768;
  const numColumns = isDesktop ? 3 : 1;

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

      // בדיקה נוספת למקרה שהמשתמש לחץ מהר לפני שהכפתור התעדכן
      const current = item.currentBuyers || 0;
      const target = item.targetBuyers || 10;
      if (current >= target) {
          Alert.alert("Group Full", "Sorry, this group is already sold out.");
          return;
      }

      router.push({
          pathname: '/payment', 
          params: { 
            amount: '1.00', 
            currency: 'ILS', 
            productName: item.title || item.name,
            productId: String(item.id),
            productImage: item.imageUrl || item.image || '',
            regularPrice: String(item.regularPrice || item.price),
            groupPrice: String(item.groupPrice)
          }
      });
  };

  const handleProductPress = (item: any) => {
    const imgLink = item.imageUrl || item.image;
    router.push({
        pathname: '/product-details',
        params: {
            id: item.id,
            title: item.title || item.name,
            description: item.description || '',
            imageUrl: imgLink,
            price: item.regularPrice || item.price,
            groupPrice: item.groupPrice,
            currentBuyers: item.currentBuyers || 0,
            targetBuyers: item.targetBuyers || 10,
            supplier: item.supplier || 'Official Importer', 
            deadline: item.deadline
        }
    });
  };

  const filteredItems = wishlistItems.filter(item => 
      (item.title || item.name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderCard = ({ item }: { item: any }) => {
    const imgLink = item.imageUrl || item.image;
    const imageSource = (imgLink && imgLink !== "") 
        ? { uri: imgLink } 
        : { uri: 'https://dummyimage.com/100x100/cccccc/000000.png&text=No+Img' };
    
    // בדיקות סטטוס
    const isAlreadyJoined = userOrders.includes(item.id);
    const current = item.currentBuyers || 0;
    const target = item.targetBuyers || 10;
    const isFull = current >= target; // האם הקבוצה מלאה?

    // חישוב הנחה
    const regPrice = parseFloat(item.regularPrice || item.price || '0');
    const grpPrice = parseFloat(item.groupPrice || '0');
    const discountPercent = regPrice > 0 ? Math.round(((regPrice - grpPrice) / regPrice) * 100) : 0;

    return (
        <TouchableOpacity 
            style={[styles.card, isDesktop && { margin: 10, maxWidth: '32%' }]}
            onPress={() => handleProductPress(item)} 
            activeOpacity={0.9}
        >
            <View>
                <Image source={imageSource} style={styles.image} resizeMode="cover" />
                
                {discountPercent > 0 && (
                    <View style={styles.discountBadge}>
                        <Text style={styles.discountText}>SAVE {discountPercent}%</Text>
                    </View>
                )}
            </View>
            
            <View style={styles.details}>
                <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
                    <Text style={styles.name} numberOfLines={2}>{item.title || item.name}</Text>
                    <TouchableOpacity onPress={() => removeFromWishlist(item.id)} style={{padding: 5}}>
                        <Ionicons name="trash-outline" size={20} color="#ff4444" />
                    </TouchableOpacity>
                </View>
                
                <View style={{flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8}}>
                    <Text style={styles.price}>₪{item.groupPrice || item.price}</Text>
                    {discountPercent > 0 && (
                        <Text style={styles.oldPrice}>₪{item.regularPrice || item.price}</Text>
                    )}
                </View>

                {/* --- הכפתור החכם המתוקן --- */}
                <TouchableOpacity 
                    style={[
                        styles.joinButton, 
                        (isAlreadyJoined || isFull) && styles.disabledButton // אפור אם הצטרף או מלא
                    ]}
                    onPress={() => handleJoinGroup(item)}
                    disabled={isAlreadyJoined || isFull}
                >
                    <Text style={styles.joinButtonText}>
                        {isAlreadyJoined 
                            ? 'Joined ✅' 
                            : isFull 
                                ? 'Sold Out 🔒' // טקסט חדש כשהקבוצה מלאה
                                : 'Join Group (Pay ₪1)'}
                    </Text>
                </TouchableOpacity>
                {/* ----------------------------- */}

            </View>
        </TouchableOpacity>
    );
  };

  if (loading) {
    return <ActivityIndicator size="large" color="#E91E63" style={{marginTop: 50}} />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.webContainer}> 
        <View style={styles.header}>
            <Text style={styles.headerTitle}>My Wishlist ❤️</Text>
            <TouchableOpacity onPress={() => setIsSearchVisible(true)} style={styles.searchIconBtn}>
                <Ionicons name="search" size={26} color="#333" />
            </TouchableOpacity>
        </View>

        <View style={styles.contentContainer}>
            {wishlistItems.length === 0 ? (
            <View style={styles.emptyContainer}>
                <Ionicons name="heart-dislike-outline" size={80} color="#ddd" />
                <Text style={styles.emptyText}>Your wishlist is empty.</Text>
                <TouchableOpacity onPress={() => router.push('/(tabs)/home')}> 
                    <Text style={styles.linkText}>Go Shopping!</Text>
                </TouchableOpacity>
            </View>
            ) : (
            <FlatList
                key={numColumns}
                data={filteredItems} 
                numColumns={numColumns}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                renderItem={renderCard}
                contentContainerStyle={{ paddingBottom: 50 }}
            />
            )}
        </View>
      </View>

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
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  searchIconBtn: { padding: 5 },
  contentContainer: { flex: 1, padding: 20 },
  
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
  
  discountBadge: {
    position: 'absolute', top: 0, left: 0, 
    backgroundColor: '#E91E63', paddingHorizontal: 6, paddingVertical: 2, 
    borderTopLeftRadius: 10, borderBottomRightRadius: 10,
    zIndex: 10
  },
  discountText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },

  details: { flex: 1, justifyContent: 'center' },
  name: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 4, width: '90%' },
  
  price: { fontSize: 16, color: '#E91E63', fontWeight: 'bold' },
  oldPrice: { fontSize: 13, color: '#999', textDecorationLine: 'line-through' },
  
  joinButton: {
    backgroundColor: '#E91E63', 
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginTop: 5
  },
  disabledButton: {
    backgroundColor: '#B0BEC5', 
  },
  joinButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  
  emptyContainer: { alignItems: 'center', marginTop: 80 },
  emptyText: { fontSize: 18, color: '#888', marginTop: 10 },
  linkText: { fontSize: 18, color: '#E91E63', fontWeight: 'bold', marginTop: 10 },

  modalContainer: { flex: 1, backgroundColor: '#f5f5f5' },
  searchHeader: { padding: 20, flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', elevation: 2 },
  searchInput: { flex: 1, borderWidth: 1, borderColor: '#ccc', padding: 10, borderRadius: 5, marginLeft: 10, textAlign: 'left' },
  list: { padding: 15 },
});