import { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Channel, ChannelList, MessageInput, MessageList } from 'stream-chat-expo';
import { Channel as ChannelType, StreamChat } from "stream-chat";

export default function MainChatScreen() {

    const [channel, setChannel] = useState();
    if(channel){
        return(
            <Channel channel={channel}>
                <MessageList/>
                <MessageInput/>
            </Channel>
        )
    }

    return <ChannelList onSelect={setChannel}/>
}
