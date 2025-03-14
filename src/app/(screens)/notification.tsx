import { useState, useEffect } from 'react';
import { View, Text, FlatList, ActivityIndicator, Pressable, Image } from 'react-native';
import { useAuth } from '../../providers/AuthProvider';
import { supabase } from '../../lib/supabase';
import { FontAwesome } from '@expo/vector-icons';

export default function NotificationScreen() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'follow_requests', 'likes', 'comments'

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('notifications')
        .select(`
          id,
          type,
          seen,
          created_at,
          sender: sender_id (id, username, avatar_url),
          post: post_id (id)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('type', filter);
      }

      const { data, error } = await query;

      if (!error) {
        setNotifications(data);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptFollowRequest = async (notificationId: string, senderId: string) => {
    try {
      // Update follow request status
      await supabase
        .from('follow_requests')
        .update({ status: 'Accepted' })
        .eq('requester_id', senderId)
        .eq('target_id', user.id);

      // Remove the notification
      await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      // Refresh notifications
      fetchNotifications();
    } catch (error) {
      console.error('Error accepting follow request:', error);
    }
  };

  const markNotificationsAsSeen = async () => {
    try {
      await supabase
        .from('notifications')
        .update({ seen: true })
        .eq('user_id', user.id)
        .eq('seen', false);
    } catch (error) {
      console.error('Error marking notifications as seen:', error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    markNotificationsAsSeen();
  }, [filter]);

  const renderNotification = ({ item }) => {
    let message = '';
    let icon = 'bell';
    switch (item.type) {
      case 'follow_request':
        message = `${item.sender.username} sent you a follow request`;
        icon = 'user-plus';
        break;
      case 'like':
        message = `${item.sender.username} liked your post`;
        icon = 'heart';
        break;
      case 'comment':
        message = `${item.sender.username} commented on your post`;
        icon = 'comment';
        break;
      default:
        message = 'New notification';
    }

    return (
      <View className="p-4 border-b border-gray-100">
        <View className="flex-row items-center">
          {/* User Avatar */}
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

          {/* Notification Icon */}
          <View className="ml-2">
            <FontAwesome name={icon} size={20} color="#3b82f6" />
          </View>

          {/* Accept Button for Follow Requests */}
          {item.type === 'follow_request' && (
            <Pressable
              className="ml-2 bg-blue-500 px-3 py-1 rounded-full"
              onPress={() => handleAcceptFollowRequest(item.id, item.sender.id)}
            >
              <Text className="text-white text-xs">Accept</Text>
            </Pressable>
          )}
        </View>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="p-4 bg-white shadow-sm">
        <Text className="text-2xl font-bold text-gray-900">Notifications</Text>
        
        {/* Filter Buttons */}
        <View className="flex-row mt-3 space-x-2">
          {['all', 'follow_request', 'like', 'comment'].map((f) => (
            <Pressable
              key={f}
              className={`px-3 py-1 rounded-full ${
                filter === f ? 'bg-blue-500' : 'bg-gray-100'
              }`}
              onPress={() => setFilter(f)}
            >
              <Text className={`text-xs ${
                filter === f ? 'text-white' : 'text-gray-700'
              }`}>
                {f === 'follow_request' ? 'Requests' : f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Content */}
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
