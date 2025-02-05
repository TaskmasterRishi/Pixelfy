import { useState } from "react";
import { Text, View, TouchableOpacity, useWindowDimensions, Image } from "react-native";
import { Ionicons, AntDesign, Feather } from '@expo/vector-icons';

export default function PostListItem({ post }) {
  const { width } = useWindowDimensions();
  
  // Default avatar fallback
  const DEFAULT_AVATAR = "https://res.cloudinary.com/dbcgxsh5x/image/upload/v1700000000/avatar/default-avatar.png";
  
  // State to track avatar URL
  const [avatarUrl, setAvatarUrl] = useState(
    post.profiles.avatar_url ? post.profiles.avatar_url : DEFAULT_AVATAR
  );


  return (
    <View style={{ backgroundColor: 'white' }}>
      {/* Header */}
      <View style={{ padding: 3, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Image
          source={{ uri: avatarUrl }}
          style={{ width: 36, height: 36, borderRadius: 24 }}
          onError={() => setAvatarUrl(DEFAULT_AVATAR)} // Set fallback avatar if loading fails
        />
        <Text style={{ fontSize: 18, fontWeight: '600', color: 'gray' }}>
          {post.profiles.username}
        </Text>
      </View>

      {/* Post Image */}
      <Image
        source={{ uri: post.image }} // Directly use Cloudinary post image URL
        style={{
          width: '100%',
          height: width,
          aspectRatio: 1,
        }}
        onError={() => console.log("Error loading post image.")}
      />

      {/* Caption */}
      {post.caption && (
        <Text style={{ padding: 8, fontSize: 16, color: 'gray' }}>
          {post.caption}
        </Text>
      )}

      {/* Actions */}
      <View style={{ flexDirection: 'row', gap: 12, padding: 3 }}>
        <TouchableOpacity>
          <AntDesign name="hearto" size={20} />
        </TouchableOpacity>
        <TouchableOpacity>
          <Ionicons name="chatbubble-outline" size={20} />
        </TouchableOpacity>
        <TouchableOpacity>
          <Feather name="send" size={20} />
        </TouchableOpacity>

        <TouchableOpacity style={{ marginLeft: 'auto' }}>
          <Feather name="bookmark" size={20} />
        </TouchableOpacity>
      </View>
    </View>
  );
}
