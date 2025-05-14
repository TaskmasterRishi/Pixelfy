import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, ActivityIndicator, Alert } from 'react-native';
import { supabase } from '~/lib/supabase';
import { useAuth } from '~/providers/AuthProvider';
import PostListItem from '~/Components/PostListItem';

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

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#0ea5e9" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white justify-center pt-20">
      <View className="flex-row items-center justify-between px-4 pt-4 pb-2 border-b border-gray-200">
        <Text className="text-xl font-bold">Saved Posts</Text>
      </View>
      <FlatList
        data={savedPosts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <PostListItem post={item} onShowLikes={() => {}} />}
        ListEmptyComponent={() => (
          <View className="flex-1 items-center justify-center">
            <Text className="text-gray-500">No saved posts yet.</Text>
          </View>
        )}
      />
    </View>
  );
};

export default SavedPostsScreen; 