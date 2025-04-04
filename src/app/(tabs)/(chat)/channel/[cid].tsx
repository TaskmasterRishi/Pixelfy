import React, { useEffect, useState } from "react";
import { ActivityIndicator, Text, View, Image, TouchableOpacity } from "react-native";
import {
  Channel,
  MessageInput,
  MessageList,
  useChannelContext,
} from "stream-chat-expo";
import { Channel as ChannelType, StreamChat } from "stream-chat";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from '~/providers/AuthProvider';
import * as MediaLibrary from 'expo-media-library';

const client = StreamChat.getInstance("cxc6zzq7e93f");

export default function ChannelScreen() {
  const [channel, setChannel] = useState<ChannelType | null>(null);
  const { cid } = useLocalSearchParams<{ cid: string }>();
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const requestPermissions = async () => {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        alert('Permission to access media library is required to send files');
      }
    };

    requestPermissions();
  }, []);

  useEffect(() => {
    const fetchChannel = async () => {
      const channels = await client.queryChannels({ cid });
      setChannel(channels[0]);
    };
    fetchChannel();
  }, [cid]);

  if (!channel || !channel.state) {
    return <ActivityIndicator />;
  }

  // Get other members from the channel
  const otherMembers = Object.values(channel.state.members).filter(member => member.user_id !== user.id);
  const otherUser = otherMembers[0]?.user;

  return (
    <Channel channel={channel}>
      <View className="flex-row items-center px-4 py-2 bg-white border-b border-gray-200">
        <TouchableOpacity onPress={() => router.back()} className="mr-2">
          <Text className="text-lg">←</Text>
        </TouchableOpacity>
        {otherUser?.image ? (
          <Image
            source={{ uri: otherUser.image }}
            className="w-8 h-8 rounded-full mr-3"
          />
        ) : (
          <View className="w-8 h-8 rounded-full bg-gray-100 mr-3 items-center justify-center">
            <Text className="text-gray-400">👤</Text>
          </View>
        )}
        <Text className="text-lg font-semibold">{otherUser?.name || otherUser?.id}</Text>
      </View>
      <MessageList />
      <SafeAreaView edges={["bottom"]}></SafeAreaView>
      <MessageInput 
        additionalTextInputProps={{
          allowFontScaling: false,
        }}
        fileUploadsEnabled={true}
        imageUploadsEnabled={true}
        sendImageAsync={true}
        additionalTouchableProps={{
          activeOpacity: 0.7,
        }}
      />
    </Channel>
  );
}
