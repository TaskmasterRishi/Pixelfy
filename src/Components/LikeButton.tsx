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
    } else {
      // Unlike the post
      const { data, error } = await supabase
        .from('likes')
        .delete()
        .eq('post_id', postId)
        .eq('liked_user', userId)
        .select();

      if (error) throw error;
      console.log('Successfully unliked post:', data);
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
