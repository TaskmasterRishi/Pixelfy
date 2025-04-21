import React, { useEffect, useState } from "react";
import { ActivityIndicator, Text, View, Image, TouchableOpacity, FlatList } from "react-native";
import {
  Channel,
  MessageInput,
  MessageList,
  useChannelContext,
  MessageSimple,
  Giphy,
  AutoCompleteSuggestionHeader,
  AutoCompleteSuggestionItem,
  useMessageContext,
} from "stream-chat-expo";
import { Channel as ChannelType, StreamChat } from "stream-chat";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from '~/providers/AuthProvider';
import * as ImagePicker from 'expo-image-picker';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Crypto from 'expo-crypto';

const client = StreamChat.getInstance("cxc6zzq7e93f");

// Enhanced Custom Message Component
const CustomMessage = () => {
  const { message, isMyMessage } = useMessageContext();
  
  return (
    <View className={`flex flex-row ${isMyMessage ? 'justify-end' : 'justify-start'} mb-3`}>
      {!isMyMessage && (
        <Image
          source={{ uri: message.user?.image }}
          className="w-10 h-10 rounded-full mr-3"
        />
      )}
      <View className={`max-w-[80%] rounded-2xl p-4 ${
        isMyMessage ? 'bg-blue-500' : 'bg-gray-100'
      } shadow-sm`}>
        {!isMyMessage && (
          <Text className="text-sm font-semibold text-gray-800 mb-1">
            {message.user?.name}
          </Text>
        )}
        <Text className={`text-base ${isMyMessage ? 'text-white' : 'text-gray-800'}`}>
          {message.text}
        </Text>
        <View className="flex flex-row items-center justify-end mt-1">
          <Text className={`text-xs ${
            isMyMessage ? 'text-blue-200' : 'text-gray-500'
          }`}>
            {new Date(message.created_at || '').toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </Text>
          {isMyMessage && (
            <Ionicons 
              name="checkmark-done" 
              size={14} 
              color={message.status === 'read' ? '#3b82f6' : '#a5b4fc'} 
              className="ml-1"
            />
          )}
        </View>
      </View>
    </View>
  );
};

// Enhanced Custom Message List Component
const CustomMessageList = () => {
  return (
    <MessageList 
      MessageSimple={CustomMessage}
      styles={{
        container: {
          backgroundColor: '#ffffff',
          paddingHorizontal: 16,
        },
        messageContainer: {
          marginBottom: 12,
        },
      }}
    />
  );
};

// Enhanced Header Component with proper online status
const CustomHeader = ({ otherUser, router, channel }) => {
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    if (channel && otherUser) {
      const member = channel.state.members[otherUser.id];
      setIsOnline(member?.user?.online || false);
    }
  }, [channel, otherUser]);

  return (
    <View className="flex flex-row items-center px-4 py-3 bg-white border-b border-gray-100 shadow-sm">
      <TouchableOpacity 
        onPress={() => router.back()} 
        className="p-2 rounded-full bg-gray-50 active:bg-gray-100"
      >
        <Ionicons name="arrow-back" size={20} color="#4b5563" />
      </TouchableOpacity>
      {otherUser?.image ? (
        <Image
          source={{ uri: otherUser.image }}
          className="w-10 h-10 rounded-full ml-3 mr-3 border-2 border-white"
        />
      ) : (
        <View className="w-10 h-10 rounded-full bg-gray-100 ml-3 mr-3 items-center justify-center border-2 border-white">
          <Ionicons name="person" size={20} color="#9ca3af" />
        </View>
      )}
      <View>
        <Text className="text-lg font-semibold text-gray-800">{otherUser?.name || otherUser?.id}</Text>
        <Text className={`text-sm ${
          isOnline ? 'text-green-500' : 'text-gray-500'
        }`}>
          {isOnline ? 'Online' : 'Offline'}
        </Text>
      </View>
    </View>
  );
};

// Enhanced Message Input Component
const CustomMessageInput = ({ handleImageUpload }) => (
  <View className="bg-white px-4 py-2 border-t border-gray-100">
    <MessageInput 
      additionalTextInputProps={{
        placeholder: "Type a message...",
        style: {
          backgroundColor: '#f3f4f6',
          borderRadius: 25,
          paddingHorizontal: 20,
          paddingVertical: 12,
          fontSize: 16,
        }
      }}
      fileUploadsEnabled={true}
      imageUploadsEnabled={true}
      sendImageAsync={true}
      additionalTouchableProps={{
        activeOpacity: 0.7,
      }}
      sendButtonStyle={{
        backgroundColor: '#3b82f6',
        borderRadius: 20,
        padding: 10,
        marginLeft: 8,
      }}
      ImageUploadIcon={() => (
        <TouchableOpacity 
          onPress={handleImageUpload}
          className="p-2 rounded-full bg-gray-100 active:bg-gray-200"
        >
          <Ionicons name="image-outline" size={24} color="#3b82f6" />
        </TouchableOpacity>
      )}
    />
  </View>
);

