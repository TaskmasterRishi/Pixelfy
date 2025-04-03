import { View, Text, Image, TouchableOpacity } from 'react-native';
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
                    const cloudinaryUrl = `https://res.cloudinary.com/YOUR_CLOUD_NAME/image/upload/${user.avatar_url}`;
                    console.log(`Avatar URL for user ${user.id}: ${cloudinaryUrl}`);
                    avatars[user.id] = cloudinaryUrl;
                });
                setUserAvatars(avatars);
            }
        };

        fetchUserAvatars();
    }, []);

    return (
        <View style={{ flex: 1, padding: 10 }}>
            <TouchableOpacity 
                onPress={() => router.push('/(chat)/users')}
                style={{ alignSelf: 'flex-end', marginBottom: 10 }}
            >
                <FontAwesome5 name="users" size={24} color="black" />
            </TouchableOpacity>

            <ChannelList 
                filters={{ members: { $in: [user.id] } }}
                onSelect={(channel) => router.push(`/(chat)/channel/${channel.cid}`)} 
                ChannelPreview={(channel) => {
                    const memberId = channel.members[0].user.id;
                    const avatarUrl = userAvatars[memberId];
                    return (
                        <View style={{ flexDirection: 'row', alignItems: 'center', padding: 10 }}>
                            {avatarUrl && (
                                <Image
                                    source={{ uri: avatarUrl }}
                                    style={{ width: 40, height: 40, borderRadius: 20, marginRight: 10 }}
                                />
                            )}
                            <Text>{channel.name}</Text>
                        </View>
                    );
                }}
            />
        </View>
    );
}
