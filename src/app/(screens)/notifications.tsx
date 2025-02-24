import { useEffect, useState } from 'react';
import { View, FlatList } from 'react-native';
import { useAuth } from '../../providers/AuthProvider';
import { supabase } from '../../lib/supabase';

export default function NotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const fetchNotifications = async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*, profiles!notifications_from_user_id_fkey(username)')
        .eq('to_user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (!error) {
        setNotifications(data);
      }
    };

    fetchNotifications();
  }, [user.id]);

  return (
    <View style={{ padding: 16 }}>
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={{ padding: 16 }}>
            <Text>{item.profiles.username} wants to follow you</Text>
            {/* Add accept/reject buttons here */}
          </View>
        )}
      />
    </View>
  );
} 