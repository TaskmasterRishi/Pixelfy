import { useState, useEffect } from "react";
import { View, FlatList, ActivityIndicator, Dimensions } from "react-native";
import { supabase } from "~/src/lib/supabase";
import { useAuth } from "~/src/providers/AuthProvider";
import StoryCircle from "~/src/Components/StoryCircle";
import { router } from "expo-router";

const { width } = Dimensions.get("window");

export default function StoriesScreen() {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchStories = async () => {
    try {
      const { data, error } = await supabase
        .from("stories")
        .select("*, user:users (id, username, avatar_url)")
        .order("created_at", { ascending: false })
        .gt("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      if (error) throw error;
      
      // Group stories by user
      const groupedStories = data.reduce((acc, story) => {
        if (!acc[story.user.id]) {
          acc[story.user.id] = {
            user: story.user,
            stories: []
          };
        }
        acc[story.user.id].stories.push(story);
        return acc;
      }, {});

      setStories(Object.values(groupedStories));
    } catch (error) {
      console.error("Error fetching stories:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStories();
  }, []);

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white p-4">
      <FlatList
        data={stories}
        keyExtractor={(item) => item.user.id}
        numColumns={4}
        columnWrapperStyle={{ justifyContent: "space-between" }}
        renderItem={({ item }) => (
          <StoryCircle
            user={item.user}
            stories={item.stories}
            onPress={() => router.push({
              pathname: "/ViewStory",
              params: { 
                userId: item.user.id,
                initialIndex: 0
              }
            })}
          />
        )}
      />
    </View>
  );
}
