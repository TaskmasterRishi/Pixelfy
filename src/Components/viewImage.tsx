import React, { useState, useEffect } from 'react';
import { Modal, Image, TouchableOpacity, View, Text, Pressable, LayoutChangeEvent } from 'react-native';
import { GestureHandlerRootView, PinchGestureHandler, PinchGestureHandlerGestureEvent, State } from 'react-native-gesture-handler';
import { Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import Animated, { useAnimatedGestureHandler, useSharedValue, withSpring } from 'react-native-reanimated';

interface ViewImageProps {
  visible: boolean;
  imageUrl: string;
  onClose: () => void;
  username?: string;
  avatarUrl?: string;
  timestamp?: Date;
  likes?: number;
  caption?: string;
}

const formatTimeAgo = (date: Date) => {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + 'y';
  
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + 'm';
  
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + 'd';
  
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + 'h';
  
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + 'm';
  
  return Math.floor(seconds) + 's';
};

const ViewImage: React.FC<ViewImageProps> = ({ 
  visible, 
  imageUrl, 
  onClose, 
  username = 'username',
  avatarUrl,
  timestamp = new Date(),
  likes = 0,
  caption = ''
}) => {
  const [fullScreen, setFullScreen] = useState(false);
  const [originalWidth, setOriginalWidth] = useState(0);
  const [originalHeight, setOriginalHeight] = useState(0);

  // Shared values for animated zoom
  const scale = useSharedValue(1);

  // Handle pinch-to-zoom gestures
  const pinchHandler = useAnimatedGestureHandler<PinchGestureHandlerGestureEvent>({
    onStart: (_, ctx: { startScale: number }) => {
      ctx.startScale = scale.value;
    },
    onActive: (event, ctx) => {
      scale.value = Math.max(1, Math.min(ctx.startScale * event.scale, 3));
    },
    onEnd: () => {
      scale.value = withSpring(1); // Reset zoom when user lifts fingers
    },
  });

  // Fetch original image dimensions
  useEffect(() => {
    if (imageUrl) {
      Image.getSize(imageUrl, (width, height) => {
        setOriginalWidth(width);
        setOriginalHeight(height);
      });
    }
  }, [imageUrl]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
        <BlurView intensity={100} tint="dark" className="flex-1 justify-center items-center">
          
          {/* Clickable background to close */}
          <Pressable className="absolute inset-0" onPress={onClose} />

          <View className="w-[80%] bg-white rounded-2xl overflow-hidden shadow-2xl">
            <View>
              {/* Header */}
              <View className="flex-row items-center p-4 border-b border-gray-200">
                <TouchableOpacity onPress={onClose} className="absolute left-2 z-10">
                  <Feather name="x" size={24} color="black" />
                </TouchableOpacity>
                
                <View className="flex-row items-center flex-1 ml-8">
                  {avatarUrl ? (
                    <Image 
                      source={{ uri: avatarUrl }} 
                      className="w-8 h-8 rounded-full"
                    />
                  ) : (
                    <View className="w-8 h-8 rounded-full bg-gray-200 items-center justify-center">
                      <Feather name="user" size={16} color="black" />
                    </View>
                  )}
                  <View className="ml-3">
                    <Text className="text-black font-semibold">{username}</Text>
                    <Text className="text-gray-500 text-xs">{formatTimeAgo(timestamp)}</Text>
                  </View>
                </View>
                
                <TouchableOpacity>
                  <Feather name="more-horizontal" size={24} color="black" />
                </TouchableOpacity>
              </View>

              {/* Image Container */}
              <PinchGestureHandler onGestureEvent={pinchHandler} onHandlerStateChange={(event) => {
                if (event.nativeEvent.state === State.END) {
                  scale.value = withSpring(1);
                }
              }}>
                <Animated.View
                  style={{
                    width: '100%',
                    aspectRatio: originalWidth && originalHeight ? originalWidth / originalHeight : 1,
                    overflow: 'hidden', // Prevent overflow
                    backgroundColor: '#000',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Animated.Image
                    source={{ uri: imageUrl }}
                    style={{
                      width: '100%',
                      height: '100%',
                      transform: [{ scale: scale }],
                    }}
                    resizeMode="contain"
                  />
                </Animated.View>
              </PinchGestureHandler>

              {/* Actions */}
              <View className="p-4 border-t border-gray-200">
                <View className="flex-row justify-between mb-4">
                  <View className="flex-row space-x-4">
                    <TouchableOpacity>
                      <Feather name="heart" size={24} color="black" />
                    </TouchableOpacity>
                    <TouchableOpacity>
                      <Feather name="message-circle" size={24} color="black" />
                    </TouchableOpacity>
                    <TouchableOpacity>
                      <Feather name="send" size={24} color="black" />
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity>
                    <Feather name="bookmark" size={24} color="black" />
                  </TouchableOpacity>
                </View>

                {/* Likes */}
                <Text className="text-black font-semibold mb-2">
                  {likes.toLocaleString()} likes
                </Text>

                {/* Caption */}
                {caption && (
                  <View className="flex-row mb-2">
                    <Text className="text-black font-semibold mr-2">{username}</Text>
                    <Text className="text-black flex-1">{caption}</Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* Full-Screen Image */}
          {fullScreen && (
            <Pressable 
              className="absolute inset-0 bg-black justify-center items-center"
              onPress={() => setFullScreen(false)}
            >
              <Image
                source={{ uri: imageUrl }}
                style={{
                  width: '100%',
                  height: '100%'
                }}
                resizeMode="contain"
              />
            </Pressable>
          )}
        </BlurView>
      </GestureHandlerRootView>
    </Modal>
  );
};

export default ViewImage;
