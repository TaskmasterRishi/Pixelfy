import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  View,
  Text,
  Image,
  TouchableOpacity,
  Alert,
  Modal,
  Pressable,
  BackHandler,
  StyleSheet,
} from "react-native";
import {
  Channel,
  MessageList,
  MessageInput,
  useMessageContext,
  useMessagesContext,
  useChannelContext,
} from "stream-chat-expo";
import { StreamChat, Channel as ChannelType } from "stream-chat";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { useAuth } from "~/providers/AuthProvider";
import * as ImagePicker from "expo-image-picker";
import Ionicons from "@expo/vector-icons/Ionicons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useFocusEffect } from "@react-navigation/native";
import { useVideoPlayer, VideoView } from 'expo-video';
import { TapGestureHandler } from "react-native-gesture-handler";

const client = StreamChat.getInstance("cxc6zzq7e93f");

// Attachment Components
const ImageAttachment = ({ attachment, isMyMessage, message, onImagePress }) => {
  const [imageDimensions, setImageDimensions] = useState({ width: 250, height: 250 });
  const imageUrl = attachment.image_url || attachment.asset_url;

  useEffect(() => {
    if (imageUrl) {
      Image.getSize(imageUrl, (width, height) => {
        setImageDimensions({ width: 250, height: 250 * (height / width) });
      });
    }
  }, [imageUrl]);

  return (
    <TouchableOpacity
      onPress={() => onImagePress(imageUrl || "")}
      activeOpacity={0.9}
      className="overflow-hidden rounded-2xl my-1"
    >
      <Image
        source={{ uri: imageUrl }}
        style={imageDimensions}
        resizeMode="cover"
      />
    </TouchableOpacity>
  );
};

const VideoAttachment = ({ attachment, isMyMessage, message }) => {
  const imageUrl = attachment.image_url || attachment.asset_url;
  const player = useVideoPlayer({ uri: imageUrl }, (player) => {
    player.loop = true;
    player.play();
  });

  return (
    <View 
      className="overflow-hidden rounded-2xl my-1 bg-black"
      style={{ width: 250, height: 250 }}
    >
      <VideoView
        style={{ width: 250, height: 250 }}
        player={player}
        allowsFullscreen
        allowsPictureInPicture
      />
    </View>
  );
};

const GiphyAttachment = ({ attachment, isMyMessage, message, onImagePress }) => {
  const [giphyDimensions, setGiphyDimensions] = useState({ width: 250, height: 250 });
  const giphyUrl = attachment.giphy?.fixed_height?.url || attachment.image_url || attachment.asset_url;

  useEffect(() => {
    if (giphyUrl) {
      Image.getSize(giphyUrl, (width, height) => {
        setGiphyDimensions({ width: 250, height: 250 * (height / width) });
      });
    }
  }, [giphyUrl]);

  if (!giphyUrl) return null;

  return (
    <TouchableOpacity
      onPress={() => onImagePress(giphyUrl)}
      activeOpacity={0.9}
      className="overflow-hidden rounded-2xl my-1"
      style={{ width: 250 }}
    >
      <Image
        source={{ uri: giphyUrl }}
        style={{ width: "100%", height: 250 * (giphyUrl ? 1 : 0.5) }}
        resizeMode="cover"
      />
    </TouchableOpacity>
  );
};

