import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, View, Text, FlatList, Image, SafeAreaView, 
  TouchableOpacity, Modal, TextInput, ActivityIndicator, Alert, useWindowDimensions, Platform, Share 
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, where, onSnapshot, doc, deleteDoc, updateDoc, increment } from 'firebase/firestore';
import { db, auth } from '../../firebaseConfig'; 

export default function MyGroupsScreen() {
  const router = useRouter();
  
  const { width } = useWindowDimensions();
  const isDesktop = width > 768;
  const numColumns = isDesktop ? 3 : 1;

  const [orders, setOrders] = useState<any[]>([]);
  const [productsMap, setProductsMap] = useState<{[key: string]: any}>({});
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');

  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const parsePrice = (value: any) => {
    if (!value) return 0;
    const cleanString = String(value).replace(/[^\d.]/g, ''); 
    const number = parseFloat(cleanString);
    return isNaN(number) ? 0 : number;
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('he-IL');
  };

  const getDaysLeft = (deadlineStr: string) => {
    if (!deadlineStr) return null;
    const end = new Date(deadlineStr);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 3600 * 24));
    return days > 0 ? days : 0;
  };

  useEffect(() => {
    const productsRef = collection(db, 'products');
    const unsubscribe = onSnapshot(productsRef, (snapshot) => {
        const map: {[key: string]: any} = {};
        snapshot.docs.forEach(doc => {
            map[doc.id] = doc.data();
        });
        setProductsMap(map);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
        setLoading(false);
        return;
    }

    const q = query(collection(db, 'orders'), where("userId", "==", user.uid));

    const unsubscribe = onSnapshot(q, (snapshot) => {
        const loadedOrders = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data
            };
        });
        setOrders(loadedOrders);
        setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleShareGroup = async (productName: string, groupPrice: any) => {
    try {
      await Share.share({
        message: `Join me on BuyForce! 🛍️\nLet's buy ${productName} together for only ₪${groupPrice}!\nWe need more people to unlock this price!`,
      });
    } catch (error) {
      console.log(error);
    }
  };

  const handleLeaveGroup = async (orderId: string, productId: string) => {
    const deleteOrder = async () => {
        try {
            if (productId) {
                const productRef = doc(db, 'products', productId);
                await updateDoc(productRef, {
                    currentBuyers: increment(-1) 
                });
            }
            await deleteDoc(doc(db, 'orders', orderId));
            if (Platform.OS === 'web') alert("Left group successfully");
        } catch (error) {
            console.error("Error leaving group:", error);
            alert("Failed to leave group.");
        }
    };

    if (Platform.OS === 'web') {
        const confirm = window.confirm("Are you sure you want to leave this group?");
        if (confirm) await deleteOrder();
    } else {
        Alert.alert(
            "Leave Group",
            "Are you sure? This will remove you from the participant list.",
            [
                { text: "No", style: "cancel" },
                { text: "Yes, Leave", style: "destructive", onPress: deleteOrder }
            ]
        );
    }
  };

  const getProcessedOrders = () => {
    const mainOrders: any[] = [];
    const balanceOrders: any[] = [];

    orders.forEach(order => {
        const isBalance = (order.productName || '').startsWith('Balance:') || (order.productName || '').startsWith('יתרה עבור:');
        if (isBalance) {
            balanceOrders.push(order);
        } else {
            mainOrders.push(order);
        }
    });

    return mainOrders.map(order => {
        const liveProduct = productsMap[order.productId];
        
        const isProductFailed = liveProduct?.status === 'failed'; 
        const isOrderRefunded = order.status === 'refunded'; 
        const isOrderREFUNDED = order.status === 'REFUNDED'; 
        
        const isFailedState = isProductFailed || isOrderRefunded || isOrderREFUNDED;

        if (!liveProduct && !isFailedState) return null;

        const currentBuyers = parsePrice(liveProduct?.currentBuyers) || 0;
        const targetBuyers = parsePrice(liveProduct?.targetBuyers) || 10;
        const isCompleted = currentBuyers >= targetBuyers;

        const fullPrice = parsePrice(liveProduct?.groupPrice) || parsePrice(liveProduct?.price) || 0;
        
        let totalAmountPaid = parsePrice(order.amountPaid) || 0;

        const relatedBalanceOrders = balanceOrders.filter(b => b.productId === order.productId);
        relatedBalanceOrders.forEach(b => {
            totalAmountPaid += (parsePrice(b.amountPaid) || 0);
        });
        
        let remaining = fullPrice - totalAmountPaid; 
        if (remaining < 1) remaining = 0;

        return {
            ...order,
            liveCurrentBuyers: currentBuyers,
            liveTargetBuyers: targetBuyers,
            isCompleted: isCompleted,
            remainingToPay: remaining, 
            fullPrice: fullPrice,
            totalAmountPaid: totalAmountPaid, 
            isFullyPaid: remaining === 0,
            isFailed: isFailedState,
            deadline: liveProduct?.deadline 
        };
    }).filter(item => item !== null);
  };

  const processedOrders = getProcessedOrders();

  const filteredOrders = processedOrders.filter(order => {
    const matchesSearch = (order.productName || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    // בודקים אם זה שייך להיסטוריה (הושלם ושולם, או נכשל והוחזר)
    const isHistoryItem = order.isFullyPaid || order.isFailed;

    if (activeTab === 'active') {
        // Active = פעיל, לא הושלם עדיין, וגם לא נכשל
        return matchesSearch && !isHistoryItem;
    } else {
        // History = הושלם או נכשל
        return matchesSearch && isHistoryItem;
    }
  });

  const handleCompletePurchase = (remainingPrice: number, productTitle: string, productId: string) => {
    const proceedToPayment = () => {
        router.push({
            pathname: '/payment',
            params: {
              amount: remainingPrice.toString(), 
              currency: 'ILS',
              productName: `Balance: ${productTitle}`,
              productId: productId
            }
          });
    };

    if (Platform.OS === 'web') {
        const confirmed = window.confirm(`Proceed to pay the remaining balance of ₪${remainingPrice}?`);
        if (confirmed) proceedToPayment();
    } else {
        Alert.alert(
            "Complete Purchase ", 
            `The group reached its target!\nProceed to pay the remaining balance of ₪${remainingPrice}?`,
            [
              { text: "Cancel", style: "cancel" },
              { text: "Yes, Pay Now", onPress: proceedToPayment }
            ]
          );
    }
  };

  const renderOrder = ({ item }: { item: any }) => {
    const progress = item.liveTargetBuyers > 0 ? item.liveCurrentBuyers / item.liveTargetBuyers : 0;
    const progressPercent = `${Math.min(progress * 100, 100)}%`;
    const missingPeople = Math.max(0, item.liveTargetBuyers - item.liveCurrentBuyers);
    const daysLeft = getDaysLeft(item.deadline);
    
    const productData = productsMap[item.productId];
    const imageUri = item.productImage || productData?.imageUrl || productData?.image || '';
    const imageSource = imageUri ? { uri: imageUri } : { uri: 'https://dummyimage.com/100x100/cccccc/000000.png&text=No+Image' };

    return (
      <View style={[
          styles.card,
          isDesktop && { flex: 1, margin: 10, maxWidth: '31%' }
      ]}>
        <View style={styles.topSection}>
            <Image source={imageSource} style={styles.image} resizeMode="cover" />
            <View style={styles.textContainer}>
                <View style={{flexDirection: 'row', justifyContent: 'space-between', width: '100%'}}>
                    <Text style={styles.title}>{item.productName}</Text>
                    
                    <View style={{flexDirection: 'row', gap: 10}}>
                        {/* כפתור שיתוף חדש לקבוצות פעילות */}
                        {!item.isFullyPaid && !item.isFailed && (
                            <TouchableOpacity onPress={() => handleShareGroup(item.productName, item.fullPrice)} style={{padding: 5}}>
                                <Ionicons name="share-social-outline" size={20} color="#4A90E2" />
                            </TouchableOpacity>
                        )}
                        {/* כפתור יציאה */}
                        {!item.isFullyPaid && !item.isFailed && (
                            <TouchableOpacity onPress={() => handleLeaveGroup(item.id, item.productId)} style={{padding: 5}}>
                                <Ionicons name="trash-outline" size={20} color="red" />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
                
                <Text style={styles.price}>Group Price: ₪{item.fullPrice}</Text>
                
                {item.isFailed ? (
                    <Text style={[styles.paid, {color: '#D32F2F'}]}>Status: Refunded ❌</Text>
                ) : (
                    <Text style={styles.paid}>Status: {item.isFullyPaid ? 'Completed 🏁' : 'Active 🏃'}</Text>
                )}

                <Text style={styles.dateText}>Ordered on: {formatDate(item.timestamp)}</Text>
            </View>
        </View>

        <View style={styles.statusSection}>
            
            {item.isFailed ? (
                <View style={{marginTop: 5, backgroundColor: '#FFEBEE', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#FFCDD2'}}>
                    <Text style={{color: '#D32F2F', fontWeight: 'bold', fontSize: 16, textAlign: 'center'}}>
                        Group Closed / Failed
                    </Text>
                    <Text style={{color: '#D32F2F', fontSize: 12, textAlign: 'center', marginTop: 2}}>
                        Your deposit of ₪{item.totalAmountPaid} has been refunded.
                    </Text>
                </View>
            ) : item.isCompleted ? (
              <>
                <Text style={[styles.statusTitle, {color: '#4CAF50'}]}>Group Completed! 🎉</Text>
                <View style={styles.progressBarBackground}>
                  <View style={[styles.progressBarFill, { width: '100%', backgroundColor: '#4CAF50' }]} />
                </View>
                
                {item.isFullyPaid ? (
                    <View style={{marginTop: 10, backgroundColor: '#e8f5e9', padding: 10, borderRadius: 8}}>
                        <Text style={{color: '#2e7d32', fontWeight: 'bold', fontSize: 16, textAlign: 'center'}}>
                            Product is on its way 🚚
                        </Text>
                        <Text style={{color: '#2e7d32', fontSize: 12, textAlign: 'center', marginTop: 2}}>
                            Thank you for your purchase!
                        </Text>
                    </View>
                ) : (
                    // ממתין לתשלום יתרה
                    <>
                        <Text style={styles.infoText}>Target reached! Pay the remainder.</Text>
                        <TouchableOpacity 
                          style={styles.payButton}
                          onPress={() => handleCompletePurchase(item.remainingToPay, item.productName, item.productId)}
                        >
                          <Text style={styles.payButtonText}>Pay Remainder (₪{item.remainingToPay})</Text>
                        </TouchableOpacity>
                    </>
                )}
              </>
            ) : (
              <>
                <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
                    <Text style={styles.statusTitle}>Waiting for buyers ⏳</Text>
                    {/* תצוגת ימים שנותרו */}
                    {daysLeft !== null && (
                        <Text style={{fontSize: 12, color: daysLeft < 3 ? 'red' : '#666', fontWeight: 'bold'}}>
                            {daysLeft} days left
                        </Text>
                    )}
                </View>

                <View style={styles.progressBarBackground}>
                  <View style={[styles.progressBarFill, { width: progressPercent as any }]} /> 
                </View>
                <Text style={styles.statusText}>
                    {item.liveCurrentBuyers} of {item.liveTargetBuyers} joined.
                    Need <Text style={{fontWeight: 'bold'}}>{missingPeople}</Text> more.
                </Text>
              </>
            )}
        </View>
      </View>
    );
  };

  if (loading) {
      return (
          <View style={{flex:1, justifyContent:'center', alignItems:'center'}}>
              <ActivityIndicator size="large" color="#E91E63" />
          </View>
      );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Groups</Text>
        <TouchableOpacity onPress={() => setIsSearchVisible(true)} style={styles.searchIconBtn}>
            <Ionicons name="search" size={26} color="#333" />
        </TouchableOpacity>
      </View>

      <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tabButton, activeTab === 'active' && styles.activeTabButton]}
            onPress={() => setActiveTab('active')}
          >
              <Text style={[styles.tabText, activeTab === 'active' && styles.activeTabText]}>Active</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tabButton, activeTab === 'history' && styles.activeTabButton]}
            onPress={() => setActiveTab('history')}
          >
              <Text style={[styles.tabText, activeTab === 'history' && styles.activeTabText]}>History</Text>
          </TouchableOpacity>
      </View>

      <FlatList
        key={numColumns} 
        data={filteredOrders} 
        numColumns={numColumns}
        keyExtractor={(item) => item.id}
        renderItem={renderOrder}
        contentContainerStyle={styles.list}
        columnWrapperStyle={isDesktop ? { justifyContent: 'flex-start' } : undefined}
        ListEmptyComponent={
            <View style={{alignItems: 'center', marginTop: 50}}>
                <Ionicons name={activeTab === 'active' ? "people-outline" : "receipt-outline"} size={50} color="#ccc" />
                <Text style={{textAlign: 'center', marginTop: 10, fontSize: 16, color: '#666'}}>
                    {activeTab === 'active' 
                        ? "You have no active groups." 
                        : "No history yet."}
                </Text>
            </View>
        }
      />

      <Modal visible={isSearchVisible} animationType="slide" onRequestClose={() => setIsSearchVisible(false)}>
        <SafeAreaView style={styles.modalContainer}>
            <View style={styles.searchHeader}>
                <TouchableOpacity onPress={() => setIsSearchVisible(false)}>
                    <Text style={{color: '#E91E63', fontWeight: 'bold'}}>Close</Text>
                </TouchableOpacity>
                <TextInput 
                    style={styles.searchInput}
                    placeholder="Search my orders..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
            </View>
            <FlatList
                key={numColumns}
                data={filteredOrders}
                numColumns={numColumns}
                keyExtractor={(item) => item.id}
                renderItem={renderOrder}
                contentContainerStyle={styles.list}
                columnWrapperStyle={isDesktop ? { justifyContent: 'flex-start' } : undefined}
            />
        </SafeAreaView>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { 
      padding: 20, backgroundColor: '#fff', flexDirection: 'row', 
      justifyContent: 'space-between', alignItems: 'center', elevation: 2 
  },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#333' },
  searchIconBtn: { padding: 5 },
  
  tabContainer: {
      flexDirection: 'row', backgroundColor: '#fff', paddingHorizontal: 20, paddingBottom: 10,
      borderBottomWidth: 1, borderBottomColor: '#eee'
  },
  tabButton: {
      marginRight: 20, paddingVertical: 8, borderBottomWidth: 2, borderBottomColor: 'transparent'
  },
  activeTabButton: {
      borderBottomColor: '#E91E63'
  },
  tabText: {
      fontSize: 16, color: '#888', fontWeight: '600'
  },
  activeTabText: {
      color: '#E91E63', fontWeight: 'bold'
  },

  list: { padding: 15 },
  
  card: { backgroundColor: '#fff', borderRadius: 15, marginBottom: 15, padding: 15, elevation: 3 },
  
  topSection: { flexDirection: 'row', marginBottom: 15 },
  image: { width: 80, height: 80, borderRadius: 10, marginRight: 15, backgroundColor: '#eee' },
  textContainer: { flex: 1, justifyContent: 'center', alignItems: 'flex-start' },
  
  title: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 5, textAlign: 'left', flex: 1 }, 
  price: { fontSize: 16, color: '#333', fontWeight: 'bold', textAlign: 'left' }, 
  paid: { fontSize: 14, color: '#4CAF50', fontWeight: 'bold', marginTop: 5, textAlign: 'left' },
  dateText: { fontSize: 12, color: '#999', marginTop: 3, textAlign: 'left' },
  
  statusSection: { borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 10 },
  statusTitle: { fontSize: 14, fontWeight: 'bold', color: '#333', marginBottom: 5, textAlign: 'left' },
  
  progressBarBackground: { height: 8, backgroundColor: '#E0E0E0', borderRadius: 4, overflow: 'hidden', marginBottom: 8 },
  progressBarFill: { height: '100%', backgroundColor: '#E91E63', borderRadius: 4 },
  
  statusText: { fontSize: 14, color: '#666', textAlign: 'left' },
  infoText: { fontSize: 14, color: '#333', textAlign: 'left', marginBottom: 10 },
  
  payButton: { backgroundColor: '#4CAF50', paddingVertical: 10, borderRadius: 8, alignItems: 'center', marginTop: 5 },
  payButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },

  modalContainer: { flex: 1, backgroundColor: '#f9f9f9' },
  searchHeader: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 15, elevation: 3 },
  searchInput: { flex: 1, height: 40, backgroundColor: '#f0f0f0', borderRadius: 20, paddingHorizontal: 15, marginHorizontal: 10, textAlign: 'left' }
});