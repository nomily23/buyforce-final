import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ 
          headerBackTitle: '', 
          headerTintColor: '#333',       
          headerTitleStyle: { fontWeight: 'bold' }
      }}>
        
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="register" options={{ headerShown: false }} />
        
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

        <Stack.Screen name="product-details" options={{ headerShown: false }} />

        <Stack.Screen 
            name="payment" 
            options={{ 
                presentation: 'modal', 
                headerShown: false 
            }} 
        />

        <Stack.Screen name="payment-methods" options={{ title: 'Payment Methods' }} />
        <Stack.Screen name="help" options={{ title: 'Help & Support' }} />

      </Stack>
    </>
  );
}