import { Redirect, Stack } from 'expo-router';
import { Chat, OverlayProvider } from 'stream-chat-expo';
import { StreamChat } from 'stream-chat';

const client = StreamChat.getInstance("cxc6zzq7e93f");

export default function HomeLayout() {
  return (
    <OverlayProvider>
      <Chat client={client}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="channel" options={{ headerShown: false }} />
        </Stack>
      </Chat>
    </OverlayProvider>
  );
}