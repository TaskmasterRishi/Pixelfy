import { PropsWithChildren, useEffect, useState, useRef } from "react";
import { Slot, Stack } from "expo-router";
import { View, StyleSheet, ActivityIndicator } from "react-native";
import { StreamChat } from "stream-chat";
import { Chat, OverlayProvider } from "stream-chat-expo";
import { useAuth } from "./AuthProvider";
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { supabase } from "../lib/supabase";

const client = StreamChat.getInstance(process.env.EXPO_PUBLIC_STREAM_API_KEY);

export default function ChatProvider({ children }: PropsWithChildren) {
  const [isReady, setIsReady] = useState(false);
  const { user } = useAuth();
  const userDetailsCache = useRef<{ username: string; avatarUrl: string } | null>(null);

  useEffect(() => {
    const connectUser = async () => {
      if (!user || !user.id) return;

      // Check cache first
      if (userDetailsCache.current) {
        await client.connectUser(
          {
            id: user.id,
            name: userDetailsCache.current.username,
            image: userDetailsCache.current.avatarUrl,
          },
          client.devToken(user.id)
        );
        setIsReady(true);
        return;
      }

      // If no cache, fetch and connect
      const { data, error } = await supabase
        .from('users')
        .select('username, avatar_url')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error("Error fetching user details:", error);
        return;
      }

      // Cache the user details
      userDetailsCache.current = {
        username: data.username || "Anonymous",
        avatarUrl: data.avatar_url || ''
      };

      await client.connectUser(
        {
          id: user.id,
          name: userDetailsCache.current.username,
          image: userDetailsCache.current.avatarUrl,
        },
        client.devToken(user.id)
      );

      setIsReady(true);
    };

    // Add a small delay to allow other app initialization
    const timeout = setTimeout(() => {
      connectUser();
    }, 100);

    return () => {
      clearTimeout(timeout);
      if (isReady) {
        client.disconnectUser();
      }
      setIsReady(false);
    };
  }, [user?.id]);

  if (!isReady) {
    return <ActivityIndicator />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <OverlayProvider>
        <Chat client={client}>
          {children}
        </Chat>
      </OverlayProvider>
    </GestureHandlerRootView>
  );
}
