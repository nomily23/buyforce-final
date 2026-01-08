import React, { useState, useEffect } from 'react';
import { 
  View, Text, Image, StyleSheet, ScrollView, TouchableOpacity, 
  SafeAreaView, useWindowDimensions, Alert, ActivityIndicator, Share 
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from '../firebaseConfig';
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';

export default function ProductDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { width } = useWindowDimensions();
  const isDesktop = width > 900;
  
  const { 
    id, title, description, imageUrl, price, groupPrice, targetBuyers, currentBuyers,
    supplier, deadline
  } = params;

  const productTitle = title || 'Product Name';
  const productDesc = description || 'No description available.';
  const productImg = imageUrl && imageUrl !== "" 
      ? imageUrl 
      : 'https://dummyimage.com/600x600/f0f0f0/aaa.png&text=No+Image';
  const supplierName = supplier || 'Official Importer';

  // המרת היעד למספר
  const target = parseFloat(targetBuyers as string || '10');

  // שימוש במשתנה דינמי שמתעדכן בזמן אמת מהשרת
  const [dynamicCurrent, setDynamicCurrent] = useState(parseFloat(currentBuyers as string || '0'));
  
  // חישוב אם הקבוצה מלאה
  const isFull = dynamicCurrent >= target;

  // חישוב אחוזים
  const progress = target > 0 ? dynamicCurrent / target : 0;
  const progressPercent = `${Math.min(progress * 100, 100)}%`;

  // --- תוספת חדשה: חישוב אחוזי הנחה ---
  const regularP = parseFloat(price as string || '0');
  const groupP = parseFloat(groupPrice as string || '0');
  const discountPercent = regularP > 0 ? Math.round(((regularP - groupP) / regularP) * 100) : 0;
  // -------------------------------------

  const [isJoined, setIsJoined] = useState(false);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState('');

  // 1. האזנה לשינויים בזמן אמת למוצר (כדי לדעת מתי הוא מתמלא)
  useEffect(() => {
    if (!id) return;
    
    const productRef = doc(db, 'products', String(id));
    const unsubscribe = onSnapshot(productRef, (docSnapshot) => {
        if (docSnapshot.exists()) {
            const data = docSnapshot.data();
            // עדכון הכמות בזמן אמת
            if (data.currentBuyers !== undefined) {
                setDynamicCurrent(data.currentBuyers);
            }
        }
    });

    return () => unsubscribe();
  }, [id]);

  // 2. האזנה לטיימר
  useEffect(() => {
    const calculateTimeLeft = () => {
        const endDate = deadline ? new Date(deadline as string) : new Date(Date.now() + 86400000); 
        const now = new Date();
        const difference = endDate.getTime() - now.getTime();

        if (difference > 0) {
            const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
            const days = Math.floor(difference / (1000 * 60 * 60 * 24));
            const minutes = Math.floor((difference / 1000 / 60) % 60);
            
            if (days > 0) return `${days}d ${hours}h ${minutes}m`;
            return `${hours}h ${minutes}m`;
        } else {
            return 'Ended';
        }
    };

    const timer = setInterval(() => {
        setTimeLeft(calculateTimeLeft());
    }, 1000);
    setTimeLeft(calculateTimeLeft());
    return () => clearInterval(timer);
  }, [deadline]);

  // 3. בדיקה אם המשתמש כבר הצטרף
  useEffect(() => {
    const user = auth.currentUser;
    if (!user || !id) {
        setLoading(false);
        return;
    }
    const q = query(collection(db, 'orders'), where("userId", "==", user.uid), where("productId", "==", id));
    const unsubscribe = onSnapshot(q, (snapshot) => {
        setIsJoined(!snapshot.empty);
        setLoading(false);
    });
    return () => unsubscribe();
  }, [id]);

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out this deal on BuyForce! 🛍️\n${productTitle} for only ₪${groupPrice}!\nJoin the group now!`,
      });
    } catch (error: any) {
      Alert.alert(error.message);
    }
  };

  const handleJoin = async () => {
    if (!auth.currentUser) {
        Alert.alert("Login Required", "Please log in to join.");
        return;
    }

    try {
        const productRef = doc(db, 'products', String(id));
        const snapshot = await getDoc(productRef);
        if (snapshot.exists()) {
            const freshData = snapshot.data();
            if ((freshData.currentBuyers || 0) >= target) {
                Alert.alert("Group Full", "Sorry! This group filled up just now.");
                return;
            }
        }
    } catch (err) {
        console.log("Error checking status", err);
    }

    router.push({
        pathname: '/payment',
        params: { 
          amount: '1.00', 
          currency: 'ILS', 
          productName: productTitle,
          productId: String(id),
          productImage: productImg
        }
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen 
        options={{
          headerShown: true,
          title: '', 
          headerBackTitle: '',
          headerTintColor: '#333',
          headerStyle: { backgroundColor: '#fff' },
          headerShadowVisible: false,
          headerLeft: () => (
            <TouchableOpacity 
              onPress={() => router.back()} 
              style={styles.headerButton}
            >
              <Ionicons name="arrow-back" size={24} color="#333" />
            </TouchableOpacity>
          ),
          // --- תוספת חדשה: כפתור הלב וכפתור השיתוף ---
          headerRight: () => (
            <View style={{flexDirection: 'row', gap: 10}}>
                <TouchableOpacity 
                  style={styles.headerButton} 
                  onPress={() => Alert.alert("Saved", "Added to wishlist!")}
                >
                  <Ionicons name="heart-outline" size={24} color="#E91E63" />
                </TouchableOpacity>

                <TouchableOpacity 
                  onPress={handleShare} 
                  style={styles.headerButton}
                >
                  <Ionicons name="share-social-outline" size={24} color="#333" />
                </TouchableOpacity>
            </View>
          ),
          // ------------------------------------------
        }} 
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={[styles.mainWrapper, isDesktop && styles.desktopMainWrapper]}>
            <View style={[styles.imageContainer, isDesktop && styles.desktopImageContainer]}>
                <Image source={{ uri: productImg as string }} style={styles.image} resizeMode="contain" />
            </View>

            <View style={[styles.detailsContainer, isDesktop && styles.desktopDetailsContainer]}>
                <Text style={styles.title}>{productTitle}</Text>
                <Text style={styles.supplierText}>Sold by: {supplierName}</Text>

                <View style={styles.statusRow}>
                    <View style={[styles.statusBadge, isFull && styles.fullBadge]}>
                        <Text style={[styles.statusText, isFull && styles.fullText]}>
                            {isFull ? 'SOLD OUT 🔒' : 'Active Group 🔥'}
                        </Text>
                    </View>
                    <View style={styles.timerBadge}>
                        <Ionicons name="time-outline" size={16} color="#E91E63" style={{marginRight: 4}} />
                        <Text style={styles.timerText}>Ends in: {timeLeft}</Text>
                    </View>
                </View>

                {/* --- תוספת חדשה: אזור המחיר המעודכן עם תגית ההנחה --- */}
                <View style={styles.priceContainer}>
                    <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start'}}>
                        <View>
                            <Text style={styles.groupPriceLabel}>Group Price:</Text>
                            <Text style={styles.groupPrice}>₪{groupPrice}</Text>
                        </View>
                        
                        {discountPercent > 0 && (
                            <View style={styles.discountBadge}>
                                <Text style={styles.discountText}>SAVE {discountPercent}%</Text>
                            </View>
                        )}
                    </View>

                    <View style={styles.regularPriceWrapper}>
                        <Text style={styles.regularPriceLabel}>Regular Price:</Text>
                        <Text style={styles.regularPrice}>₪{price}</Text>
                    </View>
                </View>
                {/* -------------------------------------------------- */}

                <View style={styles.divider} />

                <View style={styles.progressSection}>
                    <View style={styles.progressRow}>
                        <Text style={styles.progressLabel}>Buyers Joined:</Text>
                        <Text style={styles.progressValue}>{dynamicCurrent} / {target}</Text>
                    </View>
                    <View style={styles.progressBarBg}>
                        <View style={[
                            styles.progressBarFill, 
                            { width: progressPercent as any },
                            isFull && { backgroundColor: '#d32f2f' }
                        ]} />
                    </View>
                    <Text style={styles.progressSubtext}>
                        {isFull ? 'Target Reached! Group is closed.' : `${Math.round(progress * 100)}% of target reached`}
                    </Text>
                </View>

                <View style={styles.divider} />

                <Text style={styles.sectionTitle}>About this product</Text>
                <Text style={styles.description}>{productDesc}</Text>
                
                <View style={{ height: 100 }} />
            </View>
        </View>
      </ScrollView>

      <View style={styles.footerContainer}>
          <View style={styles.footerContent}>
              <View>
                  <Text style={styles.footerPrice}>₪{groupPrice}</Text>
                  <Text style={styles.footerSub}>Group Price</Text>
              </View>

              <TouchableOpacity 
                style={[styles.joinButton, (isFull || isJoined) && styles.disabledButton]}
                onPress={handleJoin}
                disabled={isFull || isJoined}
              >
                  {loading ? (
                      <ActivityIndicator color="#fff" />
                  ) : (
                      <Text style={styles.joinButtonText}>
                          {isJoined ? 'You Joined ✅' : isFull ? 'Group Full' : 'Join Now (₪1)'}
                      </Text>
                  )}
              </TouchableOpacity>
          </View>
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  scrollContent: { flexGrow: 1, backgroundColor: '#fff' },
  
  headerButton: { backgroundColor: '#f2f2f2', padding: 8, borderRadius: 50 },

  mainWrapper: { flexDirection: 'column', backgroundColor: '#fff' },
  desktopMainWrapper: {
    flexDirection: 'row', maxWidth: 1100, alignSelf: 'center', padding: 40, marginTop: 20,
    borderRadius: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 5, borderWidth: 1, borderColor: '#f0f0f0'
  },

  imageContainer: { width: '100%', height: 350, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  desktopImageContainer: { width: '50%', height: 500, borderBottomWidth: 0, borderRightWidth: 1, borderRightColor: '#f0f0f0', paddingRight: 30 },
  image: { width: '90%', height: '90%' },

  detailsContainer: { padding: 24, backgroundColor: '#fff' },
  desktopDetailsContainer: { width: '50%', paddingLeft: 40, paddingTop: 0, justifyContent: 'center' },

  title: { fontSize: 28, fontWeight: '800', color: '#1a1a1a', marginBottom: 5, lineHeight: 34 },
  supplierText: { fontSize: 14, color: '#666', marginBottom: 15 },

  statusRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap' },
  statusBadge: { backgroundColor: '#e3f2fd', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, marginRight: 10 },
  fullBadge: { backgroundColor: '#ffebee' }, 
  statusText: { color: '#1565c0', fontWeight: 'bold', fontSize: 14 },
  fullText: { color: '#d32f2f' }, 

  timerBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff0f5', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  timerText: { color: '#E91E63', fontWeight: 'bold', fontSize: 14 },

  priceContainer: { marginVertical: 10 },
  groupPriceLabel: { fontSize: 14, color: '#666', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  groupPrice: { fontSize: 36, fontWeight: 'bold', color: '#E91E63' },
  regularPriceWrapper: { flexDirection: 'row', alignItems: 'center', marginTop: 5 },
  regularPriceLabel: { fontSize: 16, color: '#888', marginRight: 8 },
  regularPrice: { fontSize: 18, color: '#888', textDecorationLine: 'line-through' },

  divider: { height: 1, backgroundColor: '#eee', marginVertical: 24 },

  progressSection: {},
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressLabel: { fontSize: 16, fontWeight: '600', color: '#333' },
  progressValue: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  progressBarBg: { height: 10, backgroundColor: '#f0f0f0', borderRadius: 5, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#4CAF50', borderRadius: 5 },
  progressSubtext: { fontSize: 13, color: '#666', marginTop: 6, textAlign: 'right' },

  sectionTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 12, color: '#333' },
  description: { fontSize: 16, color: '#555', lineHeight: 26 },

  footerContainer: {
      position: 'absolute', bottom: 0, width: '100%', backgroundColor: '#fff',
      borderTopWidth: 1, borderTopColor: '#eee', paddingBottom: 20, paddingTop: 15, paddingHorizontal: 20,
      elevation: 10, shadowColor: '#000', shadowOffset: {width: 0, height: -3}, shadowOpacity: 0.1, shadowRadius: 5
  },
  footerContent: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', maxWidth: 1100, alignSelf: 'center', width: '100%'
  },
  footerPrice: { fontSize: 24, fontWeight: 'bold', color: '#E91E63' },
  footerSub: { fontSize: 12, color: '#666' },
  
  joinButton: { 
      backgroundColor: '#E91E63', paddingVertical: 12, paddingHorizontal: 30, borderRadius: 30, elevation: 2 
  },
  disabledButton: { backgroundColor: '#ccc' }, 
  joinButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },

  // --- תוספת: סטיילים חדשים לתגית ההנחה ---
  discountBadge: {
    backgroundColor: '#E91E63',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 4,
    transform: [{ rotate: '-2deg' }] 
  },
  discountText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14
  }
  // ---------------------------------------
});