import { supabase } from '../lib/supabase';
import { useAuth } from '../providers/AuthProvider';

// Send follow request
export const sendFollowRequest = async (targetUserId: string) => {
  const { user } = useAuth();
  
  if (!user) {
    throw new Error('User not authenticated');
  }

  // Check if request already exists
  const { data: existingRequest, error: checkError } = await supabase
    .from('follow_requests')
    .select('*')
    .eq('requester_id', user.id)
    .eq('target_id', targetUserId)
    .single();

  if (existingRequest) {
    throw new Error('Follow request already exists');
  }

  // Create follow request
  const { data, error } = await supabase
    .from('follow_requests')
    .insert([{
      requester_id: user.id,
      target_id: targetUserId,
      status: 'Pending'
    }]);

  if (error) {
    throw error;
  }

  // Create notification
  await createNotification({
    userId: targetUserId,
    senderId: user.id,
    type: 'follow_request'
  });

  return data;
};

// Accept follow request
export const acceptFollowRequest = async (requestId: string) => {
  const { user } = useAuth();

  if (!user) {
    throw new Error('User not authenticated');
  }

  // Update follow request status
  const { data, error } = await supabase
    .from('follow_requests')
    .update({ status: 'Accepted' })
    .eq('id', requestId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  // Create notification for requester
  await createNotification({
    userId: data.requester_id,
    senderId: user.id,
    type: 'follow_request_accepted'
  });

  return data;
};

// Reject follow request
export const rejectFollowRequest = async (requestId: string) => {
  const { user } = useAuth();

  if (!user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('follow_requests')
    .update({ status: 'Rejected' })
    .eq('id', requestId);

  if (error) {
    throw error;
  }

  return data;
};

// Get follow requests for current user
export const getFollowRequests = async () => {
  const { user } = useAuth();

  if (!user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('follow_requests')
    .select(`
      id,
      status,
      created_at,
      requester:requester_id (id, username, avatar_url)
    `)
    .eq('target_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return data;
};

// Create notification
const createNotification = async ({
  userId,
  senderId,
  type,
  postId = null
}: {
  userId: string;
  senderId: string;
  type: string;
  postId?: string | null;
}) => {
  const { error } = await supabase
    .from('notifications')
    .insert([{
      user_id: userId,
      sender_id: senderId,
      type,
      post_id: postId
    }]);

  if (error) {
    throw error;
  }
};

// Get followers count
export const getFollowersCount = async (userId: string) => {
  const { count, error } = await supabase
    .from('follow_requests')
    .select('*', { count: 'exact' })
    .eq('target_id', userId)
    .eq('status', 'Accepted');

  if (error) {
    throw error;
  }

  return count || 0;
};

// Get following count
export const getFollowingCount = async (userId: string) => {
  const { count, error } = await supabase
    .from('follow_requests')
    .select('*', { count: 'exact' })
    .eq('requester_id', userId)
    .eq('status', 'Accepted');

  if (error) {
    throw error;
  }

  return count || 0;
}; 