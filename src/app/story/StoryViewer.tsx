import React, { useEffect, useState } from "react";
import { View, Image, ActivityIndicator, TouchableOpacity } from "react-native";
import { Video } from "expo-av";
import { useRouter, useLocalSearchParams } from "expo-router";
import { supabase } from "~/src/lib/supabase";
import Ionicons from "react-native-vector-icons/Ionicons";

interface Story {
  id: string;
  media_url: string;
  created_at: string;
}

export default function StoryViewer() {
  const { storyId } = useLocalSearchParams();
  const [story, setStory] = useState<Story | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchStory = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("stories")
        .select("id, media_url, created_at")
        .eq("id", storyId)
        .single();

      if (error) {
        console.error("Error fetching story:", error);
      } else {
        setStory(data);
      }
      setLoading(false);
    };

    if (storyId) {
      fetchStory();
    }
  }, [storyId]);

  if (loading) {
    return <ActivityIndicator size="large" color="#000" />;
  }

  // Function to detect if media is a video
  const isVideo = (url: string) => {
    return url.match(/\.(mp4|mov|avi|mkv|webm)$/i);
  };

  return (
    <View style={{ flex: 1, backgroundColor: "black", justifyContent: "center", alignItems: "center" }}>
      {story && isVideo(story.media_url) ? (
        <Video
          source={{ uri: story.media_url }}
          style={{ width: "100%", height: "100%" }}
          useNativeControls
          resizeMode="contain"
          shouldPlay
        />
      ) : (
        <Image source={{ uri: story?.media_url }} style={{ width: "100%", height: "100%" }} resizeMode="contain" />
      )}

      <TouchableOpacity onPress={() => router.back()} style={{ position: "absolute", top: 40, left: 20 }}>
        <Ionicons name="close" size={30} color="white" />
      </TouchableOpacity>
    </View>
  );
}