export default function ChannelScreen() {
  const [channel, setChannel] = useState<ChannelType | null>(null);
  const { cid } = useLocalSearchParams<{ cid: string }>();
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const verifyPermissions = async () => {
      const { status } = await ImagePicker.getMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        const { status: newStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (newStatus !== 'granted') {
          alert('Permission to access gallery is required to send images');
          return false;
        }
      }
      return true;
    };

    verifyPermissions();
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

  const customEmojiSearchIndex = {
    search: (query: string) => {
      // Implement your custom emoji search logic here
      return [
        { name: 'smile', unicode: '😊', names: ['smile', 'happy'] },
        { name: 'heart', unicode: '❤️', names: ['heart', 'love'] },
        // Add more emojis as needed
      ].filter(emoji => 
        emoji.names.some(name => name.includes(query.toLowerCase()))
      );
    },
  };

  const handleImageUpload = async () => {
    try {
      const hasPermission = await ImagePicker.getMediaLibraryPermissionsAsync();
      if (hasPermission.status !== 'granted') {
        alert('Gallery access is required to send images');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        aspect: [4, 3],
        quality: 1,
        selectionLimit: 0, // Allow multiple selections
      });

      if (!result.canceled && result.assets.length > 0) {
        const selectedImages = result.assets;
        
        // Upload each image to the channel
        for (const image of selectedImages) {
          const file = {
            uri: image.uri,
            name: image.fileName || `image_${Date.now()}.jpg`,
            type: image.type || 'image/jpeg',
          };

          // Create a message with the image attachment
          const message = {
            text: '',
            attachments: [
              {
                type: 'image',
                asset_url: file.uri,
                image_url: file.uri,
                file_size: file.size,
              }
            ]
          };

          // Send the message to the channel
          if (channel) {
            await channel.sendMessage(message);
          }
        }
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image. Please try again.');
    }
  };

  return (
    <Channel 
      channel={channel} 
      audioRecordingEnabled
      emojiSearchIndex={customEmojiSearchIndex}
      AutoCompleteSuggestionHeader={({ queryText, triggerType }) => {
        if (triggerType === "command") {
          return <Text className="text-gray-600 px-4 py-2">Available Commands</Text>;
        } else if (triggerType === "emoji") {
          return <Text className="text-gray-600 px-4 py-2">Emoji Suggestions</Text>;
        } else {
          return <AutoCompleteSuggestionHeader queryText={queryText} triggerType={triggerType} />;
        }
      }}
      AutoCompleteSuggestionItem={({ itemProps, triggerType }) => {
        if (triggerType === "command") {
          return (
            <View className="px-4 py-2">
              <Text className="font-semibold">{itemProps.name}</Text>
              <Text className="text-gray-500">{itemProps.args}</Text>
            </View>
          );
        } else if (triggerType === "mention") {
          return (
            <View className="flex-row items-center px-4 py-2">
              <Image
                source={{ uri: itemProps.image }}
                className="w-8 h-8 rounded-full mr-3"
              />
              <Text className="font-medium">{itemProps.name}</Text>
            </View>
          );
        } else {
          return <AutoCompleteSuggestionItem itemProps={itemProps} triggerType={triggerType} />;
        }
      }}
      AutoCompleteSuggestionList={({ data, onSelect, queryText, triggerType }) => {
        if (triggerType === "emoji") {
          return (
            <FlatList
              data={data}
              keyboardShouldPersistTaps="always"
              ListHeaderComponent={
                <AutoCompleteSuggestionHeader
                  queryText={queryText}
                  triggerType={triggerType}
                />
              }
              renderItem={({ item }) => (
                <TouchableOpacity
                  className="px-4 py-2"
                  onPress={() => onSelect(item)}
                >
                  <Text className="text-2xl">{item.unicode}</Text>
                  <Text className="text-gray-500">{item.name}</Text>
                </TouchableOpacity>
              )}
            />
          );
        } else {
          return (
            <View className="bg-white rounded-lg shadow-sm">
              <AutoCompleteSuggestionHeader
                queryText={queryText}
                triggerType={triggerType}
              />
              {data.map((item) => (
                <AutoCompleteSuggestionItem
                  itemProps={item}
                  key={item.name}
                  triggerType={triggerType}
                />
              ))}
            </View>
          );
        }
      }}
    >
      <Stack.Screen
        options={{
          title: otherUser?.name || 'Chat',
          headerRight: () => null,
        }}
      />
      
      <CustomHeader otherUser={otherUser} router={router} channel={channel} />
      
      <CustomMessageList />
      
      <SafeAreaView edges={["bottom"]}>
        <CustomMessageInput handleImageUpload={handleImageUpload} />
      </SafeAreaView>
    </Channel>
  );
}
