import React, { useEffect, useState, useMemo } from "react";
import {
  ActivityIndicator,
  View,
  Text,
  Image,
  TouchableOpacity,
  Alert,
  Modal,
  Pressable,
  BackHandler,
  StyleSheet,
  FlatList,
  TouchableWithoutFeedback,
} from "react-native";
import {
  Channel,
  MessageList,
  MessageInput,
  useMessageContext,
  useMessagesContext,
  useChannelContext,
  Attachment,
  FileAttachmentGroup,
  Gallery,
  MessageActionListItem,
  MessageActionListProps,
  MessageAvatar,
  MessageMenuProps,
  MessageReactionPicker,
  MessageTextContainer,
  MessageUserReactionsAvatar,
  MessageUserReactionsProps,
  Poll,
  Reaction,
  Reply,
  ReplyProps,
  StreamingMessageView,
  useChatContext,
  useFetchReactions,
  useTranslationContext,
} from "stream-chat-expo";
import { StreamChat, Channel as ChannelType } from "stream-chat";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { useAuth } from "~/providers/AuthProvider";
import * as ImagePicker from "expo-image-picker";
import Ionicons from "@expo/vector-icons/Ionicons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useFocusEffect } from "@react-navigation/native";
import { useVideoPlayer, VideoView } from 'expo-video';
import { TapGestureHandler } from "react-native-gesture-handler";
import { GestureHandlerRootView } from "react-native-gesture-handler";

const client = StreamChat.getInstance("cxc6zzq7e93f");

// Attachment Components
interface ImageAttachmentProps {
  attachment: {
    image_url?: string;
    asset_url?: string;
  };
  isMyMessage: boolean;
  message: any;
  onImagePress: (url: string) => void;
}

const ImageAttachment: React.FC<ImageAttachmentProps> = ({ 
  attachment, 
  isMyMessage, 
  message, 
  onImagePress 
}) => {
  const [imageDimensions, setImageDimensions] = useState({ width: 250, height: 250 });
  const imageUrl = attachment.image_url || attachment.asset_url;

  useEffect(() => {
    if (imageUrl) {
      Image.getSize(imageUrl, (width, height) => {
        setImageDimensions({ width: 250, height: 250 * (height / width) });
      });
    }
  }, [imageUrl]);

  return (
    <TouchableOpacity
      onPress={() => onImagePress(imageUrl || "")}
      activeOpacity={0.9}
      className="overflow-hidden rounded-2xl my-1"
    >
      <Image
        source={{ uri: imageUrl }}
        style={imageDimensions}
        resizeMode="cover"
      />
    </TouchableOpacity>
  );
};

interface VideoAttachmentProps {
  attachment: {
    image_url?: string;
    asset_url?: string;
  };
  isMyMessage: boolean;
  message: any;
}

const VideoAttachment: React.FC<VideoAttachmentProps> = ({ attachment, isMyMessage, message }) => {
  const imageUrl = attachment.image_url || attachment.asset_url;
  const player = useVideoPlayer({ uri: imageUrl }, (player) => {
    player.loop = true;
    player.play();
  });

  return (
    <View 
      className="overflow-hidden rounded-2xl my-1 bg-black"
      style={{ width: 250, height: 250 }}
    >
      <VideoView
        style={{ width: 250, height: 250 }}
        player={player}
        allowsFullscreen
        allowsPictureInPicture
      />
    </View>
  );
};

interface GiphyAttachmentProps {
  attachment: {
    giphy?: {
      fixed_height?: {
        url?: string;
      };
    };
    image_url?: string;
    asset_url?: string;
  };
  isMyMessage: boolean;
  message: any;
  onImagePress: (url: string) => void;
}

