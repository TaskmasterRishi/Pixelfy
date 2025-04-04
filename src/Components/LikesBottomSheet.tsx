import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import BottomSheet, { BottomSheetFlatList } from '@gorhom/bottom-sheet';
import { supabase } from '~/lib/supabase';
import { formatDistanceToNow } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';

interface Like {
  id: string;
  users: {
    username: string;
    avatar_url: string;
  };
  created_at: string;
}

interface LikesBottomSheetProps {
  postId: string;
  sheetRef: React.RefObject<BottomSheet>;
  visible: boolean;
  onClose: () => void;
}

export default function LikesBottomSheet({ 
  postId, 
  sheetRef, 
  visible,
  onClose 
}: LikesBottomSheetProps) {
  const [likes, setLikes] = useState<Like[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLikes = async (postId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("likes")
        .select(`
          id,
          post_id,
          created_at,
          liked_user:users!likes_liked_user_fkey(
            username,
            avatar_url
          )
        `)
        .eq("post_id", postId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching likes:", error.message);
        setError("Failed to fetch likes");
        setLikes([]);
      } else {
        const transformedData = data.map(like => ({
          id: like.id,
          users: {
            username: like.liked_user.username,
            avatar_url: like.liked_user.avatar_url
          },
          created_at: like.created_at
        }));
        setLikes(transformedData);
      }
    } catch (error) {
      console.error("Error fetching likes:", error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (postId) {
      fetchLikes(postId);
    }
  }, [postId]);

  React.useEffect(() => {
    if (visible) {
      sheetRef.current?.snapToIndex(0);
    } else {
      sheetRef.current?.close();
    }
  }, [visible]);

  return (
    <BottomSheet
      ref={sheetRef}
      snapPoints={['50%', '90%']}
      index={0}
      enableDynamicSizing={false}
      enablePanDownToClose={true}
      onChange={(index) => {
        if (index === -1) {
          onClose();
        }
      }}
      onClose={onClose}
      backgroundComponent={() => (
        <View className="flex-1 bg-gray-100 rounded-t-2xl" />
      )}
    >
      <View className="flex-1 bg-gray-100 rounded-t-2xl">
        <View className="flex-row justify-between items-center p-4 bg-gray-100 border-b border-gray-200 rounded-t-2xl">
          <Text className="text-xl font-bold">Likes</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color="black" />
          </TouchableOpacity>
        </View>
        <BottomSheetFlatList
          data={likes}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const likeDate = item.created_at ? new Date(item.created_at) : null;
            const timeText = likeDate && !isNaN(likeDate.getTime()) 
              ? formatDistanceToNow(likeDate, { addSuffix: true })
              : 'Recently';

            return (
              <View className="flex-row items-center justify-between py-3">
                <Image
                  source={{ uri: item.users.avatar_url }}
                  className="w-10 h-10 rounded-full mr-3"
                />
                <View className="flex-1">
                  <Text className="text-base">{item.users.username}</Text>
                </View>
                <Text className="text-sm text-gray-600">
                  {timeText}
                </Text>
              </View>
            );
          }}
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
          ListEmptyComponent={
            <View className="flex-1 justify-center items-center p-5">
              <Text>{loading ? 'Loading...' : 'No likes yet'}</Text>
            </View>
          }
          className="flex-1"
        />
      </View>
    </BottomSheet>
  );
} 