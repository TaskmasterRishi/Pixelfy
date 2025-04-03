import { PropsWithChildren, useEffect, useState } from "react";
import { Slot, Stack } from "expo-router";
import { View, StyleSheet, ActivityIndicator } from "react-native";
import { StreamChat } from "stream-chat";
import { Chat, OverlayProvider } from "stream-chat-expo";

const client = StreamChat.getInstance("cxc6zzq7e93f");

export default function ChatProvider({ children }: PropsWithChildren) {
  const [isReady, setIsReady] = useState(false);


  useEffect(() => {
    const connect = async () => {
      try {
        // Ensure the user is connected only if not already connected
        if (!client.userID) {
          await client.connectUser(
            {
              id: "jlahey",
              name: "Jim Lahey",
              image: "https://i.imgur.com/fR9Jz14.png",
            },
            client.devToken("jlahey")
          );
        }
        setIsReady(true);
        // const channel = client.channel("messaging", "the_park", {
        //     name: "The Park",
        //   });

        //   await channel.watch();
      } catch (error) {
        console.error("Error connecting user:", error);
      }
    };

    connect();

    return () => {
      client.disconnectUser();
      setIsReady(false);
    };
  },[]);

  if(!isReady){
    return <ActivityIndicator/>
  }

  return (
    <OverlayProvider>
      <Chat client={client}>{children}</Chat>
    </OverlayProvider>
  );
}
