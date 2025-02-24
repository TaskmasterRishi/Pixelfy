import { supabase } from './supabase';

// Check if a post is liked by the current user
export const isPostLiked = async (postId: string, userId: string) => {
  const { data, error } = await supabase
    .from('likes')
    .select('id')
    .eq('post_id', postId)
    .eq('user_id', userId)
    .single();

  return !!data && !error;
};

// Get total likes count for a post
export const getLikesCount = async (postId: string) => {
  const { count, error } = await supabase
    .from('likes')
    .select('*', { count: 'exact' })
    .eq('post_id', postId);

  return error ? 0 : count || 0;
};

// Toggle like for a post
export const toggleLike = async (postId: string, userId: string) => {
  try {
    const isLiked = await isPostLiked(postId, userId);

    if (isLiked) {
      const { error } = await supabase
        .from('likes')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', userId);

      return { success: !error, liked: false };
    } else {
      const { error } = await supabase
        .from('likes')
        .insert({
          post_id: postId,
          user_id: userId,
          created_at: new Date().toISOString()
        });

      return { success: !error, liked: true };
    }
  } catch (error) {
    console.error('Error toggling like:', error);
    return { success: false, liked: false };
  }
};

// Subscribe to likes changes
export const subscribeToLikes = (postId: string, callback: (payload: any) => void) => {
  return supabase
    .channel('likes-channel')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'likes',
      filter: `post_id=eq.${postId}`
    }, callback)
    .subscribe();
}; 