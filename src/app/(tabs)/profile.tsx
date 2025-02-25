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
  RefreshControl
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '~/src/providers/AuthProvider';
import { supabase } from '~/src/lib/supabase';
import { uploadAvatar, deleteImage } from '~/src/lib/cloudinary';
import FontAwesome from "@expo/vector-icons/FontAwesome";
import Feather from '@expo/vector-icons/Feather';
import { router } from 'expo-router';
import * as FileSystem from 'expo-file-system';
import ViewImage from '~/src/Components/viewImage';

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
  const { user } = useAuth();
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

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    setIsLoading(true);
    try {
      const [profileResponse, postsResponse] = await Promise.all([
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
          .range(0, 9) // Only fetch first 10 posts initially
      ]);

      if (profileResponse.error) throw profileResponse.error;
      if (postsResponse.error) throw postsResponse.error;

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

  const handlePickImage = async () => {
    try {
      // Request permissions first
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'We need access to your photos to upload an avatar');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.3,
      });

      if (!result.canceled && result.assets[0].uri) {
        // Check if the selected file is an image
        const fileInfo = await FileSystem.getInfoAsync(result.assets[0].uri);
        if (!fileInfo.exists) {
          Alert.alert('Error', 'Selected file does not exist');
          return;
        }

        await uploadAndSaveAvatar(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to select image');
    }
  };

  const uploadAndSaveAvatar = async (uri: string) => {
    setIsUpdating(true);
    try {
      // Get the current avatar URL
      const oldAvatarUrl = profile?.avatar_url;

      // Upload new image
      const imageUrl = await uploadAvatar(uri);
      if (!imageUrl) {
        throw new Error('Failed to upload image to Cloudinary');
      }

      // Update Supabase with new avatar URL
      const { error } = await supabase
        .from('users')
        .update({ avatar_url: imageUrl })
        .eq('id', user.id);

      if (error) throw error;

      // Delete old avatar if it exists
      if (oldAvatarUrl) {
        try {
          // Extract public ID from URL
          const urlParts = oldAvatarUrl.split('/');
          const publicId = urlParts[urlParts.length - 1].split('.')[0];
          console.log('Extracted Public ID:', publicId); // Debug log
          await deleteImage(publicId);
        } catch (error) {
          console.error('Error deleting old avatar:', error);
          // Continue even if deletion fails
        }
      }

      Alert.alert('Success', 'Profile picture updated successfully');
      await fetchProfile();
    } catch (error) {
      console.error('Error updating avatar:', error);
      Alert.alert('Error', error.message || 'Failed to update profile picture');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error('Error signing out:', error);
      Alert.alert('Error', 'Failed to sign out');
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
    // Create a new object with all required data
    const postData = {
      id: post.id,
      mediaUrl: post.media_url,
      username: post.user.username,
      avatarUrl: post.user.avatar_url,
      timestamp: post.created_at,
      caption: post.caption,
      likesCount: post.likes_count,
      comments: []
    };
    
    // Set the selected post data
    setSelectedPost(postData);
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#0ea5e9" />
      </View>
    );
  }

  return (
    <ScrollView 
      className="flex-1 bg-white" 
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      onScroll={({ nativeEvent }) => {
        if (isCloseToBottom(nativeEvent)) {
          loadMorePosts();
        }
      }}
      scrollEventThrottle={400}
    >
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
      />
      
      <View className="px-4 py-6">
        {profile && (
          <>
            {/* Profile Header */}
            <View className="flex-row items-center justify-between mb-6">
              <View className="flex-1">
                <Text className="text-2xl font-bold text-gray-900">{username || 'Username'}</Text>
                <Text className="text-gray-500">{user?.email}</Text>
              </View>
            </View>

            {/* Avatar Section */}
            <View className="items-center mb-6">
              <View className="relative">
                <TouchableOpacity onPress={handlePickImage}>
                  {profile.avatar_url ? (
                    <Image
                      source={{ uri: profile.avatar_url }}
                      className="w-24 h-24 rounded-full border-2 border-gray-200"
                    />
                  ) : (
                    <View className="w-24 h-24 rounded-full bg-gray-100 items-center justify-center border-2 border-gray-200">
                      <FontAwesome name="user" size={40} color="#9ca3af" />
                    </View>
                  )}
                  <View className="absolute bottom-0 right-0 bg-blue-500 rounded-full p-2 border-2 border-white shadow">
                    <Feather name="edit-2" size={16} color="white" />
                  </View>
                </TouchableOpacity>
              </View>
            </View>

            {/* Stats Section */}
            <View className="flex-row justify-around mb-6">
              <View className="items-center">
                <Text className="text-xl font-bold text-gray-900">{postsCount}</Text>
                <Text className="text-gray-500">Posts</Text>
              </View>
              <TouchableOpacity className="items-center">
                <Text className="text-xl font-bold text-gray-900">0</Text>
                <Text className="text-gray-500">Followers</Text>
              </TouchableOpacity>
              <TouchableOpacity className="items-center">
                <Text className="text-xl font-bold text-gray-900">0</Text>
                <Text className="text-gray-500">Following</Text>
              </TouchableOpacity>
            </View>

            {/* Bio */}
            {profile?.full_name && (
              <Text className="text-gray-900 px-4 font-bold">{profile.full_name}</Text>
            )}

            {bio && (
              <Text className="text-gray-900 mb-6 px-4">{bio}</Text>
            )}

            {/* Action Buttons */}
            <View className="flex-row gap-2 mb-6">
              <TouchableOpacity 
                onPress={() => router.push('/(screens)/edit-profile')}
                className="flex-1 py-2 rounded-lg bg-gray-100"
              >
                <Text className="text-center font-semibold">Edit Profile</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                onPress={handleSignOut}
                className="flex-1 py-2 rounded-lg bg-gray-100"
              >
                <Text className="text-center font-semibold">Sign Out</Text>
              </TouchableOpacity>
            </View>

            {/* Grid Toggle */}
            <View className="flex-row border-t border-gray-200">
              <TouchableOpacity 
                onPress={() => setActiveTab('posts')}
                className={`flex-1 p-3 items-center ${
                  activeTab === 'posts' ? 'border-b-2 border-black' : ''
                }`}
              >
                <FontAwesome 
                  name="th" 
                  size={24} 
                  color={activeTab === 'posts' ? 'black' : 'gray'} 
                />
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => setActiveTab('saved')}
                className={`flex-1 p-3 items-center ${
                  activeTab === 'saved' ? 'border-b-2 border-black' : ''
                }`}
              >
                <FontAwesome 
                  name="bookmark-o" 
                  size={24} 
                  color={activeTab === 'saved' ? 'black' : 'gray'} 
                />
              </TouchableOpacity>
            </View>

            {/* Posts Grid */}
            {activeTab === 'posts' && (
              <View className="flex-row flex-wrap mt-5" style={{ width: '100%' }}>
                {posts.map((post) => (
                  <TouchableOpacity 
                    key={post.id} 
                    className="w-[48%] mb-2 mx-[1%]"
                    onPress={() => handlePostPress(post)}
                  >
                    <View className="aspect-square rounded-lg shadow-sm bg-gray-100 overflow-hidden">
                      <Image
                        source={{ uri: post.media_url }}
                        className="w-full h-full"
                        style={{ resizeMode: 'cover' }}
                      />
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Empty State */}
            {posts.length === 0 && activeTab === 'posts' && (
              <View className="items-center justify-center py-12">
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

            {/* Saved Posts Empty State */}
            {activeTab === 'saved' && (
              <View className="items-center justify-center py-12">
                <FontAwesome name="bookmark" size={48} color="#9ca3af" />
                <Text className="text-gray-400 mt-4 text-center">
                  No Saved Posts
                </Text>
              </View>
            )}
          </>
        )}
      </View>

      {/* Add loading indicator at the bottom */}
      {hasMorePosts && (
        <View className="py-4">
          <ActivityIndicator size="small" color="#0ea5e9" />
        </View>
      )}
    </ScrollView>
  );
};

// Helper function to check if user is close to bottom
const isCloseToBottom = ({ layoutMeasurement, contentOffset, contentSize }) => {
  const paddingToBottom = 20;
  return layoutMeasurement.height + contentOffset.y >=
    contentSize.height - paddingToBottom;
};

export default ProfileScreen;
