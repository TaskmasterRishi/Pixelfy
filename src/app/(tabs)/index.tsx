import { Alert, FlatList } from "react-native";
import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "~/src/lib/supabase";
import PostListItem from "~/src/Components/PostListItem";
import { useFocusEffect } from "expo-router"; // Or import from "@react-navigation/native" if you're using that

// Define the types for the post data and user data
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
      // For each post, ensure a fallback for profiles if missing
      const updatedData = data.map((post) => ({
        ...post,
        profiles: post.profiles || { id: "", username: "Unknown", avatar_url: "" },
      }));
      setPosts(updatedData);
    }
  };

  // Refresh posts and scroll to top when the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchPosts();
      // Wait a moment to ensure posts are loaded, then scroll to top.
      // You can adjust the timeout if necessary.
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
