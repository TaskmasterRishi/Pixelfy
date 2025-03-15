import React, { useState, useEffect } from 'react';
import { Pressable, Text, ToastAndroid } from 'react-native';
import { supabase } from '~/src/lib/supabase';

interface FollowRequestProps {
  targetId: string;
  requesterId: string;
  onRequestSent?: () => void;
}

const FollowRequest: React.FC<FollowRequestProps> = ({ targetId, requesterId, onRequestSent }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [requestExists, setRequestExists] = useState(false);
  const [isFriend, setIsFriend] = useState(false);

  useEffect(() => {
    const checkExistingRequest = async () => {
      const { data, error } = await supabase
        .from('follow_requests')
        .select('id')
        .eq('requester_id', requesterId)
        .eq('target_id', targetId)
        .limit(1);

      if (error) {
        console.error('Error checking follow request:', error);
      } else {
        setRequestExists(data.length > 0);
      }
    };

    const checkIfFriends = async () => {
      const { data, error } = await supabase
        .from("friends")
        .select("id")
        .or(`user_id.eq.${requesterId},friend_id.eq.${requesterId}`)
        .or(`user_id.eq.${targetId},friend_id.eq.${targetId}`)
        .limit(1);

      setIsFriend(data && data.length > 0); // Set to true if they are friends
    };

    checkExistingRequest();
    checkIfFriends();
  }, [requesterId, targetId]);

  const handleSendRequest = async () => {
    setIsLoading(true);
    try {
      // Insert follow request into the database
      const { error } = await supabase
        .from('follow_requests')
        .insert([{ requester_id: requesterId, target_id: targetId, status: 'Pending' }]);

      if (error) throw error;

      // Create a notification for the follow request
      await supabase
        .from('notifications')
        .insert([{
          user_id: targetId,
          sender_id: requesterId,
          type: 'follow_request',
          created_at: new Date().toISOString(),
        }]);

      // Show success toast message
      ToastAndroid.show('Follow request sent!', ToastAndroid.SHORT);

      // Update the requestExists state to reflect that the request has been sent
      setRequestExists(true);

      // Call the optional callback function
      if (onRequestSent) onRequestSent();
    } catch (error) {
      console.error('Error sending follow request:', error);
      ToastAndroid.show('Failed to send follow request', ToastAndroid.SHORT);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {!isFriend && (
        <Pressable
          onPress={handleSendRequest}
          disabled={isLoading || requestExists} // Disable if loading or request exists
          className={`px-3 py-1 rounded-full ${isLoading || requestExists ? 'bg-gray-600' : 'bg-blue-500'}`}
        >
          <Text className="text-white text-sm">{isLoading ? 'Sending...' : requestExists ? 'Requested' : 'Follow'}</Text>
        </Pressable>
      )}
      {isFriend && (
        <Text className="text-gray-500 text-xs">You are friends</Text>
      )}
    </>
  );
};

export default FollowRequest;