const GiphyAttachment = ({ attachment, isMyMessage, message, onImagePress }: GiphyAttachmentProps) => {
  const [giphyDimensions, setGiphyDimensions] = useState({ width: 250, height: 250 });
  const giphyUrl = attachment.giphy?.fixed_height?.url || attachment.image_url || attachment.asset_url;

  useEffect(() => {
    if (giphyUrl) {
      Image.getSize(giphyUrl, (width, height) => {
        setGiphyDimensions({ width: 250, height: 250 * (height / width) });
      });
    }
  }, [giphyUrl]);

  if (!giphyUrl) return null;

  return (
    <TouchableOpacity
      onPress={() => onImagePress(giphyUrl)}
      activeOpacity={0.9}
      className="overflow-hidden rounded-2xl my-1"
      style={{ width: 250 }}
    >
      <Image
        source={{ uri: giphyUrl }}
        style={{ width: "100%", height: giphyDimensions.height }}
        resizeMode="cover"
      />
    </TouchableOpacity>
  );
};

interface FileAttachmentProps {
  attachment: {
    title?: string;
  };
  isMyMessage: boolean;
}

const FileAttachment = ({ attachment, isMyMessage }: FileAttachmentProps) => {
  return (
    <View
      className={`overflow-hidden rounded-2xl my-1 ${isMyMessage ? "bg-blue-500" : "bg-gray-100"}`}
      style={{ width: 250 }}
    >
      <TouchableOpacity 
        className="flex-row items-center p-3"
        activeOpacity={0.7}
      >
        <Ionicons 
          name="document-outline" 
          size={24} 
          color={isMyMessage ? "#fff" : "#4b5563"} 
        />
        <Text 
          className={`ml-2 ${isMyMessage ? "text-white" : "text-gray-800"}`}
          numberOfLines={1}
        >
          {attachment.title || "File"}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

interface AttachmentRendererProps {
  attachment: {
    type?: string;
    image_url?: string;
    asset_url?: string;
    title?: string;
  };
  isMyMessage: boolean;
  message: any; // Consider defining a proper type for message
  onImagePress: (url: string) => void;
}

const AttachmentRenderer = ({
  attachment,
  isMyMessage,
  message,
  onImagePress,
}: AttachmentRendererProps) => {
  const imageUrl = attachment.image_url || attachment.asset_url;
  
  if (attachment.type === "image" || imageUrl?.match(/\.(jpeg|jpg|png|gif)$/i)) {
    return (
      <ImageAttachment 
        attachment={attachment} 
        isMyMessage={isMyMessage} 
        message={message} 
        onImagePress={onImagePress} 
      />
    );
  }
  
  if (attachment.type === "video" || (imageUrl && imageUrl.match(/\.(mp4|mov|webm)$/i))) {
    if (!imageUrl) return null;
    return (
      <VideoAttachment 
        attachment={attachment} 
        isMyMessage={isMyMessage} 
        message={message} 
      />
    );
  }
  
  if (attachment.type === "giphy") {
    return (
      <GiphyAttachment 
        attachment={attachment} 
        isMyMessage={isMyMessage} 
        message={message} 
        onImagePress={onImagePress} 
      />
    );
  }
  
  if (attachment.type === "file") {
    return (
      <FileAttachment
        attachment={attachment}
        isMyMessage={isMyMessage}
      />
    );
  }
  
  return null;
};

// Message timestamp component
interface MessageTimestampProps {
  timestamp?: string | number | Date;
  isMyMessage: boolean;
}

const MessageTimestamp = ({ timestamp, isMyMessage }: MessageTimestampProps) => {
  if (!timestamp) return null;
  
  const time = new Date(timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  
  return (
    <Text className={`text-xs mt-1 ${isMyMessage ? "text-right text-gray-500" : "text-left text-gray-500"}`}>
      {time}
    </Text>
  );
};

// Message header with sender name for group chats
interface MessageHeaderProps {
  message: {
    user?: {
      id?: string;
      name?: string;
    };
  };
  members?: unknown;
}

const MessageHeader = (props: MessageHeaderProps) => {
  const { message } = props;
  const { channel } = useChannelContext();
  const isGroup = Object.keys(channel.state.members).length > 2;
  
  // Only show headers for other users' messages in group chats
  if (!isGroup || !message?.user?.name || message?.user?.id === client.userID) return null;
  
  return (
    <Text className="text-sm text-gray-500 mb-1">{message.user.name}</Text>
  );
};

const CustomMessageActionsList = (props: MessageActionListProps) => {
  const { messageActions } = props;
  
  return (
    <View className="bg-white rounded-lg p-4 shadow-md w-11/12 max-w-md">
      {messageActions?.map((action) => (
        <TouchableOpacity 
          key={action.title} 
          className="flex-row items-center py-3 border-b border-gray-100"
          onPress={action.action}
        >
          <View className="w-8 h-8 rounded-full bg-blue-50 items-center justify-center mr-3">
            {action.icon ? (
              action.icon
            ) : (
              <Ionicons name="chatbubble-outline" size={18} color="#3b82f6" />
            )}
          </View>
          <Text className="text-gray-800 text-base">{action.title}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const CustomMessageReactions = (props: MessageUserReactionsProps) => {
  const { reactions: propReactions, selectedReaction } = props;
  const { supportedReactions } = useMessagesContext();
  const { message } = useMessageContext();
  const { loadNextPage, reactions: fetchedReactions } = useFetchReactions({
    message,
    reactionType: selectedReaction,
    sort: {
      created_at: -1,
    },
  });
  const { t } = useTranslationContext();
  
  // Helper function to convert reaction type to emoji - same as in CustomMessage
  const getReactionEmoji = (type: string) => {
    const reactions: {[key: string]: string} = {
      love: "❤️", 
      like: "👍", 
      haha: "😂", 
      wow: "😮", 
      sad: "😢", 
      angry: "😠",
    };
    
    return reactions[type] || "👍";
  };
  
  const reactions = useMemo(
    () =>
      propReactions ||
      (fetchedReactions.map((reaction) => ({
        id: reaction.user?.id,
        image: reaction.user?.image,
        name: reaction.user?.name,
        type: reaction.type,
      })) as Reaction[]),
    [propReactions, fetchedReactions],
  );

  const renderItem = ({ item }: { item: Reaction }) => (
    <View className="flex-row items-center justify-center p-2">
      <View className="items-center mr-2">
        {item.image ? (
          <Image 
            source={{ uri: item.image }} 
            className="w-8 h-8 rounded-full"
          />
        ) : (
          <View className="w-8 h-8 rounded-full bg-gray-200 items-center justify-center">
            <Text className="text-gray-500 font-bold">
              {item.name?.[0] || "?"}
            </Text>
          </View>
        )}
      </View>
      <View className="items-center">
        <Text className="text-2xl">{getReactionEmoji(item.type)}</Text>
        <Text className="text-xs text-gray-500 mt-1">{item.name}</Text>
      </View>
    </View>
  );

  const renderHeader = () => (
    <Text className="text-base font-bold text-center my-4 text-gray-800">
      {t<string>("Message Reactions")}
    </Text>
  );

  return (
    <View className="bg-white rounded-lg p-4 shadow-md w-11/12 max-w-md max-h-[300px]">
      <FlatList
        accessibilityLabel="reaction-flat-list"
        contentContainerStyle={{ paddingHorizontal: 8 }}
        data={reactions}
        keyExtractor={(item) => `${item.id}-${item.type}`}
        ListHeaderComponent={renderHeader}
        numColumns={2}
        onEndReached={loadNextPage}
        renderItem={renderItem}
      />
    </View>
  );
};

// Updated MessageReactionPicker component to use the proper reaction types
export const CustomMessageReactionPicker = (props: any) => {
  const { dismissOverlay, ownReactionTypes = [] } = props;
  const { message } = useMessageContext();
  const { channel } = useChannelContext();
  
  // Define direct mapping of reaction types for simplicity
  const reactionTypes = ['love', 'like', 'haha', 'wow', 'sad', 'angry'];
  
  // Helper function to convert reaction type to emoji
  const getReactionEmoji = (type: string) => {
    const reactions: {[key: string]: string} = {
      love: "❤️", 
      like: "👍", 
      haha: "😂", 
      wow: "😮", 
      sad: "😢", 
      angry: "😠",
    };
    
    return reactions[type] || "👍";
  };
  
  // Direct function to send reaction using the channel API
  const sendReaction = async (type: string) => {
    try {
      console.log("Sending reaction directly via channel:", type, message.id);
      // Check if user already has this reaction
      const hasReaction = message.own_reactions?.some(r => r.type === type);
      
      if (hasReaction) {
        // Remove reaction if it exists
        await channel.deleteReaction(message.id, type);
      } else {
        // Add reaction
        await channel.sendReaction(message.id, { type });
      }
      dismissOverlay();
    } catch (error) {
      console.error("Reaction error:", error);
    }
  };
  
  return (
    <View className="bg-white rounded-full px-3 py-2 flex-row shadow-md z-50" 
          style={{ position: 'absolute', top: '15%' }}>
      {reactionTypes.map((type) => {
        const isOwn = ownReactionTypes.includes(type);
        return (
          <TouchableOpacity
            key={type}
            onPress={() => sendReaction(type)}
            className={`px-3 py-2 mx-1 ${isOwn ? "bg-blue-100 rounded-full" : ""}`}
            activeOpacity={0.7}
          >
            <Text className="text-2xl">{getReactionEmoji(type)}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

export const CustomMessageMenu = (props: MessageMenuProps) => {
  const { client } = useChatContext();
  const {
    alignment,
    files,
    groupStyles,
    images,
    message,
    dismissOverlay,
    handleReaction,
    onlyEmojis,
    otherAttachments,
    threadList,
    videos,
  } = useMessageContext();
  
  const {
    messageContentOrder,
    messageTextNumberOfLines,
    isMessageAIGenerated,
  } = useMessagesContext();
  
  const own_reactions =
    message?.own_reactions?.map((reaction) => reaction.type) || [];
    
  const {
    messageActions,
    showMessageReactions,
    selectedReaction,
    MessageUserReactionsItem,
  } = props;

  const groupStyle = `${alignment}_${(groupStyles?.[0] || "bottom").toLowerCase()}`;
  const hasThreadReplies = !!message?.reply_count;
  
  const messageHeight = useSharedValue(0);
  const messageLayout = useSharedValue({ x: 0, y: 0 });
  const messageWidth = useSharedValue(0);

  return (
    <View className="flex-1">
      <Modal onRequestClose={dismissOverlay} transparent visible={true}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <TouchableWithoutFeedback
            onPress={dismissOverlay}
            style={{ flex: 1 }}
          >
            <View className="flex-1 bg-black/70 justify-center items-center">
              <CustomMessageReactionPicker
                dismissOverlay={dismissOverlay}
                ownReactionTypes={own_reactions}
              />
              
              <View style={{ width: '100%', flexDirection: 'column', alignItems: 'center' }}>
                {/* Position reactions above the message */}
                {showMessageReactions && (
                  <View style={{ width: '100%', alignItems: 'center', marginBottom: 10, zIndex: 2 }}>
                    <CustomMessageReactions
                      message={message}
                      MessageUserReactionsAvatar={MessageUserReactionsAvatar}
                      MessageUserReactionsItem={MessageUserReactionsItem}
                      selectedReaction={selectedReaction}
                    />
                  </View>
                )}
                
                <Animated.View
                  onLayout={({
                    nativeEvent: {
                      layout: { height: layoutHeight, width: layoutWidth, x, y },
                    },
                  }) => {
                    messageLayout.value = {
                      x: alignment === "left" ? x + layoutWidth : x,
                      y,
                    };
                    messageWidth.value = layoutWidth;
                    messageHeight.value = layoutHeight;
                  }}
                  className={`items-${alignment === "left" ? "start" : "end"} flex-row`}
                >
                  {alignment === "left" && MessageAvatar && (
                    <MessageAvatar
                      {...{ alignment, message, showAvatar: true }}
                    />
                  )}
                  
                  <View
                    className={`
                      rounded-tl-2xl rounded-tr-2xl overflow-hidden my-2
                      ${onlyEmojis && !message.quoted_message ? "" : "border border-gray-200"}
                      ${otherAttachments?.length && otherAttachments[0].type === "giphy" && !message.quoted_message 
                        ? "" 
                        : otherAttachments?.length ? "bg-blue-50" : 
                          alignment === "left" ? "bg-white" : "bg-gray-100"}
                      ${(groupStyle === "left_bottom" || groupStyle === "left_single") && 
                        (!hasThreadReplies || threadList) ? "rounded-bl-sm" : "rounded-bl-2xl"}
                      ${(groupStyle === "right_bottom" || groupStyle === "right_single") && 
                        (!hasThreadReplies || threadList) ? "rounded-br-sm" : "rounded-br-2xl"}
                    `}
                    style={
                      (onlyEmojis && !message.quoted_message) || otherAttachments?.length
                        ? { borderWidth: 0 }
                        : {}
                    }
                  >
                    {messageContentOrder.map(
                      (messageContentType, messageContentOrderIndex) => {
                        switch (messageContentType) {
                          case "quoted_reply":
                            return (
                              message.quoted_message && (
                                <View
                                  key={`quoted_reply_${messageContentOrderIndex}`}
                                  className="flex-row px-2 pt-2"
                                >
                                  <Reply
                                    quotedMessage={
                                      message.quoted_message as ReplyProps["quotedMessage"]
                                    }
                                  />
                                </View>
                              )
                            );
                          case "gallery":
                            return (
                              <Gallery
                                alignment={alignment}
                                groupStyles={groupStyles}
                                hasThreadReplies={!!message?.reply_count}
                                images={images}
                                key={`gallery_${messageContentOrderIndex}`}
                                message={message}
                                threadList={threadList}
                                videos={videos}
                              />
                            );
                          case "files":
                            return (
                              <FileAttachmentGroup
                                files={files}
                                key={`file_attachment_group_${messageContentOrderIndex}`}
                                messageId={message.id}
                              />
                            );
                          case "poll":
                            const pollId = message.poll_id;
                            const poll = pollId && client.polls.fromState(pollId);
                            return poll ? (
                              <Poll message={message} poll={poll} />
                            ) : null;
                          case "ai_text": {
                            return isMessageAIGenerated?.(message) ? (
                              <StreamingMessageView
                                key={`ai_message_text_container_${messageContentOrderIndex}`}
                                message={message}
                              />
                            ) : null;
                          }
                          case "attachments":
                            return otherAttachments?.map(
                              (attachment, attachmentIndex) => (
                                <AttachmentRenderer
                                  key={`${message.id}-${attachmentIndex}`}
                                  attachment={attachment}
                                  isMyMessage={isMyMessage}
                                  message={message}
                                  onImagePress={onImagePress}
                                />
                              ),
                            );
                          case "text":
                          default:
                            return (otherAttachments?.length &&
                              otherAttachments[0].actions) ||
                              isMessageAIGenerated?.(message) ? null : (
                              <MessageTextContainer
                                key={`message_text_container_${messageContentOrderIndex}`}
                                messageOverlay
                                messageTextNumberOfLines={
                                  messageTextNumberOfLines
                                }
                                onlyEmojis={onlyEmojis}
                              />
                            );
                        }
                      },
                    )}
                  </View>
                </Animated.View>
                
                {/* Position action list below the message */}
                {!showMessageReactions && (
                  <View style={{ width: '100%', alignItems: 'center', marginTop: 10, zIndex: 2 }}>
                    <CustomMessageActionsList
                      dismissOverlay={dismissOverlay}
                      MessageActionListItem={MessageActionListItem}
                      messageActions={messageActions}
                    />
                  </View>
                )}
              </View>
            </View>
          </TouchableWithoutFeedback>
        </GestureHandlerRootView>
      </Modal>
    </View>
  );
};

const CustomMessage = () => {
  const { message, isMyMessage, groupStyles, onLongPress } = useMessageContext();
  const { channel } = useChannelContext();
  const [visibleImage, setVisibleImage] = useState<string | null>(null);
  const scaleAnim = useSharedValue(0);
  const opacityAnim = useSharedValue(0);
  const shouldGroupWithPrevious = groupStyles?.includes('bottom');

  useFocusEffect(
    React.useCallback(() => {
      const backAction = () => {
        if (visibleImage) {
          setVisibleImage(null);
          return true;
        }
        return false;
      };

      const backHandler = BackHandler.addEventListener(
        "hardwareBackPress",
        backAction
      );

      return () => backHandler.remove();
    }, [visibleImage])
  );

  useEffect(() => {
    if (visibleImage) {
      scaleAnim.value = withSpring(1, { damping: 10 });
      opacityAnim.value = withTiming(1, { duration: 300 });
    } else {
      scaleAnim.value = 0;
      opacityAnim.value = 0;
    }
  }, [visibleImage]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleAnim.value }],
    opacity: opacityAnim.value,
  }));

  const handleImagePress = (imageUrl: string) => {
    setVisibleImage(imageUrl);
  };
  
  const handleDoubleTap = () => {
    if (message && message.id && channel) {
      const hasReaction = message.own_reactions?.some(r => r.type === 'love');
      if (hasReaction) {
        channel.deleteReaction(message.id, 'love');
      } else {
        channel.sendReaction(message.id, { type: 'love' });
      }
    }
  };

  // Display message reactions with completely transparent background
  const renderReactions = () => {
    if (!message.latest_reactions || message.latest_reactions.length === 0) return null;
    
    // Group reactions by type
    const reactionsByType: {[key: string]: {count: number, own: boolean}} = {};
    
    message.latest_reactions.forEach((reaction: any) => {
      const type = reaction.type;
      if (!reactionsByType[type]) {
        reactionsByType[type] = { count: 0, own: false };
      }
      reactionsByType[type].count += 1;
      
      // Check if this reaction is from the current user
      if (reaction.user_id === client.userID) {
        reactionsByType[type].own = true;
      }
    });
    
    // Helper function to convert reaction type to emoji
    const getReactionEmoji = (type: string) => {
      const reactions: {[key: string]: string} = {
        love: "❤️", 
        like: "👍", 
        haha: "😂", 
        wow: "😮", 
        sad: "😢", 
        angry: "😠",
      };
      
      return reactions[type] || "👍";
    };
    
    return (
      <View 
        className={`flex-row ${isMyMessage ? "justify-end" : "justify-start"}`} 
        style={{ 
          position: 'absolute', 
          top: -28,
          left: isMyMessage ? undefined : 46, 
          right: isMyMessage ? 0 : undefined,
          zIndex: 1,
          paddingHorizontal: 16,
          backgroundColor: 'transparent',
        }}
      >
        <View 
          style={{ 
            backgroundColor: 'transparent',
            flexDirection: 'row',
            paddingHorizontal: 8,
            paddingVertical: 4,
          }}
        >
          {Object.entries(reactionsByType).map(([type, data]) => (
            <TouchableOpacity 
              key={type}
              onPress={() => {
                if (channel) {
                  const hasReaction = message.own_reactions?.some(r => r.type === type);
                  if (hasReaction) {
                    channel.deleteReaction(message.id, type);
                  } else {
                    channel.sendReaction(message.id, { type });
                  }
                }
              }}
              style={{ 
                flexDirection: 'row',
                alignItems: 'center',
                marginHorizontal: 2,
                backgroundColor: 'transparent', // Force transparent for all
                paddingHorizontal: 2,
              }}
            >
              <Text style={{ fontSize: 18, marginRight: 4 }}>{getReactionEmoji(type)}</Text>
              <Text style={{ fontSize: 10, color: data.own ? '#2563eb' : '#4b5563' }}>{data.count}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  return (
    <>
      <View className={`flex-row px-4 ${isMyMessage ? "justify-end" : "justify-start"}`}
        style={{ 
          marginBottom: shouldGroupWithPrevious ? 2 : 8,
          marginTop: shouldGroupWithPrevious ? 0 : 8, // Increased top margin to make room for reactions
          position: 'relative', // Add this to position reactions correctly
        }}
      >
        {/* Render reactions first so they appear on top */}
        {renderReactions()}
        
        {/* Avatar or spacing placeholder */}
        {!isMyMessage && (
          <View className="w-10 mr-2 items-start justify-start">
            {!shouldGroupWithPrevious && message.user?.image ? (
              <Image
                source={{ uri: message.user?.image }}
                className="w-8 h-8 rounded-full"
              />
            ) : null}
          </View>
        )}
        
        {/* Message content */}
        <View className={`${isMyMessage ? "items-end" : "items-start"}`} style={{ maxWidth: '75%' }}>
          {/* Show user name in group chats */}
          {!shouldGroupWithPrevious && !isMyMessage && message.user && (
            <MessageHeader message={{ user: { id: message.user.id, name: message.user.name } }} />
          )}
          
          <TapGestureHandler
            numberOfTaps={2}
            onActivated={handleDoubleTap}
          >
            <View>
              {message.text && (
                <TouchableOpacity
                  activeOpacity={0.7}
                  onLongPress={(event) => onLongPress(event)}
                  delayLongPress={500}
                >
                  <View
                    className={`px-4 py-2.5 ${
                      isMyMessage 
                        ? "bg-blue-500 rounded-tl-2xl rounded-bl-2xl rounded-tr-sm rounded-br-sm" 
                        : "bg-gray-100 rounded-tr-2xl rounded-br-2xl rounded-tl-sm rounded-bl-sm"
                    } ${
                      shouldGroupWithPrevious 
                        ? isMyMessage 
                          ? "rounded-tr-2xl" 
                          : "rounded-tl-2xl" 
                        : ""
                    }`}
                  >
                    <Text className={`text-base ${isMyMessage ? "text-white" : "text-gray-900"}`}>
                      {message.text}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
              
              {message.attachments?.map((attachment, i) => (
                <TouchableOpacity
                  key={`${message.id}-${i}-${attachment.type || 'attachment'}`}
                  onLongPress={onLongPress}
                  delayLongPress={500}
                  activeOpacity={0.9}
                >
                  <AttachmentRenderer
                    attachment={attachment}
                    isMyMessage={isMyMessage}
                    message={message}
                    onImagePress={handleImagePress}
                  />
                </TouchableOpacity>
              ))}
            </View>
          </TapGestureHandler>
          
          {!shouldGroupWithPrevious && (
            <MessageTimestamp 
              timestamp={message.created_at} 
              isMyMessage={isMyMessage}
            />
          )}
        </View>
      </View>

      <Modal visible={!!visibleImage} transparent animationType="none">
        <Pressable
          className="flex-1 bg-black/70 items-center justify-center"
          onPress={() => setVisibleImage(null)}
        >
          {visibleImage && (
            <Animated.Image
              source={{ uri: visibleImage }}
              style={[
                {
                  width: "100%",
                  height: "100%",
                  resizeMode: "contain",
                },
                animatedStyle,
              ]}
            />
          )}
        </Pressable>
      </Modal>
    </>
  );
};

export default function ChannelScreen() {
  const { cid } = useLocalSearchParams<{ cid: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [channel, setChannel] = useState<ChannelType | null>(null);

  // This is the issue - we need to use the format that Stream Chat expects
  // Define the reaction types as plain strings, not objects
  const reactionTypes = ['love', 'like', 'haha', 'wow', 'sad', 'angry'];

  useEffect(() => {
    const fetchChannel = async () => {
      const channels = await client.queryChannels({ cid });
      setChannel(channels[0]);
    };
    fetchChannel();
  }, [cid]);

  const handleImageUpload = async () => {
    if (!channel) return;

    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permission.status !== "granted") {
        Alert.alert("Permission Denied", "Access to gallery is needed to send images.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 1,
      });

      if (!result.canceled && result.assets.length > 0) {
        const img = result.assets[0];

        // Upload the image to Stream
        const response = await channel.sendImage(img.uri);

        // Use the returned URL in the attachment
        await channel.sendMessage({
          text: "",
          attachments: [
            {
              type: "image",
              image_url: response.file, // This is the public URL
              asset_url: response.file,
            },
          ],
        });
      }
    } catch (err) {
      console.error(err);
      Alert.alert("Upload Failed", "Could not send the image.");
    }
  };

  if (!channel || !channel.state) return <ActivityIndicator className="mt-20" />;

  const otherMembers = Object.values(channel.state.members).filter(
    (m: any) => m.user_id !== user?.id
  );
  const otherUser = otherMembers[0]?.user;

  return (
    <Channel 
      channel={channel}
      MessageSimple={CustomMessage}
      MessageMenu={CustomMessageMenu}
      enableMessageGroupingByUser
      keyboardVerticalOffset={0}
      deletedMessagesVisibilityType="sender"
      forceAlignMessages={false}
      additionalTextInputProps={{
        placeholder: "Type a message...",
        placeholderTextColor: "#9ca3af",
        style: { fontSize: 16 }
      }}
    >
      <Stack.Screen options={{ title: otherUser?.name || "Chat", headerShown: false }} />
      
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 bg-white border-b border-gray-100 shadow-sm">
        <TouchableOpacity
          onPress={() => router.back()}
          className="p-2 rounded-full bg-gray-100"
        >
          <Ionicons name="arrow-back" size={20} color="#4b5563" />
        </TouchableOpacity>
        
        {otherUser?.image ? (
          <Image
            source={{ uri: otherUser.image as string }}
            className="w-10 h-10 rounded-full ml-3 mr-3 border-2 border-white"
          />
        ) : (
          <View className="w-10 h-10 rounded-full bg-gray-100 ml-3 mr-3 items-center justify-center">
            <Ionicons name="person" size={20} color="#9ca3af" />
          </View>
        )}
        
        <View>
          <Text className="text-lg font-semibold text-gray-800">
            {otherUser?.name || otherUser?.id}
          </Text>
          <Text className="text-sm text-gray-500">
            {otherUser?.online ? "Online" : "Offline"}
          </Text>
        </View>
      </View>

      {/* Message list */}
      <View className="flex-1 bg-white">
        <MessageList />
      </View>
      
      {/* Message input with attachment button */}
      <View className="border-t border-gray-100">
        <View className="flex-row items-center">
          <TouchableOpacity 
            onPress={handleImageUpload}
            className="p-3 ml-2"
          >
            <Ionicons name="image-outline" size={24} color="#3b82f6" />
          </TouchableOpacity>
          <View className="flex-1">
            <MessageInput />
          </View>
        </View>
      </View>
    </Channel>
  );
}

const styles = StyleSheet.create({
  videoContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  video: {
    width: 250,
    height: 250,
  },
  fileContainer: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: 'hidden',
    marginTop: 4,
    width: 250,
  }
});
