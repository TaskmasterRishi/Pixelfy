import { Stack } from "expo-router";
import "../../global.css";
import AuthProvider from "../providers/AuthProvider";

export default function RootLayout() {
    return (
        <AuthProvider>
            <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen 
                    name="(screens)" 
                    options={{ 
                        headerShown: false,
                        presentation: 'modal'
                    }} 
                />
            </Stack>
        </AuthProvider>
    );
}