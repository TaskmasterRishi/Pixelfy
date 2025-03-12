import { useEffect, useState } from "react";
import { View, FlatList, Image, TouchableOpacity, Text, ActivityIndicator } from "react-native";
import { supabase } from "~/src/lib/supabase";
import { useRouter } from "expo-router";

export default function StoryList() {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  // Add a state to track if router is ready
  const [isRouterReady, setIsRouterReady] = useState(false);

  useEffect(() => {
    // Check if router is ready
    if (router) {
      setIsRouterReady(true);
    }
  }, [router]);

  useEffect(() => {
    const fetchStories = async () => {
      try {
        const { data, error } = await supabase
          .from("stories")
          .select("id, user_id, media_url, created_at, user:users(username, avatar_url)")
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Error fetching stories:", error);
          setError(error.message);
        } else {
          console.log("Fetched stories:", data);
          setStories(data);
        }
      } catch (err) {
        console.error("Unexpected error:", err);
        setError("An unexpected error occurred.");
      } finally {
        setLoading(false);
      }
    };

    fetchStories();
  }, []);

  if (loading) {
    return (
      <View className="h-24 justify-center items-center">
        <ActivityIndicator size="small" color="#000" />
      </View>
    );
  }

  if (error) {
    return (
      <View className="h-24 justify-center items-center">
        <Text className="text-red-500">Error: {error}</Text>
      </View>
    );
  }

  return (
    <View className="h-24 bg-white shadow-md">
      <FlatList
        data={stories}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity 
            onPress={() => {
              if (isRouterReady) {
                router.push(`/StoryViewer?id=${item.id}`);
              } else {
                console.warn("Router not ready yet");
              }
            }}
          >
            <Image
              source={{ uri: item.user.avatar_url }}
              className="w-16 h-16 rounded-full mx-2 border-2 border-blue-500 shadow-lg"
            />
          </TouchableOpacity>
        )}
      />
    </View>
  );
}
