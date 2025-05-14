import { supabase } from '~/lib/supabase';

export const sendFriendRequest = async (requesterId: string, targetId: string, requesterUsername?: string) => {
  if (requesterId === targetId) {
    throw new Error("You cannot send a follow request to yourself.");
  }

  try {
    // Check if already following
    const { data: existingFriendship, error: friendshipError } = await supabase
      .from('friends')
      .select('*')
      .or(`user_id.eq.${requesterId},user_id.eq.${targetId}`)
      .or(`friend_id.eq.${targetId},friend_id.eq.${requesterId}`)
      .maybeSingle();

    if (friendshipError) throw friendshipError;
    
    if (existingFriendship) {
      return { success: false, message: "Already following this user" };
    }

    // Check for existing pending requests
    const { data: existingRequests, error: requestsError } = await supabase
      .from('follow_requests')
      .select('*')
      .or(`requester_id.eq.${requesterId},requester_id.eq.${targetId}`)
      .or(`target_id.eq.${targetId},target_id.eq.${requesterId}`)
      .eq('status', 'Pending')
      .maybeSingle();

    if (requestsError) throw requestsError;
    
    if (existingRequests) {
      return { success: false, message: "Request already pending" };
    }

    // Create follow request
    const { error: requestError } = await supabase
      .from('follow_requests')
      .insert([{ 
        requester_id: requesterId, 
        target_id: targetId,
        status: 'Pending'
      }]);

    if (requestError) throw requestError;

    // Create notification for target user
    const { error: notificationError } = await supabase
      .from('notifications')
      .insert([{
        type: 'follow_request',
        user_id: targetId,
        sender_id: requesterId,
        seen: false
      }]);

    if (notificationError) throw notificationError;

    return { success: true };
  } catch (error) {
    console.error('Error in sendFriendRequest:', error);
    return { success: false, error };
  }
};

export const removeFriendRequest = async (requesterId: string, targetId: string, status?: string) => {
  try {
    if (status === 'requested' || !status) {
      // Delete the follow request
      const { error: requestError } = await supabase
        .from('follow_requests')
        .delete()
        .or(`requester_id.eq.${requesterId},requester_id.eq.${targetId}`)
        .or(`target_id.eq.${targetId},target_id.eq.${requesterId}`);

      if (requestError) throw requestError;

      // Delete the notification
      const { error: notificationError } = await supabase
        .from('notifications')
        .delete()
        .eq('type', 'follow_request')
        .eq('user_id', targetId)
        .eq('sender_id', requesterId);

      if (notificationError) throw notificationError;
    }

    if (status === 'following' || !status) {
      // Delete from friends table
      const { error: friendError } = await supabase
        .from('friends')
        .delete()
        .or(`user_id.eq.${requesterId},user_id.eq.${targetId}`)
        .or(`friend_id.eq.${targetId},friend_id.eq.${requesterId}`);

      if (friendError) throw friendError;
    }

    return { success: true };
  } catch (error) {
    console.error('Error in removeFriendRequest:', error);
    return { success: false, error };
  }
};
