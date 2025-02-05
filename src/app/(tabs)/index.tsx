import { Alert, FlatList } from "react-native";
import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "~/src/lib/supabase";
import PostListItem from "~/src/Components/PostListItem";
import { useFocusEffect } from "expo-router";

// Define types
type Post = {
  id: string;
  caption: string;
  image: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  profiles: {
    id: string;
    username: string;
    avatar_url: string;
  };
};

export default function FeedScreen() {
  const [posts, setPosts] = useState<Post[]>([]);
  const flatListRef = useRef<FlatList>(null);

  const fetchPosts = async () => {
    const { data, error } = await supabase
      .from("post")
      .select("*, profiles(id, username, avatar_url)")
      .order("created_at", { ascending: false });

    if (error) {
      Alert.alert("Something went wrong", error.message);
    } else if (data) {
      setPosts(
        data.map((post) => ({
          ...post,
          profiles: post.profiles || { id: "", username: "Unknown", avatar_url: "" },
        }))
      );
    }
  };

  // 🔴 Subscribe to profile updates
  useEffect(() => {
    const profileSubscription = supabase
      .channel("public:profiles")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "profiles" }, (payload) => {
        console.log("Profile updated:", payload.new);
        fetchPosts(); // Re-fetch posts when profile updates (e.g., avatar changes)
      })
      .subscribe();

    return () => {
      profileSubscription.unsubscribe();
    };
  }, []);

  // 🔄 Refresh feed when screen is focused
  useFocusEffect(
    useCallback(() => {
      fetchPosts();
      setTimeout(() => {
        flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
      }, 100);
    }, [])
  );

  return (
    <FlatList
      ref={flatListRef}
      data={posts}
      renderItem={({ item }) => <PostListItem post={item} />}
      keyExtractor={(item) => item.id.toString()}
      contentContainerStyle={{
        gap: 10,
        maxWidth: 512,
        alignSelf: "center",
        width: "100%",
      }}
      showsVerticalScrollIndicator={false}
    />
  );
}
