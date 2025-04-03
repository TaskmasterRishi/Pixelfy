import { useEffect, useState } from 'react';
import { FlatList, Text } from 'react-native';
import { supabase } from '~/lib/supabase';
import { useAuth } from '~/providers/AuthProvider';
import UserListItem from '~/Components/UserListItem';

export default function UsersScreen() {
  const [users, setUsers] = useState([]);
  const { user } = useAuth();

  useEffect(() => {
    const fetchUsers = async () => {
      if (!user) return; // Ensure user is defined

      let { data: users, error } = await supabase
        .from('users')
        .select(`
          id,
          username,
          avatar_url
        `)
        .neq('id', user.id); // exclude me

      if (error) {
        console.error('Error fetching users:', error);
        return;
      }

      setUsers(users || []);
    };
    fetchUsers();
  }, [user]); // Add user as a dependency

  const handlePress = async (user) => {
    // Implement the logic to handle the press event
    console.log('User pressed:', user);
  };

  return (
    <FlatList
      data={users}
      contentContainerStyle={{ gap: 5 }}
      renderItem={({ item }) => (
        <UserListItem 
          user={item} 
          isFollowing={false}
          onPress={() => handlePress(item)}
        />
      )}
    />
  );
}