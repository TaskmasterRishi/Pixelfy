import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  Dimensions,
  TouchableWithoutFeedback,
  Image,
  Animated,
  StatusBar,
  TouchableOpacity,
} from "react-native";
import { Video } from "expo-av";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const { width, height } = Dimensions.get("window");

interface Story {
  id: string;
  media_url: string;
  type: "image" | "video";
  caption?: string;
  user: {
    username: string;
    avatar_url: string;
  };
  user_id: string;
}

interface StoryViewerProps {
  stories: Story[];
  onClose: () => void;
  onNextUser: () => void;
  onPreviousUser: () => void;
}

const StoryViewer = ({ stories, onClose, onNextUser, onPreviousUser }: StoryViewerProps) => {
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(false);
  const [videoDuration, setVideoDuration] = useState(5000);
  const [isPaused, setIsPaused] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const progress = useRef(new Animated.Value(0)).current;
  const videoRef = useRef<Video>(null);
  const animationStartTime = useRef(0);
  const pauseTime = useRef(0);
  const [isHolding, setIsHolding] = useState(false);
  const holdTimeout = useRef<NodeJS.Timeout | null>(null);

  // Ensure current is within bounds
  useEffect(() => {
    if (stories.length > 0 && (current < 0 || current >= stories.length)) {
      setCurrent(0); // Reset to the first story if out of bounds
    }
  }, [current, stories]);

  useEffect(() => {
    if (stories.length > 0) {
      startProgress();
    }
  }, [current, stories]);

  const startProgress = () => {
    if (!stories[current] || isPaused) return;

    const remainingTime = stories[current].type === "video" 
      ? videoDuration - elapsedTime 
      : 5000 - elapsedTime;

    progress.stopAnimation();
    progress.setValue(elapsedTime / (stories[current].type === "video" ? videoDuration : 5000));

    animationStartTime.current = Date.now() - elapsedTime;

    Animated.timing(progress, {
      toValue: 1,
      duration: remainingTime,
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished && !isPaused) {
        setElapsedTime(0);
        if (current < stories.length - 1) {
          setCurrent(current + 1);
        } else {
          onNextUser();
        }
      }
    });
  };

  const handlePause = () => {
    setIsPaused(true);
    progress.stopAnimation();
    pauseTime.current = Date.now();
    setElapsedTime(pauseTime.current - animationStartTime.current);
    
    if (currentStory.type === 'video' && videoRef.current) {
      videoRef.current.pauseAsync();
    }
  };

  const handleResume = () => {
    if (isPaused) { // Only resume if actually paused
      setIsPaused(false);
      animationStartTime.current = Date.now() - elapsedTime; // Update start time
      startProgress();
      
      if (currentStory.type === 'video' && videoRef.current) {
        videoRef.current.playAsync();
      }
    }
  };

  const nextStory = () => {
    if (current < stories.length - 1) {
      setCurrent(current + 1);
    } else {
      onNextUser();
    }
  };

  const previousStory = () => {
    if (current > 0) {
      setCurrent(current - 1);
    } else {
      onPreviousUser();
    }
  };

  const handlePressIn = () => {
    // Clear any existing timeout
    if (holdTimeout.current) {
      clearTimeout(holdTimeout.current);
    }
    
    // Set new timeout for hold detection
    holdTimeout.current = setTimeout(() => {
      setIsHolding(true);
      handlePause();
    }, 200);
  };

  const handlePressOut = () => {
    // Clear the timeout if it exists
    if (holdTimeout.current) {
      clearTimeout(holdTimeout.current);
    }
    
    // If we were holding, resume
    if (isHolding) {
      setIsHolding(false);
      // Force state update before resuming
      setImmediate(() => {
        handleResume();
      });
    }
  };

  const handleTap = (side: 'left' | 'right') => {
    // Only handle taps if we're not holding
    if (!isHolding) {
      if (side === 'right') {
        nextStory();
      } else {
        previousStory();
      }
    }
  };

  if (stories.length === 0) {
    return (
      <View className="flex-1 bg-black justify-center items-center">
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  const currentStory = stories[current];
  if (!currentStory) {
    return null; // Return nothing if current story is undefined
  }

  return (
    <View className="flex-1 bg-black">
      <StatusBar backgroundColor="black" barStyle="light-content" />

      {/* Story Media (Video/Image) */}
      <View className="absolute top-0 bottom-0 left-0 right-0">
        {currentStory.type === "video" ? (
          <Video
            ref={videoRef}
            source={{ uri: currentStory.media_url }}
            resizeMode="cover"
            shouldPlay
            useNativeControls={false}
            className="w-full h-full"
            onPlaybackStatusUpdate={(status) => {
              if (status.isLoaded) {
                setLoading(false);
                setVideoDuration(status.durationMillis || 5000);
              }
            }}
          />
        ) : (
          <Image
            source={{ uri: currentStory.media_url }}
            className="w-full h-full"
            resizeMode="cover"
            onLoadEnd={() => setLoading(false)}
          />
        )}
      </View>

      {/* Loading Indicator */}
      {loading && (
        <View className="absolute top-0 bottom-0 left-0 right-0 justify-center items-center bg-black/30">
          <ActivityIndicator size="large" color="white" />
        </View>
      )}

      {/* Header: User Info & Close Button */}
      <View className="absolute top-20 left-5 right-5 flex-row items-center justify-between">
        <View className="flex-row items-center space-x-3">
          <Image
            source={{ uri: currentStory.user.avatar_url }}
            className="w-10 h-10 rounded-full border-2 border-white"
          />
          <Text className="text-white text-lg pl-5 font-semibold">
            {currentStory.user.username}
          </Text>
        </View>
        <TouchableOpacity onPress={onClose} className="p-2">
          <Ionicons name="close" size={28} color="white" />
        </TouchableOpacity>
      </View>

      {/* Progress Bars */}
      <View className="absolute top-32 left-5 right-5 flex-row space-x-1">
        {stories.map((_, index) => (
          <View
            key={index}
            className="flex-1 h-1.5 bg-gray-500/30 rounded-full overflow-hidden"
          >
            <Animated.View
              className="h-1.5 bg-white rounded-full"
              style={{
                width: current === index
                  ? progress.interpolate({
                      inputRange: [0, 1],
                      outputRange: ["0%", "100%"],
                    })
                  : current > index
                  ? "100%"
                  : "0%",
              }}
            />
          </View>
        ))}
      </View>

      {/* Caption & Action Buttons */}
      <View className="absolute bottom-24 left-4 right-4">
        {currentStory.caption && (
          <Text className="text-white pb-20 bg-black text-lg font-medium mb-4">
            {currentStory.caption}
          </Text>
        )}
        <View className="absolute bottom-4 right-4 flex-col space-y-4">
          <TouchableOpacity className="bg-black/50 p-3 rounded-full">
            <Ionicons name="heart" size={24} color="white" />
          </TouchableOpacity>
          <TouchableOpacity className="bg-black/50 p-3 rounded-full">
            <Ionicons name="chatbubble" size={24} color="white" />
          </TouchableOpacity>
          <TouchableOpacity className="bg-black/50 p-3 rounded-full">
            <Ionicons name="paper-plane" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Navigation Controls */}
      <View className="absolute top-0 left-0 right-0 bottom-0 flex-row">
        <TouchableWithoutFeedback 
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={() => handleTap('left')}
        >
          <View className="flex-1" />
        </TouchableWithoutFeedback>
        <TouchableWithoutFeedback 
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={() => handleTap('right')}
        >
          <View className="flex-1" />
        </TouchableWithoutFeedback>
      </View>
    </View>
  );
};

