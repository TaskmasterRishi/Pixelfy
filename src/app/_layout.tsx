import { Stack } from "expo-router";
import { LogBox } from "react-native";
import "../../global.css";
import AuthProvider from "../providers/AuthProvider";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Optionally suppress specific warnings
LogBox.ignoreLogs([
  "You are not currently signed in to Expo on your development machine",
]);

export default function RootLayout() {
    return (
        <SafeAreaProvider>
            <AuthProvider>
                <StatusBar style="dark" />
                <Stack 
                    screenOptions={{ 
                        headerShown: false,
                        contentStyle: { backgroundColor: 'white' },
                        animation: 'slide_from_right' // Add animation for smoother transitions
                    }}
                >
                    <Stack.Screen name="(auth)" />
                    <Stack.Screen name="(tabs)" />
                    <Stack.Screen 
                        name="(screens)" 
                        options={{ 
                            presentation: 'modal'
                        }} 
                    />
                    <Stack.Screen name="notification" />
                </Stack>
            </AuthProvider>
        </SafeAreaProvider>
    );
}