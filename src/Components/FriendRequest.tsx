import { supabase } from '~/lib/supabase';

export const sendFriendRequest = async (requesterId: string, targetId: string) => {
  if (requesterId === targetId) {
    throw new Error("You cannot send a friend request to yourself.");
  }

  // Check for existing requests
  const { data: existingRequests } = await supabase
    .from('follow_requests')
    .select('*')
    .or(`and(requester_id.eq.${requesterId},target_id.eq.${targetId}),and(requester_id.eq.${targetId},target_id.eq.${requesterId})`)
    .eq('status', 'Pending');

  if (existingRequests && existingRequests.length > 0) {
    throw new Error("Friend request already exists or pending.");
  }

  try {
    // Create follow request
    const { error: requestError } = await supabase
      .from('follow_requests')
      .insert([{ 
        requester_id: requesterId, 
        target_id: targetId,
        status: 'Pending'
      }]);

    if (requestError) throw requestError;

    // Create notification
    const { error: notificationError } = await supabase
      .from('notifications')
      .insert([{
        type: 'follow_request',
        user_id: targetId,
        sender_id: requesterId
      }]);

    if (notificationError) throw notificationError;

    return { success: true };
  } catch (error) {
    console.error('Error in FriendRequest:', error);
    return { success: false, error };
  }
};

export const deleteFriendRequest = async (requestId: string, userId: string) => {
  try {
    const { error } = await supabase
      .from('follow_requests')
      .delete()
      .eq('id', requestId)
      .or(`requester_id.eq.${userId},target_id.eq.${userId}`);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error deleting friend request:', error);
    return { success: false, error };
  }
};
