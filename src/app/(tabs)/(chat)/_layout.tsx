import { Redirect, Stack } from "expo-router";
import { Chat, OverlayProvider } from "stream-chat-expo";
import { StreamChat } from "stream-chat";

const client = StreamChat.getInstance(process.env.EXPO_PUBLIC_STREAM_API_KEY);

export default function HomeLayout() {
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="channel" options={{ headerShown: false }} />
      <Stack.Screen name="users" options={{ headerShown: false }} />
    </Stack>
  );
}
