import React, { useState } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import BottomSheet, { BottomSheetFlatList } from '@gorhom/bottom-sheet';
import { supabase } from '~/lib/supabase';
import { formatDistanceToNow } from 'date-fns';

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
    >
      <BottomSheetFlatList
        data={likes}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const likeDate = item.created_at ? new Date(item.created_at) : null;
          const timeText = likeDate && !isNaN(likeDate.getTime()) 
            ? formatDistanceToNow(likeDate, { addSuffix: true })
            : 'Recently';

          return (
            <View style={styles.likeItem}>
              <Image
                source={{ uri: item.users.avatar_url }}
                style={styles.avatar}
              />
              <View style={styles.userInfo}>
                <Text style={styles.username}>{item.users.username}</Text>
              </View>
              <Text style={styles.time}>
                {timeText}
              </Text>
            </View>
          );
        }}
        contentContainerStyle={styles.contentContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text>{loading ? 'Loading...' : 'No likes yet'}</Text>
          </View>
        }
        style={styles.list}
      />
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  likeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
  username: {
    fontSize: 16,
  },
  time: {
    fontSize: 14,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  list: {
    flex: 1,
  },
}); 