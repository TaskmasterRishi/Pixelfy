import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { supabase } from '~/lib/supabase';
import { useAuth } from '~/providers/AuthProvider';
import PostListItem from '~/Components/PostListItem';
import CommentBottomSheet from '~/Components/CommentBottomSheet';

interface User {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string | null;
  verified: boolean;
  is_private: boolean;
}

interface Post {
  id: string;
  user_id: string;
  media_url: string;
  media_type: string;
  caption: string;
  created_at: string;
  user: User;
  likes_count: number;
}

const SavedPostsScreen = () => {
  const { user } = useAuth();
  const [savedPosts, setSavedPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentsPopupVisible, setCommentsPopupVisible] = useState(false);
  const [selectedCommentPostId, setSelectedCommentPostId] = useState<string | null>(null);
  const commentSheetRef = React.useRef<any>(null);

  useEffect(() => {
    const fetchSavedPosts = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('saved_posts')
          .select(`post:posts(id, user_id, media_url, media_type, caption, created_at, user:users(id, username, full_name, avatar_url, verified, is_private))`)
          .eq('user_id', user.id);

        if (error) throw error;

        console.log('Fetched data:', data);

        setSavedPosts(data.map(item => ({
          ...item.post,
          user: item.post.user
        })));
      } catch (error) {
        console.error('Error fetching saved posts:', error);
        Alert.alert('Error', 'Failed to load saved posts');
      } finally {
        setLoading(false);
      }
    };

    fetchSavedPosts();
  }, [user]);

  const handleCommentPress = useCallback((postId: string) => {
    setSelectedCommentPostId(postId);
    setCommentsPopupVisible(true);
  }, []);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#0ea5e9" />
      </View>
    );
  }

  // Ensure selectedCommentPostId is a string before passing to CommentBottomSheet
  const validCommentPostId = selectedCommentPostId || '';

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <View className="flex-1 bg-white justify-center pt-20">
        <View className="flex-row items-center justify-between px-4 pt-4 pb-2 border-b border-gray-200">
          <Text className="text-xl font-bold">Saved Posts</Text>
        </View>
        <FlatList
          data={savedPosts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <PostListItem post={item} onShowLikes={() => {}} onComment={() => handleCommentPress(item.id)} />}
          ListEmptyComponent={() => (
            <View className="flex-1 items-center justify-center">
              <Text className="text-gray-500">No saved posts yet.</Text>
            </View>
          )}
        />
        {commentsPopupVisible && (
          <CommentBottomSheet
            postId={validCommentPostId}
            sheetRef={commentSheetRef}
            visible={commentsPopupVisible}
            onClose={() => {
              setCommentsPopupVisible(false);
              setSelectedCommentPostId(null);
            }}
          />
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

export default SavedPostsScreen; 