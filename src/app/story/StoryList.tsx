import React, { useState, useEffect } from "react";
import { View, FlatList, Image, TouchableOpacity, ActivityIndicator, Text } from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "~/lib/supabase";
import { useAuth } from "~/providers/AuthProvider";

interface Story {
  id: string;
  user_id: string;
  media_url: string;
  created_at: string;
  caption?: string;
  user: {
    username: string;
    avatar_url: string;
  };
}

export default function StoryList() {
  const [storiesByUser, setStoriesByUser] = useState<{ [key: string]: Story[] }>({});
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { user } = useAuth(); // Logged-in user

  useEffect(() => {
    const fetchStories = async () => {
      setLoading(true);
      
      const { data, error } = await supabase
        .from("stories")
        .select("id, media_url, created_at, user_id, caption, user:users(username, avatar_url)")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching stories:", error);
        setLoading(false);
        return;
      }

      // Group stories by user
      const groupedStories = data.reduce((acc, story) => {
        if (!acc[story.user_id]) {
          acc[story.user_id] = [];
        }
        acc[story.user_id].push(story);
        return acc;
      }, {} as { [key: string]: Story[] });

      // Create 2D array with logged-in user first
      const sortedUsers = user?.id && groupedStories[user.id]
        ? [user.id, ...Object.keys(groupedStories).filter(id => id !== user.id)]
        : Object.keys(groupedStories);

      setStoriesByUser(groupedStories);
      setLoading(false);
    };

    fetchStories();
  }, [user]);

  if (loading) {
    return <ActivityIndicator size="small" color="#000" />;
  }

  return (
    <View style={{ paddingVertical: 10 }}>
      <FlatList
        data={[user?.id, ...Object.keys(storiesByUser)].filter((id, index, self) => id && self.indexOf(id) === index)}
        horizontal
        keyExtractor={(userId) => `user-story-${userId}`}
        showsHorizontalScrollIndicator={false}
        renderItem={({ item: userId }) => {
          const stories = storiesByUser[userId] || [];
          const firstStory = stories[0];

          return (
            <TouchableOpacity
              onPress={() => {
                if (stories.length > 0) {
                  router.push({
                    pathname: "/story/StoryViewer",
                    params: { 
                      storyData: JSON.stringify(storiesByUser),
                      initialUserId: userId
                    }
                  });
                } else {
                  router.push("/(tabs)/new");
                }
              }}
              style={{ marginHorizontal: 8, alignItems: "center" }}
            >
              <Image
                source={{ uri: firstStory ? firstStory.user.avatar_url : "https://via.placeholder.com/60" }}
                style={{
                  width: 70,
                  height: 70,
                  borderRadius: 30,
                  borderWidth: 2,
                  borderColor: firstStory ? "#ff8501" : "#ccc",
                }}
              />
              <Text style={{ fontSize: 12, marginTop: 4 }}>
                {firstStory ? firstStory.user.username : "Add Story"}
              </Text>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}
