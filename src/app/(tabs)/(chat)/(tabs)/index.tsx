import { View, Text, Image } from 'react-native';
import { ChannelList, Channel } from 'stream-chat-expo';
import { useEffect, useState } from 'react';
import { Link, Stack, useRouter } from 'expo-router';
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
                .select('id, avatar_url'); // Fetch user IDs and their avatar URLs

            if (error) {
                console.error("Error fetching user avatars:", error);
            } else {
                const avatars: { [key: string]: string } = {};
                data.forEach(user => {
                    avatars[user.id] = user.avatar_url; // Map user IDs to their avatar URLs
                });
                setUserAvatars(avatars);
            }
        };

        fetchUserAvatars();
    }, []);

    return (
        <>
            <Stack.Screen options={{
                headerRight: () => (
                    <FontAwesome5 
                        name="users" 
                        size={24} 
                        color="black" 
                        style={{ marginHorizontal: 15 }} 
                        onPress={() => {
                            router.push('/chat/user');
                        }}
                    />
                ),
            }} />
            <ChannelList 
                filters={{ members: { $in: [user.id] } }}
                onSelect={(channel) => router.push(`/chat/channel/${channel.id}`)} 
                ChannelPreview={(channel) => (
                    <View style={{ flexDirection: 'row', alignItems: 'center', padding: 10 }}>
                        {userAvatars[channel.members[0].user.id] && ( // Assuming the first member is the user
                            <Image
                                source={{ uri: userAvatars[channel.members[0].user.id] }}
                                style={{ width: 40, height: 40, borderRadius: 20, marginRight: 10 }}
                            />
                        )}
                        <Text>{channel.name}</Text>
                    </View>
                )}
            />
        </>
    );
} 


