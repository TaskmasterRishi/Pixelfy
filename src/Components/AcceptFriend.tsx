import { supabase } from '~/lib/supabase';
import { sendFriendRequest } from './FriendRequest';

export const handleFriendAcceptance = async (userId: string, senderId: string) => {
  try {
    // Update follow request status
    const { error: updateError } = await supabase
      .from('follow_requests')
      .update({ status: 'Accepted' })
      .eq('requester_id', senderId)
      .eq('target_id', userId);

    if (updateError) throw updateError;

    // Create one-way friendship (the sender is now following the accepter)
    const { error: friendError } = await supabase
      .from('friends')
      .insert([{ user_id: senderId, friend_id: userId }]);

    if (friendError) throw friendError;

    // Check if the user is already following back
    const { data: isFollowingBack, error: checkError } = await supabase
      .from('friends')
      .select('*')
      .eq('user_id', userId)
      .eq('friend_id', senderId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      // PGRST116 means no rows found - that's expected if not following back
      throw checkError;
    }

    // Delete the original follow_request notification
    const { error: deleteNotificationError } = await supabase
      .from('notifications')
      .delete()
      .eq('type', 'follow_request')
      .eq('user_id', userId)
      .eq('sender_id', senderId);

    if (deleteNotificationError) throw deleteNotificationError;

    // Create friend_accepted notification
    const { error: notificationError } = await supabase
      .from('notifications')
      .insert({
        type: 'friend_accepted',
        user_id: senderId, // Notify the original requester
        sender_id: userId, // The person who accepted
        seen: false
      });

    if (notificationError) throw notificationError;

    // If not following back, create a follow_back suggestion notification
    if (!isFollowingBack) {
      const { error: followBackError } = await supabase
        .from('notifications')
        .insert({
          type: 'follow_back',
          user_id: userId, // Suggest to the accepter to follow back
          sender_id: senderId,
          seen: false
        });

      if (followBackError) throw followBackError;
    }

    return true;
  } catch (error) {
    console.error('Error in handleFriendAcceptance:', error);
    return false;
  }
};

export const followBack = async (userId: string, followerId: string) => {
  try {
    // First check if a follow request is needed or already following
    const { data: alreadyFollowing, error: checkError } = await supabase
      .from('friends')
      .select('*')
      .eq('user_id', userId)
      .eq('friend_id', followerId)
      .single();
      
    if (checkError && checkError.code !== 'PGRST116') {
      // PGRST116 means no rows found - that's expected if not already following
      throw checkError;
    }
    
    if (alreadyFollowing) {
      return { success: true, message: "Already following" };
    }
    
    // Create the friendship directly since this is a follow back action
    const { error: friendError } = await supabase
      .from('friends')
      .insert([{ 
        user_id: userId, 
        friend_id: followerId
      }]);

    if (friendError) throw friendError;
    
    // Clean up the follow_back notification
    const { error: notificationError } = await supabase
      .from('notifications')
      .delete()
      .eq('type', 'follow_back')
      .eq('user_id', userId)
      .eq('sender_id', followerId);
      
    if (notificationError) throw notificationError;
    
    // Create a notification for the other user
    const { error: newNotificationError } = await supabase
      .from('notifications')
      .insert({
        type: 'followed_you_back',
        user_id: followerId,
        sender_id: userId,
        seen: false
      });

    if (newNotificationError) throw newNotificationError;

    return { success: true };
  } catch (error) {
    console.error('Error in followBack:', error);
    return { success: false, error };
  }
};

export const rejectFollowRequest = async (userId: string, senderId: string) => {
  try {
    // Update the request status to Rejected
    const { error: updateError } = await supabase
      .from('follow_requests')
      .update({ status: 'Rejected' })
      .eq('requester_id', senderId)
      .eq('target_id', userId);

    if (updateError) throw updateError;

    // Delete the notification or update its type
    const { error: notificationError } = await supabase
      .from('notifications')
      .delete()
      .eq('type', 'follow_request')
      .eq('user_id', userId)
      .eq('sender_id', senderId);

    if (notificationError) throw notificationError;

    return true;
  } catch (error) {
    console.error('Error in rejectFollowRequest:', error);
    return false;
  }
};
