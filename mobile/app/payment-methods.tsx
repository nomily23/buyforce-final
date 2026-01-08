import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, FlatList, SafeAreaView, Alert, Modal, TextInput, Image } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Ionicons, FontAwesome5, MaterialIcons } from '@expo/vector-icons';

export default function PaymentMethodsScreen() {
  const router = useRouter();
  const [modalVisible, setModalVisible] = useState(false);
  
  const [cards, setCards] = useState([
    { id: '1', type: 'visa', last4: '4242', exp: '12/26', holder: 'NOMILY DANIELY', isDefault: true },
    { id: '2', type: 'mastercard', last4: '8899', exp: '09/25', holder: 'NOMILY DANIELY', isDefault: false },
  ]);

  const handleSetDefault = (id: string) => {
      const updatedCards = cards.map(card => ({
          ...card,
          isDefault: card.id === id 
      }));
      setCards(updatedCards);
  };

  const handleDelete = (id: string) => {
    Alert.alert("Remove Card", "Are you sure you want to remove this payment method?", [
        { text: "Cancel" },
        { text: "Remove", style: 'destructive', onPress: () => setCards(cards.filter(c => c.id !== id)) }
    ]);
  };

  const handleAddCard = () => {
      setModalVisible(false);
      const newCard = { 
          id: Math.random().toString(), 
          type: Math.random() > 0.5 ? 'visa' : 'mastercard', 
          last4: Math.floor(1000 + Math.random() * 9000).toString(), 
          exp: '01/28', 
          holder: 'NOMILY DANIELY',
          isDefault: cards.length === 0 
      };
      setCards([...cards, newCard]);
      Alert.alert("Success", "Card added securely via Tranzilla.");
  };

  const renderCard = ({ item }: { item: any }) => (
    <TouchableOpacity 
        activeOpacity={0.9} 
        onPress={() => handleSetDefault(item.id)}
        style={[styles.cardContainer, item.type === 'visa' ? styles.visaBg : styles.masterBg, item.isDefault && styles.defaultBorder]}
    >
        <View style={styles.cardHeader}>
            <FontAwesome5 name={item.type === 'visa' ? "cc-visa" : "cc-mastercard"} size={30} color="#fff" />
            
            <TouchableOpacity onPress={() => handleDelete(item.id)} style={{padding: 5}}>
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

        {item.isDefault ? (
            <View style={styles.defaultBadge}>
                <Ionicons name="checkmark-circle" size={14} color="#E91E63" />
                <Text style={styles.defaultText}>Default</Text>
            </View>
        ) : (
            <Text style={styles.tapToDefault}>Tap to make default</Text>
        )}
    </TouchableOpacity>
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
        <MaterialIcons name="security" size={20} color="#4CAF50" style={{marginLeft: 'auto'}} />
      </View>

      <View style={styles.content}>
        <Text style={styles.subtitle}>Manage your cards for secure group buying.</Text>
        
        <FlatList
            data={cards}
            keyExtractor={item => item.id}
            renderItem={renderCard}
            contentContainerStyle={{ paddingBottom: 100 }}
            ListEmptyComponent={<Text style={styles.emptyText}>No payment methods saved.</Text>}
        />
      </View>

      <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
          <Ionicons name="add" size={24} color="#fff" />
          <Text style={styles.addButtonText}>Add New Card</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" transparent={true} onRequestClose={() => setModalVisible(false)}>
          <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                  <View style={styles.modalHeader}>
                      <Text style={styles.modalTitle}>Add Secured Card</Text>
                      <MaterialIcons name="lock" size={18} color="#666" />
                  </View>
                  
                  <Text style={styles.modalSub}>Processed securely by Tranzilla</Text>

                  <TextInput placeholder="Card Number" placeholderTextColor="#999" style={styles.input} keyboardType="numeric" maxLength={16} />
                  
                  <View style={{flexDirection: 'row', gap: 10}}>
                      <TextInput placeholder="MM/YY" placeholderTextColor="#999" style={[styles.input, {flex: 1}]} maxLength={5} />
                      <TextInput placeholder="CVV" placeholderTextColor="#999" style={[styles.input, {flex: 1}]} keyboardType="numeric" maxLength={3} secureTextEntry />
                  </View>
                  
                  <TextInput placeholder="Card Holder Name" placeholderTextColor="#999" style={styles.input} />

                  <TouchableOpacity style={styles.saveBtn} onPress={handleAddCard}>
                      <Text style={{color: '#fff', fontWeight: 'bold', fontSize: 16}}>Save Card</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                      <Text style={{color: '#666', fontWeight: '600'}}>Cancel</Text>
                  </TouchableOpacity>
              </View>
          </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9f9f9' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 50, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  backBtn: { marginRight: 15 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  subtitle: { fontSize: 14, color: '#666', marginBottom: 15 },
  content: { padding: 20, flex: 1 },
  
  cardContainer: { borderRadius: 15, padding: 20, marginBottom: 15, height: 200, justifyContent: 'space-between', elevation: 5, shadowColor: '#000', shadowOffset: {width:0, height:4}, shadowOpacity: 0.2, shadowRadius: 5 },
  visaBg: { backgroundColor: '#1A237E' },
  masterBg: { backgroundColor: '#263238' },
  defaultBorder: { borderWidth: 2, borderColor: '#4CAF50' }, // מסגרת ירוקה לכרטיס ברירת מחדל
  
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardNumber: { color: '#fff', fontSize: 22, letterSpacing: 2, fontFamily: 'Courier' }, // פונט מונוספייס למספרים
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  cardLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 10, textTransform: 'uppercase', marginBottom: 2 },
  cardValue: { color: '#fff', fontSize: 14, fontWeight: 'bold' },

  defaultBadge: { 
      position: 'absolute', top: 15, right: 50, 
      backgroundColor: '#fff', paddingHorizontal: 8, paddingVertical: 4, 
      borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 4 
  },
  defaultText: { color: '#E91E63', fontWeight: 'bold', fontSize: 10 },
  tapToDefault: { position: 'absolute', top: 20, right: 50, color: 'rgba(255,255,255,0.5)', fontSize: 10 },

  addButton: { 
      position: 'absolute', bottom: 30, right: 20, left: 20, 
      backgroundColor: '#E91E63', padding: 15, borderRadius: 30, 
      flexDirection: 'row', justifyContent: 'center', alignItems: 'center', 
      elevation: 5, shadowColor: '#E91E63', shadowOffset: {width:0, height:4}, shadowOpacity: 0.3 
  },
  addButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginLeft: 10 },
  emptyText: { textAlign: 'center', marginTop: 50, color: '#999' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#fff', padding: 25, borderRadius: 20, elevation: 10 },
  modalHeader: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, marginBottom: 5 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  modalSub: { textAlign: 'center', color: '#888', fontSize: 12, marginBottom: 20 },
  
  input: { backgroundColor: '#f5f5f5', padding: 15, borderRadius: 12, marginBottom: 15, fontSize: 16, borderWidth: 1, borderColor: '#eee' },
  saveBtn: { backgroundColor: '#E91E63', padding: 15, borderRadius: 12, alignItems: 'center', marginTop: 10, shadowColor: '#E91E63', shadowOpacity: 0.2, shadowOffset: {width:0, height:2} },
  cancelBtn: { padding: 15, alignItems: 'center', marginTop: 5 }
});