import React, { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { Text, View, TouchableOpacity, useWindowDimensions, Image, ActivityIndicator, Alert } from "react-native";
import { Ionicons, AntDesign, Feather } from '@expo/vector-icons';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { formatDistanceToNow } from "date-fns";
import Animated, { 
  useAnimatedStyle, 
  withSpring, 
  withSequence, 
  withTiming,
  interpolate,
  useSharedValue,
  runOnJS
} from 'react-native-reanimated';
import { useAuth } from '~/providers/AuthProvider';
import { supabase } from '~/lib/supabase';
import { StyleSheet } from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import Toast from 'react-native-toast-message';
import { useRouter } from 'expo-router';
import { LikeButton, LikeButtonRef } from './LikeButton';

interface User {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string | null;
  verified: boolean;
  is_private: boolean;
}

interface Post {
  id: string;
  user_id: string;
  caption: string | null;
  media_url: string;
  media_type: string;
  created_at: string;
  user?: User;
  likes_count?: number;
}

interface PostListItemProps {
  post: Post;
  onComment?: (postId: string) => void;
  onShare?: (postId: string) => void;
  onBookmark?: (postId: string) => void;
  onProfilePress?: (userId: string) => void;
  currentUserId?: string;
  onShowLikes: (postId: string) => void;
}

export default function PostListItem({ 
  post,
  onComment,
  onShare,
  onBookmark,
  onProfilePress,
  currentUserId,
  onShowLikes
}: Omit<PostListItemProps, 'onLike'>) {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [avatarError, setAvatarError] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [isLikeRequestPending, setIsLikeRequestPending] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  
  const heartScale = useSharedValue(0);
  const contentOpacity = useSharedValue(0);

  const { user } = useAuth();

  const [commentCount, setCommentCount] = useState(0);
  const likeButtonRef = useRef<LikeButtonRef>(null);

  const avatarUrl = useMemo(() => {
    return post?.user?.avatar_url && !avatarError
      ? `${post.user.avatar_url}?t=${Date.now()}`
      : null;
  }, [post?.user?.avatar_url, avatarError]);

  const timeAgo = useMemo(() => {
    return formatDistanceToNow(new Date(post.created_at), { addSuffix: true });
  }, [post.created_at]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!post.user) {
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', post.user_id)
            .single();

          if (!userError && userData) {
            post.user = userData;
          }
        }

        const { count: likeCount, error: likeError } = await supabase
          .from('likes')
          .select('*', { count: 'exact', head: true })
          .eq('post_id', post.id);

        if (!likeError) {
          setLikeCount(likeCount ?? 0);
        }

        const { count: commentCount, error: commentError } = await supabase
          .from('comments')
          .select('*', { count: 'exact', head: true })
          .eq('post_id', post.id);

        if (!commentError) {
          setCommentCount(commentCount ?? 0);
        }

        if (user) {
          const { count, error } = await supabase
            .from('likes')
            .select('*', { count: 'exact', head: true })
            .eq('post_id', post.id)
            .eq('liked_user', user.id);

          if (!error) {
            setLiked((count ?? 0) > 0);
          }

          const { count: savedCount, error: savedError } = await supabase
            .from('saved_posts')
            .select('*', { count: 'exact', head: true })
            .eq('post_id', post.id)
            .eq('user_id', user.id);

          if (!savedError) {
            setIsSaved((savedCount ?? 0) > 0);
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, [post.id, post.user_id, user?.id]);

  const handleCommentPress = useCallback(() => {
    onComment?.(post.id);
  }, [onComment, post.id]);

  const handleLikeCountPress = useCallback(() => {
    onShowLikes(post.id);
  }, [post.id, onShowLikes]);

  const handleShare = async () => {
    try {
      Toast.show({
        type: 'info',
        text1: 'Preparing to share...'
      });
      
      const fileUri = FileSystem.documentDirectory + "temp_image.jpg";
      const { uri } = await FileSystem.downloadAsync(post.media_url, fileUri);
      await Sharing.shareAsync(uri);
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: 'Failed to share image'
      });
    } finally {
      FileSystem.deleteAsync(FileSystem.documentDirectory + "temp_image.jpg", { idempotent: true });
    }
  };

  const handleDoubleTapLike = useCallback(() => {
    if (!liked && user && !isLikeRequestPending) {
      likeButtonRef.current?.handleLikePress();
      
      heartScale.value = 0;
      heartScale.value = withSequence(
        withSpring(1, { damping: 4 }),
        withTiming(1, { duration: 500 }),
        withTiming(0, { duration: 200 })
      );
    }
  }, [liked, user?.id, isLikeRequestPending]);

  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onStart(() => {
      runOnJS(handleDoubleTapLike)();
    });

  const toggleSavePost = async () => {
    if (!user) return;
    try {
      if (isSaved) {
        const { error } = await supabase
          .from('saved_posts')
          .delete()
          .eq('post_id', post.id)
          .eq('user_id', user.id);

        if (error) throw error;

        setIsSaved(false);
        Alert.alert('Removed', 'Post removed from saved posts');
      } else {
        const { error } = await supabase
          .from('saved_posts')
          .insert({ user_id: user.id, post_id: post.id });

        if (error) throw error;

        setIsSaved(true);
        Alert.alert('Saved', 'Post added to saved posts');
      }
    } catch (error) {
      console.error('Error toggling save post:', error);
      Alert.alert('Error', 'Failed to toggle save post');
    }
  };

  const heartAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value }],
    opacity: heartScale.value,
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

  if (!post) {
    return (
      <View className="p-4">
        <ActivityIndicator size="small" color="#0000ff" />
      </View>
    );
  }

  return (
    <View>
      <Animated.View className="bg-white" style={contentAnimatedStyle}>
        <TouchableOpacity 
          className="px-4 py-3 flex-row items-center justify-between"
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
               <FontAwesome name="user" size={24} color="gray" />
              </View>
            )}
            <View className="ml-3">
              <Text className="font-semibold text-[14px]">
                {post?.user?.username || 'Unknown User'}
                {post?.user?.verified && (
                  <Ionicons name="checkmark-circle" size={14} color="#3897F0" style={{ marginLeft: 4 }} />
                )}
              </Text>
              <Text className="text-xs text-gray-500">{timeAgo}</Text>
            </View>
          </View>
        </TouchableOpacity>

        <GestureDetector gesture={doubleTapGesture}>
          <TouchableOpacity activeOpacity={1}>
            <View className="relative">
              <Image
                source={{ uri: post.media_url || 'https://via.placeholder.com/500' }}
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
        </GestureDetector>

        {/* Actions */}
        <View className="px-4 pt-3 pb-1">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-4">
              <LikeButton 
                ref={likeButtonRef}
                isLiked={liked}
                postId={post.id}
                postUserId={post.user_id}
                userId={user?.id}
                onLikeChange={(newLikedState) => {
                  setLiked(newLikedState);
                  supabase
                    .from('likes')
                    .select('*', { count: 'exact', head: true })
                    .eq('post_id', post.id)
                    .then(({ count }) => {
                      setLikeCount(count ?? 0);
                    });
                }}
              />
              <TouchableOpacity 
                onPress={handleLikeCountPress}
                className="active:opacity-60"
              >
                <Text className="text-sm font-semibold text-gray-800">
                  {likeCount} likes
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={handleCommentPress}
                className="active:opacity-60 flex-row items-center gap-2"
              >
                <Feather name="message-circle" size={26} color="#262626" />
                <Text className="text-sm font-semibold text-gray-800">{commentCount}</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={handleShare}
                className="active:opacity-60"
              >
                <Animated.View>
                  <Feather name="send" size={24} color="#262626" />
                </Animated.View>
              </TouchableOpacity>
            </View>
            <TouchableOpacity 
              onPress={toggleSavePost}
              className="active:opacity-60"
            >
              <Feather name="bookmark" size={24} color={isSaved ? "#FFD700" : "#262626"} />
            </TouchableOpacity>
          </View>

          {/* Likes & Caption */}
          <View className="mt-2">
            <Text className="font-semibold text-[14px]">
              {liked ? "You and " : ""}{likeCount} {likeCount === 1 ? 'like' : 'likes'}
            </Text>
            {post.caption && (
              <Text className="text-[14px] leading-5 mt-1">
                <Text className="font-semibold">{post.user?.username || 'Unknown'} </Text>
                <Text className="ml-1">{post.caption}</Text>
              </Text>
            )}
          </View>

          {/* Add Comment Button */}
          <TouchableOpacity 
            onPress={handleCommentPress}
            className="mt-2 mb-1"
          >
            <Text className="text-gray-500 text-sm">Add a comment</Text>
          </TouchableOpacity>
        </View>

        {/* Separator */}
        <View className="h-[1px] bg-gray-100 mt-1" />
      </Animated.View>
    </View>
  );
}

// Add these styles
const styles = StyleSheet.create({
  likeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  contentContainer: {
    paddingBottom: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
});