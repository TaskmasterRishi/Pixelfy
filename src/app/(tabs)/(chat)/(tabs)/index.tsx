import { View, Text, Image, TouchableOpacity, RefreshControl } from 'react-native';
import { ChannelList } from 'stream-chat-expo';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '~/providers/AuthProvider';
import { FontAwesome5 } from '@expo/vector-icons';
import { supabase } from '~/lib/supabase';

export default function ChatScreen() {
    const { user } = useAuth();
    const router = useRouter();
    const [userAvatars, setUserAvatars] = useState<{ [key: string]: string }>({});
    const [refreshing, setRefreshing] = useState(false);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchUserAvatars();
        setRefreshing(false);
    };

    useEffect(() => {
        const fetchUserAvatars = async () => {
            const { data, error } = await supabase
                .from('users')
                .select('id, avatar_url');

            if (error) {
                console.error("Error fetching user avatars:", error);
            } else {
                const avatars: { [key: string]: string } = {};
                data.forEach(user => {
                    const cloudinaryUrl = `${user.avatar_url}`;
                    avatars[user.id] = cloudinaryUrl;
                });
                setUserAvatars(avatars);
            }
        };

        fetchUserAvatars();
    }, []);

    useEffect(() => {
        router.setParams({
            headerShown: 'false'
        });
    }, [router]);

    return (
        <View className="flex-1 bg-gray-50">
            {/* Header */}
            <View className="bg-white px-5 pt-5 pb-4 border-b border-gray-200 shadow-sm">
                <View className="flex-row justify-between items-center">
                    <View>
                        <Text className="text-2xl font-bold text-gray-900">Chats</Text>
                        <Text className="text-sm text-gray-500 mt-1">
                            Connect with your community
                        </Text>
                    </View>
                    <TouchableOpacity 
                        onPress={() => router.push('/(chat)/users')}
                        className="bg-blue-500 p-3 rounded-lg shadow-lg"
                    >
                        <FontAwesome5 name="user-plus" size={18} color="white" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Chat List */}
            <View className="flex-1 p-4">
                <ChannelList 
                    filters={{ members: { $in: [user.id] } }}
                    onSelect={(channel) => router.push(`/(chat)/channel/${channel.cid}`)} 
                    ChannelPreview={(channel) => {
                        const memberId = channel.members[0].user.id;
                        const avatarUrl = userAvatars[memberId];
                        return (
                            <View className="flex-row items-center p-4 bg-white rounded-lg shadow-sm mb-3">
                                {avatarUrl ? (
                                    <Image
                                        source={{ uri: avatarUrl }}
                                        className="w-12 h-12 rounded-full border border-gray-200 mr-4"
                                    />
                                ) : (
                                    <View className="w-12 h-12 rounded-full bg-gray-200 mr-4 justify-center items-center">
                                        <FontAwesome5 name="user" size={20} color="#94a3b8" />
                                    </View>
                                )}
                                <View className="flex-1">
                                    <Text className="text-base font-medium text-gray-900">
                                        {channel.name}
                                    </Text>
                                    <Text className="text-sm text-gray-500 mt-1">
                                        Last message...
                                    </Text>
                                </View>
                                <FontAwesome5 name="chevron-right" size={14} color="#94a3b8" />
                            </View>
                        );
                    }}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={['#3b82f6']}
                            tintColor="#3b82f6"
                        />
                    }
                />
            </View>
        </View>
    );
}
