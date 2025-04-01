import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useAuth } from '~/providers/AuthProvider';
import { supabase } from '~/lib/supabase';
import { router, Stack } from 'expo-router';
import CustomTextInput from '~/Components/CustomTextInput';

const EditProfileScreen = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    phone: '',
    avatar_url: '',
    bio: '',
    website: '',
    gender: '',
    date_of_birth: '',
    is_private: false,
    verified: false
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      setFormData({
        username: data.username || '',
        email: data.email || '',
        phone: data.phone || '',
        avatar_url: data.avatar_url || '',
        bio: data.bio || '',
        website: data.website || '',
        gender: data.gender || '',
        date_of_birth: data.date_of_birth || '',
        is_private: data.is_private || false,
        verified: data.verified || false
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to load profile');
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);

      // Validate username
      if (!formData.username.trim()) {
        Alert.alert('Error', 'Username is required');
        return;
      }

      // Check if username is unique
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('id')
        .eq('username', formData.username)
        .neq('id', user.id)
        .single();

      if (existingUser) {
        Alert.alert('Error', 'Username already taken');
        return;
      }

      const { error } = await supabase
        .from('users')
        .update({
          username: formData.username,
          phone: formData.phone,
          avatar_url: formData.avatar_url,
          bio: formData.bio,
          website: formData.website,
          gender: formData.gender,
          date_of_birth: formData.date_of_birth,
          is_private: formData.is_private,
          updated_at: new Date(),
        })
        .eq('id', user.id);

      if (error) throw error;

      Alert.alert('Success', 'Profile updated successfully');
      router.back();
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile');
      console.error('Error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#0ea5e9" />
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Edit Profile',
          presentation: 'modal',
          headerRight: () => (
            <TouchableOpacity 
              onPress={handleSave}
              disabled={isSaving}
            >
              <Text className={`font-semibold ${isSaving ? 'text-gray-400' : 'text-blue-500'}`}>
                {isSaving ? 'Saving...' : 'Done'}
              </Text>
            </TouchableOpacity>
          ),
        }}
      />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 bg-white"
      >
        <ScrollView className="flex-1">
          <View className="p-4 space-y-4">
            {/* Bio Input */}
            <View>
              <Text className="text-sm text-gray-500 mb-1 ml-1">Bio</Text>
              <TextInput
                value={formData.bio}
                onChangeText={(text) => setFormData(prev => ({ ...prev, bio: text }))}
                placeholder="Write a bio..."
                multiline
                numberOfLines={4}
                className="bg-gray-50 rounded-xl p-4 text-base text-gray-900"
                style={{ textAlignVertical: 'top' }}
              />
            </View>

            {/* Website Input */}
            <CustomTextInput
              label="Website"
              value={formData.website}
              onChangeText={(text) => setFormData(prev => ({ ...prev, website: text }))}
              placeholder="Your website"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
            />

            {/* Gender Input */}
            <CustomTextInput
              label="Gender"
              value={formData.gender}
              onChangeText={(text) => setFormData(prev => ({ ...prev, gender: text }))}
              placeholder="Your gender"
            />

            {/* Date of Birth Input */}
            <CustomTextInput
              label="Date of Birth"
              value={formData.date_of_birth}
              onChangeText={(text) => setFormData(prev => ({ ...prev, date_of_birth: text }))}
              placeholder="YYYY-MM-DD"
              keyboardType="numbers-and-punctuation"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
};

export default EditProfileScreen; 