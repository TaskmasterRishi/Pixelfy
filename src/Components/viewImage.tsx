import React, { useState, useEffect, useRef } from 'react';
import { Modal, Image, TouchableOpacity, View, Text, Pressable, LayoutChangeEvent, ScrollView, TextInput, ActivityIndicator } from 'react-native';
import { GestureHandlerRootView, PinchGestureHandler, PinchGestureHandlerGestureEvent, State } from 'react-native-gesture-handler';
import { Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import Animated, { useAnimatedGestureHandler, useSharedValue, withSpring, useAnimatedStyle, withTiming, Easing, FadeIn, FadeOut, SlideInUp } from 'react-native-reanimated';
import { supabase } from '../lib/supabase';
import { useAuth } from '~/providers/AuthProvider';
import { Alert, Linking } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import { deleteImage } from '../lib/cloudinary';
import Toast from 'react-native-toast-message';

interface Comment {
  id: string;
  user: {
    username: string;
    avatar_url: string;
  };
  content: string;
  created_at: string;
}

interface ViewImageProps {
  visible: boolean;
  imageUrl: string;
  onClose: () => void;
  postId?: string;
  initialComments?: Comment[];
  onBookmarkPress?: () => void;
}

// Define the shape of data returned from Supabase
interface PostDataFromSupabase {
  id: string;
  caption: string | null;
  created_at: string;
  media_url: string;
  users: {
    username: string;
    avatar_url: string | null;
  } | null;
}

interface CommentDataFromSupabase {
  id: string;
  content: string;
  created_at: string;
  users: {
    username: string;
    avatar_url: string | null;
  } | null;
}

const formatTimeAgo = (date: Date) => {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + 'y';
  
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + 'm';
  
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + 'd';
  
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + 'h';
  
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + 'm';
  
  return Math.floor(seconds) + 's';
};

const ViewImage: React.FC<ViewImageProps> = ({ 
  visible, 
  imageUrl, 
  onClose,
  postId,
  initialComments = [],
  onBookmarkPress
}) => {
  const [fullScreen, setFullScreen] = useState(false);
  const [originalWidth, setOriginalWidth] = useState(0);
  const [originalHeight, setOriginalHeight] = useState(0);
  const { user, username: currentUsername } = useAuth();
  const [postData, setPostData] = useState<{
    username: string;
    avatarUrl: string | null;
    timestamp: Date | null;
    likesCount: number;
    caption: string | null;
    postId: string | null;
  } | null>(null);
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [showOptions, setShowOptions] = useState(false);
  const optionsPanelY = useSharedValue(500);
  const cardOpacity = useSharedValue(0);
  const cardScale = useSharedValue(0.95);
  const scale = useSharedValue(1);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [contentReady, setContentReady] = useState(true);
  const previousPostId = useRef<string | null>(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  
  const cardAnimatedStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ scale: cardScale.value }],
  }));

  const animatedImageStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  useEffect(() => {
    if (imageUrl) {
      setOriginalWidth(4);
      setOriginalHeight(3);
      
      Image.getSize(
        imageUrl,
        (width, height) => {
          setOriginalWidth(width);
          setOriginalHeight(height);
        },
        (error) => {
          console.warn('Failed to get image size:', error);
        }
      );
      
      Image.prefetch(imageUrl).catch(() => {});
    }
  }, [imageUrl]);

  useEffect(() => {
    if (visible) {
      cardOpacity.value = 0;
      cardScale.value = 0.95;
      setIsLoading(true);
      
      loadingTimeoutRef.current = setTimeout(() => {
        cardOpacity.value = withTiming(1, { duration: 250 });
        cardScale.value = withTiming(1, { duration: 250 });
        setIsLoading(false);
      }, 300);
    } else {
      cardOpacity.value = withTiming(0, { duration: 200 });
      cardScale.value = withTiming(0.95, { duration: 200 });
      
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    }
    
    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, [visible]);

  useEffect(() => {
    if (!postId || !visible || postId === previousPostId.current) return;
    
    previousPostId.current = postId;
    let isMounted = true;

    const fetchPostData = async () => {
      try {
        const postPromise = supabase
          .from('posts')
          .select(`
            id, caption, created_at, media_url,
            users:user_id (username, avatar_url)
          `)
          .eq('id', postId)
          .single();

        const likesPromise = supabase
          .from('likes')
          .select('id', { count: 'exact' })
          .eq('post_id', postId);

        const commentsPromise = supabase
          .from('comments')
          .select(`
            id, content, created_at,
            users (username, avatar_url)
          `)
          .eq('post_id', postId)
          .order('created_at', { ascending: true });

        const [postResult, likesResult, commentsResult] = await Promise.all([
          postPromise, likesPromise, commentsPromise
        ]);

        if (!isMounted) return;

        if (postResult.error) throw postResult.error;
        if (likesResult.error) throw likesResult.error;
        if (commentsResult.error) throw commentsResult.error;

        const typedPostData = postResult.data as unknown as PostDataFromSupabase;
        const likesCount = likesResult.count || 0;
        const typedCommentsData = commentsResult.data as unknown as CommentDataFromSupabase[];

        setPostData({
          username: typedPostData.users?.username || 'Unknown',
          avatarUrl: typedPostData.users?.avatar_url || null,
          timestamp: typedPostData.created_at ? new Date(typedPostData.created_at) : null,
          likesCount: likesCount,
          caption: typedPostData.caption || null,
          postId: typedPostData.id
        });

        setComments(
          typedCommentsData.map(comment => ({
            id: comment.id,
            user: {
              username: comment.users?.username || 'Unknown',
              avatar_url: comment.users?.avatar_url || ''
            },
            content: comment.content,
            created_at: comment.created_at
          }))
        );

        setIsLoading(false);
        setContentReady(true);
        cardOpacity.value = withTiming(1, { duration: 250 });
        cardScale.value = withTiming(1, { duration: 250 });

      } catch (error) {
        if (!isMounted) return;
        console.error('Error fetching post data:', error);
        setIsLoading(false);
        Toast.show({
          type: 'error',
          text1: 'Error loading post',
          text2: 'Please try again'
        });
      }
    };

    fetchPostData();
    
    return () => { isMounted = false; };
  }, [postId, visible]);

  const pinchHandler = useAnimatedGestureHandler<PinchGestureHandlerGestureEvent, { startScale: number }>({
    onStart: (_, ctx) => { ctx.startScale = scale.value; },
    onActive: (event, ctx) => {
      scale.value = Math.max(1, Math.min(ctx.startScale * event.scale, 3));
    },
    onEnd: () => {
      scale.value = withSpring(1);
    },
  });

  const handleDownload = async () => {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Denied',
          'Please enable photo library access in settings',
          [{ text: 'Open Settings', onPress: () => Linking.openSettings() }, { text: 'Cancel' }]
        );
        return;
      }
      
      Toast.show({
        type: 'info',
        text1: 'Downloading image...'
      });
      
      const fileUri = FileSystem.documentDirectory + "temp_image.jpg";
      const { uri } = await FileSystem.downloadAsync(imageUrl, fileUri);
      await MediaLibrary.saveToLibraryAsync(uri);
      
      Toast.show({
        type: 'success',
        text1: 'Image saved to gallery'
      });
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: 'Failed to download image'
      });
    } finally {
      FileSystem.deleteAsync(FileSystem.documentDirectory + "temp_image.jpg", { idempotent: true });
    }
  };

  const handleShare = async () => {
    try {
      Toast.show({
        type: 'info',
        text1: 'Preparing to share...'
      });
      
      const fileUri = FileSystem.documentDirectory + "temp_image.jpg";
      const { uri } = await FileSystem.downloadAsync(imageUrl, fileUri);
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

  const handleDeletePost = async () => {
    if (!postId || !user) return;
    
    Alert.alert('Delete Post', 'This action cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', 
        style: 'destructive', 
        onPress: async () => {
          try {
            Toast.show({
              type: 'info',
              text1: 'Deleting post...'
            });
            
            const publicId = imageUrl.split('/').pop()?.split('.')[0];
            
            const deleteSuccess = await deleteImage(publicId!);
            if (!deleteSuccess) throw new Error('Failed to delete image');
            
            const { error } = await supabase
              .from('posts')
              .delete()
              .eq('id', postId)
              .eq('user_id', user.id);
              
            if (error) throw error;
            
            Toast.show({
              type: 'success',
              text1: 'Post deleted successfully'
            });
            
            onClose();
          } catch (err) {
            Toast.show({
              type: 'error',
              text1: 'Failed to delete post'
            });
          }
        }
      }
    ]);
  };

  const handleBookmarkPress = async () => {
    if (!postId || !user) return;
    try {
      setIsBookmarked(!isBookmarked);
      const { error } = await supabase
        .from('saved_posts')
        .upsert({ user_id: user.id, post_id: postId }, { onConflict: 'user_id' });
      if (error) throw error;
      Toast.show({
        type: 'success',
        text1: isBookmarked ? 'Post unsaved' : 'Post saved'
      });
    } catch (error) {
      console.error('Error saving post:', error);
      Toast.show({
        type: 'error',
        text1: 'Failed to save post'
      });
    }
  };

  const toggleSavePost = async () => {
    if (!postId || !user) return;
    try {
      if (isSaved) {
        const { error } = await supabase
          .from('saved_posts')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);

        if (error) throw error;

        setIsSaved(false);
        Toast.show({
          type: 'success',
          text1: 'Post removed from saved posts'
        });
      } else {
        const { error } = await supabase
          .from('saved_posts')
          .insert({ user_id: user.id, post_id: postId });

        if (error) throw error;

        setIsSaved(true);
        Toast.show({
          type: 'success',
          text1: 'Post added to saved posts'
        });
      }
    } catch (error) {
      console.error('Error toggling save post:', error);
      Toast.show({
        type: 'error',
        text1: 'Failed to toggle save post'
      });
    }
  };

  useEffect(() => {
    optionsPanelY.value = withSpring(showOptions ? 0 : 500, { damping: 15 });
  }, [showOptions]);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <GestureHandlerRootView className="flex-1">
        <BlurView intensity={1800} tint="dark" className="flex-1 justify-center items-center">
          <Pressable className="absolute inset-0" onPress={onClose} />

          <Animated.View 
            style={cardAnimatedStyle}
            className="w-[90%] max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl"
          >
            {isLoading && (
              <View className="p-8 h-[520px] items-center justify-center">
                <ActivityIndicator size="large" color="#0ea5e9" />
                <Text className="text-lg font-medium text-gray-700 mt-4">Loading post...</Text>
              </View>
            )}

            {!isLoading && (
              <View className="w-full">
                <View className="flex-row items-center p-4 border-b border-gray-100">
                  <TouchableOpacity onPress={onClose} className="absolute left-4 z-10 p-2">
                    <Feather name="x" size={24} color="black" />
                  </TouchableOpacity>
                  
                  <View className="flex-row items-center flex-1 ml-12">
                    {postData?.avatarUrl ? (
                      <Image 
                        source={{ uri: postData.avatarUrl }} 
                        className="w-10 h-10 rounded-full"
                      />
                    ) : (
                      <View className="w-10 h-10 rounded-full bg-gray-200 items-center justify-center">
                        <Feather name="user" size={20} color="black" />
                      </View>
                    )}
                    <View className="ml-3">
                      <Text className="text-black font-semibold text-base">{postData?.username || 'Unknown'}</Text>
                      <Text className="text-gray-500 text-xs">
                        {postData?.timestamp ? formatTimeAgo(postData.timestamp) : 'Just now'}
                      </Text>
                    </View>
                  </View>
                  
                  {postData?.username === currentUsername && (
                    <TouchableOpacity 
                      onPress={() => setShowOptions(true)}
                      className="p-2"
                    >
                      <Feather name="more-horizontal" size={24} color="black" />
                    </TouchableOpacity>
                  )}
                </View>

                <PinchGestureHandler onGestureEvent={pinchHandler} onHandlerStateChange={(event) => {
                  if (event.nativeEvent.state === State.END) {
                    scale.value = withSpring(1);
                  }
                }}>
                  <Animated.View 
                    className="w-full bg-black items-center justify-center" 
                    style={{
                      height: 380,
                      overflow: 'hidden',
                    }}
                  >
                    <Animated.Image
                      source={{ uri: imageUrl }}
                      className="w-full h-full"
                      style={[
                        animatedImageStyle,
                        {
                          width: '100%',
                          height: '100%',
                          maxWidth: '100%',
                          maxHeight: '100%',
                        }
                      ]}
                      resizeMode="cover"
                    />
                  </Animated.View>
                </PinchGestureHandler>

                <View className="p-4 border-t border-gray-100">
                  <View className="flex-row justify-between items-center mb-3">
                    <View className="flex-row items-center space-x-5">
                      <View className="flex-row items-center">
                        <TouchableOpacity className="p-1">
                          <Feather name="heart" size={26} color="black" />
                        </TouchableOpacity>
                        <Text className="text-black font-semibold text-sm ml-2">
                          {postData?.likesCount ? postData.likesCount.toLocaleString() + " likes" : "0 likes"}
                        </Text>
                      </View>
                      <TouchableOpacity className="p-1">
                        <Feather name="message-circle" size={26} color="black" />
                      </TouchableOpacity>
                      <TouchableOpacity className="p-1" onPress={handleShare}>
                        <Feather name="send" size={26} color="black" />
                      </TouchableOpacity>
                    </View>
                    <TouchableOpacity className="p-1" onPress={toggleSavePost}>
                      <Feather name="bookmark" size={26} color={isSaved ? "#FFD700" : "black"} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}
          </Animated.View>

          {fullScreen && (
            <Pressable 
              className="absolute inset-0 bg-black/90 justify-center items-center"
              onPress={() => setFullScreen(false)}
            >
              <Image
                source={{ uri: imageUrl }}
                style={{
                  width: '100%',
                  height: '100%'
                }}
                resizeMode="contain"
              />
            </Pressable>
          )}

          <View className="absolute inset-0" pointerEvents={showOptions ? 'auto' : 'none'}>
            <Pressable 
              className="flex-1"
              onPress={() => setShowOptions(false)}
              style={{ 
                opacity: showOptions ? 1 : 0,
                backgroundColor: showOptions ? 'rgba(0,0,0,0.5)' : 'transparent'
              }}
            />
            <Animated.View 
              style={{ 
                transform: [{ translateY: optionsPanelY }],
                backgroundColor: 'white',
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0
              }}
            >
              <View className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto my-3" />
              
              {postData?.username === currentUsername && (
                <TouchableOpacity 
                  onPress={() => {
                    setShowOptions(false);
                    handleDeletePost();
                  }}
                  className="flex-row items-center px-6 py-4 border-b border-gray-100"
                >
                  <Feather name="trash-2" size={24} color="red" />
                  <Text className="ml-4 text-red-500 font-semibold">Delete Post</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity 
                onPress={() => {
                  setShowOptions(false);
                  handleDownload();
                }}
                className="flex-row items-center px-6 py-4 border-b border-gray-100"
              >
                <Feather name="download" size={24} color="black" />
                <Text className="ml-4 font-medium">Save to Gallery</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                onPress={() => {
                  setShowOptions(false);
                  handleShare();
                }}
                className="flex-row items-center px-6 py-4 border-b border-gray-100"
              >
                <Feather name="share-2" size={24} color="black" />
                <Text className="ml-4 font-medium">Share</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                onPress={() => setShowOptions(false)}
                className="px-6 py-4 mb-2"
              >
                <Text className="text-center text-gray-500 font-medium">Cancel</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </BlurView>
      </GestureHandlerRootView>
    </Modal>
  );
};

export default React.memo(ViewImage);