import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack>
      {/* מסך הכניסה */}
      <Stack.Screen name="index" options={{ headerShown: false }} />
      
      {/* 👇 כאן אנחנו מספרים למנהל שיש תיקייה של טאבים */}
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}