const FileAttachment = ({ attachment, isMyMessage }) => {
  return (
    <View
      className={`overflow-hidden rounded-2xl my-1 ${isMyMessage ? "bg-blue-500" : "bg-gray-100"}`}
      style={{ width: 250 }}
    >
      <TouchableOpacity 
        className="flex-row items-center p-3"
        activeOpacity={0.7}
      >
        <Ionicons 
          name="document-outline" 
          size={24} 
          color={isMyMessage ? "#fff" : "#4b5563"} 
        />
        <Text 
          className={`ml-2 ${isMyMessage ? "text-white" : "text-gray-800"}`}
          numberOfLines={1}
        >
          {attachment.title || "File"}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const AttachmentRenderer = ({ attachment, isMyMessage, message, onImagePress }) => {
  const imageUrl = attachment.image_url || attachment.asset_url;
  
  if (attachment.type === "image" || imageUrl?.match(/\.(jpeg|jpg|png|gif)$/i)) {
    return (
      <ImageAttachment 
        attachment={attachment} 
        isMyMessage={isMyMessage} 
        message={message} 
        onImagePress={onImagePress} 
      />
    );
  }
  
  if (attachment.type === "video" || (imageUrl && imageUrl.match(/\.(mp4|mov|webm)$/i))) {
    if (!imageUrl) return null;
    return (
      <VideoAttachment 
        attachment={attachment} 
        isMyMessage={isMyMessage} 
        message={message} 
      />
    );
  }
  
  if (attachment.type === "giphy") {
    return (
      <GiphyAttachment 
        attachment={attachment} 
        isMyMessage={isMyMessage} 
        message={message} 
        onImagePress={onImagePress} 
      />
    );
  }
  
  if (attachment.type === "file") {
    return (
      <FileAttachment
        attachment={attachment}
        isMyMessage={isMyMessage}
      />
    );
  }
  
  return null;
};

// Message timestamp component
const MessageTimestamp = ({ timestamp, isMyMessage }) => {
  if (!timestamp) return null;
  
  const time = new Date(timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  
  return (
    <Text className={`text-xs mt-1 ${isMyMessage ? "text-right text-gray-500" : "text-left text-gray-500"}`}>
      {time}
    </Text>
  );
};

// Message header with sender name for group chats
const MessageHeader = (props) => {
  const { message, members } = props;
  const { channel } = useChannelContext();
  const isGroup = Object.keys(channel.state.members).length > 2;
  
  // Only show headers for other users' messages in group chats
  if (!isGroup || !message?.user?.name || message?.user?.id === client.userID) return null;
  
  return (
    <Text className="text-sm text-gray-500 mb-1">{message.user.name}</Text>
  );
};

const CustomMessage = () => {
  const { message, isMyMessage, previousMessageStyles, onLongPress } = useMessageContext();
  const { handleReaction } = useMessagesContext();
  const [visibleImage, setVisibleImage] = useState<string | null>(null);
  const scaleAnim = useSharedValue(0);
  const opacityAnim = useSharedValue(0);
  
  // Check if message should be grouped
  const shouldGroupWithPrevious = previousMessageStyles?.groupedByUser;

  useFocusEffect(
    React.useCallback(() => {
      const backAction = () => {
        if (visibleImage) {
          setVisibleImage(null);
          return true;
        }
        return false;
      };

      const backHandler = BackHandler.addEventListener(
        "hardwareBackPress",
        backAction
      );

      return () => backHandler.remove();
    }, [visibleImage])
  );

  useEffect(() => {
    if (visibleImage) {
      scaleAnim.value = withSpring(1, { damping: 10 });
      opacityAnim.value = withTiming(1, { duration: 300 });
    } else {
      scaleAnim.value = 0;
      opacityAnim.value = 0;
    }
  }, [visibleImage]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleAnim.value }],
    opacity: opacityAnim.value,
  }));

  const handleImagePress = (imageUrl: string) => {
    setVisibleImage(imageUrl);
  };
  
  const handleDoubleTap = () => {
    if (message && message.id) {
      handleReaction(message, 'love');
    }
  };

  return (
    <>
      <View className={`flex-row px-4 ${isMyMessage ? "justify-end" : "justify-start"}`}
        style={{ 
          marginBottom: shouldGroupWithPrevious ? 2 : 8,
          marginTop: shouldGroupWithPrevious ? 0 : 2 
        }}
      >
        {/* Avatar or spacing placeholder */}
        {!isMyMessage && (
          <View className="w-10 mr-2 items-start justify-start">
            {!shouldGroupWithPrevious && message.user?.image ? (
              <Image
                source={{ uri: message.user?.image }}
                className="w-8 h-8 rounded-full"
              />
            ) : null}
          </View>
        )}
        
        {/* Message content */}
        <View className={`${isMyMessage ? "items-end" : "items-start"}`} style={{ maxWidth: '75%' }}>
          {/* Show user name in group chats */}
          {!shouldGroupWithPrevious && !isMyMessage && (
            <MessageHeader message={message} />
          )}
          
          <TapGestureHandler
            numberOfTaps={2}
            onActivated={handleDoubleTap}
          >
            <View>
              {message.text && (
                <TouchableOpacity
                  activeOpacity={0.7}
                  onLongPress={onLongPress}
                  delayLongPress={500}
                >
                  <View
                    className={`px-4 py-2.5 ${
                      isMyMessage 
                        ? "bg-blue-500 rounded-tl-2xl rounded-bl-2xl rounded-tr-sm rounded-br-sm" 
                        : "bg-gray-100 rounded-tr-2xl rounded-br-2xl rounded-tl-sm rounded-bl-sm"
                    } ${
                      shouldGroupWithPrevious 
                        ? isMyMessage 
                          ? "rounded-tr-2xl" 
                          : "rounded-tl-2xl" 
                        : ""
                    }`}
                  >
                    <Text className={`text-base ${isMyMessage ? "text-white" : "text-gray-900"}`}>
                      {message.text}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
              
              {message.attachments?.map((attachment, i) => (
                <AttachmentRenderer
                  key={`${message.id}-${i}-${attachment.type || 'attachment'}`}
                  attachment={attachment}
                  isMyMessage={isMyMessage}
                  message={message}
                  onImagePress={handleImagePress}
                />
              ))}
            </View>
          </TapGestureHandler>
          
          {!shouldGroupWithPrevious && (
            <MessageTimestamp 
              timestamp={message.created_at} 
              isMyMessage={isMyMessage}
            />
          )}
        </View>
      </View>

      <Modal visible={!!visibleImage} transparent animationType="none">
        <Pressable
          className="flex-1 bg-black/70 items-center justify-center"
          onPress={() => setVisibleImage(null)}
        >
          {visibleImage && (
            <Animated.Image
              source={{ uri: visibleImage }}
              style={[
                {
                  width: "100%",
                  height: "100%",
                  resizeMode: "contain",
                },
                animatedStyle,
              ]}
            />
          )}
        </Pressable>
      </Modal>
    </>
  );
};

export default function ChannelScreen() {
  const { cid } = useLocalSearchParams<{ cid: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [channel, setChannel] = useState<ChannelType | null>(null);

  useEffect(() => {
    const fetchChannel = async () => {
      const channels = await client.queryChannels({ cid });
      setChannel(channels[0]);
    };
    fetchChannel();
  }, [cid]);

  const handleImageUpload = async () => {
    if (!channel) return;

    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permission.status !== "granted") {
        Alert.alert("Permission Denied", "Access to gallery is needed to send images.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 1,
      });

      if (!result.canceled && result.assets.length > 0) {
        const img = result.assets[0];
        await channel.sendMessage({
          text: "",
          attachments: [
            {
              type: "image",
              image_url: img.uri,
              asset_url: img.uri,
            },
          ],
        });
      }
    } catch (err) {
      console.error(err);
      Alert.alert("Upload Failed", "Could not send the image.");
    }
  };

  if (!channel || !channel.state) return <ActivityIndicator className="mt-20" />;

  const otherMembers = Object.values(channel.state.members).filter(
    (m: any) => m.user_id !== user?.id
  );
  const otherUser = otherMembers[0]?.user;

  return (
    <Channel 
      channel={channel}
      MessageSimple={CustomMessage}
      messageGroupingLimit={60000} // 1 minute
      enableMessageGroupingByUser
      keyboardVerticalOffset={0}
      deletedMessagesVisibilityType="sender"
      forceAlignMessages={null}
      additionalTextInputProps={{
        placeholder: "Type a message...",
        placeholderTextColor: "#9ca3af",
        style: { fontSize: 16 }
      }}
      MessageHeader={MessageHeader}
    >
      <Stack.Screen options={{ title: otherUser?.name || "Chat", headerShown: false }} />
      
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 bg-white border-b border-gray-100 shadow-sm">
        <TouchableOpacity
          onPress={() => router.back()}
          className="p-2 rounded-full bg-gray-100"
        >
          <Ionicons name="arrow-back" size={20} color="#4b5563" />
        </TouchableOpacity>
        
        {otherUser?.image ? (
          <Image
            source={{ uri: otherUser.image as string }}
            className="w-10 h-10 rounded-full ml-3 mr-3 border-2 border-white"
          />
        ) : (
          <View className="w-10 h-10 rounded-full bg-gray-100 ml-3 mr-3 items-center justify-center">
            <Ionicons name="person" size={20} color="#9ca3af" />
          </View>
        )}
        
        <View>
          <Text className="text-lg font-semibold text-gray-800">
            {otherUser?.name || otherUser?.id}
          </Text>
          <Text className="text-sm text-gray-500">
            {otherUser?.online ? "Online" : "Offline"}
          </Text>
        </View>
      </View>

      {/* Message list */}
      <View className="flex-1 bg-white">
        <MessageList />
      </View>
      
      {/* Message input with attachment button */}
      <View className="border-t border-gray-100">
        <View className="flex-row items-center">
          <TouchableOpacity 
            onPress={handleImageUpload}
            className="p-3 ml-2"
          >
            <Ionicons name="image-outline" size={24} color="#3b82f6" />
          </TouchableOpacity>
          <View className="flex-1">
            <MessageInput />
          </View>
        </View>
      </View>
    </Channel>
  );
}

const styles = StyleSheet.create({
  videoContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  video: {
    width: 250,
    height: 250,
  },
  fileContainer: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: 'hidden',
    marginTop: 4,
    width: 250,
  }
});
