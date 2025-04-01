import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  Image, 
  ActivityIndicator, 
  ScrollView,
  useWindowDimensions,
  RefreshControl,
  TouchableOpacity
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { supabase } from '~/lib/supabase';
import FontAwesome from "@expo/vector-icons/FontAwesome";
import ViewImage from '~/Components/viewImage';
import { useAuth } from '~/providers/AuthProvider';
import { sendFriendRequest } from '~/Components/FriendRequest';

type Post = {
  id: string;
  media_url: string;
  caption: string;
  created_at: string;
  likes_count: number;
};

const ViewProfile = () => {
  const { userId } = useLocalSearchParams();
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [selectedPost, setSelectedPost] = useState<{
    id: string;
    mediaUrl: string;
    username: string;
    avatarUrl: string;
    timestamp: string;
    caption: string;
    likesCount: number;
  } | null>(null);
  const [followStatus, setFollowStatus] = useState<'not_following' | 'requested' | 'following'>('not_following');
  const [isFollowUpdating, setIsFollowUpdating] = useState(false);

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
            user:users(username, avatar_url),
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
          .from('follow_requests')
          .select('status')
          .eq('requester_id', user.id)
          .eq('target_id', userId)
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

      // Update follow status
      if (followStatusResponse.data) {
        if (followStatusResponse.data.status === 'Accepted') {
          setFollowStatus('following');
        } else if (followStatusResponse.data.status === 'Pending') {
          setFollowStatus('requested');
        }
      } else {
        setFollowStatus('not_following');
      }

    } catch (error) {
      console.error('Error fetching profile data:', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProfile();
    setRefreshing(false);
  };

  const handlePostPress = (post: Post) => {
    setSelectedPost({
      id: post.id,
      mediaUrl: post.media_url,
      username: profile.username,
      avatarUrl: profile.avatar_url,
      timestamp: post.created_at,
      caption: post.caption,
      likesCount: post.likes_count
    });
  };

  const handleFollow = async () => {
    if (isFollowUpdating) return;
    setIsFollowUpdating(true);
    
    try {
      if (followStatus === 'following' || followStatus === 'requested') {
        const { success } = await removeFriendRequest(user.id, userId, followStatus);
        if (success) {
          setFollowStatus('not_following');
          if (followStatus === 'following') {
            setFollowersCount(prev => prev - 1);
          }
        }
      } else {
        const { success } = await sendFriendRequest(user.id, userId, user.username);
        if (success) {
          setFollowStatus('requested');
        }
      }
    } catch (error) {
      console.error('Error updating follow status:', error);
    } finally {
      setIsFollowUpdating(false);
    }
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

  return (
    <ScrollView 
      className="flex-1 bg-white pt-20"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
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
      
      <View className="px-4 pb-6">
        {profile && (
          <>
            {/* Profile Header */}
            <View className='px-4'>
              <Text className="text-3xl font-extrabold text-gray-900">{profile.username}</Text>
              {profile.full_name && (
                <Text className="text-gray-600 mt-1 text-lg">{profile.full_name}</Text>
              )}
            </View>

            {/* Bio */}
            {profile.bio && (
              <Text className="text-gray-800 mb-8 px-4 text-lg leading-6">{profile.bio}</Text>
            )}

            {/* Avatar Section */}
            <View className="items-center mb-8">
              {profile.avatar_url ? (
                <Image
                  source={{ uri: profile.avatar_url }}
                  className="w-32 h-32 rounded-full border-4 border-white shadow-lg"
                />
              ) : (
                <View className="w-32 h-32 rounded-full bg-gray-100 items-center justify-center border-4 border-white shadow-lg">
                  <FontAwesome name="user" size={48} color="#9ca3af" />
                </View>
              )}
            </View>

            {/* Stats Section */}
            <View className="flex-row justify-around mb-8 bg-white rounded-xl py-4 mx-2 shadow-sm border border-gray-200">
              <View className="items-center">
                <Text className="text-2xl font-bold text-gray-900">{posts.length}</Text>
                <Text className="text-gray-500 text-sm">Posts</Text>
              </View>
              <TouchableOpacity className="items-center">
                <Text className="text-2xl font-bold text-gray-900">{followersCount}</Text>
                <Text className="text-gray-500 text-sm">Followers</Text>
              </TouchableOpacity>
              <TouchableOpacity className="items-center">
                <Text className="text-2xl font-bold text-gray-900">{followingCount}</Text>
                <Text className="text-gray-500 text-sm">Following</Text>
              </TouchableOpacity>
            </View>


            {/* Action Buttons */}
            <View className="flex-row gap-3 mb-8 px-4">
              <TouchableOpacity 
                className={`flex-1 py-3 rounded-lg items-center ${
                  followStatus === 'following' 
                    ? 'bg-blue-50 border border-blue-100' 
                    : followStatus === 'requested'
                    ? 'bg-blue-100 border border-blue-200'
                    : 'bg-blue-500'
                }`}
                onPress={handleFollow}
                disabled={isFollowUpdating}
              >
                {isFollowUpdating ? (
                  <ActivityIndicator size="small" color={
                    followStatus === 'following' ? '#3b82f6' : 
                    followStatus === 'requested' ? '#3b82f6' : 
                    '#ffffff'
                  } />
                ) : (
                  <Text className={`font-semibold ${
                    followStatus === 'following' ? 'text-blue-600' : 
                    followStatus === 'requested' ? 'text-blue-700' : 
                    'text-white'
                  }`}>
                    {followStatus === 'following' ? 'Following' : 
                     followStatus === 'requested' ? 'Requested' : 
                     'Follow'}
                  </Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity 
                className="flex-1 bg-gray-200 py-3 rounded-lg items-center"
                onPress={() => console.log('Message button pressed')}
              >
                <Text className="text-gray-800 font-semibold">Message</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                className="flex-1 bg-gray-200 py-3 rounded-lg items-center"
                onPress={() => console.log('Share button pressed')}
              >
                <Text className="text-gray-800 font-semibold">Share</Text>
              </TouchableOpacity>
            </View>

            {/* Posts Grid */}
            <View className="flex-row flex-wrap mt-5" style={{ width: '100%' }}>
              {posts.map((post) => (
                <TouchableOpacity 
                  key={post.id} 
                  className="w-[48%] mb-3 mx-[1%]"
                  onPress={() => handlePostPress(post)}
                >
                  <View className="aspect-square rounded-xl shadow-sm bg-gray-100 overflow-hidden">
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
              <View className="items-center justify-center py-16">
                <View className="bg-gray-50 p-8 rounded-full">
                  <FontAwesome name="camera" size={48} color="#9ca3af" />
                </View>
                <Text className="text-gray-400 mt-6 text-lg text-center">
                  No Posts Yet
                </Text>
              </View>
            )}
          </>
        )}
      </View>
    </ScrollView>
  );
};

export default ViewProfile;
