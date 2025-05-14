import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  Image, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert, 
  ScrollView,
  useWindowDimensions,
  RefreshControl,
  Share,
  Pressable
} from 'react-native';
import FontAwesome from "@expo/vector-icons/FontAwesome";
import Feather from '@expo/vector-icons/Feather';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import StoryViewer from '~/app/story/StoryViewer';
import { useAuth } from '~/providers/AuthProvider';
import { supabase } from '~/lib/supabase';
import { BlurView } from 'expo-blur';
import Animated, { useSharedValue, withSpring } from 'react-native-reanimated';
import ViewImage from '~/Components/viewImage';

// Define the Post type
type Post = {
  id: string;
  media_url: string;
  caption: string;
  created_at: string;
  user: {
    username: string;
    avatar_url: string;
  };
  likes_count: number;
};

const ProfileScreen = () => {
  const { user, setSession } = useAuth();
  const { refresh } = useLocalSearchParams();
  const [profile, setProfile] = useState<any>(null);
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [postsCount, setPostsCount] = useState(0);
  const [activeTab, setActiveTab] = useState('posts');
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMorePosts, setHasMorePosts] = useState(true);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [stories, setStories] = useState<any[]>([]);
  const [showStoryViewer, setShowStoryViewer] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const optionsPanelY = useSharedValue(500);
  const [isMounted, setIsMounted] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user, refresh]);

  useEffect(() => {
    if (showOptions) {
      optionsPanelY.value = withSpring(0, { damping: 15 });
    } else {
      optionsPanelY.value = withSpring(500, { damping: 15 });
    }
  }, [showOptions]);


  const fetchProfile = async () => {
    setIsLoading(true);
    try {
      if (!user) throw new Error('User not found');
      const [profileResponse, postsResponse, followersResponse, followingResponse] = await Promise.all([
        supabase.from('users').select('*').eq('id', user.id).single(),
        supabase.from('posts').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).range(0, 9),
        supabase.from('friends').select('friend_id', { count: 'exact' }).eq('friend_id', user.id),
        supabase.from('friends').select('user_id', { count: 'exact' }).eq('user_id', user.id)
      ]);

      setProfile(profileResponse.data);
      setUsername(profileResponse.data?.username || '');
      setBio(profileResponse.data?.bio || '');
      const postsData = postsResponse.data || [];
      setPosts(postsData);
      setPostsCount(postsData.length);
      setHasMorePosts(postsData.length >= 10);
      setFollowersCount(followersResponse.count ?? 0);
      setFollowingCount(followingResponse.count ?? 0);
    } catch (error) {
      console.error('Error fetching profile data:', error instanceof Error ? error.message : 'Unknown error');
      Alert.alert('Error', 'Failed to load profile data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!user) return;
    
    setIsUpdating(true);
    try {
      const { error } = await supabase.from('users').update({ username, bio }).eq('id', user.id);
      if (error) throw error;
      Alert.alert('Success', 'Profile updated successfully');
      await fetchProfile();
    } catch (error) {
      console.error('Error updating profile:', error instanceof Error ? error.message : 'Unknown error');
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleShareProfile = async () => {
    try {
      await Share.share({
        message: `Check out my profile on Pixelfy: https://pixelfy.com/profile/${username}`,
      });
    } catch (error) {
      console.error('Error sharing profile:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProfile();
    setRefreshing(false);
  };

  const loadMorePosts = async () => {
    if (!hasMorePosts) return;
    try {
      if (!user) return;
      
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .range(page * 10, (page + 1) * 10 - 1);

      if (error) {
        console.error('Error loading posts:', error);
        return;
      }

      if (data && data.length > 0) {
        setPosts(prev => [...(prev || []), ...data]);
        setPage(prev => prev + 1);
        setHasMorePosts(data.length >= 10);
      } else {
        setHasMorePosts(false);
      }
    } catch (error) {
      console.error('Error loading more posts:', error);
    }
  };

  const handleLogout = async () => {
    setShowOptions(false);
    try {
      setSession(null);
      await supabase.auth.signOut();
      if (isMounted) router.replace('/(auth)/');
    } catch (error) {
      Alert.alert('Error', 'Failed to log out. Please try again.');
    }
  };

  const handleImagePress = (post: Post) => {
    setSelectedImage(post.media_url);
    setSelectedPost(post);
  };

  const handleSavePost = async (postId: string) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('saved_posts')
        .insert({ user_id: user.id, post_id: postId });

      if (error) throw error;

      Alert.alert('Success', 'Post saved successfully');
    } catch (error) {
      console.error('Error saving post:', error);
      Alert.alert('Error', 'Failed to save post');
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#0ea5e9" />
      </View>
    );
  }

  return (
    <>
      <View className="flex-row items-center justify-between px-4 py-2 border-b border-gray-200 bg-white">
        <Text className="text-xl font-bold">{username || 'Username'}</Text>
        <View className="flex-row items-center gap-2">
          <TouchableOpacity 
            onPress={() => router.push('/(tabs)/new')}
            className="active:opacity-50"
          >
            <Feather name="plus-square" size={25} color="black" />
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => setShowOptions(true)}
            className="active:opacity-50"
          >
            <Ionicons name="menu" size={28} color="black" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView className="flex-1 bg-white">
        {/* Profile Info Section */}
        <View className="p-6">
          <View className="flex-row items-center mb-6">
            <TouchableOpacity 
              onPress={() => router.push('/(screens)/edit-profile')}
              className="mr-4"
            >
              {profile.avatar_url ? (
                <Image
                  source={{ uri: profile.avatar_url }}
                  className={`w-20 h-20 rounded-full border-2`}
                />
              ) : (
                <View className="w-20 h-20 rounded-full bg-gray-100 items-center justify-center border-2 border-gray-200">
                  <FontAwesome name="user" size={32} color="#9ca3af" />
                </View>
              )}
            </TouchableOpacity>

            <View className="flex-1">
              <Text className="text-xl font-bold">{username}</Text>
              {profile.full_name && (
                <Text className="text-base text-gray-600">{profile.full_name}</Text>
              )}
              {bio && (
                <Text className="text-sm text-gray-500 mt-1">{bio}</Text>
              )}
            </View>
          </View>

          {/* Stats */}
          <View className="flex-row justify-around bg-white p-4 rounded-lg shadow-sm border border-gray-100">
            <View className="items-center">
              <Text className="text-lg font-bold">{postsCount}</Text>
              <Text className="text-sm text-gray-500">Posts</Text>
            </View>
            <TouchableOpacity 
              className="items-center"
              onPress={() => user && router.push(`/(screens)/follow-list?type=followers&userId=${user.id}`)}
            >
              <Text className="text-lg font-bold">{followersCount}</Text>
              <Text className="text-sm text-gray-500">Followers</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              className="items-center"
              onPress={() => user && router.push(`/(screens)/follow-list?type=following&userId=${user.id}`)}
            >
              <Text className="text-lg font-bold">{followingCount}</Text>
              <Text className="text-sm text-gray-500">Following</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Actions */}
        <View className="p-6 bg-gray-50">
          <Text className="text-xl font-semibold mb-4">Quick Actions</Text>
          <View className="flex-row flex-wrap -mx-2">
            <TouchableOpacity
              className="w-1/2 px-2 mb-4"
              onPress={() => router.push('/(screens)/edit-profile')}
            >
              <View className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                <View className="w-10 h-10 rounded-full items-center justify-center mb-3 bg-blue-50">
                  <Feather name="edit" size={20} color="#3b82f6" />
                </View>
                <Text className="text-base font-semibold mb-1">Edit Profile</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              className="w-1/2 px-2 mb-4"
              onPress={handleShareProfile}
            >
              <View className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                <View className="w-10 h-10 rounded-full items-center justify-center mb-3 bg-green-50">
                  <Feather name="share-2" size={20} color="#10b981" />
                </View>
                <Text className="text-base font-semibold mb-1">Share Profile</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Posts Section */}
        <View className="p-6">
          <Text className="text-xl font-semibold mb-4">Your Posts</Text>
          {posts.length > 0 ? (
            <View className="flex-row flex-wrap -mx-1">
              {posts.map((post) => (
                <TouchableOpacity
                  key={post.id}
                  className="w-1/3 p-1"
                  onPress={() => handleImagePress(post)}
                  activeOpacity={0.7}
                >
                  <View className="aspect-square rounded-lg bg-gray-100 overflow-hidden">
                    <Image
                      source={{ uri: post.media_url }}
                      className="w-full h-full"
                      style={{ resizeMode: 'cover' }}
                    />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View className="items-center justify-center py-8">
              <FontAwesome name="camera" size={48} color="#9ca3af" />
              <Text className="text-gray-400 mt-4 text-center">
                No Posts Yet
              </Text>
              <TouchableOpacity 
                onPress={() => router.push('/(tabs)/new')}
                className="mt-4 bg-blue-500 px-6 py-3 rounded-full"
              >
                <Text className="text-white font-semibold">Share Your First Post</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

      </ScrollView>

      {/* Options Modal */}
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
          <View className="w-12 h-1 bg-gray-300 rounded-full mx-auto my-3" />
          
          <TouchableOpacity 
            onPress={() => {
              setShowOptions(false);
              router.push('/(screens)/settings');
            }}
            className="flex-row items-center px-6 py-4 border-b border-gray-200"
          >
            <Feather name="settings" size={24} color="black" />
            <Text className="ml-4">Settings</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => {
              setShowOptions(false);
              router.push('../(screens)/Help');
            }}
            className="flex-row items-center px-6 py-4 border-b border-gray-200"
          >
            <Feather name="help-circle" size={24} color="black" />
            <Text className="ml-4">Help</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => {
              setShowOptions(false);
              router.push('/(screens)/saved-posts');
            }}
            className="flex-row items-center px-6 py-4 border-b border-gray-200"
          >
            <Feather name="bookmark" size={24} color="black" />
            <Text className="ml-4">Saved Posts</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={handleLogout}
            className="flex-row items-center px-6 py-4 border-b border-gray-200"
          >
            <Feather name="log-out" size={24} color="red" />
            <Text className="ml-4 text-red-500">Log Out</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => setShowOptions(false)}
            className="px-6 py-4 mb-6"
          >
            <Text className="text-center text-gray-500">Cancel</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* Image Viewer Modal */}
      <ViewImage
        visible={!!selectedImage}
        imageUrl={selectedImage || ''}
        onClose={() => {
          setSelectedImage(null);
          setSelectedPost(null);
        }}
        postId={selectedPost?.id}
        onBookmarkPress={() => {
          if (selectedPost?.id) {
            handleSavePost(selectedPost.id);
          }
        }}
      />
    </>
  );
};

// Helper function to check if user is close to bottom
const isCloseToBottom = ({
  layoutMeasurement,
  contentOffset,
  contentSize
}: {
  layoutMeasurement: { height: number };
  contentOffset: { y: number };
  contentSize: { height: number };
}) => {
  const paddingToBottom = 20;
  return layoutMeasurement.height + contentOffset.y >=
    contentSize.height - paddingToBottom;
};

export default ProfileScreen;
