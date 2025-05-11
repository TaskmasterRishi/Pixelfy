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
      <View className={`max-w-[80%] rounded-2xl ${
        isMyMessage ? 'bg-blue-500' : 'bg-gray-100'
      } shadow-sm p-2`}>
        {!isMyMessage && (
          <Text className="text-sm font-semibold text-gray-800 mb-1">
            {message.user?.name}
          </Text>
        )}
        
        {/* Display text if present */}
        {message.text && (
          <Text className={`text-base ${isMyMessage ? 'text-white' : 'text-gray-800'}`}>
            {message.text}
          </Text>
        )}
        
        {/* Display image attachments */}
        {message.attachments?.map((attachment, index) => {
          if (attachment.type === 'image' || attachment.image_url) {
            return (
              <Image 
                key={`${message.id}-${index}`}
                source={{ uri: attachment.image_url || attachment.asset_url }}
                className="w-full h-auto mt-2 rounded-lg"
                style={{ maxHeight: 200, aspectRatio: 1 }} // Maintain aspect ratio
                resizeMode="contain" // Maintain aspect ratio
              />
            );
          }
          if (attachment.type === 'giphy') {
            return (
              <Giphy key={`${message.id}-${index}`} attachment={attachment} />
            );
          }
          return null;
        })}
        
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
    />
  );
};

// Enhanced Header Component with proper online status
interface CustomHeaderProps {
  otherUser: {
    id: string;
    image?: string;
    name?: string;
  };
  router: {
    back: () => void;
  };
  channel: {
    state: {
      members: Record<string, {
        user?: {
          online: boolean;
        };
      }>;
    };
  };
}

const CustomHeader: React.FC<CustomHeaderProps> = ({ otherUser, router, channel }) => {
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
interface CustomMessageInputProps {
  handleImageUpload: () => void;
}

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
  const otherMembers = Object.values(channel.state.members).filter(member => member.user_id !== user?.id);
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
                file_size: image.fileSize || 0, // Use image.fileSize if available, otherwise default to 0
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
    <Channel channel={channel}>
      <Stack.Screen
        options={{
          title: otherUser?.name || 'Chat',
          headerRight: () => null,
        }}
      />
      
      {/* Custom Header (kept as requested) */}
      <View className="flex flex-row items-center px-4 py-3 bg-white border-b border-gray-100 shadow-sm">
        <TouchableOpacity 
          onPress={() => router.back()} 
          className="p-2 rounded-full bg-gray-50 active:bg-gray-100"
        >
          <Ionicons name="arrow-back" size={20} color="#4b5563" />
        </TouchableOpacity>
        {otherUser?.image ? (
          <Image
            source={{ uri: otherUser.image as string }}
            className="w-10 h-10 rounded-full ml-3 mr-3 border-2 border-white"
          />
        ) : (
          <View className="w-10 h-10 rounded-full bg-gray-100 ml-3 mr-3 items-center justify-center border-2 border-white">
            <Ionicons name="person" size={20} color="#9ca3af" />
          </View>
        )}
        <View>
          <Text className="text-lg font-semibold text-gray-800">{otherUser?.name || otherUser?.id}</Text>
          <Text className="text-sm text-gray-500">
            {otherUser?.online ? 'Online' : 'Offline'}
          </Text>
        </View>
      </View>
      
      {/* Default Message List and Input (no customizations) */}
      <MessageList />
      <MessageInput />
    </Channel>
  );
}