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
    name: '',
    bio: '',
    website: '',
    email: '',
    phone: '',
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      setFormData({
        username: data.username || '',
        name: data.full_name || '',
        bio: data.bio || '',
        website: data.website || '',
        email: user?.email || '',
        phone: data.phone || '',
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
        .from('profiles')
        .select('id')
        .eq('username', formData.username)
        .neq('id', user.id)
        .single();

      if (existingUser) {
        Alert.alert('Error', 'Username already taken');
        return;
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          username: formData.username,
          full_name: formData.name,
          bio: formData.bio,
          website: formData.website,
          phone: formData.phone,
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
            {/* Name Input */}
            <CustomTextInput
              label="Name"
              value={formData.name}
              onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
              placeholder="Your full name"
              autoCapitalize="words"
            />

            {/* Username Input */}
            <CustomTextInput
              label="Username"
              value={formData.username}
              onChangeText={(text) => setFormData(prev => ({ ...prev, username: text }))}
              placeholder="Username"
              autoCapitalize="none"
              autoCorrect={false}
              required
            />

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

            <View className="h-px bg-gray-200 my-4" />

            <Text className="text-lg font-semibold mb-4">Private Information</Text>

            {/* Email Input */}
            <CustomTextInput
              label="Email"
              value={formData.email}
              editable={false}
              className="bg-gray-100"
            />

            {/* Phone Input */}
            <CustomTextInput
              label="Phone"
              value={formData.phone}
              onChangeText={(text) => setFormData(prev => ({ ...prev, phone: text }))}
              placeholder="Your phone number"
              keyboardType="phone-pad"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
};

export default EditProfileScreen; 