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

    // Create one-way friendship
    const { error: friendError } = await supabase
      .from('friends')
      .insert([{ user_id: userId, friend_id: senderId }]);

    if (friendError) throw friendError;

    // Check if the user is following back
    const { data: isFollowingBack } = await supabase
      .from('friends')
      .select()
      .eq('user_id', senderId)
      .eq('friend_id', userId)
      .single();

    // If not following back, create a follow_back notification
    if (!isFollowingBack) {
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert({
          type: 'follow_back',
          user_id: userId,
          sender_id: senderId
        });

      if (notificationError) throw notificationError;
    }

    return true;
  } catch (error) {
    console.error('Error in handleFriendAcceptance:', error);
    return false;
  }
};

export const followBack = async (userId: string, followerId: string) => {
  try {
    // Send follow request back
    const { success } = await sendFriendRequest(userId, followerId);
    
    if (success) {
      // Check if mutual follow exists
      const { data: mutualFollow } = await supabase
        .from('follow_requests')
        .select('*')
        .eq('requester_id', followerId)
        .eq('target_id', userId)
        .eq('status', 'Accepted');

      if (mutualFollow && mutualFollow.length > 0) {
        // Create mutual friendship
        await supabase.from('friends').insert([
          { user_id: userId, friend_id: followerId },
          { user_id: followerId, friend_id: userId }
        ]);
      }
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error in followBack:', error);
    return false;
  }
};
