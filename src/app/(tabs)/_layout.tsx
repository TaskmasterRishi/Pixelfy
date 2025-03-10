import { Tabs } from "expo-router";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useAuth } from "~/src/providers/AuthProvider";
import { SafeAreaView } from 'react-native-safe-area-context';
import { memo } from 'react';
import Animated, {
    useAnimatedStyle,
    withSpring,
    withTiming,
    withSequence,
    Easing,
} from 'react-native-reanimated';
import SearchPage from './search';

const springConfig = {
    damping: 15,
    mass: 1,
    stiffness: 120,
    overshootClamping: false,
    restDisplacementThreshold: 0.001,
    restSpeedThreshold: 0.001,
};

const timingConfig = {
    duration: 250,
    easing: Easing.bezier(0.4, 0, 0.2, 1),
};

// Enhanced animated icon component with pop and color interpolation
const TabIcon = memo(({ name, color, focused }: { name: string, color: string, focused: boolean }) => (
    <Animated.View style={[
        {
            width: 50,
            height: 35,
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
        },
        useAnimatedStyle(() => ({
            transform: [
                {
                    scale: withSpring(focused ? 1.1 : 1, springConfig)
                },
                {
                    translateY: withSpring(focused ? -2 : 0, springConfig)
                }
            ],
        }))
    ]}>
        <FontAwesome
            name={name}
            size={22}
            color={color}
            style={{
                height: 22,
                width: 22,
                textAlign: 'center',
            }}
        />

        {/* Bottom indicator line */}
        <Animated.View style={[{
            width: 16,
            height: 2,
            borderRadius: 1,
            backgroundColor: '#007AFF',
            position: 'absolute',
            bottom: 0,
        }, useAnimatedStyle(() => ({
            opacity: withTiming(focused ? 1 : 0, timingConfig),
            transform: [
                {
                    scaleX: withSpring(focused ? 1 : 0, {
                        ...springConfig,
                        stiffness: 180,
                    })
                }
            ],
        }))]} />

        {/* Ripple effect on focus */}
        {focused && (
            <Animated.View style={[{
                width: 35,
                height: 35,
                borderRadius: 17.5,
                backgroundColor: '#007AFF15',
                position: 'absolute',
                zIndex: -1,
            }, useAnimatedStyle(() => ({
                transform: [{
                    scale: withSequence(
                        withTiming(1.2, {
                            duration: 200,
                            easing: Easing.bezier(0.2, 0, 0, 1),
                        }),
                        withTiming(1.1, {
                            duration: 150,
                            easing: Easing.bezier(0.4, 0, 0.2, 1),
                        })
                    )
                }],
                opacity: withTiming(focused ? 0.8 : 0, {
                    duration: 150,
                    easing: Easing.bezier(0.4, 0, 0.2, 1),
                }),
            }))]} />
        )}
    </Animated.View>
));

export default function TabLayout() {
    const { isAuthenticated } = useAuth();

    // If not authenticated, let the index.tsx handle the redirect
    if (!isAuthenticated) {
        return null;
    }

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <Tabs
                screenOptions={{
                    tabBarActiveTintColor: "#007AFF",
                    tabBarInactiveTintColor: "#8E8E93",
                    tabBarShowLabel: false,
                    headerShown: false,
                    tabBarStyle: {
                        elevation: 8,
                        height: 48,
                        paddingHorizontal: 10,
                        backgroundColor: '#FFFFFF',
                        borderTopWidth: 0.5,
                        borderTopColor: '#DBDBDB',
                        shadowColor: '#000',
                        shadowOffset: {
                            width: 0,
                            height: -2,
                        },
                        shadowOpacity: 0.08,
                        shadowRadius: 2,
                    }
                }}
            >
                <Tabs.Screen
                    name="search"
                    options={{
                        tabBarIcon: ({ color, focused }) => (
                            <TabIcon name="search" color={color} focused={focused} />
                        )
                    }}
                />

                <Tabs.Screen
                    name="index"
                    options={{
                        tabBarIcon: ({ color, focused }) => (
                            <TabIcon name="home" color={color} focused={focused} />
                        )
                    }}
                />

                <Tabs.Screen
                    name="new"
                    options={{
                        tabBarIcon: ({ color, focused }) => (
                            <TabIcon name="plus-square-o" color={color} focused={focused} />
                        )
                    }}
                />

                <Tabs.Screen
                    name="profile"
                    options={{
                        tabBarIcon: ({ color, focused }) => (
                            <TabIcon name="user" color={color} focused={focused} />
                        )
                    }}
                />

                <Tabs.Screen
                    name="chat"
                    options={{
                        tabBarIcon: ({ color, focused }) => (
                            <TabIcon name="comments-o" color={color} focused={focused} />
                        ),
                        title: "Chat"
                    }}
                />

            </Tabs>
        </SafeAreaView>
    );
}
