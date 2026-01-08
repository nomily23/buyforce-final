import React, { useState } from 'react';
import { 
  StyleSheet, View, Text, TouchableOpacity, Image, Alert, 
  SafeAreaView, ScrollView, Modal, Switch, ActivityIndicator, Platform, TextInput 
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from '../../firebaseConfig';
import { signOut, updateProfile } from 'firebase/auth'; 
import { collection, getDocs, query, where, writeBatch, doc, updateDoc } from 'firebase/firestore';

// --- מילון תרגומים (עברית / אנגלית) ---
const translations = {
  en: {
    verified: "Verified Member",
    preferences: "PREFERENCES",
    appSettings: "App Settings",
    paymentMethods: "Payment Methods",
    support: "SUPPORT",
    helpSupport: "Help & Support",
    logOut: "Log Out",
    adminZone: "ADMIN ZONE (DEMO ONLY)",
    runChecks: "Run Daily System Checks 🔄",
    adminDesc: "Closes expired groups, refunds users, and triggers emails.",
    // Modal
    modalTitle: "App Settings",
    langSection: "Language / שפה",
    pushTitle: "Push Notifications",
    pushSub: "Get updates on your groups",
    emailTitle: "Email Updates",
    emailSub: "Receive receipts & news",
    faceIdTitle: "Face ID / Biometric",
    faceIdSub: "Secure quick login",
    saveChanges: "Save Changes",
    // Name Edit
    editNameTitle: "Edit Name",
    enterName: "Enter full name",
    cancel: "Cancel",
    save: "Save"
  },
  he: {
    verified: "חבר מאומת",
    preferences: "העדפות",
    appSettings: "הגדרות אפליקציה",
    paymentMethods: "אמצעי תשלום",
    support: "תמיכה",
    helpSupport: "עזרה ותמיכה",
    logOut: "התנתק",
    adminZone: "אזור ניהול (דמו)",
    runChecks: "הרץ בדיקות מערכת 🔄",
    adminDesc: "סגירת קבוצות, ביצוע זיכויים ושליחת הודעות.",
    // Modal
    modalTitle: "הגדרות",
    langSection: "שפה / Language",
    pushTitle: "התראות דחיפה",
    pushSub: "קבל עדכונים על הקבוצות שלך",
    emailTitle: "עדכונים במייל",
    emailSub: "קבלות וחדשות חשובות",
    faceIdTitle: "זיהוי פנים / ביומטרי",
    faceIdSub: "כניסה מהירה ומאובטחת",
    saveChanges: "שמור שינויים",
    // Name Edit
    editNameTitle: "עריכת שם",
    enterName: "הכנס שם מלא",
    cancel: "ביטול",
    save: "שמור"
  }
};

export default function ProfileScreen() {
  const router = useRouter();
  const user = auth.currentUser;

  // --- משתנים לניהול המשתמש והתצוגה ---
  const [userData, setUserData] = useState({
    displayName: user?.displayName || 'BuyForce User',
    email: user?.email || 'user@example.com',
    photoURL: user?.photoURL || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'
  });

  // --- משתנים לעריכת שם ---
  const [isNameModalVisible, setNameModalVisible] = useState(false);
  const [newFullName, setNewFullName] = useState("");
  const [isSavingName, setIsSavingName] = useState(false);

  // --- משתנים לחלון ההגדרות ---
  const [modalVisible, setModalVisible] = useState(false);
  const [isPushOn, setIsPushOn] = useState(true);
  const [isEmailOn, setIsEmailOn] = useState(true);
  const [isFaceIdOn, setIsFaceIdOn] = useState(true); // החזרנו את זה!
  const [appLanguage, setAppLanguage] = useState<"en" | "he">("en"); // ברירת מחדל אנגלית
  const [saving, setSaving] = useState(false);
  
  const [adminLoading, setAdminLoading] = useState(false);

  // שימוש בטקסטים לפי השפה הנבחרת
  const t = translations[appLanguage];

  // --- לוגיקה ליציאה מהחשבון ---
  const handleLogout = async () => {
    const performLogout = async () => {
        try {
            await signOut(auth);
            router.replace('/login'); 
        } catch (error) {
            console.error(error);
            Alert.alert("Error", "Failed to log out");
        }
    };

    if (Platform.OS === 'web') {
        if (window.confirm("Are you sure you want to log out?")) {
            await performLogout();
        }
    } else {
        Alert.alert(
            "Sign Out", "Are you sure you want to log out?",
            [
              { text: "Cancel", style: "cancel" },
              { text: "Yes, Log Out", style: 'destructive', onPress: performLogout }
            ]
        );
    }
  };

  // --- לוגיקה לעריכת שם ---
  const openNameEdit = () => {
    setNewFullName(userData.displayName);
    setNameModalVisible(true);
  };

  const handleSaveName = async () => {
    if (!user || !newFullName.trim()) return;
    setIsSavingName(true);
    
    try {
      await updateProfile(user, { displayName: newFullName });
      const userRef = doc(db, 'users', user.uid);
      try { await updateDoc(userRef, { full_name: newFullName }); } catch (e) {}

      setUserData(prev => ({ ...prev, displayName: newFullName }));
      setNameModalVisible(false);
      Alert.alert("Success", "Name updated successfully!");
    } catch (error) {
      console.error("Error updating name:", error);
      Alert.alert("Error", "Could not update name.");
    } finally {
      setIsSavingName(false);
    }
  };

  // --- לוגיקה לשמירת הגדרות ---
  const saveSettings = () => {
      setSaving(true);
      setTimeout(() => {
          setSaving(false);
          setModalVisible(false);
          // כאן השפה "נתפסת" והמסך יתעדכן כי ה-State השתנה
          const msg = appLanguage === 'he' ? "הגדרות נשמרו בהצלחה" : "Settings Saved";
          if (Platform.OS === 'web') alert(msg);
          else Alert.alert("Success", msg);
      }, 800);
  };

  // --- לוגיקה של כפתור המנהל (שרת) ---
  const runAdminChecks = async () => {
    setAdminLoading(true);
    try {
        const batch = writeBatch(db);
        const now = new Date();
        let processedCount = 0;

        const productsRef = collection(db, 'products');
        const q = query(productsRef, where('status', '!=', 'EXPIRED')); 
        const querySnapshot = await getDocs(q);

        for (const productDoc of querySnapshot.docs) {
            const data = productDoc.data();
            const deadline = data.deadline ? new Date(data.deadline) : null;
            if (!deadline) continue;

            const currentBuyers = data.currentBuyers || 0;
            const targetBuyers = parseFloat(data.targetBuyers || '1000');

            if (now > deadline && currentBuyers < targetBuyers) {
                processedCount++;
                const productId = productDoc.id;
                const prodRef = doc(db, 'products', productId);
                batch.update(prodRef, { status: 'EXPIRED' });

                const ordersRef = collection(db, 'orders');
                const ordersQ = query(ordersRef, where('productId', '==', productId), where('status', '==', 'PAID'));
                const ordersSnapshot = await getDocs(ordersQ);

                for (const orderDoc of ordersSnapshot.docs) {
                    const orderData = orderDoc.data();
                    const orderRef = doc(db, 'orders', orderDoc.id);
                    batch.update(orderRef, { status: 'REFUNDED', refundedAt: new Date() });

                    const mailRef = doc(collection(db, 'mail'));
                    batch.set(mailRef, {
                        to: orderData.userEmail,
                        message: {
                            subject: `BuyForce Update: Group Closed & Refunded - ${data.title}`,
                            html: `<p>The group buying for <strong>${data.title}</strong> has ended. Refund issued.</p>`
                        }
                    });
                }
            }
        }
        await batch.commit();
        const msg = `System Check Complete.\nProcessed ${processedCount} expired groups.`;
        Alert.alert("Admin Task", msg);

    } catch (error: any) {
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
                <Image source={{ uri: userData.photoURL }} style={styles.avatar} />
                <TouchableOpacity style={styles.editIcon} onPress={openNameEdit}>
                    <Ionicons name="pencil" size={16} color="#fff" />
                </TouchableOpacity>
            </View>
            <Text style={styles.name}>{userData.displayName}</Text>
            <Text style={styles.email}>{userData.email}</Text>
            <View style={styles.badge}>
                <Text style={styles.badgeText}>{t.verified}</Text>
            </View>
        </View>

        {/* Menu Section */}
        <View style={styles.section}>
            <Text style={[styles.sectionTitle, appLanguage === 'he' && {textAlign: 'right'}]}>{t.preferences}</Text>
            
            <TouchableOpacity style={[styles.menuItem, appLanguage === 'he' && {flexDirection: 'row-reverse'}]} onPress={() => setModalVisible(true)}>
                <View style={[styles.menuItemLeft, appLanguage === 'he' && {flexDirection: 'row-reverse'}]}>
                    <View style={[styles.iconBox, {backgroundColor: '#E3F2FD', marginRight: appLanguage==='he'?0:15, marginLeft: appLanguage==='he'?15:0}]}>
                        <Ionicons name="settings-outline" size={22} color="#2196F3" />
                    </View>
                    <Text style={styles.menuItemText}>{t.appSettings}</Text>
                </View>
                <Ionicons name={appLanguage==='he' ? "chevron-back" : "chevron-forward"} size={20} color="#ccc" />
            </TouchableOpacity>

            <TouchableOpacity style={[styles.menuItem, appLanguage === 'he' && {flexDirection: 'row-reverse'}]} onPress={() => router.push('/payment-methods')}>
                <View style={[styles.menuItemLeft, appLanguage === 'he' && {flexDirection: 'row-reverse'}]}>
                    <View style={[styles.iconBox, {backgroundColor: '#E8F5E9', marginRight: appLanguage==='he'?0:15, marginLeft: appLanguage==='he'?15:0}]}>
                        <Ionicons name="card-outline" size={22} color="#4CAF50" />
                    </View>
                    <Text style={styles.menuItemText}>{t.paymentMethods}</Text>
                </View>
                <Ionicons name={appLanguage==='he' ? "chevron-back" : "chevron-forward"} size={20} color="#ccc" />
            </TouchableOpacity>
        </View>

        <View style={styles.section}>
            <Text style={[styles.sectionTitle, appLanguage === 'he' && {textAlign: 'right'}]}>{t.support}</Text>
            <TouchableOpacity style={[styles.menuItem, appLanguage === 'he' && {flexDirection: 'row-reverse'}]} onPress={() => router.push('/help')}>
                <View style={[styles.menuItemLeft, appLanguage === 'he' && {flexDirection: 'row-reverse'}]}>
                    <View style={[styles.iconBox, {backgroundColor: '#FFF3E0', marginRight: appLanguage==='he'?0:15, marginLeft: appLanguage==='he'?15:0}]}>
                        <Ionicons name="help-circle-outline" size={22} color="#FF9800" />
                    </View>
                    <Text style={styles.menuItemText}>{t.helpSupport}</Text>
                </View>
                <Ionicons name={appLanguage==='he' ? "chevron-back" : "chevron-forward"} size={20} color="#ccc" />
            </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutText}>{t.logOut}</Text>
        </TouchableOpacity>

        {/* Admin Zone */}
        <View style={styles.adminSection}>
            <Text style={styles.adminTitle}>{t.adminZone}</Text>
            <TouchableOpacity 
                style={[styles.adminButton, adminLoading && { opacity: 0.6 }]} 
                onPress={runAdminChecks}
                disabled={adminLoading}
            >
                {adminLoading ? (
                    <ActivityIndicator color="#fff" size="small" />
                ) : (
                    <Text style={styles.adminButtonText}>{t.runChecks}</Text>
                )}
            </TouchableOpacity>
            <Text style={styles.adminDesc}>{t.adminDesc}</Text>
        </View>

      </ScrollView>

      {/* --- חלון עריכת שם (Modal) --- */}
      <Modal
        visible={isNameModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setNameModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, {minHeight: 250, justifyContent: 'center'}]}>
            <Text style={[styles.modalTitle, {textAlign: 'center'}]}>{t.editNameTitle}</Text>
            <TextInput
              style={[styles.input, {textAlign: appLanguage==='he'?'right':'left'}]}
              value={newFullName}
              onChangeText={setNewFullName}
              placeholder={t.enterName}
            />
            <View style={styles.modalButtonsRow}>
              <TouchableOpacity onPress={() => setNameModalVisible(false)} style={styles.cancelButton}>
                <Text style={styles.buttonText}>{t.cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSaveName} style={styles.saveActionBtn}>
                {isSavingName ? <ActivityIndicator color="#FFF"/> : <Text style={[styles.buttonText, {color: '#FFF'}]}>{t.save}</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* --- חלון הגדרות (Modal) --- */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
                <View style={[styles.modalHeader, appLanguage === 'he' && {flexDirection: 'row-reverse'}]}>
                    <Text style={styles.modalTitle}>{t.modalTitle}</Text>
                    <TouchableOpacity onPress={() => setModalVisible(false)}>
                        <Ionicons name="close" size={24} color="#333" />
                    </TouchableOpacity>
                </View>

                {/* בחירת שפה */}
                <Text style={[styles.sectionHeader, appLanguage==='he' && {textAlign: 'right'}]}>{t.langSection}</Text>
                <View style={[styles.row, appLanguage === 'he' && {flexDirection: 'row-reverse'}]}>
                  <TouchableOpacity 
                    onPress={() => setAppLanguage('he')}
                    style={[styles.langButton, appLanguage === 'he' && styles.activeLang]}
                  >
                    <Text style={{fontWeight: appLanguage==='he'?'bold':'normal'}}>עברית 🇮🇱</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    onPress={() => setAppLanguage('en')}
                    style={[styles.langButton, appLanguage === 'en' && styles.activeLang]}
                  >
                    <Text style={{fontWeight: appLanguage==='en'?'bold':'normal'}}>English 🇺🇸</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.divider} />

                {/* הגדרות */}
                <View style={[styles.settingRow, appLanguage === 'he' && {flexDirection: 'row-reverse'}]}>
                    <View style={appLanguage === 'he' && {alignItems: 'flex-end'}}>
                        <Text style={styles.settingLabel}>{t.pushTitle}</Text>
                        <Text style={styles.settingSub}>{t.pushSub}</Text>
                    </View>
                    <Switch 
                        trackColor={{ false: "#767577", true: "#E91E63" }}
                        thumbColor={"#f4f3f4"}
                        onValueChange={() => setIsPushOn(!isPushOn)}
                        value={isPushOn}
                    />
                </View>

                <View style={[styles.settingRow, appLanguage === 'he' && {flexDirection: 'row-reverse'}]}>
                    <View style={appLanguage === 'he' && {alignItems: 'flex-end'}}>
                        <Text style={styles.settingLabel}>{t.emailTitle}</Text>
                        <Text style={styles.settingSub}>{t.emailSub}</Text>
                    </View>
                    <Switch 
                        trackColor={{ false: "#767577", true: "#E91E63" }}
                        thumbColor={"#f4f3f4"}
                        onValueChange={() => setIsEmailOn(!isEmailOn)}
                        value={isEmailOn}
                    />
                </View>

                {/* 👇 הוספנו בחזרה את זיהוי הפנים! 👇 */}
                <View style={[styles.settingRow, appLanguage === 'he' && {flexDirection: 'row-reverse'}]}>
                    <View style={appLanguage === 'he' && {alignItems: 'flex-end'}}>
                        <Text style={styles.settingLabel}>{t.faceIdTitle}</Text>
                        <Text style={styles.settingSub}>{t.faceIdSub}</Text>
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
                        <Text style={styles.saveButtonText}>{t.saveChanges}</Text>
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
  iconBox: { width: 36, height: 36, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
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
  adminDesc: { color: '#999', fontSize: 10, marginTop: 8, fontStyle: 'italic', textAlign: 'center' },

  // Modal Styles
  modalOverlay: {
      flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end'
  },
  modalContent: {
      backgroundColor: '#fff', borderTopLeftRadius: 25, borderTopRightRadius: 25, padding: 25,
      minHeight: 350
  },
  modalHeader: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20
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
  saveButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },

  // New Styles
  input: {
    borderWidth: 1, borderColor: '#DDD', borderRadius: 10, padding: 12,
    marginBottom: 20, fontSize: 16, backgroundColor: '#FAFAFA'
  },
  modalButtonsRow: {
    flexDirection: 'row', justifyContent: 'space-between', gap: 10
  },
  cancelButton: {
    backgroundColor: '#EEE', padding: 12, borderRadius: 10, flex: 1, alignItems: 'center'
  },
  saveActionBtn: {
    backgroundColor: '#E91E63', padding: 12, borderRadius: 10, flex: 1, alignItems: 'center'
  },
  buttonText: { fontWeight: 'bold', fontSize: 16 },
  
  // Language Styles
  sectionHeader: { fontSize: 14, fontWeight: '600', color: '#555', marginBottom: 10 },
  row: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  langButton: {
    flex: 1, padding: 10, borderWidth: 1, borderColor: '#DDD', borderRadius: 8, alignItems: 'center'
  },
  activeLang: { backgroundColor: '#E3F2FD', borderColor: '#2196F3' },
  divider: { height: 1, backgroundColor: '#EEE', marginVertical: 15 },
});