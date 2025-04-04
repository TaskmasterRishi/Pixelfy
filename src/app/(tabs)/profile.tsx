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
import ViewImage from '~/Components/viewImage';
import StoryViewer from '~/app/story/StoryViewer';
import { useAuth } from '~/providers/AuthProvider';
import { supabase } from '~/lib/supabase';
import { BlurView } from 'expo-blur';
import Animated, { useSharedValue, withSpring } from 'react-native-reanimated';

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
  const [activeTab, setActiveTab] = useState('posts'); // 'posts' or 'saved'
  const { width } = useWindowDimensions();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedPost, setSelectedPost] = useState<{
    id: string;
    mediaUrl: string;
    username: string;
    avatarUrl: string;
    timestamp: string;
    caption: string;
    likesCount: number;
    comments: any[];
  } | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMorePosts, setHasMorePosts] = useState(true);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [stories, setStories] = useState<Story[]>([]);
  const [showStoryViewer, setShowStoryViewer] = useState(false);
  const [isViewImageVisible, setIsViewImageVisible] = useState(false); // State to control ViewImage visibility
  const [showOptions, setShowOptions] = useState(false);
  const optionsPanelY = useSharedValue(500);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  useEffect(() => {
    const fetchStories = async () => {
      try {
        const { data, error } = await supabase
          .from('stories')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true });

        if (error) throw error;
        setStories(data || []);
      } catch (error) {
        console.error('Error fetching stories:', error);
      }
    };

    if (user) {
      fetchStories();
    }
  }, [user]);

  useEffect(() => {
    if (refresh === 'true') {
      fetchProfile();
    }
  }, [refresh]);

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
      const [profileResponse, postsResponse, followersResponse, followingResponse] = await Promise.all([
        supabase
          .from('users')
          .select('id, username, full_name, email, avatar_url, bio, website, is_private, verified')
          .eq('id', user.id)
          .single(),
        supabase
          .from('posts')
          .select(`
            id, 
            media_url, 
            caption, 
            created_at, 
            user:users(username, avatar_url),
            likes:likes(count)
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .range(0, 9), // Only fetch first 10 posts initially
        supabase
          .from('friends')
          .select('friend_id', { count: 'exact' })
          .eq('friend_id', user.id), // Count followers
        supabase
          .from('friends')
          .select('user_id', { count: 'exact' })
          .eq('user_id', user.id) // Count following
      ]);

      if (profileResponse.error) throw profileResponse.error;
      if (postsResponse.error) throw postsResponse.error;
      if (followersResponse.error) throw followersResponse.error;
      if (followingResponse.error) throw followingResponse.error;

      setProfile(profileResponse.data);
      setUsername(profileResponse.data.username || '');
      setBio(profileResponse.data.bio || '');

      const processedPosts = postsResponse.data.map(post => ({
        ...post,
        likes_count: post.likes[0]?.count || 0
      }));

      setPosts(processedPosts || []);
      setPostsCount(processedPosts.length || 0);
      setHasMorePosts(processedPosts.length >= 10);

      // Update follower and following counts
      const followersCount = followersResponse.count || 0;
      const followingCount = followingResponse.count || 0;

      // Set the counts in state (you'll need to create these states)
      setFollowersCount(followersCount);
      setFollowingCount(followingCount);

    } catch (error) {
      console.error('Error fetching profile data:', error.message);
      Alert.alert('Error', 'Failed to load profile data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({ username, bio })
        .eq('id', user.id);

      if (error) throw error;

      Alert.alert('Success', 'Profile updated successfully');
      await fetchProfile();
    } catch (error) {
      console.error('Error updating profile:', error.message);
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleShareProfile = async () => {
    try {
      // Debugging: Log the username and share message
      console.log('Username:', username);
      const shareMessage = `Check out my profile on Pixelfy: https://pixelfy.com/profile/${username}`;
      console.log('Share Message:', shareMessage); // Log the share message
      await Share.share({
        message: shareMessage,
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
      const { data, error } = await supabase
        .from('posts')
        .select(`
          id, 
          media_url, 
          caption, 
          created_at, 
          user:users(username, avatar_url),
          likes:likes(count)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .range(page * 10, (page + 1) * 10 - 1);

      if (error) throw error;

      if (data.length > 0) {
        const processedPosts = data.map(post => ({
          ...post,
          likes_count: post.likes[0]?.count || 0
        }));

        setPosts(prev => [...prev, ...processedPosts]);
        setPage(prev => prev + 1);
        setHasMorePosts(data.length >= 10);
      } else {
        setHasMorePosts(false);
      }
    } catch (error) {
      console.error('Error loading more posts:', error);
    }
  };

  const handlePostPress = (post: Post) => {
    setSelectedPost({
      id: post.id,
      mediaUrl: post.media_url,
      username: post.user.username,
      avatarUrl: post.user.avatar_url,
      timestamp: post.created_at,
      caption: post.caption,
      likesCount: post.likes_count
    });
  };

  const handleAvatarPress = () => {
    if (stories.length > 0 && isMounted) {
      // Create grouped stories object with proper structure
      const groupedStories = {
        [user.id]: stories.map(story => ({
          id: story.id,
          media_url: story.media_url,
          type: story.media_type,
          caption: story.caption,
          created_at: story.created_at,
          user: {
            id: user.id,
            username: profile.username,
            avatar_url: profile.avatar_url
          }
        }))
      };

      router.push({
        pathname: "/story/StoryViewer",
        params: { 
          storyData: JSON.stringify(groupedStories),
          initialUserId: user.id
        }
      });
    }
  };

  const handleLogout = async () => {
    setShowOptions(false);
    try {
      // Clear the session in the auth provider
      setSession(null);
      
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        throw error;
      }
      
      // Only navigate if component is mounted
      if (isMounted) {
        router.replace('/(auth)/');
      }
    } catch (error) {
      console.error('Error logging out:', error);
      Alert.alert('Error', 'Failed to log out. Please try again.');
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

      <ScrollView 
        className="flex-1 bg-white"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        }
      >
        {/* Profile Info Section */}
        <View className="p-6">
          <View className="flex-row items-center mb-6">
            <TouchableOpacity 
              onPress={handleAvatarPress}
              disabled={stories.length === 0}
              className="mr-4"
            >
              {profile.avatar_url ? (
                <Image
                  source={{ uri: profile.avatar_url }}
                  className={`w-20 h-20 rounded-full border-2 ${
                    stories.length > 0 ? 'border-blue-500' : 'border-gray-200'
                  }`}
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
              onPress={() => router.push(`/(screens)/follow-list?type=followers&userId=${user.id}`)}
            >
              <Text className="text-lg font-bold">{followersCount}</Text>
              <Text className="text-sm text-gray-500">Followers</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              className="items-center"
              onPress={() => router.push(`/(screens)/follow-list?type=following&userId=${user.id}`)}
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
                  onPress={() => handlePostPress(post)}
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

      {/* ViewImage Modal */}
      <ViewImage
        visible={!!selectedPost}
        imageUrl={selectedPost?.mediaUrl || ''}
        postId={selectedPost?.id}
        onClose={() => setSelectedPost(null)}
        username={selectedPost?.username}
        avatarUrl={selectedPost?.avatarUrl}
        timestamp={selectedPost?.timestamp}
        caption={selectedPost?.caption}
        likesCount={selectedPost?.likesCount}
        initialComments={[]}
        style={{ width: '100%', margin: 0 }}
      />

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
    </>
  );
};

// Helper function to check if user is close to bottom
const isCloseToBottom = ({ layoutMeasurement, contentOffset, contentSize }) => {
  const paddingToBottom = 20;
  return layoutMeasurement.height + contentOffset.y >=
    contentSize.height - paddingToBottom;
};

export default ProfileScreen;
