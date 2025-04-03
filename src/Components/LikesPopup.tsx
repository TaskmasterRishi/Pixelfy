import React, { useEffect, useState } from 'react';
import { View, Text, Modal, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { supabase } from '../lib/supabase';
import UserListItem from './UserListItem';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const MAX_TRANSLATE_Y = SCREEN_HEIGHT / 1.5;
const MIN_TRANSLATE_Y = SCREEN_HEIGHT / 5;

interface LikesPopupProps {
  visible: boolean;
  onClose: () => void;
  position: { x: number; y: number };
  postId: string;
}

export default function LikesPopup({ visible, onClose, position, postId }: LikesPopupProps) {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
  const translateY = useSharedValue(0);
  const context = useSharedValue({ y: 0 });

  const gesture = Gesture.Pan()
    .onStart(() => {
      context.value = { y: translateY.value };
    })
    .onUpdate((e) => {
      translateY.value = e.translationY + context.value.y;
      translateY.value = Math.max(translateY.value, -MAX_TRANSLATE_Y);
    })
    .onEnd(() => {
      if (translateY.value > -MIN_TRANSLATE_Y) {
        translateY.value = withSpring(SCREEN_HEIGHT);
        onClose();
      }
      if (translateY.value < -MIN_TRANSLATE_Y) {
        translateY.value = withSpring(-MAX_TRANSLATE_Y);
      }
    });

  const reanimatedBottomStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }]
  }));

  const scrollTo = (destination: number) => {
    'worklet';
    translateY.value = withSpring(destination, { damping: 50 });
  };

  useEffect(() => {
    if (visible) {
      scrollTo(-SCREEN_HEIGHT / 3);
    }
  }, [visible]);

  useEffect(() => {
    const fetchLikes = async () => {
      try {
        const { data, error } = await supabase
          .from('likes')
          .select('liker:users!likes_liked_user_fkey(id, username, avatar_url, full_name)')
          .eq('post_id', postId);

        if (error) throw error;
        setUsers(data?.map(like => like.liker) || []);
      } catch (error) {
        console.error('Error fetching likes:', error);
      } finally {
        setLoading(false);
      }
    };

    if (visible) {
      fetchLikes();
    }
  }, [visible, postId]);

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity 
        className="flex-1 bg-black/50" 
        activeOpacity={1} 
        onPress={onClose}
      >
        <GestureDetector gesture={gesture}>
          <Animated.View 
            className="absolute bg-white rounded-t-3xl w-full max-h-[90%] p-4 shadow-lg"
            style={[reanimatedBottomStyle, { top: SCREEN_HEIGHT }]}
          >
            <View className="w-12 h-1.5 bg-gray-300 rounded-full self-center mb-4" />
            <Text className="text-base font-semibold mb-3">Liked by</Text>
            {loading ? (
              <ActivityIndicator size="small" color="#000" />
            ) : (
              <View className="max-h-[80%]">
                {users.length > 0 ? (
                  users.map(user => (
                    <UserListItem 
                      key={user.id} 
                      user={user}
                      onPress={onClose}
                    />
                  ))
                ) : (
                  <Text className="text-gray-500 text-center">No likes yet</Text>
                )}
              </View>
            )}
          </Animated.View>
        </GestureDetector>
      </TouchableOpacity>
    </Modal>
  );
} 