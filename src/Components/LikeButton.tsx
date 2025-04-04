import React, { useState, useCallback, useEffect } from 'react';
import { TouchableOpacity } from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  withSpring, 
  withSequence,
  useSharedValue
} from 'react-native-reanimated';
import { AntDesign } from '@expo/vector-icons';
import { supabase } from '~/lib/supabase';
import { useAuth } from '~/providers/AuthProvider';
import { triggerNotification } from '~/Components/NotificationTrigger';

interface LikeButtonProps {
  isLiked?: boolean;
  postId: string;
  postUserId: string;
  onLikeChange?: (liked: boolean) => void;
}

export const checkIfLiked = async (postId: string, userId: string) => {
  try {
    if (!userId) {
      console.error('User not authenticated');
      return false;
    }

    const { data, error } = await supabase
      .from('likes')
      .select('*')
      .eq('post_id', postId)
      .eq('liked_user', userId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return !!data; // Return true if like exists, false otherwise
  } catch (error) {
    console.error('Error checking like status:', error);
    return false;
  }
};

export const handleLike = async ({
  postId,
  postUserId,
  isLiked,
  onLikeChange,
  userId
}: {
  postId: string;
  postUserId: string;
  isLiked: boolean;
  onLikeChange?: (liked: boolean) => void;
  userId: string;
}) => {
  try {
    if (!userId) {
      console.error('User not authenticated');
      return;
    }

    const newLikedState = !isLiked;
    
    if (newLikedState) {
      // Like the post
      const { data, error } = await supabase
        .from('likes')
        .insert({
          post_id: postId,
          user_id: postUserId,
          liked_user: userId
        })
        .select();

      if (error) throw error;

      // Check if notification already exists
      const { data: existingNotification } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', postUserId)
        .eq('sender_id', userId)
        .eq('post_id', postId)
        .eq('type', 'like')
        .maybeSingle();

      if (existingNotification) {
        // Update existing notification
        await supabase
          .from('notifications')
          .update({ created_at: new Date().toISOString() })
          .eq('id', existingNotification.id);
      } else {
        // Create new notification
        await supabase
          .from('notifications')
          .insert({
            user_id: postUserId,
            sender_id: userId,
            type: 'like',
            post_id: postId
          });
      }
    } else {
      // Unlike the post
      const { data, error } = await supabase
        .from('likes')
        .delete()
        .eq('post_id', postId)
        .eq('liked_user', userId)
        .select();

      if (error) throw error;

      // Delete notification for unlike
      await supabase
        .from('notifications')
        .delete()
        .eq('post_id', postId)
        .eq('sender_id', userId)
        .eq('type', 'like');
    }

    if (onLikeChange) {
      await onLikeChange(newLikedState);
    }

    return newLikedState;

  } catch (error) {
    console.error('Error in handleLike:', error);
    return isLiked;
  }
};

export const LikeButton = ({ isLiked = false }: { isLiked: boolean }) => {
  return (
    <AntDesign 
      name={isLiked ? "heart" : "hearto"} 
      size={26} 
      color={isLiked ? "#FF3B30" : "#262626"} 
    />
  );
};
