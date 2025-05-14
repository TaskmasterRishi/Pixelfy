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
import { sendFriendRequest, removeFriendRequest } from '~/Components/FriendRequest';

type Post = {
  id: string;
  media_url: string;
  caption: string;
  created_at: string;
  likes_count: number;
};

// Define ViewImageProps interface to match what the component expects
interface ViewImageProps {
  visible: boolean;
  imageUrl: string;
  onClose: () => void;
  postId?: string;
  initialComments?: any[];
  // Add other props as needed, but with optional modifier
}

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
    if (!user?.id || !userId) return;
    
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
        // Also check if they're already friends
        const { data: existingFriendship, error: friendshipError } = await supabase
          .from('friends')
          .select('*')
          .eq('user_id', user.id)
          .eq('friend_id', userId)
          .single();

        if (!friendshipError && existingFriendship) {
          setFollowStatus('following');
        } else {
          setFollowStatus('not_following');
        }
      }

    } catch (error: any) {
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
    if (isFollowUpdating || !user?.id || !userId) return;
    
    setIsFollowUpdating(true);
    
    try {
      if (followStatus === 'following' || followStatus === 'requested') {
        const { success } = await removeFriendRequest(user.id, userId.toString(), followStatus);
        if (success) {
          setFollowStatus('not_following');
          if (followStatus === 'following') {
            setFollowersCount(prev => prev - 1);
          }
        }
      } else {
        // Use email instead of username since we don't have username in the user object
        const { success } = await sendFriendRequest(user.id, userId.toString(), user.email || '');
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
  }, [userId, user?.id]);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#0ea5e9" />
      </View>
    );
  }

  return (
    <ScrollView 
      className="flex-1 bg-white pt-10"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {selectedPost && (
        <ViewImage
          visible={!!selectedPost}
          imageUrl={selectedPost.mediaUrl}
          postId={selectedPost.id}
          onClose={() => setSelectedPost(null)}
          initialComments={[]}
        />
      )}
      
      <View className="px-4 py-6 bg-white">
        {profile && (
          <>
            {/* Profile Header */}
            <View className='flex-row items-center justify-between px-4 py-2 border-b border-gray-200'>
              <Text className="text-xl font-bold">{profile.username}</Text>
              <View className="flex-row items-center space-x-4">
                {/* Removed menu handler */}
              </View>
            </View>

            {/* Avatar Section */}
            <View className="flex-row mb-4 pt-4 relative">
              <TouchableOpacity 
                onPress={() => console.log('Avatar pressed')}
                className="mr-4"
              >
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
              </TouchableOpacity>

              <View className="flex-1 justify-center">
                <Text className="text-lg font-bold">{profile.full_name}</Text>
                {profile.bio && (
                  <Text className="text-sm mt-1">{profile.bio}</Text>
                )}
              </View>
            </View>

            {/* Stats Section */}
            <View className="flex-row justify-around mb-4">
              <View className="items-center">
                <Text className="text-lg font-bold">{posts.length}</Text>
                <Text className="text-sm text-gray-500">Posts</Text>
              </View>
              <View className="items-center">
                <Text className="text-lg font-bold">{followersCount}</Text>
                <Text className="text-sm text-gray-500">Followers</Text>
              </View>
              <View className="items-center">
                <Text className="text-lg font-bold">{followingCount}</Text>
                <Text className="text-sm text-gray-500">Following</Text>
              </View>
            </View>

            {/* Action Buttons */}
            <View className="flex-row gap-2 mb-6">
              <TouchableOpacity 
                className={`flex-1 py-2 rounded-lg ${
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
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text className={`text-center font-semibold ${
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
                className="flex-1 bg-gray-200 py-2 rounded-lg"
                onPress={() => console.log('Message button pressed')}
              >
                <Text className="text-center text-gray-800 font-semibold">Message</Text>
              </TouchableOpacity>
            </View>

            {/* Posts Grid */}
            <View className="flex-row flex-wrap mt-5 bg-white" style={{ width: '100%' }}>
              {posts.map((post) => (
                <TouchableOpacity 
                  key={post.id} 
                  className="w-[48%] mb-3 mx-[1%]"
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

            {/* Empty State */}
            {posts.length === 0 && (
              <View className="items-center justify-center py-16 bg-white">
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
