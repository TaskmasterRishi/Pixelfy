import { useState } from "react";
import {
  Channel,
  ChannelList,
  MessageInput,
  MessageList,
} from "stream-chat-expo";
import { Channel as ChannelType, StreamChat } from "stream-chat";
import { router } from "expo-router";
import { push } from "expo-router/build/global-state/routing";

export default function MainTabScreen() {
  return (
    <ChannelList
      onSelect={(channel) => router.push(`/channel/${channel.cid}`)}
    />
  );
}
