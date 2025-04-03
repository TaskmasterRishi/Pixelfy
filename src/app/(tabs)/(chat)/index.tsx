import { View, Text, StyleSheet } from 'react-native';

export default function ChatIndex() {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Chat</Text>
            <Text style={styles.subtitle}>Start a conversation!</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#fff',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
    },
});
