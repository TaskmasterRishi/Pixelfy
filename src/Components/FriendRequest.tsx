import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator } from 'react-native';

interface FollowRequestProps {
  targetId: string;
  requesterId: string;
  isFollowing: boolean;
  isUpdating: boolean;
  onRequestSent: () => void;
  onUnfollow: () => void;
}

const FollowRequest: React.FC<FollowRequestProps> = ({
  targetId,
  requesterId,
  isFollowing,
  isUpdating,
  onRequestSent,
  onUnfollow
}) => {
  if (isUpdating) {
    return (
      <View className="mt-2">
        <ActivityIndicator size="small" color="#000" />
      </View>
    );
  }

  return (
    <TouchableOpacity
      onPress={isFollowing ? onUnfollow : onRequestSent}
      className={`mt-2 px-4 py-1 rounded-full ${
        isFollowing ? 'bg-gray-200' : 'bg-blue-500'
      }`}
    >
      <Text className={`text-center ${
        isFollowing ? 'text-black' : 'text-white'
      }`}>
        {isFollowing ? 'Following' : 'Follow'}
      </Text>
    </TouchableOpacity>
  );
};

export default FollowRequest;
