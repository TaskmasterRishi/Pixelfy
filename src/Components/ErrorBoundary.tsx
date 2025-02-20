import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

interface Props {
    children: React.ReactNode;
}

interface State {
    hasError: boolean;
}

export class ErrorBoundary extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(_: Error): State {
        return { hasError: true };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('Error:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <View className="flex-1 items-center justify-center p-4">
                    <Text className="text-xl font-bold mb-4">Something went wrong</Text>
                    <TouchableOpacity 
                        onPress={() => this.setState({ hasError: false })}
                        className="bg-blue-500 px-4 py-2 rounded-lg"
                    >
                        <Text className="text-white font-bold">Try Again</Text>
                    </TouchableOpacity>
                </View>
            );
        }

        return this.props.children;
    }
} 