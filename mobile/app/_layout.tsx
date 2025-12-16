import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* מסך ההתחברות (הראשי) - בלי כותרת */}
      <Stack.Screen name="index" />
      
      {/* הטאבים הפנימיים - בלי כותרת נוספת מעליהם */}
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}