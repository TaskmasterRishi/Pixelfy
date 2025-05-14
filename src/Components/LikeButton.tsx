import React, { forwardRef, useImperativeHandle, useState } from 'react';
import { TouchableOpacity } from 'react-native';
import { AntDesign } from '@expo/vector-icons';
import { supabase } from '~/lib/supabase';

interface LikeButtonProps {
  isLiked: boolean;
  postId: string;
  postUserId: string;
  userId?: string;
  onLikeChange: (liked: boolean) => void;
}

export interface LikeButtonRef {
  handleLikePress: () => Promise<void>;
}

const LikeButton = forwardRef<LikeButtonRef, LikeButtonProps>(
  ({ isLiked, postId, postUserId, userId, onLikeChange }, ref) => {
    const [isRequestPending, setIsRequestPending] = useState(false);

    const handlePress = async () => {
      if (!userId || isRequestPending) {
        return;
      }

      setIsRequestPending(true);

      try {
        // Check if the like already exists
        const { data: existingLike, error: fetchError } = await supabase
          .from('likes')
          .select('*')
          .eq('post_id', postId)
          .eq('liked_user', userId)
          .single();

        if (fetchError && fetchError.code !== 'PGRST116') {
          console.error('Error fetching like:', fetchError);
          return;
        }

        if (existingLike) {
          // Unlike: Delete the existing like
          const { error: deleteError } = await supabase
            .from('likes')
            .delete()
            .eq('post_id', postId)
            .eq('liked_user', userId);

          if (deleteError) {
            console.error('Error deleting like:', deleteError);
            return;
          }

          onLikeChange(false);
        } else {
          // Like: Add a new like with proper relationship
          const { error: insertError } = await supabase
            .from('likes')
            .insert([{ 
              post_id: postId,
              user_id: postUserId,
              liked_user: userId
            }]);

          if (insertError) {
            console.error('Error inserting like:', insertError);
            return;
          }

          onLikeChange(true);
        }
      } catch (error) {
        console.error('Error handling like:', error);
      } finally {
        setIsRequestPending(false);
      }
    };

    useImperativeHandle(ref, () => ({
      handleLikePress: handlePress
    }));

    return (
      <TouchableOpacity onPress={handlePress}>
        <AntDesign 
          name={isLiked ? "heart" : "hearto"} 
          size={26} 
          color={isLiked ? "#FF3B30" : "#262626"} 
        />
      </TouchableOpacity>
    );
  }
);

export { LikeButton };
export default LikeButton;
