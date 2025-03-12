import { View, Image, TouchableOpacity, Text } from "react-native";
import { router } from "expo-router";

interface StoryCircleProps {
  user: {
    id: string;
    username: string;
    avatar_url: string;
  };
  stories: Array<any>;
  onPress: () => void;
}

export default function StoryCircle({ user, stories, onPress }: StoryCircleProps) {
  return (
    <TouchableOpacity 
      className="items-center space-y-1"
      onPress={onPress}
    >
      <View className="w-16 h-16 rounded-full border-2 border-blue-500 p-1">
        <Image
          source={{ uri: user.avatar_url }}
          className="w-full h-full rounded-full"
        />
      </View>
      <Text 
        className="text-xs text-gray-600" 
        numberOfLines={1}
      >
        {user.username}
      </Text>
    </TouchableOpacity>
  );
} 