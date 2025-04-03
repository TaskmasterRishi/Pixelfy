import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { supabase } from '~/lib/supabase';
import { useAuth } from '~/providers/AuthProvider';
import UserListItem from '~/Components/UserListItem';
import { FontAwesome, Feather } from '@expo/vector-icons';

const FollowList = () => {
  const { type, userId } = useLocalSearchParams();
  const { user } = useAuth();
  const [list, setList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    fetchList();
  }, [type, userId]);

  const fetchList = async () => {
    try {
      let query;
      if (type === 'followers') {
        query = supabase
          .from('friends')
          .select('user:users!friends_user_id_fkey(id, username, avatar_url, full_name)')
          .eq('friend_id', userId);
      } else {
        query = supabase
          .from('friends')
          .select('friend:users!friends_friend_id_fkey(id, username, avatar_url, full_name)')
          .eq('user_id', userId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setList(data || []);
    } catch (error) {
      console.error('Error fetching list:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#0ea5e9" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="bg-blue-50 p-6 pt-20">
        <View className="flex-row justify-between items-center mb-2">
          <Text className="text-3xl font-bold">
            {type === 'followers' ? 'Followers' : 'Following'}
          </Text>
          <TouchableOpacity
            className="flex-row items-center bg-white px-4 py-2 rounded-full shadow-sm"
            onPress={() => router.setParams({ 
              type: type === 'followers' ? 'following' : 'followers',
              userId 
            })}
          >
            <Text className="text-sm font-medium text-gray-700 mr-2">
              {type === 'followers' ? 'Following' : 'Followers'}
            </Text>
            <Feather name="repeat" size={16} color="#6b7280" />
          </TouchableOpacity>
        </View>
        <Text className="text-base text-gray-600">
          {type === 'followers' 
            ? 'People who follow this account' 
            : 'Accounts this user is following'}
        </Text>
      </View>

      <FlatList
        data={list}
        keyExtractor={(item) => item.user?.id || item.friend?.id}
        renderItem={({ item }) => {
          const userData = item.user || item.friend;
          return (
            <TouchableOpacity 
              className="flex-row items-center p-4 bg-white border-b border-gray-100"
              onPress={() => router.push(`/(screens)/viewProfile?userId=${userData.id}`)}
            >
              {userData.avatar_url ? (
                <Image
                  source={{ uri: userData.avatar_url }}
                  className="w-10 h-10 rounded-full border border-gray-100"
                />
              ) : (
                <View className="w-10 h-10 rounded-full bg-gray-50 items-center justify-center border border-gray-100">
                  <FontAwesome name="user" size={18} color="#666" />
                </View>
              )}
              <View className="ml-4 flex-1">
                <Text className="text-base font-medium">{userData.username}</Text>
                <Text className="text-sm text-gray-500">{userData.full_name}</Text>
              </View>
              <Feather name="chevron-right" size={20} color="#9ca3af" />
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View className="items-center justify-center py-12">
            <Text className="text-gray-500 text-sm">
              {type === 'followers' ? 'No followers yet' : 'Not following anyone'}
            </Text>
          </View>
        }
        contentContainerStyle={list.length === 0 ? { flex: 1 } : {}}
      />
    </View>
  );
};

export default FollowList; 