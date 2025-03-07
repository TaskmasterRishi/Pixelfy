import { Stack } from "expo-router";
import { useEffect } from "react";
import { StreamChat } from "stream-chat";
import { OverlayProvider, Chat } from "stream-chat-expo";
import { GestureHandlerRootView } from 'react-native-gesture-handler';

const API_KEY = "kz86mkfxgccn";
const client = StreamChat.getInstance(API_KEY);

export default function ChatLayout() {
    useEffect(() => {
        const connectUser = async () => {
            await client.connectUser(
                {
                    id: "123",
                    name: "John Doe",
                    image: "https://via.placeholder.com/150"
                },
                client.devToken("123")
            );
        };

        connectUser();

        return () => {
            client.disconnectUser();
        };
    }, []);

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <OverlayProvider>
                <Chat client={client}>
                    <Stack>
                        <Stack.Screen name="index" options={{ title: "Messages" }} />
                    </Stack>
                </Chat>
            </OverlayProvider>
        </GestureHandlerRootView>
    );
}
