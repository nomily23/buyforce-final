import React, { useState, useEffect } from 'react';
import { TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from '../firebaseConfig'; 
import { doc, setDoc, deleteDoc, onSnapshot } from 'firebase/firestore';

export default function HeartButton({ product }: { product: any }) {
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user || !product?.id) return;

    const wishlistRef = doc(db, 'users', user.uid, 'wishlist', String(product.id));

    const unsubscribe = onSnapshot(wishlistRef, (docSnap) => {
      setIsLiked(docSnap.exists());
    });

    return () => unsubscribe();
  }, [product.id]);

  const toggleLike = async () => {
    const user = auth.currentUser;
    
    if (!user) {
      Alert.alert("Login Required", "Please log in to save products to your wishlist.");
      return;
    }

    const wishlistRef = doc(db, 'users', user.uid, 'wishlist', String(product.id));

    try {
      if (isLiked) {
        await deleteDoc(wishlistRef);
      } else {
        await setDoc(wishlistRef, product);
      }
    } catch (error) {
      console.log("Error updating wishlist:", error);
    }
  };

  return (
    <TouchableOpacity onPress={toggleLike} style={{ padding: 5 }}>
      <Ionicons 
        name={isLiked ? "heart" : "heart-outline"} 
        size={28} 
        color={isLiked ? "#E91E63" : "#888"} 
      />
    </TouchableOpacity>
  );
}