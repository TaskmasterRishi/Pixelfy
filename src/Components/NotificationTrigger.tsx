import { supabase } from '../lib/supabase';

interface NotificationTriggerProps {
  userId: string;
  senderId: string;
  type: string;
  postId?: string | null;
}

export const triggerNotification = async ({
  userId,
  senderId,
  type,
  postId = null
}: NotificationTriggerProps) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        sender_id: senderId,
        type,
        post_id: postId,
        seen: false,
        created_at: new Date().toISOString()
      });
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error triggering notification:', error);
    return false;
  }
};
