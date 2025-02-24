import { useState, useEffect } from 'react';
import { View, TextInput, FlatList, Pressable, Image, Text, Dimensions, Animated } from 'react-native';
import { useAuth } from '../../providers/AuthProvider';
import { supabase } from '../../lib/supabase';
import { FontAwesome } from '@expo/vector-icons';

export default function SearchPage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [followStatus, setFollowStatus] = useState({});
  const [isSearching, setIsSearching] = useState(false);
  const [positions] = useState(() => 
    searchResults.map(() => ({
      x: new Animated.Value(Math.random() * Dimensions.get('window').width),
      y: new Animated.Value(Math.random() * Dimensions.get('window').height)
    }))
  );

  const handleSearch = async (query) => {
    if (query.length > 2) {
      setIsSearching(true);
      const { data, error } = await supabase
        .from('users')
        .select('id, username, avatar_url')
        .ilike('username', `%${query}%`)
        .neq('id', user.id);
      
      if (!error) {
        setSearchResults(data);
      }
    } else {
      setIsSearching(false);
      setSearchResults([]);
      fetchRandomUsers();
    }
  };

  const fetchRandomUsers = async () => {
    const { data, error } = await supabase
      .from('users')
      .select('id, username, avatar_url')
      .eq('is_private', false)
      .neq('id', user.id) // Exclude current user
      .order('created_at', { ascending: false })
      .limit(5);

    if (!error) {
      setSearchResults((prevResults) => [...prevResults, ...data]);
    }
  };

  useEffect(() => {
    fetchRandomUsers();
  }, []);

  const checkFollowStatus = async (targetUserId) => {
    const { data, error } = await supabase
      .from('follow_requests')
      .select('status')
      .eq('requester_id', user.id)
      .eq('target_id', targetUserId)
      .single();

    if (!error && data) {
      setFollowStatus(prev => ({ ...prev, [targetUserId]: data.status }));
    }
  };

  const handleFollowRequest = async (targetUserId) => {
    const { error } = await supabase
      .from('follow_requests')
      .insert({
        requester_id: user.id,
        target_id: targetUserId,
        status: 'pending'
      });
    
    if (!error) {
      setFollowStatus(prev => ({ ...prev, [targetUserId]: 'pending' }));
      alert('Follow request sent!');
    }
  };

  useEffect(() => {
    // Check follow status for each result when searchResults change
    searchResults.forEach(user => {
      checkFollowStatus(user.id);
    });
  }, [searchResults]);

  useEffect(() => {
    const animate = () => {
      positions.forEach((pos, index) => {
        if (searchResults[index]) {
          Animated.parallel([
            Animated.timing(pos.x, {
              toValue: Math.random() * (Dimensions.get('window').width - 100),
              duration: 5000 + Math.random() * 5000,
              useNativeDriver: true,
            }),
            Animated.timing(pos.y, {
              toValue: Math.random() * (Dimensions.get('window').height - 200),
              duration: 5000 + Math.random() * 5000,
              useNativeDriver: true,
            })
          ]).start(() => animate());
        }
      });
    };

    if (!isSearching) {
      animate();
    }
  }, [positions, isSearching, searchResults]);

  return (
    <View style={{ padding: 8, backgroundColor: '#fff', flex: 1 }}>
      <TextInput
        style={{ 
          height: 40, 
          backgroundColor: '#f0f0f0', 
          borderRadius: 8, 
          padding: 10, 
          marginBottom: 8,
          color: '#000',
          fontSize: 14
        }}
        placeholder="Search users..."
        placeholderTextColor="#888"
        value={searchQuery}
        onChangeText={(text) => {
          setSearchQuery(text);
          handleSearch(text);
        }}
      />
      
      <View style={{ flex: 1 }}>
        {searchResults.map((item, index) => (
          <Animated.View
            key={item.id}
            style={{
              position: 'absolute',
              transform: [
                { translateX: positions[index]?.x || 0 },
                { translateY: positions[index]?.y || 0 }
              ],
              alignItems: 'center',
              width: 100
            }}
          >
            <View style={{ 
              width: 80,
              height: 80,
              borderRadius: 40,
              overflow: 'hidden',
              backgroundColor: '#f0f0f0',
              justifyContent: 'center',
              alignItems: 'center',
              borderWidth: 1,
              borderColor: '#e0e0e0'
            }}>
              {item.avatar_url ? (
                <Image
                  source={{ uri: item.avatar_url }}
                  style={{ width: '100%', height: '100%' }}
                />
              ) : (
                <FontAwesome name="user" size={30} color="#888" />
              )}
            </View>
            
            <Text 
              style={{ 
                color: '#000', 
                fontSize: 12, 
                marginTop: 4,
                marginBottom: 4
              }}
              numberOfLines={1}
            >
              {item.username}
            </Text>

            <Pressable
              style={{
                maxWidth: 100,
                paddingVertical: 4,
                paddingHorizontal: 12,
                backgroundColor: followStatus[item.id] === 'pending' ? '#f0f0f0' : '#3897f0',
                borderRadius: 4,
                alignSelf: 'center'
              }}
              onPress={() => handleFollowRequest(item.id)}
              disabled={followStatus[item.id] === 'pending'}
            >
              <Text style={{ 
                color: followStatus[item.id] === 'pending' ? '#888' : '#fff', 
                fontSize: 12, 
                fontWeight: 'bold',
                textAlign: 'center'
              }}>
                {followStatus[item.id] === 'pending' ? 'Requested' : 'Follow'}
              </Text>
            </Pressable>
          </Animated.View>
        ))}
      </View>
    </View>
  );
} 