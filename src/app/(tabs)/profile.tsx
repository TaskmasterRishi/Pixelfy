import React, { useState, useEffect } from 'react';
import { 
  View, Text, Image, TextInput, TouchableOpacity, ActivityIndicator, Alert 
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '~/src/providers/AuthProvider'; // Ensure correct path
import { supabase } from '~/src/lib/supabase'; // Import Supabase instance
import { uploadAvatar } from '~/src/lib/cloudinary'; // Import Cloudinary avatar upload function
import FontAwesome from "@expo/vector-icons/FontAwesome";
import Feather from '@expo/vector-icons/Feather';

const ProfileScreen = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, bio, avatar_url')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Error fetching profile:', error.message);
    } else {
      setProfile(data);
      setUsername(data.username || '');
      setBio(data.bio || '');
    }
    setIsLoading(false);
  };

  const handleUpdateProfile = async () => {
    setIsUpdating(true);

    const { error } = await supabase
      .from('profiles')
      .update({ username, bio })
      .eq('id', user.id);

    if (error) {
      console.error('Error updating profile:', error.message);
    } else {
      fetchProfile(); // Refresh profile after update
      Alert.alert('Profile Updated', 'Your profile has been successfully updated.', [{ text: 'OK' }]);
    }

    setIsUpdating(false);
  };

  const handlePickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.3,
    });

    if (!result.canceled) {
      uploadAndSaveAvatar(result.assets[0].uri);
    }
  };

  const uploadAndSaveAvatar = async (uri: string) => {
    setIsUpdating(true);

    const imageUrl = await uploadAvatar(uri);

    if (!imageUrl) {
      console.error('Failed to upload avatar');
      setIsUpdating(false);
      return;
    }

    const { error } = await supabase
      .from('profiles')
      .update({ avatar_url: imageUrl })
      .eq('id', user.id);

    if (error) {
      console.error('Error updating avatar:', error.message);
    } else {
      fetchProfile();
    }

    setIsUpdating(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  if (isLoading) {
    return <ActivityIndicator size="large" color="#007bff" />;
  }

  return (
    <View style={{ flex: 1, alignItems: 'center', padding: 20 }}>
      {profile && (
        <>
          <View style={{ position: 'relative', width: 120, height: 120, marginBottom: 20 }}>
            <TouchableOpacity onPress={handlePickImage}>
              {profile.avatar_url ? (
                <Image
                  source={{ uri: profile.avatar_url }}
                  style={{ width: 100, height: 100, borderRadius: 50 }}
                />
              ) : (
                <View
                  style={{
                    width: 100,
                    height: 100,
                    borderRadius: 50,
                    backgroundColor: '#ccc',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <FontAwesome name="user" size={50} color="gray" />
                </View>
              )}
            </TouchableOpacity>

            {/* Edit Icon (Clicking opens Image Picker) */}
            <TouchableOpacity
              onPress={handlePickImage}
              style={{
                position: 'absolute',
                bottom: 5,
                right: 5,
                backgroundColor: '#fff',
                borderRadius: 20,
                padding: 6,
                borderWidth: 1,
                borderColor: '#ccc',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.2,
                shadowRadius: 2,
              }}
            >
              <Feather name="edit" size={18} color="black" />
            </TouchableOpacity>
          </View>

          <TextInput
            value={username}
            onChangeText={setUsername}
            placeholder="Enter username"
            style={{
              borderWidth: 1,
              borderColor: '#ccc',
              padding: 10,
              width: '100%',
              borderRadius: 5,
              marginBottom: 10,
            }}
          />

          <TextInput
            value={bio}
            onChangeText={setBio}
            placeholder="Enter bio"
            style={{
              borderWidth: 1,
              borderColor: '#ccc',
              padding: 10,
              width: '100%',
              borderRadius: 5,
              marginBottom: 10,
            }}
          />

          <View style={{ marginTop: 'auto', width: '100%' }}>
            <TouchableOpacity
              onPress={handleUpdateProfile}
              style={{
                padding: 10,
                backgroundColor: isUpdating ? '#aaa' : '#007bff',
                borderRadius: 5,
                width: '100%',
                alignItems: 'center',
              }}
              disabled={isUpdating}
            >
              {isUpdating ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff' }}>Update Profile</Text>}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSignOut}
              style={{
                marginTop: 20,
                padding: 10,
                backgroundColor: '#ff4444',
                borderRadius: 5,
                width: '100%',
                alignItems: 'center',
              }}
            >
              <Text style={{ color: '#fff' }}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
};

export default ProfileScreen;
