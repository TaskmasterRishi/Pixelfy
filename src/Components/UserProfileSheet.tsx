import React, { useEffect, useState } from 'react';
import { Text, View, ActivityIndicator, Image, TouchableOpacity } from 'react-native';
import BottomSheet from '@gorhom/bottom-sheet';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '~/lib/supabase';
import { useAuth } from '~/providers/AuthProvider';

interface UserProfileSheetProps {
  userId: string | null;
  sheetRef: React.RefObject<BottomSheet>;
  visible: boolean;
  onClose: () => void;
}

export default function UserProfileSheet({ 
  userId, 
  sheetRef, 
  visible, 
  onClose 
}: UserProfileSheetProps) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [followRequested, setFollowRequested] = useState(false);
  const { user: currentUser } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (userId && visible) {
      fetchUserData();
    }
  }, [userId, visible]);

  const fetchUserData = async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      // Fetch user data
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (userError) throw userError;
      
      setUser(userData);
      
      // Check if current user is following this user
      if (currentUser) {
        const { data: followData, error: followError } = await supabase
          .from('follows')
          .select('*')
          .eq('follower_id', currentUser.id)
          .eq('following_id', userId)
          .single();
          
        if (!followError && followData) {
          setFollowing(true);
          setFollowRequested(followData.status === 'pending');
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFollowToggle = async () => {
    if (!currentUser || !user) return;
    
    setFollowLoading(true);
    try {
      if (following) {
        // Unfollow user
        const { error } = await supabase
          .from('follows')
          .delete()
          .eq('follower_id', currentUser.id)
          .eq('following_id', user.id);
          
        if (error) throw error;
        setFollowing(false);
        setFollowRequested(false);
      } else {
        // Follow user
        const status = user.is_private ? 'pending' : 'accepted';
        const { error } = await supabase
          .from('follows')
          .insert([
            {
              follower_id: currentUser.id,
              following_id: user.id,
              status
            }
          ]);
          
        if (error) throw error;
        setFollowing(true);
        setFollowRequested(status === 'pending');
      }
    } catch (error) {
      console.error('Error toggling follow status:', error);
    } finally {
      setFollowLoading(false);
    }
  };

  const handleViewProfile = () => {
    if (user && user.username) {
      onClose();
      router.push(`/channel/${user.username}`);
    }
  };

  return (
    <BottomSheet
      ref={sheetRef}
      index={visible ? 0 : -1}
      snapPoints={['50%']}
      enablePanDownToClose
      onClose={onClose}
      backgroundStyle={{ backgroundColor: '#fff' }}
      handleIndicatorStyle={{ backgroundColor: '#ddd' }}
    >
      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#0000ff" />
        </View>
      ) : !user ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Text>User not found</Text>
        </View>
      ) : (
        <View className="flex-1 px-4 py-6">
          <View className="flex-row items-center mb-6">
            <View className="h-20 w-20 rounded-full overflow-hidden bg-gray-200 border-2 border-white shadow">
              {user.avatar_url ? (
                <Image
                  source={{ uri: user.avatar_url }}
                  className="h-full w-full"
                  resizeMode="cover"
                />
              ) : (
                <View className="h-full w-full items-center justify-center">
                  <FontAwesome name="user" size={40} color="#6b7280" />
                </View>
              )}
            </View>
            <View className="ml-4 flex-1">
              <Text className="text-xl font-bold">{user.username}</Text>
              {user.full_name && (
                <Text className="text-gray-600">{user.full_name}</Text>
              )}
              <View className="flex-row mt-2">
                <TouchableOpacity
                  className={`px-4 py-2 rounded-full mr-2 ${
                    following
                      ? followRequested
                        ? 'bg-blue-100 border border-blue-200'
                        : 'bg-blue-50 border border-blue-100'
                      : 'bg-blue-500'
                  }`}
                  onPress={handleFollowToggle}
                  disabled={followLoading}
                >
                  {followLoading ? (
                    <ActivityIndicator 
                      size="small" 
                      color={following ? '#3b82f6' : '#fff'} 
                    />
                  ) : (
                    <Text 
                      className={`font-medium ${
                        following
                          ? followRequested
                            ? 'text-blue-700'
                            : 'text-blue-600'
                          : 'text-white'
                      }`}
                    >
                      {following
                        ? followRequested
                          ? 'Requested'
                          : 'Following'
                        : 'Follow'}
                    </Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  className="px-4 py-2 rounded-full border border-gray-300"
                  onPress={handleViewProfile}
                >
                  <Text className="font-medium text-gray-700">View Profile</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
          
          {user.bio && (
            <View className="mb-4">
              <Text className="text-gray-800">{user.bio}</Text>
            </View>
          )}
          
          <View className="flex-row justify-between px-2 py-4 border-t border-gray-100">
            <View className="items-center">
              <Text className="text-lg font-bold">{user.post_count || 0}</Text>
              <Text className="text-gray-600">Posts</Text>
            </View>
            <View className="items-center">
              <Text className="text-lg font-bold">{user.follower_count || 0}</Text>
              <Text className="text-gray-600">Followers</Text>
            </View>
            <View className="items-center">
              <Text className="text-lg font-bold">{user.following_count || 0}</Text>
              <Text className="text-gray-600">Following</Text>
            </View>
          </View>
        </View>
      )}
    </BottomSheet>
  );
} 