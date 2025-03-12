import { useEffect, useState } from "react";
import { View, Image, TouchableOpacity } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { supabase } from "~/src/lib/supabase";

export default function StoryViewer() {
  const { id } = useLocalSearchParams();
  const [story, setStory] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const fetchStory = async () => {
      const { data, error } = await supabase
        .from("stories")
        .select("id, media_url, user:users(username, avatar_url)")
        .eq("id", id)
        .single();

      if (error) {
        console.error("Error fetching story:", error);
      } else {
        setStory(data);
      }
    };

    fetchStory();
  }, [id]);

  return story ? (
    <View className="flex-1 bg-black justify-center items-center">
      <Image source={{ uri: story.media_url }} className="w-full h-full" resizeMode="cover" />
      <TouchableOpacity
        className="absolute top-10 left-5 bg-white p-2 rounded-full shadow-md"
        onPress={() => router.back()}
      >
        ✖
      </TouchableOpacity>
    </View>
  ) : null;
}