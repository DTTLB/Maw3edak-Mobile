import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="patient-login" />
      <Stack.Screen name="patient-register" />
      {/* Forced password change: no swipe-back so the patient can't slip past
          the gate. The only exits are changing the password or logging out. */}
      <Stack.Screen name="change-password" options={{ gestureEnabled: false }} />
    </Stack>
  );
}
