import { useState, useEffect } from 'react';
import { View, TextInput, FlatList, Pressable, Image, Text } from 'react-native';
import { useAuth } from '../../providers/AuthProvider';
import { supabase } from '../../lib/supabase';
import { FontAwesome } from '@expo/vector-icons';

export default function SearchPage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  const handleSearch = async (query) => {
    if (query.length > 2) {
      const { data, error } = await supabase
        .from('users')
        .select('id, username, avatar_url')
        .ilike('username', `%${query}%`)
        .neq('id', user.id); // Exclude current user
      
      if (!error) {
        setSearchResults(data);
      }
    } else {
      setSearchResults([]);
    }
  };

  const fetchRandomUsers = async () => {
    const { data, error } = await supabase
      .from('users')
      .select('id, username, avatar_url')
      .eq('is_private', false)
      .order('created_at', { ascending: false })
      .limit(5);

    if (!error) {
      setSearchResults((prevResults) => [...prevResults, ...data]);
    }
  };

  useEffect(() => {
    fetchRandomUsers();
  }, []);

  const sendFollowRequest = async (targetUserId) => {
    const { error } = await supabase
      .from('notifications')
      .insert({
        type: 'follow_request',
        from_user_id: user.id,
        to_user_id: targetUserId,
        status: 'pending'
      });
    
    if (!error) {
      alert('Follow request sent!');
    }
  };

  return (
    <View style={{ padding: 16, backgroundColor: '#f8f8f8', flex: 1 }}>
      <TextInput
        style={{ 
          height: 50, 
          borderColor: '#ccc', 
          borderWidth: 1, 
          borderRadius: 8, 
          padding: 10, 
          marginBottom: 16 
        }}
        placeholder="Search users..."
        placeholderTextColor="#888"
        value={searchQuery}
        onChangeText={(text) => {
          setSearchQuery(text);
          handleSearch(text);
        }}
      />
      
      <FlatList
        data={searchResults}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable 
            style={{ 
              padding: 16, 
              flexDirection: 'row', 
              alignItems: 'center', 
              backgroundColor: '#fff', 
              borderRadius: 8, 
              marginBottom: 10, 
              elevation: 2 
            }}
            onPress={() => sendFollowRequest(item.id)}
          >
            {item.avatar_url ? (
              <Image
                source={{ uri: item.avatar_url }}
                style={{ width: 40, height: 40, borderRadius: 20, marginRight: 12 }}
              />
            ) : (
              <View style={{ 
                width: 40, 
                height: 40, 
                borderRadius: 20, 
                backgroundColor: '#f1f1f1', 
                marginRight: 12, 
                justifyContent: 'center', 
                alignItems: 'center' 
              }}>
                <FontAwesome name="user" size={24} color="#888" />
              </View>
            )}
            <Text style={{ fontSize: 16, fontWeight: 'bold' }}>{item.username}</Text>
          </Pressable>
        )}
      />
    </View>
  );
} 