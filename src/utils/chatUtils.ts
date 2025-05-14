import { Channel } from "stream-chat";
import { Alert } from "react-native";

export const handleDeleteAttachment = async (
  channel: Channel | null,
  messageId: string,
  attachmentId: string
) => {
  if (!channel) return;

  try {
    // Delete the attachment from the message
    await channel.deleteAttachment(messageId, attachmentId);
    
    // Update the local state to remove the attachment
    const updatedMessage = {
      ...channel.state.messages[messageId],
      attachments: channel.state.messages[messageId]?.attachments?.filter(
        (a: any) => a.id !== attachmentId
      ),
    };

    // Update the channel state to trigger a re-render
    channel.state.updateLocalMessage(messageId, updatedMessage);

    // Optional: Show a success message
    Alert.alert("Success", "Attachment deleted successfully!");
  } catch (err) {
    console.error("Failed to delete attachment:", err);
    Alert.alert("Error", "Failed to delete attachment.");
  }
}; 