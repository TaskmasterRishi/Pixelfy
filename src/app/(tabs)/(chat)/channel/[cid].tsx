import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Text } from 'react-native';
import { Channel, MessageInput, MessageList, useChannelContext } from 'stream-chat-expo';
import { Channel as ChannelType, StreamChat } from "stream-chat";
import { useLocalSearchParams } from 'expo-router';

const client = StreamChat.getInstance("cxc6zzq7e93f");

export default function ChannelScreen() {
    const [channel, setChannel] = useState<ChannelType>();
    const {cid} = useLocalSearchParams<{cid : string}>();

    useEffect(() => {
        const fetchChannel = async () => {
            const channels = await client.queryChannels({cid});
            setChannel(channels[0])
        };
        fetchChannel();
    },[cid]);

    if (!channel) {
        return <ActivityIndicator />;
    }

    return (
        <Channel channel={channel}>
          <MessageList />
          <MessageInput />
        </Channel>
    );
}