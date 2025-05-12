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
} from "react-native";
import {
  Channel,
  MessageList,
  MessageInput,
  useMessageContext,
  Giphy,
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

const client = StreamChat.getInstance("cxc6zzq7e93f");

const CustomMessage = () => {
  const { message, isMyMessage } = useMessageContext();
  const [visibleImage, setVisibleImage] = useState<string | null>(null);
  const scaleAnim = useSharedValue(0);
  const opacityAnim = useSharedValue(0);

  useFocusEffect(
    React.useCallback(() => {
      const backAction = () => {
        if (visibleImage) {
          setVisibleImage(null);
          return true; // Prevent default back behavior
        }
        return false; // Allow default back behavior
      };

      const backHandler = BackHandler.addEventListener(
        "hardwareBackPress",
        backAction
      );

      return () => {
        backHandler.remove(); // Clean up the event listener
      };
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

  return (
    <>
      <View
        className={`flex-row mb-3 px-4 ${
          isMyMessage ? "justify-end" : "justify-start"
        }`}
      >
        {!isMyMessage && (
          <Image
            source={{ uri: message.user?.image }}
            className="w-9 h-9 rounded-full mr-2"
          />
        )}
        <View
          className={`max-w-[75%] rounded-2xl px-4 py-2 ${
            isMyMessage ? "bg-blue-500" : "bg-gray-100"
          }`}
        >
          {!isMyMessage && (
            <Text className="text-sm font-semibold text-gray-800 mb-1">
              {message.user?.name}
            </Text>
          )}
          {message.text && (
            <Text
              className={`text-base ${
                isMyMessage ? "text-white" : "text-gray-900"
              }`}
            >
              {message.text}
            </Text>
          )}

          {message.attachments?.map((attachment, i) => {
            if (attachment.type === "image" || attachment.image_url) {
              const imageUrl = attachment.image_url || attachment.asset_url;
              return (
                <TouchableOpacity
                  key={`${message.id}-${i}`}
                  onPress={() => setVisibleImage(imageUrl || "")}
                  activeOpacity={0.9}
                >
                  <Image
                    source={{ uri: imageUrl }}
                    className="mt-2 rounded-lg"
                    style={{ height: 200, aspectRatio: 1 }}
                    resizeMode="cover"
                  />
                </TouchableOpacity>
              );
            }
            if (attachment.type === "giphy") {
              return (
                <Giphy key={`${message.id}-${i}`} attachment={attachment} />
              );
            }
            return null;
          })}

          <Text
            className={`text-xs text-right mt-1 ${
              isMyMessage ? "text-blue-200" : "text-gray-500"
            }`}
          >
            {new Date(message.created_at || "").toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
        </View>
      </View>

      {/* Animated Fullscreen Modal */}
      <Modal visible={!!visibleImage} transparent animationType="none">
        <Pressable
          className="flex-1 bg-black/50 items-center justify-center"
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
        Alert.alert(
          "Permission Denied",
          "Access to gallery is needed to send images."
        );
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

  if (!channel || !channel.state)
    return <ActivityIndicator className="mt-20" />;

  const otherMembers = Object.values(channel.state.members).filter(
    (m: any) => m.user_id !== user?.id
  );
  const otherUser = otherMembers[0]?.user;

  return (
    <Channel channel={channel} MessageSimple={CustomMessage}>
      <Stack.Screen
        options={{ title: otherUser?.name || "Chat", headerShown: false }}
      />
      <View className="flex-row items-center px-4 py-3 bg-white border-b border-gray-100 shadow-sm">
        <TouchableOpacity
          onPress={() => router.back()}
          className="p-2 rounded-full bg-gray-100"
        >
          <Ionicons name="arrow-back" size={20} color="#4b5563" />
        </TouchableOpacity>
        {otherUser?.image ? (
          <Image
            source={{ uri: otherUser.image }}
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

      <MessageList />
      <MessageInput
        additionalTextInputProps={{
          accessoryRight: () => (
            <TouchableOpacity onPress={handleImageUpload} className="ml-2">
              <Ionicons name="image-outline" size={24} color="#3b82f6" />
            </TouchableOpacity>
          ),
        }}
      />
    </Channel>
  );
}
