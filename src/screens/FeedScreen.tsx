import { useState, useRef, useCallback, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Animated,
  TouchableOpacity,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Easing,
  StyleSheet,
} from "react-native";
import { supabase } from "~/lib/supabase";
import { useFocusEffect, useRouter } from "expo-router";
import StoryList from "~/app/story/StoryList";
import PostListItem from "~/Components/PostListItem";
import { useFonts } from "expo-font";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useAuth } from "~/providers/AuthProvider";
import { LikeButton } from '~/Components/LikeButton';
import { GestureHandlerRootView } from 'react-native-gesture-hand
import LikesBottomSheet from '~/Components/LikesBottomSheet';

export default function FeedScreen() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const sheetRef = useRef<BottomSheet>(null);

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          id,
          user_id,
          caption,
          media_url,
          media_type,
          created_at,
          user:users(id, username, avatar_url, verified),
          likes_count:likes(count)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchPosts();
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleShowLikes = (postId: string) => {
    setSelectedPostId(postId);
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <PostListItem
            post={item}
            onShowLikes={handleShowLikes}
            // Add other necessary props
          />
        )}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        ListEmptyComponent={
          <View className="flex-1 justify-center items-center">
            <Text>No posts available</Text>
          </View>
        }
      />

      <LikesBottomSheet
        postId={selectedPostId || ''}
        sheetRef={sheetRef}
        visible={!!selectedPostId}
        onClose={() => setSelectedPostId(null)}
      />
    </View>
  );
} 