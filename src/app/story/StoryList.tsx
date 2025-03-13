import React, { useState, useEffect } from "react";
import { View, FlatList, Image, TouchableOpacity, ActivityIndicator, Text } from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "~/src/lib/supabase";

interface Story {
  id: string;
  user_id: string;
  media_url: string;
  created_at: string;
  user: {
    username: string;
    avatar_url: string;
  };
}

export default function StoryList() {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchStories = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("stories")
        .select("id, media_url, created_at, user_id, user:users(username, avatar_url)")
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) {
        console.error("Error fetching stories:", error);
      } else {
        // Filter to show only the latest story per user
        const uniqueUserStories = data.reduce((acc, story) => {
          const existing = acc.find(s => s.user_id === story.user_id);
          if (!existing) {
            acc.push(story);
          }
          return acc;
        }, []);
        setStories(uniqueUserStories);
      }
      setLoading(false);
    };

    fetchStories();
  }, []);

  if (loading) {
    return <ActivityIndicator size="small" color="#000" />;
  }

  return (
    <View style={{ paddingVertical: 10 }}>
      <FlatList
        data={stories}
        horizontal
        keyExtractor={(item) => item.id}
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => router.push({ pathname: "/story/StoryViewer", params: { storyId: item.id } })}
            style={{ marginHorizontal: 8, alignItems: "center" }}
          >
            <Image
              source={{ uri: item.user.avatar_url }}
              style={{
                width: 60,
                height: 60,
                borderRadius: 30,
                borderWidth: 2,
                borderColor: "#ff8501",
              }}
            />
            <Text style={{ fontSize: 12, marginTop: 4 }}>{item.user.username}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}