export default function StoryViewerWrapper() {
  const { storyData, initialUserId } = useLocalSearchParams();
  const router = useRouter();
  const [groupedStories, setGroupedStories] = useState<{ [key: string]: Story[] }>({});
  const [currentUserId, setCurrentUserId] = useState<string | null>(initialUserId as string | null);
  const [currentUserStories, setCurrentUserStories] = useState<Story[]>([]);

  useEffect(() => {
    const fetchAndTransformStories = async () => {
      try {
        if (!storyData) {
          console.error("Error: storyData is undefined or null");
          return;
        }

        const parsedStories = JSON.parse(storyData as string);
        setGroupedStories(parsedStories);

        if (initialUserId && parsedStories[initialUserId]) {
          setCurrentUserStories(parsedStories[initialUserId]);
        }
      } catch (error) {
        console.error("Error parsing storyData:", error);
      }
    };

    fetchAndTransformStories();
  }, [storyData, initialUserId]);

  const handleNextUser = () => {
    const userIds = Object.keys(groupedStories);
    const currentIndex = userIds.indexOf(currentUserId || "");

    if (currentIndex < userIds.length - 1) {
      const nextUserId = userIds[currentIndex + 1];
      setCurrentUserId(nextUserId);
      setCurrentUserStories(groupedStories[nextUserId]);
    } else {
      router.back(); // Auto-close when all users' stories are viewed
    }
  };

  const handlePreviousUser = () => {
    const userIds = Object.keys(groupedStories);
    const currentIndex = userIds.indexOf(currentUserId || "");

    if (currentIndex > 0) {
      const previousUserId = userIds[currentIndex - 1];
      setCurrentUserId(previousUserId);
      setCurrentUserStories(groupedStories[previousUserId]);
    }
  };

  if (!currentUserId || currentUserStories.length === 0) {
    return (
      <View className="flex-1 bg-black justify-center items-center">
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    <StoryViewer
      stories={currentUserStories}
      onClose={() => router.back()}
      onNextUser={handleNextUser}
      onPreviousUser={handlePreviousUser}
    />
  );
}
