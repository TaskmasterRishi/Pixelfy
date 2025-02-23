import React, { useState, useEffect } from 'react';
import { TouchableOpacity } from 'react-native';
import { AntDesign } from '@expo/vector-icons';
import { useSupabase } from '../../providers/SupabaseProvider';
import { useUser } from '../../providers/UserProvider';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSequence,
  withSpring 
} from 'react-native-reanimated';

interface LikeButtonProps {
  postId: string;
  initialLikeCount: number;
  onLikeChange?: (count: number) => void;
}

export default function LikeButton({ postId, initialLikeCount, onLikeChange }: LikeButtonProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(initialLikeCount);
  const supabase = useSupabase();
  const user = useUser();
  const likeScale = useSharedValue(1);

  useEffect(() => {
    checkIfLiked();
  }, []);

  const checkIfLiked = async () => {
    try {
      const { data, error } = await supabase
        .from('likes')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setIsLiked(!!data);
    } catch (error) {
      console.error('Error checking like status:', error);
    }
  };

  const toggleLike = async () => {
    try {
      if (isLiked) {
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user?.id);

        if (error) throw error;
        setLikesCount(prev => {
          const newCount = prev - 1;
          onLikeChange?.(newCount);
          return newCount;
        });
      } else {
        const { error } = await supabase
          .from('likes')
          .insert({
            post_id: postId,
            user_id: user?.id
          });

        if (error) throw error;
        setLikesCount(prev => {
          const newCount = prev + 1;
          onLikeChange?.(newCount);
          return newCount;
        });
      }
      
      // Animate the like button
      likeScale.value = withSequence(
        withSpring(0.8),
        withSpring(1)
      );
      
      setIsLiked(!isLiked);
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const likeButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: likeScale.value }],
  }));

  return (
    <TouchableOpacity 
      onPress={toggleLike}
      className="active:opacity-60"
    >
      <Animated.View style={likeButtonStyle}>
        <AntDesign 
          name={isLiked ? "heart" : "hearto"} 
          size={26} 
          color={isLiked ? "#FF3B30" : "#262626"} 
        />
      </Animated.View>
    </TouchableOpacity>
  );
} 