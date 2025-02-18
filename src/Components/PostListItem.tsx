import { Text, View, TouchableOpacity, useWindowDimensions, Image } from "react-native";
import { Ionicons, AntDesign, Feather, Entypo } from '@expo/vector-icons';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useState, useMemo } from "react";
import { formatDistanceToNow } from "date-fns";

export default function PostListItem({ post }) {
  const { width } = useWindowDimensions();
  const [avatarError, setAvatarError] = useState(false);
  const [liked, setLiked] = useState(false);

  if (!post || !post.profiles) {
    console.error("Invalid Post Data:", post);
    return null;
  }

  const avatarUrl = useMemo(() => {
    return post.profiles?.avatar_url && !avatarError
      ? `${post.profiles.avatar_url}?t=${Date.now()}`
      : null;
  }, [post.profiles?.avatar_url, avatarError]);

  const timeAgo = useMemo(() => {
    return post.created_at ? formatDistanceToNow(new Date(post.created_at), { addSuffix: true }) : "Just now";
  }, [post.created_at]);

  return (
    <View className="bg-white mb-4">
      <View className="px-4 py-2 flex-row items-center justify-between">
        <View className="flex-row items-center gap-3">
          {avatarUrl ? (
            <Image
              source={{ uri: avatarUrl }}
              className="w-10 h-10 rounded-full border border-gray-300"
              onError={() => setAvatarError(true)}
            />
          ) : (
            <View className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
              <FontAwesome name="user" size={20} color="gray" />
            </View>
          )}
          <View>
            <Text className="text-sm font-semibold text-gray-900">{post.profiles?.username || "Unknown"}</Text>
            <Text className="text-xs text-gray-500">{timeAgo}</Text>
          </View>
        </View>
        <TouchableOpacity>
          <Entypo name="dots-three-horizontal" size={18} color="black" />
        </TouchableOpacity>
      </View>
      <Image
        source={{ uri: post.image }}
        className="w-full"
        style={{ height: width, aspectRatio: 1 }}
      />
      <View className="flex-row items-center justify-between px-4 py-2">
        <View className="flex-row gap-4">
          <TouchableOpacity onPress={() => setLiked(!liked)}>
            <AntDesign name={liked ? "heart" : "hearto"} size={24} color={liked ? "red" : "black"} />
          </TouchableOpacity>
          <TouchableOpacity>
            <Ionicons name="chatbubble-outline" size={24} color="black" />
          </TouchableOpacity>
          <TouchableOpacity>
            <Feather name="send" size={24} color="black" />
          </TouchableOpacity>
        </View>
        <TouchableOpacity>
          <Feather name="bookmark" size={24} color="black" />
        </TouchableOpacity>
      </View>
      <Text className="px-4 text-sm font-semibold">
        {liked ? "Liked by you and others" : "Be the first to like"}
      </Text>
      {post.caption && (
        <Text className="px-4 py-1 text-sm">
          <Text className="font-semibold">{post.profiles?.username || "Unknown"} </Text>
          {post.caption}
        </Text>
      )}
    </View>
  );
}