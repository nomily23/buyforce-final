import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ 
          headerBackTitle: '', // ✅ התיקון: פשוט משאירים את הטקסט ריק וזה מעלים אותו
          headerTintColor: '#333',       
          headerTitleStyle: { fontWeight: 'bold' }
      }}>
        
        {/* 1. מסכי כניסה והרשמה */}
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="register" options={{ headerShown: false }} />
        
        {/* 2. הטאבים הראשיים */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

        {/* 3. מסכים פנימיים */}
        <Stack.Screen name="product-details" options={{ headerShown: false }} />

        {/* דף תשלום - כחלון קופץ */}
        <Stack.Screen 
            name="payment" 
            options={{ 
                presentation: 'modal', 
                headerShown: false 
            }} 
        />

        {/* דפי הגדרות ועזרה */}
        <Stack.Screen name="payment-methods" options={{ title: 'Payment Methods' }} />
        <Stack.Screen name="help" options={{ title: 'Help & Support' }} />

      </Stack>
    </>
  );
}