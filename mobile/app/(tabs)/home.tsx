import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, View, Text, FlatList, Image, SafeAreaView, 
  TouchableOpacity, Modal, TextInput, Alert, useWindowDimensions, ScrollView
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons'; 
import { collection, onSnapshot, query, where } from 'firebase/firestore'; 
import { db, auth } from '../../firebaseConfig'; 

import HeartButton from '../../components/HeartButton';

export default function CatalogScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = width > 768;
  const numColumns = isDesktop ? 3 : 1;

  const [products, setProducts] = useState<any[]>([]); 
  const [userOrders, setUserOrders] = useState<string[]>([]); 
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  const categories = ['All', 'Travel', 'Electronics', 'Home', 'Furniture', 'Technology'];

  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const trendingSearches = ['iPhone', 'Dyson', 'TV', 'Sony', 'Laptop'];
  const recentSearches = ['Galaxy S24', 'Coffee Machine', 'Headphones'];

  useEffect(() => {
    const productsRef = collection(db, 'products');
    const unsubscribe = onSnapshot(productsRef, (snapshot) => {
      const loadedProducts = snapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id 
      }));
      setProducts(loadedProducts);
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


  const productsByCategory = selectedCategory === 'All' 
    ? products 
    : products.filter(product => {
        const prodCat = (product.category || '').toLowerCase();
        const selected = selectedCategory.toLowerCase();
        return prodCat === selected;
    });

  const nearGoalProducts = productsByCategory.filter(p => {
      const current = p.currentBuyers || 0;
      const target = p.targetBuyers || 10;
      return (current / target) >= 0.7 && (current / target) < 1;
  });

  const marketBreakers = [...productsByCategory].sort((a, b) => {
      const discountA = 1 - (a.groupPrice / (a.regularPrice || a.price));
      const discountB = 1 - (b.groupPrice / (b.regularPrice || b.price));
      return discountB - discountA;
  }).slice(0, 5);

  const newArrivals = [...productsByCategory].reverse().slice(0, 5);

  const filteredProducts = products.filter(product => {
    const title = (product.title || product.name || '').toLowerCase();
    const q = searchQuery.toLowerCase();
    return title.includes(q);
  });

  const handleJoinGroup = (product: any) => {
      if (!product.id) return;
      if (!auth.currentUser) {
          Alert.alert("Login Required", "Please log in to join.");
          return;
      }
      if (userOrders.includes(product.id)) {
          Alert.alert("Already Joined", "You are already in this group.");
          return; 
      }
      router.push({
          pathname: '/payment',
          params: { 
            amount: '1.00', 
            currency: 'ILS', 
            productName: product.title || product.name,
            productId: String(product.id),
            productImage: product.imageUrl || product.image || '',
            regularPrice: String(product.regularPrice || product.price),
            groupPrice: String(product.groupPrice)
          }
      });
  };

  const renderProductCard = ({ item, horizontal = false }: { item: any, horizontal?: boolean }) => {
    const current = item.currentBuyers || 0;
    const target = item.targetBuyers || 10;
    const progress = current / target; 
    const progressPercent = `${Math.min(progress * 100, 100)}%` as any;
    const isFull = current >= target;
    const isJoined = userOrders.includes(item.id);

    const regPrice = parseFloat(item.regularPrice || item.price || '0');
    const grpPrice = parseFloat(item.groupPrice || '0');
    const discountPercent = regPrice > 0 ? Math.round(((regPrice - grpPrice) / regPrice) * 100) : 0;

    const imgLink = item.imageUrl || item.image || 'https://dummyimage.com/400x400/ccc/000.png';
    const title = item.title || item.name;

    return (
      <TouchableOpacity 
        activeOpacity={0.9}
        onPress={() => {
            setIsSearchVisible(false);
            router.push({
                pathname: '/product-details',
                params: {
                    id: item.id,
                    title: title,
                    description: item.description || item.subtitle || '',
                    imageUrl: imgLink,
                    price: item.regularPrice || item.price,
                    groupPrice: item.groupPrice,
                    currentBuyers: current,
                    targetBuyers: target,
                    supplier: item.supplier || 'Official Importer', 
                    deadline: item.deadline || new Date(Date.now() + 86400000).toISOString()
                }
            });
        }}
        style={[
            styles.card, 
            horizontal ? { width: 220, marginRight: 15 } : (isDesktop ? { flex: 1, margin: 10, maxWidth: '31%' } : { marginBottom: 20 })
        ]}
      >
        <View style={{ position: 'absolute', top: 10, right: 10, zIndex: 10, backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 20, padding: 2 }}>
            <HeartButton product={item} />
        </View>

        {discountPercent > 10 && (
            <View style={styles.discountBadge}>
                <Text style={styles.discountText}>{discountPercent}% OFF</Text>
            </View>
        )}

        {progress > 0.8 && !isFull && (
             <View style={styles.hotBadge}>
                <Ionicons name="flame" size={14} color="#fff" />
                <Text style={styles.hotText}>HOT</Text>
            </View>
        )}

        <Image source={{ uri: imgLink }} style={[styles.image, horizontal && { height: 140 }]} resizeMode="cover" />
        
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>{title}</Text>
          
          <View style={styles.progressContainer}>
            <View style={styles.progressBarBackground}>
               <View style={[styles.progressBarFill, { width: progressPercent, backgroundColor: isFull ? '#4CAF50' : '#E91E63' }]} />
            </View>
            <Text style={styles.progressTextSmall}>{current}/{target} Sold</Text>
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.price}>₪{item.regularPrice || item.price}</Text>
            <Text style={styles.groupPrice}>₪{item.groupPrice}</Text>
          </View>

          {!horizontal && (
             <TouchableOpacity 
                style={[styles.joinButton, (isFull || isJoined) && styles.disabledButton]} 
                onPress={() => handleJoinGroup(item)} 
                disabled={isFull || isJoined} 
             >
                <Text style={styles.joinButtonText}>
                  {isJoined ? 'Joined ✅' : isFull ? 'Full' : 'Join (₪1)'}
                </Text>
             </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const MainHeader = () => (
    <View>
       <View style={styles.categoryContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={categories}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={[styles.categoryButton, selectedCategory === item && styles.selectedCategoryButton]}
              onPress={() => setSelectedCategory(item)}
            >
              <Text style={[styles.categoryText, selectedCategory === item && styles.selectedCategoryText]}>{item}</Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {nearGoalProducts.length > 0 && (
          <View style={styles.sectionContainer}>
              <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Ending Soon ⏳</Text>
                  <Text style={styles.sectionSubtitle}>Near Goal</Text>
              </View>
              <FlatList
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  data={nearGoalProducts}
                  keyExtractor={item => item.id}
                  renderItem={({ item }) => renderProductCard({ item, horizontal: true })}
                  contentContainerStyle={{ paddingHorizontal: 15 }}
              />
          </View>
      )}

      {marketBreakers.length > 0 && (
        <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Market Breakers 💥</Text>
                <Text style={styles.sectionSubtitle}>Best Discounts</Text>
            </View>
            <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={marketBreakers}
                keyExtractor={item => item.id}
                renderItem={({ item }) => renderProductCard({ item, horizontal: true })}
                contentContainerStyle={{ paddingHorizontal: 15 }}
            />
        </View>
      )}

      {newArrivals.length > 0 && (
        <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>New Arrivals ✨</Text>
            </View>
            <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={newArrivals}
                keyExtractor={item => item.id}
                renderItem={({ item }) => renderProductCard({ item, horizontal: true })}
                contentContainerStyle={{ paddingHorizontal: 15 }}
            />
        </View>
      )}

      <Text style={[styles.sectionTitle, { paddingHorizontal: 20, marginTop: 20, marginBottom: 10 }]}>
          All Products ({selectedCategory})
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>BuyForce</Text>
        
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 15 }}>
            {/* כפתור למודל */}
            <TouchableOpacity onPress={() => router.push('/modal')}>
                <Ionicons name="gift-outline" size={24} color="#E91E63" />
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setIsSearchVisible(true)} style={styles.searchIconBtn}>
                <Ionicons name="search" size={26} color="#333" />
            </TouchableOpacity>
        </View>
      </View>

      <FlatList
        ListHeaderComponent={MainHeader}
        key={numColumns} 
        data={filteredProducts}
        numColumns={numColumns} 
        keyExtractor={(item) => item.id} 
        renderItem={({ item }) => renderProductCard({ item, horizontal: false })}
        contentContainerStyle={{ paddingBottom: 50 }}
        columnWrapperStyle={isDesktop ? { justifyContent: 'flex-start', paddingHorizontal: 15 } : undefined}
        ListEmptyComponent={
            <View style={{alignItems: 'center', marginTop: 50}}>
                <Text style={{color: 'gray'}}>No products found in this category.</Text>
            </View>
        }
      />
      
      <Modal visible={isSearchVisible} animationType="slide" onRequestClose={() => setIsSearchVisible(false)}>
        <SafeAreaView style={styles.modalContainer}>
              <View style={styles.searchHeader}>
                <TouchableOpacity onPress={() => setIsSearchVisible(false)}>
                    <Text style={{fontSize: 16, color: '#E91E63', fontWeight: 'bold'}}>Close</Text>
                </TouchableOpacity>
                <TextInput 
                    style={styles.searchInput} 
                    value={searchQuery} 
                    onChangeText={setSearchQuery} 
                    placeholder="Search product..." 
                    autoFocus={true}
                />
              </View>

              {searchQuery.trim() === '' ? (
                  <ScrollView style={styles.suggestionsContainer} keyboardShouldPersistTaps="always">
                      <Text style={styles.suggestionTitle}>Trending Searches 🔥</Text>
                      <View style={styles.chipsContainer}>
                          {trendingSearches.map((term, index) => (
                              <TouchableOpacity 
                                key={index} 
                                style={styles.chip} 
                                onPress={() => setSearchQuery(term)}
                              >
                                  <Text style={styles.chipText}>{term}</Text>
                              </TouchableOpacity>
                          ))}
                      </View>

                      <Text style={styles.suggestionTitle}>Recent Searches 🕒</Text>
                      <View>
                          {recentSearches.map((term, index) => (
                              <TouchableOpacity 
                                key={index} 
                                style={styles.recentItem} 
                                onPress={() => setSearchQuery(term)}
                              >
                                  <Ionicons name="time-outline" size={20} color="#888" style={{marginRight: 10}} />
                                  <Text style={styles.recentText}>{term}</Text>
                                  <Ionicons name="arrow-forward-outline" size={16} color="#ccc" style={{marginLeft: 'auto'}} />
                              </TouchableOpacity>
                          ))}
                      </View>
                  </ScrollView>
              ) : (
                  <FlatList
                    data={filteredProducts}
                    keyExtractor={(item) => item.id} 
                    renderItem={({ item }) => renderProductCard({ item, horizontal: false })}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={
                        <Text style={{textAlign: 'center', marginTop: 50, color: 'gray'}}>No products found for "{searchQuery}"</Text>
                    }
                  />
              )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9f9f9' },
  header: { padding: 20, backgroundColor: '#fff', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 2 },
  headerTitle: { fontSize: 24, fontWeight: '900', color: '#E91E63' },
  searchIconBtn: { padding: 5 },
  categoryContainer: { backgroundColor: '#fff', paddingVertical: 15, marginBottom: 10 },
  categoryButton: { paddingHorizontal: 15, paddingVertical: 8, backgroundColor: '#f0f0f0', borderRadius: 20, marginHorizontal: 5 },
  selectedCategoryButton: { backgroundColor: '#E91E63' },
  categoryText: { color: '#333' },
  selectedCategoryText: { color: '#fff', fontWeight: 'bold' },
  sectionContainer: { marginBottom: 25 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingHorizontal: 20, marginBottom: 10 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  sectionSubtitle: { fontSize: 14, color: '#E91E63', fontWeight: '600' },
  list: { padding: 15 },
  card: { backgroundColor: '#fff', borderRadius: 15, overflow: 'hidden', elevation: 3, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5, shadowOffset: {width:0, height: 2} },
  image: { width: '100%', height: 180 },
  info: { padding: 12 },
  name: { fontSize: 16, fontWeight: 'bold', marginBottom: 5, textAlign: 'left', color: '#333' },
  progressContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 5 },
  progressBarBackground: { flex: 1, height: 6, backgroundColor: '#eee', borderRadius: 3, marginRight: 8 },
  progressBarFill: { height: '100%', borderRadius: 3 },
  progressTextSmall: { fontSize: 12, color: '#666' },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 5, marginBottom: 5 },
  price: { textDecorationLine: 'line-through', color: '#999', fontSize: 13 },
  groupPrice: { fontWeight: 'bold', color: '#E91E63', fontSize: 18 },
  joinButton: { backgroundColor: '#E91E63', padding: 10, borderRadius: 8, alignItems: 'center', marginTop: 8 },
  disabledButton: { backgroundColor: '#B0BEC5' }, 
  joinButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  
  discountBadge: {
      position: 'absolute', top: 10, left: 10, zIndex: 10,
      backgroundColor: '#E91E63', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 5
  },
  discountText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  hotBadge: {
      position: 'absolute', top: 10, left: 90, zIndex: 10, 
      backgroundColor: '#FF9800', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 5,
      flexDirection: 'row', alignItems: 'center', gap: 3
  },
  hotText: { color: '#fff', fontWeight: 'bold', fontSize: 10 },

  modalContainer: { flex: 1, backgroundColor: '#f5f5f5' },
  searchHeader: { padding: 20, flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', elevation: 2 },
  searchInput: { flex: 1, borderWidth: 1, borderColor: '#ccc', padding: 10, borderRadius: 5, marginLeft: 10, textAlign: 'left' },
  suggestionsContainer: { padding: 20 },
  suggestionTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 15, marginTop: 10 },
  chipsContainer: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 20 },
  chip: { backgroundColor: '#e0e0e0', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, marginRight: 10, marginBottom: 10 },
  chipText: { color: '#333', fontWeight: '600' },
  recentItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  recentText: { fontSize: 16, color: '#555' }
});