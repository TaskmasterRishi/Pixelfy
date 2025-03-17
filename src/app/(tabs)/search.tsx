import { useState, useEffect } from 'react';
import { View, TextInput, FlatList, Pressable, Image, Text, Dimensions, ScrollView, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { useAuth } from '../../providers/AuthProvider';
import { supabase } from '../../lib/supabase';
import { FontAwesome } from '@expo/vector-icons';
import MasonryList from '@react-native-seoul/masonry-list';
import FollowRequest from '../../Components/FriendRequest';
import Toast from 'react-native-toast-message';
import { router } from 'expo-router';

export default function SearchPage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [publicUsers, setPublicUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [followStatuses, setFollowStatuses] = useState<Record<string, boolean>>({});
  const [isFollowUpdating, setIsFollowUpdating] = useState<Record<string, boolean>>({});

  const fetchPublicUsers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, username, avatar_url, bio')
        .eq('is_private', false)
        .neq('id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (!error) {
        setPublicUsers(data);
        fetchFollowStatuses(data.map(user => user.id));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFollowStatuses = async (userIds: string[]) => {
    try {
      const { data, error } = await supabase
        .from('friends')
        .select('friend_id')
        .eq('user_id', user.id)
        .in('friend_id', userIds);

      if (!error) {
        const statuses = userIds.reduce((acc, id) => {
          acc[id] = data.some(record => record.friend_id === id);
          return acc;
        }, {} as Record<string, boolean>);
        setFollowStatuses(prev => ({ ...prev, ...statuses }));
      }
    } catch (error) {
      console.error('Error fetching follow statuses:', error);
    }
  };

  const handleSearch = async (query) => {
    if (query.length > 2) {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('users')
          .select('id, username, avatar_url, bio')
          .ilike('username', `%${query}%`)
          .neq('id', user.id);
        
        if (!error) {
          setSearchResults(data);
          fetchFollowStatuses(data.map(user => user.id));
        }
      } finally {
        setIsLoading(false);
      }
    } else {
      setSearchResults([]);
      fetchPublicUsers();
    }
  };

  const handleFollow = async (userId: string) => {
    if (isFollowUpdating[userId]) return;
    
    setIsFollowUpdating(prev => ({ ...prev, [userId]: true }));
    
    try {
      if (followStatuses[userId]) {
        // Unfollow
        const { error } = await supabase
          .from('friends')
          .delete()
          .eq('user_id', user.id)
          .eq('friend_id', userId);
        
        if (!error) {
          setFollowStatuses(prev => ({ ...prev, [userId]: false }));
        }
      } else {
        // Follow
        const { error } = await supabase
          .from('friends')
          .insert([{ user_id: user.id, friend_id: userId }]);
        
        if (!error) {
          setFollowStatuses(prev => ({ ...prev, [userId]: true }));
        }
      }
    } catch (error) {
      console.error('Error updating follow status:', error);
    } finally {
      setIsFollowUpdating(prev => ({ ...prev, [userId]: false }));
    }
  };

  useEffect(() => {
    fetchPublicUsers();
  }, []);

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

  const renderUserCard = (cardUser) => (
    <Pressable 
      key={cardUser.id} 
      className="w-[48%] mb-4 bg-white rounded-lg shadow-sm p-3"
      onPress={() => router.push(`/(screens)/viewProfile?userId=${cardUser.id}`)}
    >
      <View className="items-center">
        <View className="w-20 h-20 rounded-full overflow-hidden border-2 border-white shadow-md">
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
        <Text className="font-semibold mt-2 text-center" numberOfLines={1}>
          {cardUser.username}
        </Text>
        {cardUser.bio && (
          <Text className="text-gray-600 text-xs text-center mt-1" numberOfLines={2}>
            {cardUser.bio}
          </Text>
        )}
        <FollowRequest 
          targetId={cardUser.id}
          requesterId={user.id}
          isFollowing={followStatuses[cardUser.id] || false}
          isUpdating={isFollowUpdating[cardUser.id] || false}
          onRequestSent={() => handleFollow(cardUser.id)}
          onUnfollow={() => handleFollow(cardUser.id)}
        />
      </View>
    </Pressable>
  );

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 pt-4 pb-2 bg-white border-b border-gray-200">
        <Text className="text-xl font-bold">Search</Text>
        <FontAwesome name="search" size={20} color="black" />
      </View>

      {/* Search Bar */}
      <View className="p-4 bg-white">
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
            <View className="flex-row flex-wrap justify-between px-2">
              {searchResults.map(renderUserCard)}
            </View>
          ) : (
            <>
              <Text className="text-lg font-semibold px-4 mb-2">Public Profiles</Text>
              <View className="flex-row flex-wrap justify-between px-2">
                {publicUsers.map(renderUserCard)}
              </View>
            </>
          )}
        </ScrollView>
      )}
      <Toast />
    </View>
  );
} 