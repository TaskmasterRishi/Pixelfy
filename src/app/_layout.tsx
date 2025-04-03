import { Stack } from "expo-router";
import { LogBox } from "react-native";
import "../../global.css";
import AuthProvider from "../providers/AuthProvider";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useEffect } from 'react';
import { PermissionsAndroid, Platform } from 'react-native';

// Optionally suppress specific warnings
LogBox.ignoreLogs([
  "You are not currently signed in to Expo on your development machine",
]);

export default function RootLayout() {
  useEffect(() => {
    const run = async () => {
      if (Platform.OS === 'android') {
        await PermissionsAndroid.requestMultiple([
          'android.permission.POST_NOTIFICATIONS',
          'android.permission.BLUETOOTH_CONNECT',
        ]);
      }
    };
    run();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <StatusBar style="dark" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: "white" },
              animation: "slide_from_right", // Add animation for smoother transitions
            }}
          >
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen
              name="(screens)"
              options={{
                presentation: "modal",
              }}
            />
            <Stack.Screen name="notification" />
            <Stack.Screen name="help" />
          </Stack>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
