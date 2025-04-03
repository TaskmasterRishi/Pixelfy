import { PropsWithChildren, useEffect, useState } from "react";
import { Slot, Stack } from "expo-router";
import { View, StyleSheet, ActivityIndicator } from "react-native";
import { StreamChat } from "stream-chat";
import { Chat, OverlayProvider } from "stream-chat-expo";
import { useAuth } from "./AuthProvider";
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { supabase } from "../lib/supabase";

const client = StreamChat.getInstance("cxc6zzq7e93f");

export default function ChatProvider({ children }: PropsWithChildren) {
  const [isReady, setIsReady] = useState(false);
  const {user} = useAuth();
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
            console.log("Fetched avatar_url from Supabase:", data.avatar_url);
            setAvatarUrl(data.avatar_url);
          } else {
            console.log("No avatar_url found for the user.");
          }
        }
      }
    };

    fetchUserDetails();
  }, [user]);

  useEffect(() => {
    const connectUser = async () => {
      if (user && user.id && username) {
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
        } catch (error) {
          console.error("Error connecting user:", error);
        }
      } else {
        console.error("User is not defined or user.id is missing");
      }
    };

    if (user && user.id && username) {
      connectUser();
    }

    return () => {
      if (isReady) {
        client.disconnectUser();
      }
      setIsReady(false);
    };
  }, [user?.id]);

  if(!isReady){
    return <ActivityIndicator/>
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
