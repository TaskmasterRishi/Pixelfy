import { Text, View, Image, TouchableOpacity } from "react-native";
import { Ionicons, AntDesign, Feather } from '@expo/vector-icons';

export default function PostListItem(props: { post: any; }) {
    const { post } = props;

    if (!post || !post.user) return null; // Return nothing if post data is incomplete

    return (
        <View className="bg-white">
            {/* Header */}
            <View className="p-2 flex-row gap-3 items-center">
                <Image
                    source={{ uri: post.user.image_url }}
                    className="w-12 aspect-square rounded-full"
                />
                <Text className="text-xl font-semibold text-gray-600">{post.user.username}</Text>
            </View>

            {/* Post Image */}
            <Image
                source={{ uri: post.image_url }}
                className="w-full aspect-[4/3]"
            />

            {/* Actions */}
            <View className="flex-row gap-3 p-2 pr-4 pl-4">
                <TouchableOpacity>
                    <AntDesign name="hearto" size={20} />
                </TouchableOpacity>
                <TouchableOpacity>
                    <Ionicons name="chatbubble-outline" size={20} />
                </TouchableOpacity>
                <TouchableOpacity>
                    <Feather name="send" size={20} />
                </TouchableOpacity>
    
                <TouchableOpacity className="ml-auto">
                    <Feather name="bookmark" size={20} />
                </TouchableOpacity>
            </View>
        </View>
    );
}
