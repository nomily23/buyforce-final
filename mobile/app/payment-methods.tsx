import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, FlatList, SafeAreaView, Alert, Modal, TextInput } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';

export default function PaymentMethodsScreen() {
  const router = useRouter();
  const [modalVisible, setModalVisible] = useState(false);
  
  // נתונים מדומים של כרטיסים
  const [cards, setCards] = useState([
    { id: '1', type: 'visa', last4: '4242', exp: '12/26', holder: 'NOMILY DANIELY' },
    { id: '2', type: 'mastercard', last4: '8899', exp: '09/25', holder: 'NOMILY DANIELY' },
  ]);

  const handleDelete = (id: string) => {
    Alert.alert("Remove Card", "Are you sure?", [
        { text: "Cancel" },
        { text: "Remove", style: 'destructive', onPress: () => setCards(cards.filter(c => c.id !== id)) }
    ]);
  };

  const handleAddCard = () => {
      // הוספה מדומה של כרטיס
      setModalVisible(false);
      const newCard = { 
          id: Math.random().toString(), 
          type: 'visa', 
          last4: Math.floor(1000 + Math.random() * 9000).toString(), 
          exp: '01/28', 
          holder: 'NOMILY DANIELY' 
      };
      setCards([...cards, newCard]);
      Alert.alert("Success", "New card added successfully!");
  };

  const renderCard = ({ item }: { item: any }) => (
    <View style={[styles.cardContainer, item.type === 'visa' ? styles.visaBg : styles.masterBg]}>
        <View style={styles.cardHeader}>
            <FontAwesome5 name={item.type === 'visa' ? "cc-visa" : "cc-mastercard"} size={30} color="#fff" />
            <TouchableOpacity onPress={() => handleDelete(item.id)}>
                <Ionicons name="trash-outline" size={20} color="rgba(255,255,255,0.7)" />
            </TouchableOpacity>
        </View>
        <Text style={styles.cardNumber}>•••• •••• •••• {item.last4}</Text>
        <View style={styles.cardFooter}>
            <View>
                <Text style={styles.cardLabel}>Card Holder</Text>
                <Text style={styles.cardValue}>{item.holder}</Text>
            </View>
            <View>
                <Text style={styles.cardLabel}>Expires</Text>
                <Text style={styles.cardValue}>{item.exp}</Text>
            </View>
        </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Payment Methods</Text>
      </View>

      <View style={styles.content}>
        <FlatList
            data={cards}
            keyExtractor={item => item.id}
            renderItem={renderCard}
            contentContainerStyle={{ paddingBottom: 100 }}
            ListEmptyComponent={<Text style={styles.emptyText}>No cards saved.</Text>}
        />
      </View>

      <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
          <Ionicons name="add" size={24} color="#fff" />
          <Text style={styles.addButtonText}>Add New Card</Text>
      </TouchableOpacity>

      {/* מודל להוספת כרטיס (פשוט לרושם) */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
          <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                  <Text style={styles.modalTitle}>Add New Card</Text>
                  <TextInput placeholder="Card Number" style={styles.input} keyboardType="numeric" />
                  <View style={{flexDirection: 'row', gap: 10}}>
                      <TextInput placeholder="MM/YY" style={[styles.input, {flex: 1}]} />
                      <TextInput placeholder="CVV" style={[styles.input, {flex: 1}]} keyboardType="numeric" />
                  </View>
                  <TouchableOpacity style={styles.saveBtn} onPress={handleAddCard}>
                      <Text style={{color: '#fff', fontWeight: 'bold'}}>Save Card</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                      <Text style={{color: '#666'}}>Cancel</Text>
                  </TouchableOpacity>
              </View>
          </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9f9f9' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 50, backgroundColor: '#fff' },
  backBtn: { marginRight: 15 },
  title: { fontSize: 20, fontWeight: 'bold' },
  content: { padding: 20, flex: 1 },
  
  cardContainer: { borderRadius: 15, padding: 20, marginBottom: 15, height: 180, justifyContent: 'space-between', elevation: 5 },
  visaBg: { backgroundColor: '#1A237E' },
  masterBg: { backgroundColor: '#263238' },
  
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardNumber: { color: '#fff', fontSize: 22, letterSpacing: 2, marginTop: 10 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  cardLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 10, textTransform: 'uppercase' },
  cardValue: { color: '#fff', fontSize: 14, fontWeight: 'bold' },

  addButton: { 
      position: 'absolute', bottom: 30, right: 20, left: 20, 
      backgroundColor: '#E91E63', padding: 15, borderRadius: 30, 
      flexDirection: 'row', justifyContent: 'center', alignItems: 'center', elevation: 5 
  },
  addButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginLeft: 10 },
  emptyText: { textAlign: 'center', marginTop: 50, color: '#999' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#fff', padding: 20, borderRadius: 15 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
  input: { backgroundColor: '#f0f0f0', padding: 12, borderRadius: 8, marginBottom: 10 },
  saveBtn: { backgroundColor: '#E91E63', padding: 12, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  cancelBtn: { padding: 12, alignItems: 'center', marginTop: 5 }
});