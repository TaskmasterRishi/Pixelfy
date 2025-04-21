import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, ActivityIndicator, Switch,
  TouchableOpacity, Image
} from 'react-native';
import { Stack, router } from 'expo-router';
import { supabase } from '~/lib/supabase';
import { useAuth } from '~/providers/AuthProvider';
import Toast from 'react-native-toast-message';

const CloseFriendsScreen = () => {
  const { user } = useAuth();
  const [allUsers, setAllUsers] = useState([]);
  const [closeFriends, setCloseFriends] = useState<string[]>([]);
  const [originalCloseFriends, setOriginalCloseFriends] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        const { data: usersData } = await supabase
          .from('users')
          .select('id, username, full_name, avatar_url')
          .neq('id', user.id);

        const { data: closeFriendsData } = await supabase
          .from('close_friends')
          .select('friend_id')
          .eq('user_id', user.id);

        const closeFriendIds = closeFriendsData?.map(cf => cf.friend_id) || [];

        setAllUsers(usersData || []);
        setCloseFriends(closeFriendIds);
        setOriginalCloseFriends(closeFriendIds);
      } catch (error) {
        Toast.show({ type: 'error', text2: 'Error loading close friends' });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const toggleFriend = (friendId: string) => {
    setCloseFriends(prev => {
      const newFriends = prev.includes(friendId) 
        ? prev.filter(id => id !== friendId) 
        : [...prev, friendId];
      return newFriends;
    });
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);

      const added = closeFriends.filter(id => !originalCloseFriends.includes(id));
      const removed = originalCloseFriends.filter(id => !closeFriends.includes(id));

      const insertOps = added.map(friend_id => ({
        user_id: user.id,
        friend_id
      }));

      const deleteOps = removed.map(friend_id =>
        supabase.from('close_friends').delete().match({ user_id: user.id, friend_id })
      );

      if (insertOps.length > 0) {
        await supabase.from('close_friends').insert(insertOps);
      }

      for (const del of deleteOps) await del;

      Toast.show({ type: 'success', text2: 'Close friends updated' });
      router.back();
    } catch (err) {
      Toast.show({ type: 'error', text2: 'Failed to update close friends' });
    } finally {
      setIsSaving(false);
    }
  };

  const renderUser = (userItem) => {
    const isCloseFriend = closeFriends.includes(userItem.id);

    return (
      <TouchableOpacity 
        key={userItem.id} 
        className="flex-row items-center p-4 bg-white rounded-lg mb-2"
        onPress={() => toggleFriend(userItem.id)}
      >
        <Image
          source={{ uri: userItem.avatar_url || 'https://placehold.co/64x64' }}
          className="w-10 h-10 rounded-full"
        />
        <View className="ml-4 flex-1">
          <Text className="text-base font-medium text-gray-800">{userItem.full_name}</Text>
          <Text className="text-sm text-gray-500">@{userItem.username}</Text>
        </View>
        <Switch
          trackColor={{ false: "#d1d5db", true: "#0ea5e9" }}
          thumbColor={isCloseFriend ? "#fff" : "#f4f3f4"}
          value={isCloseFriend}
          onValueChange={() => toggleFriend(userItem.id)}
        />
      </TouchableOpacity>
    );
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
      <Stack.Screen
        options={{
          headerShown: false,
          title: 'Close Friends',
          presentation: 'modal'
        }}
      />

      <ScrollView className="flex-1 bg-white">
        {/* Header */}
        <View className="bg-blue-50 p-6 pt-20">
          <View>
            <Text className="text-3xl font-bold mb-2">Close Friends</Text>
            <Text className="text-base text-gray-600">
              Select friends to add to your Close Friends list. Only these friends will see your exclusive content.
            </Text>
          </View>
        </View>

        {/* Absolute positioned Done button */}
        <TouchableOpacity 
          onPress={handleSave} 
          disabled={isSaving}
          className="absolute top-20 right-4 bg-blue-500 px-4 py-2 rounded-full z-10"
        >
          <Text className={`text-white font-semibold ${isSaving ? 'opacity-50' : ''}`}>
            {isSaving ? 'Saving...' : 'Done'}
          </Text>
        </TouchableOpacity>

        {/* User List */}
        <View className="p-6">
          {allUsers.map(user => renderUser(user))}
        </View>
      </ScrollView>
    </>
  );
};

export default CloseFriendsScreen;
