import React, { useState, useEffect } from 'react';
import { View, TextInput, FlatList, Pressable, Image, Text, Dimensions, ScrollView, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { useAuth } from '../../providers/AuthProvider';
import { supabase } from '../../lib/supabase';
import { FontAwesome } from '@expo/vector-icons';
import MasonryList from '@react-native-seoul/masonry-list';
import { sendFriendRequest, removeFriendRequest } from '~/Components/FriendRequest';

import Toast from 'react-native-toast-message';
import { router } from 'expo-router';
import ViewImage from '~/Components/viewImage';

interface User {
  id: string;
  username: string;
  avatar_url: string | null;
  bio: string | null;
}

interface Post {
  id: string;
  media_url: string;
  media_type: string;
  user_id: string;
}

type FollowStatus = 'not_following' | 'requested' | 'following';

export default function SearchPage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [publicUsers, setPublicUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [followStatuses, setFollowStatuses] = useState<Record<string, FollowStatus>>({});
  const [isFollowUpdating, setIsFollowUpdating] = useState<Record<string, boolean>>({});
  const [publicPosts, setPublicPosts] = useState<Post[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isImageVisible, setIsImageVisible] = useState(false);

  const fetchPublicUsers = async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, username, avatar_url, bio')
        .eq('is_private', false)
        .neq('id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      
      if (data) {
        setPublicUsers(data);
        fetchFollowStatuses(data.map(user => user.id));
        await fetchPublicPosts(data);
      }
    } catch (error) {
      console.error('Error fetching public users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFollowStatuses = async (userIds: string[]) => {
    if (!user?.id) return;
    
    try {
      // Check friends
      const { data: friendsData } = await supabase
        .from('friends')
        .select('friend_id')
        .eq('user_id', user.id)
        .in('friend_id', userIds);

      // Check follow requests
      const { data: requestsData } = await supabase
        .from('follow_requests')
        .select('target_id, status')
        .eq('requester_id', user.id)
        .in('target_id', userIds);

      const statuses = userIds.reduce((acc, id) => {
        if (friendsData?.some(record => record.friend_id === id)) {
          acc[id] = 'following';
        } else if (requestsData?.some(record => record.target_id === id && record.status === 'Pending')) {
          acc[id] = 'requested';
        } else {
          acc[id] = 'not_following';
        }
        return acc;
      }, {} as Record<string, FollowStatus>);
      
      setFollowStatuses(prev => ({ ...prev, ...statuses }));
    } catch (error) {
      console.error('Error fetching follow statuses:', error);
    }
  };

  const handleSearch = async (query: string) => {
    if (query.length > 2) {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('users')
          .select('id, username, avatar_url, bio')
          .ilike('username', `%${query}%`)
          .neq('id', user?.id || '');
        
        if (error) throw error;
        
        if (data) {
          setSearchResults(data);
          fetchFollowStatuses(data.map(user => user.id));
        }
      } catch (error) {
        console.error('Error searching users:', error);
      } finally {
        setIsLoading(false);
      }
    } else {
      setSearchResults([]);
      fetchPublicUsers();
    }
  };

  const handleFollow = async (userId: string) => {
    if (!user?.id || isFollowUpdating[userId]) return;
    
    setIsFollowUpdating(prev => ({ ...prev, [userId]: true }));
    
    try {
      const currentStatus = followStatuses[userId];
      
      if (currentStatus === 'following' || currentStatus === 'requested') {
        const { success } = await removeFriendRequest(user.id, userId, currentStatus);
        if (success) {
          setFollowStatuses(prev => ({ ...prev, [userId]: 'not_following' }));
        }
      } else {
        const { success } = await sendFriendRequest(user.id, userId, user.email || '');
        if (success) {
          setFollowStatuses(prev => ({ ...prev, [userId]: 'requested' }));
        }
      }
    } catch (error) {
      console.error('Error updating follow status:', error);
    } finally {
      setIsFollowUpdating(prev => ({ ...prev, [userId]: false }));
    }
  };

  const fetchPublicPosts = async (users: User[]) => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('id, media_url, media_type, user_id')
        .in('user_id', users.map(user => user.id))
        .eq('media_type', 'image')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      
      if (data) {
        setPublicPosts(data);
      }
    } catch (error) {
      console.error('Error fetching public posts:', error);
    }
  };

  useEffect(() => {
    fetchPublicUsers();
  }, [user?.id]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchPublicUsers();
      if (searchQuery.length > 0) {
        await handleSearch(searchQuery);
      }
    } finally {
      setRefreshing(false);
    }
  };

  const openUserProfile = (profileUser: User) => {
    router.push({
      pathname: '/viewProfile',
      params: { userId: profileUser.id }
    });
  };

  const renderUserCard = (cardUser: User) => (
    <Pressable 
      key={cardUser.id} 
      onPress={() => openUserProfile(cardUser)}
    >
      <View className="flex-row items-center justify-between p-4 mb-2 border border-solid rounded-3xl border-gray-200">
        <View className="flex-row items-center space-x-4 gap-1 ">
          <View className="w-14 h-14 rounded-full overflow-hidden border-2 border-white shadow-md">
            {cardUser.avatar_url ? (
              <Image
                source={{ uri: cardUser.avatar_url }}
                className="w-full h-full"
                resizeMode="cover"
              />
            ) : (
              <View className="w-full h-full bg-gray-200 justify-center items-center">
                <FontAwesome name="user" size={24} color="#6b7280" />
              </View>
            )}
          </View>
          <View>
            <Text className="font-semibold text-gray-900" numberOfLines={1}>
              {cardUser.username}
            </Text>
            {cardUser.bio && (
              <Text className="text-gray-600 text-xs" numberOfLines={1}>
                {cardUser.bio}
              </Text>
            )}
          </View>
        </View>
        <Pressable
          onPress={(e) => {
            e.stopPropagation();
            handleFollow(cardUser.id);
          }}
          className={`px-4 py-2 rounded-full ${
            followStatuses[cardUser.id] === 'following' 
              ? 'bg-blue-50 border border-blue-100' 
              : followStatuses[cardUser.id] === 'requested'
              ? 'bg-blue-100 border border-blue-200'
              : 'bg-blue-500'
          }`}
          disabled={isFollowUpdating[cardUser.id]}
        >
          {isFollowUpdating[cardUser.id] ? (
            <ActivityIndicator size="small" color={
              followStatuses[cardUser.id] === 'following' ? '#3b82f6' : 
              followStatuses[cardUser.id] === 'requested' ? '#3b82f6' : 
              '#ffffff'
            } />
          ) : (
            <Text className={`text-sm font-medium ${
              followStatuses[cardUser.id] === 'following' ? 'text-blue-600' : 
              followStatuses[cardUser.id] === 'requested' ? 'text-blue-700' : 
              'text-white'
            }`}>
              {followStatuses[cardUser.id] === 'following' ? 'Following' : 
               followStatuses[cardUser.id] === 'requested' ? 'Requested' : 
               'Follow'}
            </Text>
          )}
        </Pressable>
      </View>
    </Pressable>
  );

  const openImage = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    setIsImageVisible(true);
  };

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 pt-4 pb-2 border-b border-gray-200">
        <Text className="text-xl font-bold">Search</Text>
        <FontAwesome name="search" size={20} color="black" />
      </View>

      {/* Search Bar */}
      <View className="p-4">
        <TextInput
          className="h-12 bg-gray-100 text-gray-800 rounded-lg px-4"
          placeholder="Search users..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={(text) => {
            setSearchQuery(text);
            handleSearch(text);
          }}
        />
      </View>

      {isLoading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#000" />
        </View>
      ) : (
        <ScrollView 
          showsVerticalScrollIndicator={false} 
          className="p-2"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#000000']}
              tintColor="#000000"
            />
          }
        >
          {searchResults.length > 0 ? (
            <View className="px-2">
              {searchResults.map(cardUser => (
                renderUserCard(cardUser)
              ))}
            </View>
          ) : (
            <>
              <Text className="text-lg font-semibold px-4 mb-2">Peoples you might knows</Text>
              <View className="px-2">
                {publicUsers.map(renderUserCard)}
              </View>
              <Text className="text-lg font-semibold px-4 mb-2">For you</Text>
              <View className="px-2">
                <MasonryList
                  data={publicPosts}
                  renderItem={({ item, i }: { item: any; i: number }) => (
                    <Pressable onPress={() => openImage(item.media_url)}>
                      <View className="mb-2 rounded-md border border-gray-200 overflow-hidden mx-1">
                        <Image
                          key={item.id}
                          source={{ uri: item.media_url }}
                          className="w-full"
                          style={{ height: Dimensions.get('window').width / 2 - 16 }}
                          resizeMode="cover"
                        />
                      </View>
                    </Pressable>
                  )}
                  keyExtractor={(item: any) => item.id}
                  numColumns={2}
                />
              </View>
            </>
          )}
        </ScrollView>
      )}

      {/* Image Modal */}
      {isImageVisible && selectedImage && (
        <ViewImage 
          visible={isImageVisible} 
          imageUrl={selectedImage} 
          onClose={() => setIsImageVisible(false)} 
        />
      )}
      <Toast />
    </View>
  );
} 