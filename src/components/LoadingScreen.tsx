import { View, ActivityIndicator } from 'react-native';

export function LoadingScreen() {
    return (
        <View className="flex-1 items-center justify-center bg-white">
            <ActivityIndicator size="large" color="#0284c7" />
        </View>
    );
} 