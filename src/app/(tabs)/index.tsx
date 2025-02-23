import { useState, useEffect, useCallback, useRef } from "react";
import { View, Text, FlatList, ActivityIndicator, Alert, RefreshControl } from "react-native";
import { supabase } from "~/src/lib/supabase";
import { useFocusEffect, useRouter } from "expo-router";
import PostListItem from "~/src/Components/PostListItem";

const PAGE_SIZE = 10;

export default function FeedScreen() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastPostId, setLastPostId] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const router = useRouter();
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  // Fetch posts from Supabase
  const fetchPosts = async (reset = false) => {
    if (!hasMore && !reset) return;

    setLoading(true);

    const query = supabase
      .from("posts")
      .select(`
        *,
        user:users (
          username,
          avatar_url,
          verified
        )
      `)
      .order("created_at", { ascending: false })
      .limit(PAGE_SIZE);

    if (!reset && lastPostId) {
      query.lt('id', lastPostId); // Fetch posts with IDs less than the last post ID
    }

    const { data, error } = await query;

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

    if (data.length > 0) {
      setLastPostId(data[data.length - 1].id); // Update the last post ID
    }

    setPosts((prev) => {
      const newPosts = reset ? data : [...prev, ...data];
      const uniquePosts = Array.from(new Map(newPosts.map((post) => [post.id, post])).values());
      return uniquePosts;
    });

    setHasMore(data.length === PAGE_SIZE); // Check if there are more posts to fetch
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

  // Debounced fetch on scroll
  const handleEndReached = () => {
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    debounceTimeout.current = setTimeout(() => {
      fetchPosts();
    }, 300); // 300ms debounce
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
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.5}
          ListFooterComponent={loading ? <ActivityIndicator size="small" color="#000" /> : null}
          initialNumToRender={10} // Render 10 items initially
          maxToRenderPerBatch={10} // Render 10 items per batch
          windowSize={21} // Render 21 items in the window (10 above, 10 below, 1 in view)
        />
      )}
    </View>
  );
}
