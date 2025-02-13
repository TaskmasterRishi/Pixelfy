import { useEffect } from 'react';
import { useRouter } from 'expo-router'; // Import useRouter hook
import { Tabs } from "expo-router";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useAuth } from "~/src/providers/AuthProvider";

export default function TabLayout() {
    const { isAuthenticated } = useAuth();
    const router = useRouter(); // Initialize router

    useEffect(() => {
        if (!isAuthenticated) {
            // Redirect to authentication page if the user is not authenticated
            router.push('/(auth)'); // Use router.push to navigate
        }
    }, [isAuthenticated, router]); // Dependency on isAuthenticated and router

    return (
        <Tabs screenOptions={{
            tabBarActiveTintColor: "blue",
            tabBarShowLabel: false,
            headerShown: false
        }}>
            <Tabs.Screen
                name="index"
                options={{
                    headerTitle: "For you",
                    headerTitleAlign: "center",
                    headerTitleStyle: { fontSize: 17 },
                    tabBarIcon: ({ color }) => <FontAwesome name="home" size={26} color={color} />,
                }}
            />

            <Tabs.Screen
                name="new"
                options={{
                    headerTitle: "Create Post",
                    headerTitleAlign: "center",
                    headerTitleStyle: { fontSize: 17 },
                    tabBarIcon: ({ color }) => <FontAwesome name="plus-square-o" size={26} color={color} />,
                }}
            />

            <Tabs.Screen
                name="profile"
                options={{
                    headerTitle: "Profile",
                    headerTitleAlign: "center",
                    headerTitleStyle: { fontSize: 17 },
                    tabBarIcon: ({ color }) => <FontAwesome name="user" size={26} color={color} />,
                }}
            />
        </Tabs>
    );
}
