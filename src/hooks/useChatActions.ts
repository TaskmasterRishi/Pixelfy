import { Channel } from "stream-chat";
import { Alert } from "react-native";

export const useChatActions = (channel: Channel | null) => {
  const handleDeleteAttachment = async (messageId: string, attachmentId: string) => {
    if (!channel) return;

    try {
      await channel.deleteAttachment(messageId, attachmentId);
      const updatedMessage = {
        ...channel.state.messages[messageId],
        attachments: channel.state.messages[messageId]?.attachments?.filter(
          (a: any) => a.id !== attachmentId
        ),
      };
      channel.state.updateLocalMessage(messageId, updatedMessage);
      Alert.alert("Success", "Attachment deleted successfully!");
    } catch (err) {
      console.error("Failed to delete attachment:", err);
      Alert.alert("Error", "Failed to delete attachment.");
    }
  };

  return { handleDeleteAttachment };
}; 