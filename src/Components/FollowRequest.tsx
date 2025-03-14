import { useState } from 'react';
import { Pressable, Text, ToastAndroid, Platform } from 'react-native';
import { supabase } from '../lib/supabase';
import { triggerNotification } from './NotificationTrigger';

interface FollowRequestProps {
  targetId: string;
  requesterId: string;
  onRequestSent?: () => void;
}

export default function FollowRequest({ targetId, requesterId, onRequestSent }: FollowRequestProps) {
  const [isPending, setIsPending] = useState(false);

  const showToast = (message: string) => {
    if (Platform.OS === 'android') {
      ToastAndroid.show(message, ToastAndroid.SHORT);
    } else {
      // For iOS, you might want to use a custom toast component
      // or a library like react-native-toast-message
      console.log(message); // Temporary fallback
    }
  };

  const sendFollowRequest = async () => {
    try {
      const { error } = await supabase
        .from('follow_requests')
        .insert({
          requester_id: requesterId,
          target_id: targetId,
          status: 'Pending'
        });
      
      if (error) throw error;
      
      await triggerNotification({
        userId: targetId,
        senderId: requesterId,
        type: 'follow_request'
      });
      
      setIsPending(true);
      if (onRequestSent) onRequestSent();
      showToast('Follow request sent');
    } catch (error) {
      showToast('Error sending follow request');
    }
  };

  return (
    <Pressable 
      className={`px-3 py-1 rounded-full ${
        isPending ? 'bg-gray-400' : 'bg-blue-500'
      }`}
      onPress={sendFollowRequest}
      disabled={isPending}
    >
      <Text className="text-white text-xs">
        {isPending ? 'Requested' : 'Follow'}
      </Text>
    </Pressable>
  );
}
