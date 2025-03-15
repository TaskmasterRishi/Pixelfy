import React, { useState } from 'react';
import { Pressable, Text, ToastAndroid } from 'react-native';
import { supabase } from '~/src/lib/supabase';

interface AcceptFriendProps {
  requesterId: string;
  targetId: string;
  onAccepted?: () => void;
}

const AcceptFriend: React.FC<AcceptFriendProps> = ({ requesterId, targetId, onAccepted }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleAccept = async () => {
    setIsLoading(true);
    try {
      // Update follow request status to "Accepted"
      const { error: updateError } = await supabase
        .from("follow_requests")
        .update({ status: "Accepted" })
        .eq("requester_id", requesterId)
        .eq("target_id", targetId);

      if (updateError) throw updateError;

      // Add both users as friends
      const { error: friendError } = await supabase
        .from("friends")
        .insert([
          { user_id: targetId, friend_id: requesterId, created_at: new Date().toISOString() },
          { user_id: requesterId, friend_id: targetId, created_at: new Date().toISOString() }
        ]);

      if (friendError) throw friendError;

      // Update notification instead of deleting it
      await supabase
        .from("notifications")
        .update({ 
          type: 'friend_accepted',
          seen: false,
          created_at: new Date().toISOString()
        })
        .eq('sender_id', requesterId)
        .eq('user_id', targetId)
        .eq('type', 'follow_request');

      if (onAccepted) onAccepted();
      ToastAndroid.show('Friend request accepted', ToastAndroid.SHORT);
    } catch (error) {
      ToastAndroid.show('Error accepting request', ToastAndroid.SHORT);
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Pressable
      className="bg-green-500 px-3 py-1 rounded-full"
      onPress={handleAccept}
      disabled={isLoading}
    >
      <Text className="text-white text-xs">
        {isLoading ? "Accepting..." : "Accept"}
      </Text>
    </Pressable>
  );
};

export default AcceptFriend;
