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
import { LinearGradient } from "expo-linear-gradient";

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
  const [mediaLoaded, setMediaLoaded] = useState<boolean[]>(new Array(stories.length).fill(false));
  const fadeAnim = useRef(new Animated.Value(0)).current; // Animation for fade-in effect

  // Ensure current is within bounds
  useEffect(() => {
    if (stories.length > 0 && (current < 0 || current >= stories.length)) {
      setCurrent(0); // Reset to the first story if out of bounds
    }
  }, [current, stories]);

  useEffect(() => {
    if (stories.length > 0) {
      startProgress();
      fadeIn(); // Trigger fade-in animation when the story changes
    }
  }, [current, stories]);

  const fadeIn = () => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500, // Duration of the fade-in effect
      useNativeDriver: true,
    }).start();
  };

  const startProgress = () => {
    if (!stories[current] || isPaused) return;

    const totalDuration = stories[current].type === "video" 
      ? videoDuration 
      : 5000;

    // Stop any existing animation
    progress.stopAnimation();

    // Reset elapsed time if starting fresh
    if (elapsedTime >= totalDuration) {
      setElapsedTime(0);
    }

    // Update the animation start time
    animationStartTime.current = Date.now() - elapsedTime;

    Animated.timing(progress, {
      toValue: 1,
      duration: totalDuration - elapsedTime,
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
    
    if (stories[current].type === 'video' && videoRef.current) {
      videoRef.current.pauseAsync();
    }
  };

  const handleResume = () => {
    if (!isPaused) return;

    setIsPaused(false);
    animationStartTime.current = Date.now() - elapsedTime;
    startProgress();
    
    if (stories[current].type === 'video' && videoRef.current) {
      videoRef.current.playAsync();
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
    if (holdTimeout.current) {
      clearTimeout(holdTimeout.current);
    }
    
    holdTimeout.current = setTimeout(() => {
      setIsHolding(true);
      handlePause();
    }, 200);
  };

  const handlePressOut = () => {
    if (holdTimeout.current) {
      clearTimeout(holdTimeout.current);
    }
    
    if (isHolding) {
      setIsHolding(false);
      setImmediate(() => {
        handleResume();
      });
    }
  };

  const handleTap = (side: 'left' | 'right') => {
    if (!isHolding) {
      if (side === 'right') {
        nextStory();
      } else {
        previousStory();
      }
    }
  };

  useEffect(() => {
    if (stories[current]?.type === 'video' && videoRef.current) {
      videoRef.current.getStatusAsync().then(status => {
        if (status.isLoaded) {
          setVideoDuration(status.durationMillis || 5000);
        }
      });
    }
  }, [current]);

  useEffect(() => {
    setElapsedTime(0);
    progress.setValue(0);
    startProgress();
  }, [current]);

  useEffect(() => {
    const preloadMedia = async () => {
      const loadPromises = stories.map(async (story, index) => {
        if (story.type === "video") {
          const video = new Video();
          await video.loadAsync({ uri: story.media_url });
        } else {
          await Image.prefetch(story.media_url);
        }
        setMediaLoaded(prev => {
          const newLoaded = [...prev];
          newLoaded[index] = true;
          return newLoaded;
        });
      });
      await Promise.all(loadPromises);
    };

    if (stories.length > 0) {
      preloadMedia();
    }
  }, [stories]);

  if (stories.length === 0 || mediaLoaded.some(loaded => !loaded)) {
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
      <Animated.View style={{ opacity: fadeAnim, position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }}>
        {currentStory.type === "video" ? (
          <Video
            ref={videoRef}
            source={{ uri: currentStory.media_url }}
            resizeMode="cover"
            shouldPlay={!isPaused}
            isLooping={false}
            useNativeControls={false}
            className="w-full h-full"
            onPlaybackStatusUpdate={(status) => {
              if (status.isLoaded) {
                setLoading(false);
                if (!isPaused && status.positionMillis && status.durationMillis) {
                  setElapsedTime(status.positionMillis);
                }
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
      </Animated.View>

      {/* Gradient Overlay */}
      <LinearGradient
        colors={["rgba(0,0,0,0.6)", "transparent", "rgba(0,0,0,0.6)"]}
        locations={[0, 0.5, 1]}
        className="absolute top-0 bottom-0 left-0 right-0"
      />

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
        <TouchableOpacity 
          onPress={(e) => {
            e.stopPropagation();
            onClose();
          }} 
          className="p-2"
        >
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
      <View className="absolute bottom-10 w-[100%] flex-row items-end justify-between">
        {/* Caption Container */}
        <View className="flex-1 bg-black/30 rounded-2xl p-4 mr-4">
          {/* Title Caption */}
          <Text className="text-white text-xl font-bold mb-1">
            {currentStory.user.username}'s Story
          </Text>
          {/* Story Caption */}
          {currentStory.caption ? (
            <Text className="text-white text-lg font-medium leading-6">
              {currentStory.caption}
            </Text>
          ) : (
            <Text className="text-gray-400 text-lg font-medium leading-6">
              No caption available
            </Text>
          )}
        </View>

        {/* Icons on Right Side */}
        <View className="flex-row bottom-10 right-5 gap-3">
          <TouchableOpacity 
            className="bg-white/10 p-3 rounded-full"
            onPress={(e) => {
              e.stopPropagation();
              // Add your like functionality here
            }}
          >
            <Ionicons name="heart" size={24} color="white" />
          </TouchableOpacity>
          <TouchableOpacity 
            className="bg-white/10 p-3 rounded-full"
            onPress={(e) => {
              e.stopPropagation();
              // Add your comment functionality here
            }}
          >
            <Ionicons name="chatbubble" size={24} color="white" />
          </TouchableOpacity>
          <TouchableOpacity 
            className="bg-white/10 p-3 rounded-full"
            onPress={(e) => {
              e.stopPropagation();
              // Add your share functionality here
            }}
          >
            <Ionicons name="paper-plane" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Navigation Controls */}
      <View className="absolute top-32 left-0 right-0 bottom-10 flex-row">
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