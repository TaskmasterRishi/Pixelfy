import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  Image, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert, 
  ScrollView,
  RefreshControl,
  StatusBar
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { supabase } from '~/src/lib/supabase';
import FontAwesome from "@expo/vector-icons/FontAwesome";
import FollowRequest from '~/src/Components/FriendRequest';
import { useAuth } from '~/src/providers/AuthProvider';

type Post = {
  id: string;
  media_url: string;
  caption: string;
  created_at: string;
  likes_count: number;
};

const ViewProfile = () => {
  const { user } = useAuth();
  const { userId } = useLocalSearchParams();
  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState<boolean | null>(null);

  const fetchProfile = async () => {
    setIsLoading(true);
    try {
      const [profileResponse, postsResponse, followersResponse, followingResponse, followStatusResponse] = await Promise.all([
        supabase
          .from('users')
          .select('id, username, full_name, avatar_url, bio, website, is_private, verified')
          .eq('id', userId)
          .single(),
        supabase
          .from('posts')
          .select(`
            id, 
            media_url, 
            caption, 
            created_at,
            likes:likes(count)
          `)
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(10),
        supabase
          .from('friends')
          .select('friend_id', { count: 'exact' })
          .eq('friend_id', userId),
        supabase
          .from('friends')
          .select('user_id', { count: 'exact' })
          .eq('user_id', userId),
        supabase
          .from('friends')
          .select('*')
          .eq('user_id', user.id)
          .eq('friend_id', userId)
          .single()
      ]);

      if (profileResponse.error) throw profileResponse.error;
      if (postsResponse.error) throw postsResponse.error;
      if (followersResponse.error) throw followersResponse.error;
      if (followingResponse.error) throw followingResponse.error;

      setProfile(profileResponse.data);
      
      const processedPosts = postsResponse.data.map(post => ({
        ...post,
        likes_count: post.likes[0]?.count || 0
      }));
      setPosts(processedPosts || []);

      setFollowersCount(followersResponse.count || 0);
      setFollowingCount(followingResponse.count || 0);
      
      setIsFollowing(!!followStatusResponse.data);

    } catch (error) {
      console.error('Error fetching profile data:', error.message);
      Alert.alert('Error', 'Failed to load profile data');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProfile();
    setRefreshing(false);
  };

  useEffect(() => {
    if (userId) {
      fetchProfile();
    }
  }, [userId]);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#0ea5e9" />
      </View>
    );
  }

  if (!profile) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Text className="text-gray-500">User not found</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      {/* Add space at the top */}
      <View style={{ height: StatusBar.currentHeight }} />
      
      <ScrollView 
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View className="px-4 py-6">
          {/* Profile Header */}
          <View className="flex-row items-center justify-between mb-6">
            <View className="flex-1">
              <Text className="text-2xl font-bold text-gray-900">{profile.username}</Text>
              {profile.full_name && (
                <Text className="text-gray-500">{profile.full_name}</Text>
              )}
            </View>
          </View>

          {/* Avatar Section */}
          <View className="items-center mb-6">
            <View className="relative">
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
            </View>
          </View>

          {/* Stats Section */}
          <View className="flex-row justify-around mb-6">
            <View className="items-center">
              <Text className="text-xl font-bold text-gray-900">{posts.length}</Text>
              <Text className="text-gray-500">Posts</Text>
            </View>
            <TouchableOpacity className="items-center">
              <Text className="text-xl font-bold text-gray-900">{followersCount}</Text>
              <Text className="text-gray-500">Followers</Text>
            </TouchableOpacity>
            <TouchableOpacity className="items-center">
              <Text className="text-xl font-bold text-gray-900">{followingCount}</Text>
              <Text className="text-gray-500">Following</Text>
            </TouchableOpacity>
          </View>

          {/* Bio */}
          {profile.bio && (
            <Text className="text-gray-900 mb-6 px-4">{profile.bio}</Text>
          )}

          {/* Follow Button */}
          {user.id !== userId && isFollowing !== null && (
            <View className="mb-6">
              <FollowRequest 
                targetId={userId}
                requesterId={user.id}
                isFollowing={isFollowing}
                onRequestSent={() => setIsFollowing(true)}
                onUnfollow={() => setIsFollowing(false)}
              />
            </View>
          )}

          {/* Posts Grid */}
          <View className="flex-row flex-wrap mt-5" style={{ width: '100%' }}>
            {posts.map((post) => (
              <TouchableOpacity 
                key={post.id} 
                className="w-[48%] mb-2 mx-[1%]"
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

          {/* Empty State */}
          {posts.length === 0 && (
            <View className="items-center justify-center py-12">
              <FontAwesome name="camera" size={48} color="#9ca3af" />
              <Text className="text-gray-400 mt-4 text-center">
                No Posts Yet
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

export default ViewProfile;
