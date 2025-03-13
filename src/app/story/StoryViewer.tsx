import React, { useEffect, useState, useRef } from "react";
import { View, Image, TouchableOpacity, ActivityIndicator, Text, Animated, Dimensions } from "react-native";
import { Video } from "expo-av";
import { useRouter, useLocalSearchParams } from "expo-router";
import { supabase } from "~/src/lib/supabase";
import Ionicons from "react-native-vector-icons/Ionicons";
import { TapGestureHandler, State, GestureHandlerRootView } from 'react-native-gesture-handler';

interface Story {
  id: string;
  media_url: string;
  created_at: string;
  caption: string;
  user_id: string;
}

export default function StoryViewer() {
  const { storyId } = useLocalSearchParams();
  const [stories, setStories] = useState<Story[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const videoRef = useRef<Video>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const fetchStories = async () => {
      setLoading(true);

      // Fetch the selected story first to find the user_id
      const { data: selectedStory, error: selectedError } = await supabase
        .from("stories")
        .select("id, media_url, created_at, caption, user_id")
        .eq("id", storyId)
        .single();

      if (selectedError || !selectedStory) {
        console.error("Error fetching selected story:", selectedError);
        setLoading(false);
        return;
      }

      // Fetch all stories from the same user, ordered by oldest first
      const { data: userStories, error: userError } = await supabase
        .from("stories")
        .select("id, media_url, created_at, caption, user_id")
        .eq("user_id", selectedStory.user_id)
        .order("created_at", { ascending: true }); // Changed to ascending order

      if (userError || !userStories) {
        console.error("Error fetching user's stories:", userError);
        setLoading(false);
        return;
      }

      setStories(userStories);
      // Always start from the first story (oldest)
      setCurrentIndex(0);
      startProgressBar();
      setLoading(false);
    };

    if (storyId) {
      fetchStories();
    }
  }, [storyId]);

  useEffect(() => {
    if (stories.length > 0) {
      startProgressBar();
    }
  }, [currentIndex, stories]);

  const isVideo = (url: string) => url.match(/\.(mp4|mov|avi|mkv|webm)$/i);

  const startProgressBar = () => {
    // Reset the progress bar
    progress.setValue(0);
    
    // Stop any existing animation
    progress.stopAnimation();

    // Start new animation
    Animated.timing(progress, {
      toValue: 100,
      duration: 5000, // 5 seconds per story
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished) {
        // Ensure we have the latest state
        setCurrentIndex(prevIndex => {
          if (prevIndex < stories.length - 1) {
            return prevIndex + 1;
          } else {
            router.back();
            return prevIndex; // Return current index while navigating back
          }
        });
      }
    });
  };

  const handleVideoPress = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pauseAsync();
      } else {
        videoRef.current.playAsync();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const goNextStory = () => {
    setCurrentIndex(prevIndex => {
      if (prevIndex < stories.length - 1) {
        return prevIndex + 1;
      } else {
        router.back();
        return prevIndex; // Return current index while navigating back
      }
    });
  };

  const goPrevStory = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    } else {
      router.back(); // Close if there are no previous stories
    }
  };

  const handleTap = ({ nativeEvent }) => {
    const screenWidth = Dimensions.get('window').width;
    const tapX = nativeEvent.x;
    
    if (tapX < screenWidth / 3) {
      goPrevStory();
    } else if (tapX > screenWidth / 3) {
      goNextStory();
    }
  };

  if (loading) {
    return <ActivityIndicator size="large" color="#fff" className="flex-1" />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <TapGestureHandler
        onHandlerStateChange={({ nativeEvent }) => {
          if (nativeEvent.state === State.END) {
            handleTap({ nativeEvent });
          }
        }}
      >
        <View className="flex-1 bg-black justify-center items-center relative">
          {/* Media */}
          {stories[currentIndex] && isVideo(stories[currentIndex].media_url) ? (
            <TouchableOpacity onPress={handleVideoPress} activeOpacity={1} className="w-full h-full">
              <Video
                ref={videoRef}
                source={{ uri: stories[currentIndex].media_url }}
                className="w-full h-full"
                useNativeControls={false}
                resizeMode="cover"
                shouldPlay
                isMuted={false}
                volume={1.0}
                onPlaybackStatusUpdate={(status) => {
                  if (status.didJustFinish) {
                    setCurrentIndex(prevIndex => {
                      if (prevIndex < stories.length - 1) {
                        return prevIndex + 1;
                      } else {
                        router.back();
                        return prevIndex;
                      }
                    });
                  }
                }}
              />
            </TouchableOpacity>
          ) : (
            <Image 
              source={{ uri: stories[currentIndex].media_url }} 
              className="w-full h-full" 
              resizeMode="cover"
              blurRadius={2}
            />
          )}

          {/* Gradient Overlay */}
          <View className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-black/50 to-black/10" />

          {/* Header with Progress Bar & Close Button */}
          <View className="absolute top-12 left-5 flex-row justify-between w-[90%] items-center">
            <View className="flex-1 flex-row space-x-1">
              {stories.map((_, index) => (
                <View key={index} className="h-1.5 flex-1 rounded-full bg-white/20 overflow-hidden">
                  <Animated.View
                    style={{
                      width: index === currentIndex ? progress.interpolate({ inputRange: [0, 100], outputRange: ["0%", "100%"] }) : "100%",
                      backgroundColor: index === currentIndex ? "#ffffff" : "#ffffff30",
                    }}
                    className="h-full rounded-full"
                  />
                </View>
              ))}
            </View>
            <TouchableOpacity 
              onPress={() => router.back()} 
              className="ml-4 p-2 bg-black/30 rounded-full"
            >
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
          </View>

          {/* Bottom Controls */}
          <View className="absolute bottom-10 w-[90%] flex-row items-end justify-between">
            {/* Caption */}
            <View className="flex-1 bg-black/30 rounded-2xl p-4">
              <Text className="text-white text-lg font-medium leading-6">
                {stories[currentIndex].caption}
              </Text>
            </View>

            {/* Action Icons */}
            <View className="flex-row space-x-4 ml-4">
              <TouchableOpacity className="bg-black/30 p-3 rounded-full shadow-lg">
                <Ionicons name="heart" size={24} color="white" />
              </TouchableOpacity>
              <TouchableOpacity className="bg-black/30 p-3 rounded-full shadow-lg">
                <Ionicons name="chatbubble" size={24} color="white" />
              </TouchableOpacity>
              <TouchableOpacity className="bg-black/30 p-3 rounded-full shadow-lg">
                <Ionicons name="paper-plane" size={24} color="white" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </TapGestureHandler>
    </GestureHandlerRootView>
  );
}

