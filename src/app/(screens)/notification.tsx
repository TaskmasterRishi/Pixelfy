import { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  Pressable,
  Image,
} from "react-native";
import { useAuth } from "../../providers/AuthProvider";
import { supabase } from "../../lib/supabase";
import { FontAwesome } from "@expo/vector-icons";
import { ToastAndroid } from "react-native";

export default function NotificationScreen() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // 'all', 'follow_requests', 'likes', 'comments'

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from("notifications")
        .select(
          `
          id,
          type,
          seen,
          created_at,
          sender: sender_id (id, username, avatar_url)
        `
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (filter !== "all") {
        query = query.eq("type", filter);
      }

      const { data, error } = await query;

      if (!error) {
        setNotifications(data);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const checkIfFriends = async (senderId: string) => {
    const { data, error } = await supabase
      .from("friends")
      .select("id")
      .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
      .or(`user_id.eq.${senderId},friend_id.eq.${senderId}`)
      .limit(1);

    return data && data.length > 0; // Return true if they are friends
  };

  const handleAcceptFollowRequest = async (notificationId: string, senderId: string) => {
    try {
      // Check if already friends
      const areFriends = await checkIfFriends(senderId);
      if (areFriends) {
        ToastAndroid.show('You are already friends with this user.', ToastAndroid.SHORT);
        return;
      }

      // Update follow request status
      await supabase
        .from("follow_requests")
        .update({ status: "Accepted" })
        .eq("requester_id", senderId)
        .eq("target_id", user.id);

      // Add both users as friends
      await supabase
        .from("friends")
        .insert([
          { user_id: user.id, friend_id: senderId, created_at: new Date().toISOString() },
          { user_id: senderId, friend_id: user.id, created_at: new Date().toISOString() }
        ]);

      // Update the notification to reflect acceptance
      await supabase
        .from("notifications")
        .update({ type: "friend_accepted" }) // Change type to reflect the action
        .eq("id", notificationId);

      // Refresh notifications
      fetchNotifications();
    } catch (error) {
      console.error("Error accepting follow request:", error);
    }
  };

  const handleRejectFollowRequest = async (notificationId: string, senderId: string) => {
    try {
      // Update follow request status
      await supabase
        .from("follow_requests")
        .update({ status: "Rejected" })
        .eq("requester_id", senderId)
        .eq("target_id", user.id);

      // Update the notification to reflect rejection
      await supabase
        .from("notifications")
        .update({ type: "follow_request_rejected" }) // Change type to reflect the action
        .eq("id", notificationId);

      // Refresh notifications
      fetchNotifications();
    } catch (error) {
      console.error("Error rejecting follow request:", error);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [filter]);

  const renderNotification = ({ item }) => {
    let message = "";
    switch (item.type) {
      case "follow_request":
        message = `${item.sender.username} sent you a follow request`;
        break;
      case "friend_accepted":
        message = `${item.sender.username} accepted your friend request`;
        break;
      // Add more cases as needed
      default:
        message = "New notification";
    }

    return (
      <View className="p-4 border-b border-gray-100">
        <View className="flex-row items-center">
          {item.sender.avatar_url ? (
            <Image
              source={{ uri: item.sender.avatar_url }}
              className="w-10 h-10 rounded-full mr-3"
            />
          ) : (
            <View className="w-10 h-10 rounded-full bg-gray-200 mr-3 justify-center items-center">
              <FontAwesome name="user" size={20} color="#6b7280" />
            </View>
          )}
          <View className="flex-1">
            <Text className="text-base font-medium">{message}</Text>
            <Text className="text-xs text-gray-500 mt-1">
              {new Date(item.created_at).toLocaleString()}
            </Text>
          </View>

          {/* Accept/Reject Buttons for Follow Requests */}
          {item.type === "follow_request" && (
            <View className="flex-row">
              <Pressable
                className="ml-2 bg-blue-500 px-3 py-1 rounded-full"
                onPress={() => handleAcceptFollowRequest(item.id, item.sender.id)}
              >
                <Text className="text-white text-sm">Accept</Text>
              </Pressable>

              <Pressable
                className="ml-2 bg-red-500 px-3 py-1 rounded-full"
                onPress={() => handleRejectFollowRequest(item.id, item.sender.id)}
              >
                <Text className="text-white text-sm">Reject</Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-gray-50">
      <View className="p-4 bg-white shadow-sm">
        <Text className="text-2xl font-bold text-gray-900">Notifications</Text>
        {/* Filter Buttons */}
        <View className="flex-row mt-3 space-x-2">
          {["all", "follow_request", "friend_accepted"].map((f) => (
            <Pressable
              key={f}
              className={`px-3 py-1 rounded-full ${
                filter === f ? "bg-blue-500" : "bg-gray-100"
              }`}
              onPress={() => setFilter(f)}
            >
              <Text
                className={`text-xs ${
                  filter === f ? "text-white" : "text-gray-700"
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderNotification}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            <View className="flex-1 justify-center items-center p-4">
              <FontAwesome name="bell-slash" size={24} color="#9ca3af" />
              <Text className="text-gray-500 mt-2">No notifications</Text>
            </View>
          }
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </View>
  );
}
