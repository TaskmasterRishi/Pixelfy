import React, { useState, useMemo, useCallback } from "react";
import { Text, View, TouchableOpacity, useWindowDimensions, Image } from "react-native";
import { Ionicons, AntDesign, Feather, Entypo } from '@expo/vector-icons';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { formatDistanceToNow } from "date-fns";
import Animated, { 
  useAnimatedStyle, 
  withSpring, 
  withSequence, 
  withTiming,
  interpolate,
  useSharedValue,
  Easing,
  runOnJS
} from 'react-native-reanimated';

interface User {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string | null;
  verified: boolean;
}

interface Post {
  id: string;
  user_id: string;
  caption: string | null;
  media_url: string;
  media_type: string;
  created_at: string;
  user: User;
}

interface PostListItemProps {
  post: Post;
  onLike?: (postId: string) => void;
  onComment?: (postId: string) => void;
  onShare?: (postId: string) => void;
  onBookmark?: (postId: string) => void;
  onProfilePress?: (userId: string) => void;
}

export default function PostListItem({ 
  post,
  onLike,
  onComment,
  onShare,
  onBookmark,
  onProfilePress
}: PostListItemProps) {
  const { width } = useWindowDimensions();
  const [avatarError, setAvatarError] = useState(false);
  const [liked, setLiked] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  const [lastTap, setLastTap] = useState(0);
  const heartScale = useSharedValue(0);
  const likeScale = useSharedValue(1);
  const contentOpacity = useSharedValue(0);

  const avatarUrl = useMemo(() => {
    return post.user?.avatar_url && !avatarError
      ? `${post.user.avatar_url}?t=${Date.now()}`
      : null;
  }, [post.user?.avatar_url, avatarError]);

  const timeAgo = useMemo(() => {
    return formatDistanceToNow(new Date(post.created_at), { addSuffix: true });
  }, [post.created_at]);

  const handleDoubleTapLike = useCallback(() => {
    if (!liked) {
      // Show and animate the heart overlay
      heartScale.value = 0;
      heartScale.value = withSequence(
        withSpring(1, { damping: 4 }),
        withTiming(1, { duration: 500 }),
        withTiming(0, { duration: 200 })
      );
      runOnJS(setLiked)(true);
      runOnJS(onLike?.(post.id));
    }
  }, [liked, post.id, onLike]);

  const handleImagePress = useCallback(() => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    
    if (now - lastTap < DOUBLE_TAP_DELAY) {
      handleDoubleTapLike();
    }
    setLastTap(now);
  }, [lastTap, handleDoubleTapLike]);

  const handleLike = useCallback(() => {
    likeScale.value = withSequence(
      withSpring(0.8),
      withSpring(1)
    );
    setLiked(prev => !prev);
    onLike?.(post.id);
  }, [post.id, onLike]);

  const handleProfilePress = useCallback(() => {
    onProfilePress?.(post.user_id);
  }, [post.user_id, onProfilePress]);

  // Animation styles
  const heartAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value }],
    opacity: heartScale.value,
  }));

  const likeButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: likeScale.value }],
  }));

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    opacity: withTiming(1, { duration: 300 }),
    transform: [
      { 
        translateY: interpolate(
          contentOpacity.value,
          [0, 1],
          [10, 0]
        )
      }
    ],
  }));

  React.useEffect(() => {
    contentOpacity.value = 1;
  }, []);

  if (!post || !post.user) {
    return null;
  }

  return (
    <Animated.View className="bg-white" style={contentAnimatedStyle}>
      {/* Header */}
      <TouchableOpacity 
        className="px-4 py-3 flex-row items-center justify-between"
        onPress={handleProfilePress}
      >
        <View className="flex-row items-center">
          {avatarUrl ? (
            <Image
              source={{ uri: avatarUrl }}
              className="w-9 h-9 rounded-full border border-gray-100"
              onError={() => setAvatarError(true)}
            />
          ) : (
            <View className="w-9 h-9 rounded-full bg-gray-50 items-center justify-center border border-gray-100">
              <FontAwesome name="user" size={16} color="#666" />
            </View>
          )}
          <View className="ml-3">
            <Text className="font-semibold text-[14px]">
              {post.user.username}
              {post.user.verified && (
                <Ionicons name="checkmark-circle" size={14} color="#3897F0" style={{ marginLeft: 4 }} />
              )}
            </Text>
            <Text className="text-xs text-gray-500">{timeAgo}</Text>
          </View>
        </View>
        <TouchableOpacity className="p-2">
          <Feather name="more-horizontal" size={20} color="#262626" />
        </TouchableOpacity>
      </TouchableOpacity>

      {/* Image with double tap */}
      <TouchableOpacity 
        activeOpacity={1}
        onPress={handleImagePress}
      >
        <View className="relative">
          <Image
            source={{ uri: post.media_url }}
            className="w-full bg-gray-100"
            style={{ height: width, aspectRatio: 1 }}
            onError={() => setImageError(true)}
          />
          <Animated.View 
            className="absolute inset-0 items-center justify-center pointer-events-none"
            style={heartAnimatedStyle}
          >
            <AntDesign name="heart" size={80} color="white" />
          </Animated.View>
        </View>
      </TouchableOpacity>

      {/* Actions */}
      <View className="px-4 pt-3 pb-1">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-4">
            <TouchableOpacity 
              onPress={handleLike}
              className="active:opacity-60"
            >
              <Animated.View style={likeButtonStyle}>
                <AntDesign 
                  name={liked ? "heart" : "hearto"} 
                  size={26} 
                  color={liked ? "#FF3B30" : "#262626"} 
                />
              </Animated.View>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => onComment?.(post.id)}
              className="active:opacity-60"
            >
              <Animated.View>
                <Feather name="message-circle" size={26} color="#262626" />
              </Animated.View>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => onShare?.(post.id)}
              className="active:opacity-60"
            >
              <Animated.View>
                <Feather name="send" size={24} color="#262626" />
              </Animated.View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Likes & Caption */}
        <View className="mt-2">
          <Text className="font-semibold text-[14px]">
            {liked ? "you liked this pic" : "0 likes"}
          </Text>
          {post.caption && (
            <Text className="text-[14px] leading-5 mt-1">
              <Text className="font-semibold">{post.user.username} </Text>
              <Text className="ml-1">{post.caption}</Text>
            </Text>
          )}
        </View>

        {/* Add Comment Button */}
        <TouchableOpacity 
          onPress={() => onComment?.(post.id)}
          className="mt-2 mb-1"
        >
          <Text className="text-gray-500 text-sm">Add a comment...</Text>
        </TouchableOpacity>
      </View>

      {/* Separator */}
      <View className="h-[1px] bg-gray-100 mt-1" />
    </Animated.View>
  );
}