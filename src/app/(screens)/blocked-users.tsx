import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, ActivityIndicator, Switch,
  TouchableOpacity, Image
} from 'react-native';
import { Stack, router } from 'expo-router';
import { supabase } from '~/lib/supabase';
import { useAuth } from '~/providers/AuthProvider';
import Toast from 'react-native-toast-message';

const BlockedUsersScreen = () => {
  const { user } = useAuth();
  const [allUsers, setAllUsers] = useState([]);
  const [blockedUsers, setBlockedUsers] = useState<string[]>([]);
  const [originalBlockedUsers, setOriginalBlockedUsers] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        setIsLoading(true);

        const { data: usersData } = await supabase
          .from('users')
          .select('id, username, full_name, avatar_url')
          .neq('id', user.id);

        const { data: blockedUsersData } = await supabase
          .from('blocked_users')
          .select('blocked_id')
          .eq('blocker_id', user.id);

        const blockedUserIds = blockedUsersData?.map(b => b.blocked_id) || [];

        setAllUsers(usersData || []);
        setBlockedUsers(blockedUserIds);
        setOriginalBlockedUsers(blockedUserIds);
      } catch (error) {
        Toast.show({ type: 'error', text2: 'Error loading blocked users' });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const toggleBlock = (userId: string) => {
    setBlockedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);

      const added = blockedUsers.filter(id => !originalBlockedUsers.includes(id));
      const removed = originalBlockedUsers.filter(id => !blockedUsers.includes(id));

      const insertOps = added.map(blocked_id => ({
        blocker_id: user.id,
        blocked_id
      }));

      if (insertOps.length > 0) {
        await supabase.from('blocked_users').insert(insertOps);
      }

      if (removed.length > 0) {
        await supabase
          .from('blocked_users')
          .delete()
          .match({ blocker_id: user.id })
          .in('blocked_id', removed);
      }

      Toast.show({ type: 'success', text2: 'Blocked users updated' });
      setTimeout(() => router.back(), 400); // Slight delay to allow toast display
    } catch (err) {
      Toast.show({ type: 'error', text2: 'Failed to update blocked users' });
    } finally {
      setIsSaving(false);
    }
  };

  const renderUser = (userItem) => {
    const isBlocked = blockedUsers.includes(userItem.id);

    return (
      <TouchableOpacity
        key={userItem.id}
        className="flex-row items-center p-4 bg-white rounded-lg mb-2"
        onPress={() => toggleBlock(userItem.id)}
      >
        <Image
          source={{ uri: userItem.avatar_url?.startsWith('http') ? userItem.avatar_url : 'https://placehold.co/64x64' }}
          className="w-10 h-10 rounded-full"
        />
        <View className="ml-4 flex-1">
          <Text className="text-base font-medium text-gray-800">{userItem.full_name}</Text>
          <Text className="text-sm text-gray-500">@{userItem.username}</Text>
        </View>
        <Switch
          trackColor={{ false: "#d1d5db", true: "#ef4444" }}
          thumbColor={isBlocked ? "#fff" : "#f4f3f4"}
          value={isBlocked}
          onValueChange={() => toggleBlock(userItem.id)}
        />
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#ef4444" />
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
          title: 'Blocked Users',
          presentation: 'modal',
        }}
      />

      <ScrollView className="flex-1 bg-white">
        {/* Header */}
        <View className="bg-red-50 p-6 pt-20">
          <Text className="text-3xl font-bold mb-2">Blocked Users</Text>
          <Text className="text-base text-gray-600">
            Manage your blocked users list. These users will not be able to interact with you.
          </Text>
        </View>

        {/* Done button */}
        <TouchableOpacity
          onPress={handleSave}
          disabled={isSaving}
          className="absolute top-20 right-4 bg-red-500 px-4 py-2 rounded-full z-10"
        >
          <Text className={`text-white font-semibold ${isSaving ? 'opacity-50' : ''}`}>
            {isSaving ? 'Saving...' : 'Done'}
          </Text>
        </TouchableOpacity>

        {/* List */}
        <View className="p-6">
          {allUsers.map(user => renderUser(user))}
        </View>
      </ScrollView>
    </>
  );
};

export default BlockedUsersScreen;
