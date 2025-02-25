import { useEffect, useState } from 'react';
import { View, FlatList, Text, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useAuth } from '../../providers/AuthProvider';
import { supabase } from '../../lib/supabase';
import { acceptFollowRequest, rejectFollowRequest } from '../../utils/follow';
import { FontAwesome } from '@expo/vector-icons';

export default function NotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    if (!user) return;

    // Get both notifications and follow requests
    const { data: notificationsData, error: notificationsError } = await supabase
      .from('notifications')
      .select('*, sender:profiles!notifications_sender_id_fkey(username, avatar_url)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    const { data: followRequests, error: followRequestsError } = await supabase
      .from('follow_requests')
      .select('*, requester:profiles!follow_requests_requester_id_fkey(username, avatar_url)')
      .eq('target_id', user.id)
      .eq('status', 'Pending')
      .order('created_at', { ascending: false });

    if (notificationsError || followRequestsError) {
      Alert.alert('Error', 'Failed to load notifications');
      return;
    }

    // Combine and sort notifications
    const combined = [
      ...(followRequests?.map(request => ({
        id: request.id,
        type: 'follow_request',
        created_at: request.created_at,
        sender: request.requester,
        requestId: request.id
      })) || []),
      ...(notificationsData || [])
    ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    setNotifications(combined);
    setLoading(false);
  };

  const handleAccept = async (requestId: string) => {
    try {
      await acceptFollowRequest(requestId);
      fetchNotifications(); // Refresh notifications
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const handleReject = async (requestId: string) => {
    try {
      await rejectFollowRequest(requestId);
      fetchNotifications(); // Refresh notifications
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [user?.id]);

  const renderItem = ({ item }) => {
    if (item.type === 'follow_request') {
      return (
        <View className="p-4 border-b border-gray-200">
          <View className="flex-row items-center">
            {item.sender.avatar_url ? (
              <Image
                source={{ uri: item.sender.avatar_url }}
                className="w-10 h-10 rounded-full mr-3"
              />
            ) : (
              <View className="w-10 h-10 rounded-full bg-gray-200 items-center justify-center mr-3">
                <FontAwesome name="user" size={16} color="#6b7280" />
              </View>
            )}
            <Text className="flex-1">
              <Text className="font-semibold">{item.sender.username}</Text> wants to follow you
            </Text>
            <View className="flex-row space-x-2">
              <TouchableOpacity
                className="bg-green-500 px-3 py-1 rounded-full"
                onPress={() => handleAccept(item.requestId)}
              >
                <Text className="text-white text-xs">Accept</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="bg-red-500 px-3 py-1 rounded-full"
                onPress={() => handleReject(item.requestId)}
              >
                <Text className="text-white text-xs">Reject</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      );
    }

    // Render other notification types here
    return (
      <View className="p-4 border-b border-gray-200">
        <Text>{item.type} notification</Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center p-4">
            <Text className="text-gray-500">No notifications</Text>
          </View>
        }
      />
    </View>
  );
} 