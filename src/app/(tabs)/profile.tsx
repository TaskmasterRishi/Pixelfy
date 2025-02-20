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
  useWindowDimensions 
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '~/src/providers/AuthProvider';
import { supabase } from '~/src/lib/supabase';
import { uploadAvatar } from '~/src/lib/cloudinary';
import FontAwesome from "@expo/vector-icons/FontAwesome";
import Feather from '@expo/vector-icons/Feather';
import { router } from 'expo-router';

const ProfileScreen = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [posts, setPosts] = useState([]);
  const [postsCount, setPostsCount] = useState(0);
  const [activeTab, setActiveTab] = useState('posts'); // 'posts' or 'saved'
  const { width } = useWindowDimensions();

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    setIsLoading(true);
    try {
      // Fetch profile data
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, username, bio, avatar_url')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      setProfile(profileData);
      setUsername(profileData.username || '');
      setBio(profileData.bio || '');

      // Fetch posts count
      const { count, error: countError } = await supabase
        .from('post')
        .select('id', { count: 'exact' })
        .eq('user_id', user.id);

      if (countError) throw countError;
      setPostsCount(count || 0);

      // Fetch posts
      const { data: postsData, error: postsError } = await supabase
        .from('post')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (postsError) throw postsError;
      setPosts(postsData || []);

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
        .from('profiles')
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
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0].uri) {
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
      const imageUrl = await uploadAvatar(uri);
      if (!imageUrl) throw new Error('Failed to upload image');

      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: imageUrl })
        .eq('id', user.id);

      if (error) throw error;
      await fetchProfile();
    } catch (error) {
      console.error('Error updating avatar:', error);
      Alert.alert('Error', 'Failed to update profile picture');
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

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#0ea5e9" />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-white">
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
              <View className="flex-row flex-wrap">
                {posts.map((post) => (
                  <TouchableOpacity 
                    key={post.id} 
                    className="w-1/3 aspect-square p-0.5"
                  >
                    <Image
                      source={{ uri: post.image }}
                      className="w-full h-full"
                    />
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
    </ScrollView>
  );
};

export default ProfileScreen;
