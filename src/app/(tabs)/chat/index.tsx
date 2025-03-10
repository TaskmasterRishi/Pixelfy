import { View } from 'react-native';
import { ChannelList,Channel, MessageList, MessageInput } from 'stream-chat-expo';
import { Channel as ChannelType } from 'stream-chat';
import { useState } from 'react';

export default function ChatScreen() {
    const [channel, setChannel] = useState<ChannelType>();



if(channel){
   return (
      <Channel channel={channel}>
         <MessageList/>
         <MessageInput/>
      </Channel>
   )
}

    const onSelect = (channel: ChannelType) => {
        setChannel(channel);
        console.log('Selected channel:', channel);
    };

    return (
        <View style={{ flex: 1 }}>
            <ChannelList onSelect={onSelect} />
        </View>
    );
} 



