import React, { useState } from 'react';
import { 
  StyleSheet, View, Text, TouchableOpacity, Image, Alert, 
  SafeAreaView, ScrollView, Modal, Switch, ActivityIndicator, Platform 
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from '../../firebaseConfig';
import { signOut } from 'firebase/auth';
// 👇 ייבואים חדשים שצריך בשביל הלוגיקה של ה"שרת"
import { collection, getDocs, query, where, writeBatch, doc, Timestamp } from 'firebase/firestore';

export default function ProfileScreen() {
  const router = useRouter();
  const user = auth.currentUser;

  // משתנים לחלון ההגדרות
  const [modalVisible, setModalVisible] = useState(false);
  const [isPushOn, setIsPushOn] = useState(true);
  const [isEmailOn, setIsEmailOn] = useState(true);
  const [isFaceIdOn, setIsFaceIdOn] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // משתנה לטעינה של כפתור המנהל
  const [adminLoading, setAdminLoading] = useState(false);

  const handleLogout = async () => {
    const performLogout = async () => {
        try {
            await signOut(auth);
            router.replace('/login'); 
        } catch (error) {
            console.error(error);
            if (Platform.OS === 'web') alert("Failed to log out");
            else Alert.alert("Error", "Failed to log out");
        }
    };

    if (Platform.OS === 'web') {
        if (window.confirm("Are you sure you want to log out?")) {
            await performLogout();
        }
    } else {
        Alert.alert(
            "Sign Out",
            "Are you sure you want to log out?",
            [
              { text: "Cancel", style: "cancel" },
              { 
                text: "Yes, Log Out", 
                style: 'destructive',
                onPress: performLogout
              }
            ]
        );
    }
  };

  const saveSettings = () => {
      setSaving(true);
      setTimeout(() => {
          setSaving(false);
          setModalVisible(false);
          if (Platform.OS === 'web') alert("Settings Saved");
          else Alert.alert("Settings Saved", "Your preferences have been updated successfully.");
      }, 1000);
  };

  // 👇👇👇 הפונקציה החכמה שמחליפה את השרת 👇👇👇
  const runAdminChecks = async () => {
    setAdminLoading(true);
    try {
        const batch = writeBatch(db);
        const now = new Date();
        let processedCount = 0;

        // 1. מביאים את כל המוצרים שעדיין פתוחים
        // הערה: בפרויקט אמיתי עושים את הסינון בתאריך בשאילתה, כאן נעשה בקוד לפשטות
        const productsRef = collection(db, 'products');
        const q = query(productsRef, where('status', '!=', 'EXPIRED')); 
        const querySnapshot = await getDocs(q);

        for (const productDoc of querySnapshot.docs) {
            const data = productDoc.data();
            const deadline = data.deadline ? new Date(data.deadline) : null;
            
            // אם אין דדליין, נניח שהמוצר פג תוקף אחרי 24 שעות מהיצירה (אם יש שדה כזה) או שנדלג
            if (!deadline) continue;

            // בדיקה: האם עבר הזמן? והאם הקבוצה לא מלאה?
            const currentBuyers = data.currentBuyers || 0;
            const targetBuyers = parseFloat(data.targetBuyers || '1000');

            if (now > deadline && currentBuyers < targetBuyers) {
                // מצאנו קבוצה שצריך לסגור ולזכות!
                processedCount++;
                const productId = productDoc.id;

                // א. עדכון סטטוס הקבוצה
                const prodRef = doc(db, 'products', productId);
                batch.update(prodRef, { status: 'EXPIRED' });

                // ב. מציאת כל ההזמנות של הקבוצה הזו
                const ordersRef = collection(db, 'orders');
                const ordersQ = query(ordersRef, where('productId', '==', productId), where('status', '==', 'PAID'));
                const ordersSnapshot = await getDocs(ordersQ);

                for (const orderDoc of ordersSnapshot.docs) {
                    const orderData = orderDoc.data();
                    
                    // ג. זיכוי ההזמנה (שינוי סטטוס)
                    const orderRef = doc(db, 'orders', orderDoc.id);
                    batch.update(orderRef, { status: 'REFUNDED', refundedAt: new Date() });

                    // ד. שליחת מייל ללקוח (דרך תוסף Trigger Email)
                    // אם התקנת את התוסף בפיירבייס, זה ישלח מייל אמיתי.
                    // אם לא, זה פשוט ייצור מסמך בקולקציה וזה בסדר להדגמה.
                    const mailRef = doc(collection(db, 'mail'));
                    batch.set(mailRef, {
                        to: orderData.userEmail,
                        message: {
                            subject: `BuyForce Update: Group Closed & Refunded - ${data.title}`,
                            html: `
                                <p>Hi ${orderData.userName || 'Customer'},</p>
                                <p>The group buying for <strong>${data.title}</strong> has ended.</p>
                                <p>Unfortunately, we didn't reach the target of ${targetBuyers} buyers.</p>
                                <p style="color:red; font-weight:bold;">Your payment of ₪1.00 has been refunded.</p>
                                <p>Thanks, BuyForce Team.</p>
                            `
                        }
                    });
                }
            }
        }

        // ביצוע כל השינויים
        await batch.commit();

        const msg = `System Check Complete.\nProcessed ${processedCount} expired groups.`;
        if (Platform.OS === 'web') alert(msg);
        else Alert.alert("Admin Task", msg);

    } catch (error: any) {
        console.error("Admin check failed:", error);
        Alert.alert("Error", error.message);
    } finally {
        setAdminLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        
        {/* Header - User Info */}
        <View style={styles.header}>
            <View style={styles.avatarContainer}>
                <Image 
                    source={{ uri: user?.photoURL || 'https://cdn-icons-png.flaticon.com/512/149/149071.png' }} 
                    style={styles.avatar} 
                />
                <TouchableOpacity style={styles.editIcon} onPress={() => Alert.alert("Edit Photo", "Gallery access required.")}>
                    <Ionicons name="pencil" size={16} color="#fff" />
                </TouchableOpacity>
            </View>
            <Text style={styles.name}>{user?.displayName || 'BuyForce User'}</Text>
            <Text style={styles.email}>{user?.email || 'user@example.com'}</Text>
            <View style={styles.badge}>
                <Text style={styles.badgeText}>Verified Member</Text>
            </View>
        </View>

        {/* Menu Section */}
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Preferences</Text>
            
            <TouchableOpacity style={styles.menuItem} onPress={() => setModalVisible(true)}>
                <View style={styles.menuItemLeft}>
                    <View style={[styles.iconBox, {backgroundColor: '#E3F2FD'}]}>
                        <Ionicons name="settings-outline" size={22} color="#2196F3" />
                    </View>
                    <Text style={styles.menuItemText}>App Settings</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#ccc" />
            </TouchableOpacity>

            <TouchableOpacity 
                style={styles.menuItem} 
                onPress={() => router.push('/payment-methods')}
            >
                <View style={styles.menuItemLeft}>
                    <View style={[styles.iconBox, {backgroundColor: '#E8F5E9'}]}>
                        <Ionicons name="card-outline" size={22} color="#4CAF50" />
                    </View>
                    <Text style={styles.menuItemText}>Payment Methods</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#ccc" />
            </TouchableOpacity>
        </View>

        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Support</Text>
            
            <TouchableOpacity 
                style={styles.menuItem} 
                onPress={() => router.push('/help')}
            >
                <View style={styles.menuItemLeft}>
                    <View style={[styles.iconBox, {backgroundColor: '#FFF3E0'}]}>
                        <Ionicons name="help-circle-outline" size={22} color="#FF9800" />
                    </View>
                    <Text style={styles.menuItemText}>Help & Support</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#ccc" />
            </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        {/* 👇👇👇 כפתור המנהל הסודי 👇👇👇 */}
        <View style={styles.adminSection}>
            <Text style={styles.adminTitle}>Admin Zone (Demo Only)</Text>
            <TouchableOpacity 
                style={[styles.adminButton, adminLoading && { opacity: 0.6 }]} 
                onPress={runAdminChecks}
                disabled={adminLoading}
            >
                {adminLoading ? (
                    <ActivityIndicator color="#fff" size="small" />
                ) : (
                    <Text style={styles.adminButtonText}>Run Daily System Checks 🔄</Text>
                )}
            </TouchableOpacity>
            <Text style={styles.adminDesc}>
                Closes expired groups, refunds users, and triggers emails.
            </Text>
        </View>

      </ScrollView>

      {/* Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>App Settings</Text>
                    <TouchableOpacity onPress={() => setModalVisible(false)}>
                        <Ionicons name="close" size={24} color="#333" />
                    </TouchableOpacity>
                </View>

                <View style={styles.settingRow}>
                    <View>
                        <Text style={styles.settingLabel}>Push Notifications</Text>
                        <Text style={styles.settingSub}>Get updates on your groups</Text>
                    </View>
                    <Switch 
                        trackColor={{ false: "#767577", true: "#E91E63" }}
                        thumbColor={"#f4f3f4"}
                        onValueChange={() => setIsPushOn(!isPushOn)}
                        value={isPushOn}
                    />
                </View>

                <View style={styles.settingRow}>
                    <View>
                        <Text style={styles.settingLabel}>Email Updates</Text>
                        <Text style={styles.settingSub}>Receive receipts & news</Text>
                    </View>
                    <Switch 
                        trackColor={{ false: "#767577", true: "#E91E63" }}
                        thumbColor={"#f4f3f4"}
                        onValueChange={() => setIsEmailOn(!isEmailOn)}
                        value={isEmailOn}
                    />
                </View>

                <View style={styles.settingRow}>
                    <View>
                        <Text style={styles.settingLabel}>Face ID / Biometric</Text>
                        <Text style={styles.settingSub}>Secure quick login</Text>
                    </View>
                    <Switch 
                        trackColor={{ false: "#767577", true: "#4CAF50" }}
                        thumbColor={"#f4f3f4"}
                        onValueChange={() => setIsFaceIdOn(!isFaceIdOn)}
                        value={isFaceIdOn}
                    />
                </View>

                <TouchableOpacity style={styles.saveButton} onPress={saveSettings}>
                    {saving ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.saveButtonText}>Save Changes</Text>
                    )}
                </TouchableOpacity>
            </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9f9f9' },
  content: { padding: 20 },
  
  header: { alignItems: 'center', marginBottom: 30, marginTop: 20 },
  avatarContainer: { 
    width: 100, height: 100, borderRadius: 50, marginBottom: 15,
    elevation: 5, shadowColor: '#000', shadowOffset: {width:0, height:5}, shadowOpacity: 0.2, shadowRadius: 5
  },
  avatar: { width: 100, height: 100, borderRadius: 50 },
  editIcon: {
      position: 'absolute', bottom: 0, right: 0, backgroundColor: '#E91E63', 
      width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center',
      borderWidth: 2, borderColor: '#fff'
  },
  name: { fontSize: 24, fontWeight: 'bold', color: '#333', marginBottom: 2 },
  email: { fontSize: 14, color: '#666', marginBottom: 10 },
  badge: { backgroundColor: '#E3F2FD', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  badgeText: { color: '#2196F3', fontSize: 12, fontWeight: 'bold' },

  section: { backgroundColor: '#fff', borderRadius: 16, padding: 10, marginBottom: 20, elevation: 1 },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#999', margin: 10, textTransform: 'uppercase' },
  
  menuItem: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', 
    paddingVertical: 12, paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: '#f9f9f9' 
  },
  menuItemLeft: { flexDirection: 'row', alignItems: 'center' },
  iconBox: { width: 36, height: 36, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  menuItemText: { fontSize: 16, color: '#333', fontWeight: '500' },

  logoutButton: { 
    backgroundColor: '#FFEBEE', padding: 15, borderRadius: 12, alignItems: 'center', marginTop: 10,
    ...Platform.select({ web: { cursor: 'pointer' } as any })
  },
  logoutText: { color: '#D32F2F', fontWeight: 'bold', fontSize: 16 },

  // Admin Section Styles
  adminSection: { marginTop: 40, alignItems: 'center', borderTopWidth: 1, borderTopColor: '#ddd', paddingTop: 20 },
  adminTitle: { fontSize: 12, color: '#999', fontWeight: 'bold', marginBottom: 10, textTransform: 'uppercase' },
  adminButton: { 
      backgroundColor: '#333', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 8,
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center'
  },
  adminButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  adminDesc: { color: '#999', fontSize: 10, marginTop: 8, fontStyle: 'italic' },

  // Modal Styles
  modalOverlay: {
      flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end'
  },
  modalContent: {
      backgroundColor: '#fff', borderTopLeftRadius: 25, borderTopRightRadius: 25, padding: 25,
      minHeight: 350
  },
  modalHeader: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30
  },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  settingRow: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25
  },
  settingLabel: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  settingSub: { fontSize: 12, color: '#888', marginTop: 2 },
  saveButton: {
      backgroundColor: '#E91E63', padding: 15, borderRadius: 12, alignItems: 'center', marginTop: 20
  },
  saveButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});