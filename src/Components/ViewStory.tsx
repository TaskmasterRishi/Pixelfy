import { useState, useEffect, useRef } from "react";
import { View, Image, TouchableOpacity, Dimensions, Text, ActivityIndicator } from "react-native";
import { supabase } from "~/src/lib/supabase";
import { router } from "expo-router";
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get("window");

export default function ViewStory({ route }) {
  const { userId, initialIndex } = route.params;
  const [stories, setStories] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [loading, setLoading] = useState(true);
  const progressRef = useRef(new Array(stories.length).fill(0));

  const fetchStories = async () => {
    try {
      const { data, error } = await supabase
        .from("stories")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setStories(data);
    } catch (error) {
      console.error("Error fetching stories:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStories();
  }, [userId]);

  const handleNext = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      router.back();
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    } else {
      router.back();
    }
  };

  if (loading || !stories[currentIndex]) {
    return (
      <View className="flex-1 justify-center items-center bg-black">
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      <Image
        source={{ uri: stories[currentIndex].media_url }}
        className="w-full h-full"
        resizeMode="contain"
      />

      {/* Progress Bar */}
      <View className="absolute top-4 w-full px-4 flex-row space-x-1">
        {stories.map((_, index) => (
          <View
            key={index}
            className={`h-1 flex-1 ${index === currentIndex ? 'bg-white' : 'bg-white/50'}`}
          />
        ))}
      </View>

      {/* Navigation */}
      <View className="absolute top-0 bottom-0 w-full flex-row">
        <TouchableOpacity 
          className="flex-1"
          onPress={handlePrevious}
        />
        <TouchableOpacity 
          className="flex-1"
          onPress={handleNext}
        />
      </View>

      {/* Close Button */}
      <TouchableOpacity
        className="absolute top-4 right-4 p-2 bg-black/50 rounded-full"
        onPress={() => router.back()}
      >
        <Ionicons name="close" size={24} color="white" />
      </TouchableOpacity>
    </View>
  );
}
