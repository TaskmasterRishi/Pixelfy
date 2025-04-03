import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { useChatContext } from 'stream-chat-expo';
import { useAuth } from '~/providers/AuthProvider';
import { router } from 'expo-router';

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
  const { client } = useChatContext();
  const { user: me } = useAuth();

  const handlePress = async () => {
    console.log("UserListItem pressed:", user.username); // Debugging line

    // Check if the user exists (you may need to implement this check)
    try {
      const userExists = await client.queryUsers({ id: user.id });
      if (userExists.users.length === 0) {
        console.error("User does not exist:", user.id);
        return; // Exit if the user does not exist
      }
    } catch (error) {
      console.error("Error checking user existence:", error);
      return; // Exit if there's an error
    }

    // Start a chat with the selected user
    const channel = client.channel('messaging', {
      members: [me.id, user.id],
    });

    try {
      // Create the channel
      await channel.create();
      console.log("Channel created:", channel.cid); // Debugging line

      // Watch the channel to get its state
      await channel.watch();
      console.log("Channel watched:", channel.cid); // Debugging line

      // Ensure the routing to the correct channel ID
      router.replace(`/(chat)/channel/${channel.cid}`); // Ensure cid is correctly used
    } catch (error) {
      console.error("Error creating or watching channel:", error); // Log any errors
    }
  };

  return (
    <TouchableOpacity 
      className="flex-row items-center px-4 py-3 border-b border-gray-100"
      onPress={handlePress}
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
          <Text className="text-sm text-gray-500">{user.full_name}+"hi"</Text>
        )}
        <Text className="text-sm text-gray-500">Tap to chat</Text>
      </View>

      {isFollowing && (
        <Text className="text-sm text-gray-500">Following</Text>
      )}
    </TouchableOpacity>
  );
};

export default UserListItem; 