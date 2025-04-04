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

export const deleteNotification = async ({
  postId,
  senderId,
  type
}: {
  postId: string;
  senderId: string;
  type: string;
}) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('post_id', postId)
      .eq('sender_id', senderId)
      .eq('type', type);
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting notification:', error);
    return false;
  }
};
