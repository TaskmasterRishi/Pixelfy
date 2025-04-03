import { PropsWithChildren, useEffect, useState } from "react";
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
  const [username, setUsername] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserDetails = async () => {
      if (user && user.id) {
        const { data, error } = await supabase
          .from('users')
          .select('username, avatar_url')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error("Error fetching user details:", error);
        } else {
          setUsername(data.username);
          if (data.avatar_url) {
            const cloudinaryUrl = `https://res.cloudinary.com/YOUR_CLOUD_NAME/image/upload/${data.avatar_url}`;
            console.log("Fetched avatar_url from Cloudinary:", cloudinaryUrl);
            setAvatarUrl(cloudinaryUrl);
          } else {
            console.log("No avatar_url found for the user.");
          }
        }
      }
    };

    fetchUserDetails();
  }, [user]);

  useEffect(() => {
    if (!user || !user.id || !username || !avatarUrl) {
      console.log("Waiting for user details to be ready...");
      return;
    }

    const connect = async () => {
      console.log("Attempting to connect user:", { user, username, avatarUrl });
      try {
        await client.connectUser(
          {
            id: user.id,
            name: username || "Anonymous",
            image: avatarUrl || '',
          },
          client.devToken(user.id)
        );
        setIsReady(true);
        console.log("User connected successfully");
      } catch (error) {
        console.error("Error connecting user:", error);
      }
    };

    connect();

    return () => {
      if (isReady) {
        client.disconnectUser();
      }
      setIsReady(false);
    };
  }, [user?.id, username, avatarUrl]);

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
