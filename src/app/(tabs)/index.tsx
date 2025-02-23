import { useState, useEffect, useCallback } from "react";
import { View, Text, FlatList, ActivityIndicator, Alert, RefreshControl } from "react-native";
import { supabase } from "~/src/lib/supabase";
import { useFocusEffect, useRouter } from "expo-router";
import PostListItem from "~/src/Components/PostListItem";

const PAGE_SIZE = 10;

export default function FeedScreen() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(0);
  const router = useRouter();

  // Fetch posts from Supabase
  const fetchPosts = async (reset = false) => {
    setLoading(true);

    const { data, error } = await supabase
      .from("posts")
      .select(`*`)
      .order("created_at", { ascending: false })
      .range(reset ? 0 : page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    if (error) {
      Alert.alert("Error", error.message);
      console.error("Supabase Fetch Error:", error);
      setLoading(false);
      return;
    }

    if (!Array.isArray(data)) {
      console.error("Unexpected data structure:", data);
      setLoading(false);
      return;
    }

    // Remove duplicates
    setPosts((prev) => {
      const newPosts = reset ? data : [...prev, ...data];
      const uniquePosts = Array.from(new Map(newPosts.map((post) => [post.id, post])).values());
      return uniquePosts;
    });

    setPage(reset ? 1 : page + 1);
    setLoading(false);
  };

  // Add function to check user profile
  const checkUserProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile, error } = await supabase
      .from('users')
      .select('username, is_private, verified')
      .eq('id', user.id)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching user profile:', error);
      return;
    }

    if (!profile || !profile.username) {
      console.log('Username not set or profile missing, redirecting to user_info');
      router.push('/(screens)/user_info');
    }
  };

  // Modify useFocusEffect to include profile check
  useFocusEffect(
    useCallback(() => {
      checkUserProfile();
      fetchPosts(true);
    }, [])
  );

  // Pull to refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPosts(true);
    setRefreshing(false);
  };

  return (
    <View className="flex-1 bg-gray-100">
      {loading && posts.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#000" />
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item, index) => (item.id ? item.id.toString() : `post-${index}`)}
          renderItem={({ item }) => <PostListItem post={item} />}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          onEndReached={() => fetchPosts(false)}
          onEndReachedThreshold={0.5}
          ListFooterComponent={loading ? <ActivityIndicator size="small" color="#000" /> : null}
        />
      )}
    </View>
  );
}
