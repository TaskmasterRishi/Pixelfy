import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  Pressable,
  Image,
  SafeAreaView,
  Animated,
  Easing,
} from "react-native";
import { useAuth } from "../../providers/AuthProvider";
import { supabase } from "../../lib/supabase";
import { FontAwesome } from "@expo/vector-icons";
import { ToastAndroid } from "react-native";
import { useNavigation } from '@react-navigation/native';
import { handleFriendAcceptance, followBack } from "../../Components/AcceptFriend";
import { useRouter } from "expo-router";
import { sendFriendRequest } from "../../Components/FriendRequest";

// Update NotificationItem props interface
interface NotificationItemProps {
  item: any;
  index: number;
  onReject: (notificationId: string, senderId: string) => void;
  fetchNotifications: () => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({ 
  item, 
  index,
  onReject,
  fetchNotifications
}) => {
  const { user } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);
  const navigation = useNavigation();
  const router = useRouter();
  const translateY = useRef(new Animated.Value(50)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  const markAsSeen = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ seen: true })
        .eq('id', notificationId);

      if (error) throw error;
    } catch (error) {
      console.error('Error marking notification as seen:', error);
    }
  };

  const handlePress = () => {
    // Mark notification as seen when pressed
    if (!item.seen) {
      markAsSeen(item.id);
    }
    // Remove this navigation since the file doesn't exist
    // router.push({
    //   pathname: '/viewProfile',
    //   params: { userId: item.sender.id }
    // });
  };

  const handleAcceptFollowRequest = async (notificationId: string, senderId: string) => {
    try {
      const success = await handleFriendAcceptance(user.id, senderId);
      if (success) {
        // Only update the existing notification type to friend_accepted
        const { error } = await supabase
          .from('notifications')
          .update({ type: 'friend_accepted' })
          .eq('id', notificationId);

        if (error) {
          throw error;
        }

        // Refresh notifications
        fetchNotifications();
      }
    } catch (error) {
      console.error('Error accepting follow request:', error);
    }
  };

  const handleFollowBack = async (senderId: string) => {
    try {
      const success = await followBack(user.id, senderId);
      if (success) {
        // Remove the follow_back notification
        await supabase
          .from('notifications')
          .delete()
          .eq('id', item.id);

        // Refresh notifications
        fetchNotifications();
      }
    } catch (error) {
      console.error('Error following back:', error);
    }
  };

  // Add function to check if following
  const checkIfFollowing = async (senderId: string) => {
    try {
      const { data, error } = await supabase
        .from('friends')
        .select()
        .or(`and(user_id.eq.${user.id},friend_id.eq.${senderId}),and(user_id.eq.${senderId},friend_id.eq.${user.id})`)
        .single();
      
      if (error && error.code !== 'PGRST116') { // PGRST116 is the code for no rows found
        throw error;
      }
      
      setIsFollowing(!!data);
    } catch (error) {
      console.error('Error checking follow status:', error);
      setIsFollowing(false);
    }
  };

  useEffect(() => {
    if (item.type === 'follow_back') {
      checkIfFollowing(item.sender.id);
    }
  }, [item, user.id]);

  useEffect(() => {
    Animated.sequence([
      Animated.delay(index * 50),
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [index]);

  let action = "";
  let iconName = "bell";
  let iconColor = "#3b82f6";
  
  switch (item.type) {
    case "follow_request":
      action = "sent you a follow request";
      iconName = "user-plus";
      iconColor = "#3b82f6";
      break;
    case "friend_accepted":
      action = "You accepted the follow request";
      iconName = "check-circle";
      iconColor = "#10b981";
      break;
    case "like":
      action = "liked your post";
      iconName = "heart";
      iconColor = "#ef4444";
      break;
    case "comment":
      action = "commented on your post";
      iconName = "comment";
      iconColor = "#f59e0b";
      break;
    case "mention":
      action = "mentioned you in a post";
      iconName = "at";
      iconColor = "#8b5cf6";
      break;
    case "follow_back":
      action = "is following you";
      iconName = "user-plus";
      iconColor = "#3b82f6";
      break;
    default:
      action = "sent you a notification";
  }

  return (
    <Animated.View
      style={{
        transform: [{ translateY }],
        opacity,
      }}
    >
      <Pressable onPress={handlePress}>
        <View className={`p-5 border-b bg-white border border-gray-200 ${
          !item.seen ? 'bg-blue-50' : ''
        }`}>
          <View className="flex-row items-center space-x-4">
            {!item.seen && (
              <View className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full" />
            )}
            {item.sender.avatar_url ? (
              <Image
                source={{ uri: item.sender.avatar_url }}
                className="w-14 h-14 rounded-full border-2 border-white shadow-sm"
              />
            ) : (
              <View className="w-14 h-14 rounded-full bg-gray-100 justify-center items-center border-2 border-white shadow-sm">
                <FontAwesome name="user" size={28} color="#6b7280" />
              </View>
            )}
            
            <View className="flex-1">
              <Text className="text-base font-semibold text-gray-800">
                {item.sender.username}
              </Text>
              <View className="flex-row items-center space-x-2">
                <FontAwesome name={iconName} size={16} color={iconColor} />
                <Text className="text-sm text-gray-600">{action}</Text>
              </View>
              <Text className="text-xs text-gray-400 mt-1.5">
                {new Date(item.created_at).toLocaleString()}
              </Text>
            </View>

            {item.type === "follow_request" && (
              <View className="flex-row gap-2">
                <Pressable
                  className="bg-green-500 px-4 py-2 rounded-lg active:bg-green-600 shadow-sm"
                  onPress={() => handleAcceptFollowRequest(item.id, item.sender.id)}
                >
                  <Text className="text-white text-sm font-medium">Accept</Text>
                </Pressable>
                <Pressable
                  className="bg-red-500 px-4 py-2 rounded-lg active:bg-red-600 shadow-sm"
                  onPress={() => onReject(item.id, item.sender.id)}
                >
                  <Text className="text-white text-sm font-medium">Reject</Text>
                </Pressable>
              </View>
            )}

            {item.type === "follow_back" && (
              <Pressable
                className="bg-blue-500 px-4 py-2 rounded-lg active:bg-blue-600 shadow-sm"
                onPress={() => handleFollowBack(item.sender.id)}
              >
                <Text className="text-white text-sm font-medium">Follow Back</Text>
              </Pressable>
            )}
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
};

export default function NotificationScreen() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // 'all', 'follow_request', 'friend_accepted', 'like', 'comment', 'mention'
  const navigation = useNavigation();
  const fadeAnim = useRef(new Animated.Value(0)).current; // For fade-in effect
  const scaleAnim = useRef(new Animated.Value(0.95)).current; // For scale effect

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
        .update({ type: "follow_request_rejected" })
        .eq("id", notificationId);

      // Refresh notifications
      fetchNotifications();
    } catch (error) {
      console.error("Error rejecting follow request:", error);
    }
  };

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
        // Mark all fetched notifications as seen
        const unseenIds = data
          .filter(n => !n.seen)
          .map(n => n.id);

        if (unseenIds.length > 0) {
          await supabase
            .from('notifications')
            .update({ seen: true })
            .in('id', unseenIds);
        }

        const sortedData = data.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

        setNotifications(sortedData);
      } else {
        console.error("Supabase error:", error);
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

  useEffect(() => {
    fetchNotifications();
  }, [filter]);

  useEffect(() => {
    // Fade-in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // Scale animation
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 4,
      useNativeDriver: true,
    }).start();
  }, []);

  const renderNotification = ({ item, index }) => {
    return (
      <NotificationItem 
        item={item} 
        index={index}
        onReject={handleRejectFollowRequest}
        fetchNotifications={fetchNotifications}
      />
    );
  };

  return (
    <Animated.View
      style={{
        flex: 1,
        backgroundColor: 'white',
        opacity: fadeAnim,
        transform: [{ scale: scaleAnim }],
      }}
    >
      <View className="p-6 bg-white shadow-sm border-b border-gray-100 mt-14">
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-3xl font-bold text-gray-900">Notifications</Text>
          <Pressable className="p-2">
            <FontAwesome name="bell" size={24} color="#3b82f6" />
          </Pressable>
        </View>
        
        {/* Filter Buttons */}
        <View className="flex-row flex-wrap gap-2">
          {["all", "follow_request", "friend_accepted", "like", "comment", "mention"].map((f) => (
            <Pressable
              key={f}
              className={`px-4 py-2 rounded-full ${
                filter === f ? "bg-blue-500" : "bg-gray-100"
              } active:bg-blue-600 shadow-sm`}
              onPress={() => setFilter(f)}
            >
              <Text
                className={`text-sm ${
                  filter === f ? "text-white" : "text-gray-700"
                } font-medium`}
              >
                {f.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {loading ? (
        <Animated.View
          style={{ opacity: fadeAnim }}
          className="flex-1 justify-center items-center bg-gray-50"
        >
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text className="text-gray-500 mt-3">Loading notifications...</Text>
        </Animated.View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderNotification}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            <Animated.View
              style={{ opacity: fadeAnim }}
              className="flex-1 justify-center items-center p-4 bg-gray-50"
            >
              <View className="bg-white p-8 rounded-xl shadow-sm items-center space-y-4">
                <FontAwesome name="bell-slash" size={40} color="#9ca3af" />
                <Text className="text-gray-500 text-center text-lg">No notifications yet</Text>
                <Text className="text-gray-400 text-center">You're all caught up!</Text>
              </View>
            </Animated.View>
          }
          contentContainerStyle={{ paddingBottom: 20 }}
          className="bg-gray-50"
        />
      )}
    </Animated.View>
  );
}
