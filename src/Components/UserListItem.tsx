import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';

type UserListItemProps = {
  user: {
    id: string;
    username: string;
    avatar_url?: string;
    full_name?: string;
  };
  isFollowing: boolean;
  onPress: () => void;
};

const UserListItem = ({ user, isFollowing, onPress }: UserListItemProps) => {
  return (
    <TouchableOpacity 
      className="flex-row items-center px-4 py-3 border-b border-gray-100"
      onPress={onPress}
    >
      {user.avatar_url ? (
        <Image
          source={{ uri: user.avatar_url }}
          className="w-10 h-10 rounded-full mr-3"
        />
      ) : (
        <View className="w-10 h-10 rounded-full bg-gray-100 mr-3 items-center justify-center">
          <Text className="text-gray-400 text-lg">👤</Text>
        </View>
      )}
      
      <View className="flex-1">
        <Text className="font-semibold">{user.username}</Text>
        {user.full_name && (
          <Text className="text-sm text-gray-500">{user.full_name}</Text>
        )}
      </View>

      {isFollowing && (
        <Text className="text-sm text-gray-500">Following</Text>
      )}
    </TouchableOpacity>
  );
};

export default UserListItem; 