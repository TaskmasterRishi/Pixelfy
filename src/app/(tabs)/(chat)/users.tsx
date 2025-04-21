import { useEffect, useState } from 'react';
import { FlatList, Text, View, ActivityIndicator, RefreshControl, TextInput } from 'react-native';
import { supabase } from '~/lib/supabase';
import { useAuth } from '~/providers/AuthProvider';
import UserListItem from '~/Components/UserListItem';
import tw from 'tailwind-react-native-classnames';
import { FontAwesome } from '@expo/vector-icons';

export default function UsersScreen() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredUsers, setFilteredUsers] = useState([]);
  const { user } = useAuth();

  useEffect(() => {
    const fetchUsers = async () => {
      if (!user) return;

      let { data: users, error } = await supabase
        .from('users')
        .select(`
          id,
          username,
          avatar_url
        `)
        .neq('id', user.id);

      if (error) {
        console.error('Error fetching users:', error);
        return;
      }

      setUsers(users || []);
      setFilteredUsers(users || []);
      setLoading(false);
    };
    fetchUsers();
  }, [user]);

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query.length > 0) {
      const filtered = users.filter(user => 
        user.username.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(users);
    }
  };

  const handlePress = async (user) => {
    // Implement the logic to handle the press event
    console.log('User pressed:', user);
  };

  if (loading) {
    return (
      <View className="flex-1 bg-gray-50 justify-center items-center">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className="mt-4 text-blue-500 font-medium">Loading users...</Text>
      </View>
    );
  }

  if (!users.length) {
    return (
      <View className="flex-1 bg-gray-50 justify-center items-center p-4">
        <Text className="text-lg text-gray-600 font-medium">No users found</Text>
        <Text className="text-center text-gray-400 mt-2">Try again later or check your connection</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-5 pt-5 pb-4 border-b border-gray-200 shadow-sm">
        <View className="flex-row justify-between items-center">
          <View>
            <Text className="text-2xl font-bold text-gray-900">Discover Users</Text>
            <Text className="text-sm text-gray-500 mt-1">
              Connect with your community
            </Text>
          </View>
        </View>
      </View>

      {/* Search Bar */}
      <View className="p-4 bg-white border-b border-gray-200">
        <View className="flex-row items-center bg-gray-100 rounded-lg px-4">
          <FontAwesome name="search" size={16} color="#9CA3AF" />
          <TextInput
            className="flex-1 h-12 text-gray-800 ml-2"
            placeholder="Search users..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={handleSearch}
          />
        </View>
      </View>

      {/* User List */}
      <View className="flex-1 p-4">
        <FlatList
          data={filteredUsers}
          renderItem={({ item }) => (
            <UserListItem 
              user={item} 
              isFollowing={false}
              onPress={() => handlePress(item)}
              style="p-4 bg-white rounded-lg shadow-sm mb-3"
            />
          )}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={() => fetchUsers()}
              colors={['#3b82f6']}
              tintColor="#3b82f6"
            />
          }
        />
      </View>
    </View>
  );
}