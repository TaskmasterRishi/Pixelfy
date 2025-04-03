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
  Platform,
  Image,
  Switch
} from 'react-native';
import { useAuth } from '~/providers/AuthProvider';
import { supabase } from '~/lib/supabase';
import { router, Stack } from 'expo-router';
import CustomTextInput from '~/Components/CustomTextInput';
import * as ImagePicker from 'expo-image-picker';
import { uploadImage, deleteImage } from '~/lib/cloudinary';
import FontAwesome from "@expo/vector-icons/FontAwesome";
import * as ImageManipulator from 'expo-image-manipulator';
import Toast from 'react-native-toast-message';

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
    verified: false,
    full_name: ''
  });
  const [originalData, setOriginalData] = useState(null);
  const [lastPressTime, setLastPressTime] = useState(0);

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

      const formattedData = {
        username: data.username || '',
        email: data.email || '',
        phone: data.phone || '',
        avatar_url: data.avatar_url || '',
        bio: data.bio || '',
        website: data.website || '',
        gender: data.gender || '',
        date_of_birth: data.date_of_birth || '',
        is_private: data.is_private || false,
        verified: data.verified || false,
        full_name: data.full_name || ''
      };

      // Store original data
      setOriginalData(formattedData);
      // Set form data
      setFormData(formattedData);
    } catch (error) {
      Toast.show({
        type: 'error',
        text2: 'Failed to load profile'
      });
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarUpload = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled) {
        setIsSaving(true);
        const uri = result.assets[0].uri;

        // If there's an existing avatar, delete it first
        if (formData.avatar_url) {
          try {
            const publicId = formData.avatar_url.split('/').pop()?.split('.')[0];
            if (publicId) {
              await deleteImage(publicId);
            }
          } catch (deleteError) {
            console.error('Error deleting old avatar:', deleteError);
          }
        }

        // Compress image
        const compressed = await ImageManipulator.manipulateAsync(
          uri,
          [{ resize: { width: 500 } }],
          { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
        );

        // Upload to Cloudinary
        const uploadedUrl = await uploadImage(compressed.uri, '');
        
        if (!uploadedUrl) {
          throw new Error('Failed to upload image');
        }

        // Update Supabase with only avatar_url
        const { error: updateError } = await supabase
          .from('users')
          .update({ avatar_url: uploadedUrl })
          .eq('id', user.id);

        if (updateError) {
          console.error('Avatar update error:', updateError);
          throw updateError;
        }

        // Update local state
        setFormData(prev => ({ ...prev, avatar_url: uploadedUrl }));
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Profile picture updated successfully',
          position: 'bottom'
        });
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to update profile picture',
        position: 'bottom'
      });
      console.error('Error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);

      // Validate username
      if (!formData.username.trim()) {
        Toast.show({
          type: 'error',
          text2: 'Username is required'
        });
        return;
      }

      // Get changed fields only
      const changedFields = {};
      let hasChanges = false;

      // Compare each field with original data
      Object.keys(formData).forEach(key => {
        if (key === 'avatar_url' || key === 'email' || key === 'verified') return;

        const originalValue = originalData[key];
        const currentValue = key === 'is_private' ? formData[key] : formData[key].trim();

        if (originalValue !== currentValue) {
          changedFields[key] = currentValue;
          hasChanges = true;
        }
      });

      // If nothing has changed, show message and return
      if (!hasChanges) {
        Toast.show({
          type: 'info',
          text2: 'No changes to save'
        });
        router.push('/(tabs)/profile?refresh=true');
        return;
      }

      // Check username uniqueness only if username changed
      if (changedFields.username) {
        const { data: existingUser, error: checkError } = await supabase
          .from('users')
          .select('id')
          .eq('username', changedFields.username)
          .neq('id', user.id)
          .single();

        if (existingUser) {
          Toast.show({
            type: 'error',
            text2: 'Username already taken'
          });
          return;
        }
      }

      // Update only changed fields
      const { error } = await supabase
        .from('users')
        .update(changedFields)
        .eq('id', user.id);

      if (error) {
        console.error('Update error:', error);
        throw error;
      }

      Toast.show({
        type: 'success',
        text2: 'Profile updated successfully'
      });
      
      // Navigate back to profile with refresh parameter
      router.push('/(tabs)/profile?refresh=true');
    } catch (error) {
      Toast.show({
        type: 'error',
        text2: 'Failed to update profile'
      });
      console.error('Error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrivacyToggle = (value: boolean) => {
    setFormData(prev => ({ ...prev, is_private: value }));
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
              style={{ paddingHorizontal: 16, paddingVertical: 8 }}
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
            {/* Add Avatar Section */}
            <View className="items-center mb-4">
              <View className="mb-2">
                {formData.avatar_url ? (
                  <View className="relative">
                    <Image
                      source={{ uri: formData.avatar_url }}
                      className="w-24 h-24 rounded-full border-2 border-gray-200"
                    />
                    {isSaving && (
                      <View className="absolute inset-0 bg-black/30 rounded-full items-center justify-center">
                        <View className="items-center">
                          <ActivityIndicator color="white" size="small" />
                          <Text className="text-white text-xs mt-1">Uploading...</Text>
                        </View>
                      </View>
                    )}
                  </View>
                ) : (
                  <View className="w-24 h-24 rounded-full bg-gray-100 items-center justify-center border-2 border-gray-200">
                    {isSaving ? (
                      <View className="items-center">
                        <ActivityIndicator color="#9ca3af" size="small" />
                        <Text className="text-gray-400 text-xs mt-1">Uploading...</Text>
                      </View>
                    ) : (
                      <FontAwesome name="user" size={40} color="#9ca3af" />
                    )}
                  </View>
                )}
              </View>
              
              {/* Separate pressable text */}
              <TouchableOpacity 
                onPress={handleAvatarUpload}
                disabled={isSaving}
                className="py-3 px-6 rounded-lg active:opacity-70"
                style={{ paddingVertical: 12, paddingHorizontal: 24 }}
              >
                <Text 
                  className={`text-sm font-medium ${
                    isSaving ? 'text-gray-400' : 'text-blue-500'
                  }`}
                >
                  {isSaving ? 'Updating...' : 'Change Profile Picture'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Full Name Input */}
            <CustomTextInput
              label="Full Name"
              value={formData.full_name}
              onChangeText={(text) => setFormData(prev => ({ ...prev, full_name: text }))}
              placeholder="Your full name"
              autoCapitalize="words"
              autoCorrect={false}
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

            {/* Private Account Toggle moved to the end */}
            <View className="flex-row items-center justify-between bg-gray-50 px-4 py-3 rounded-xl mt-4">
              <View>
                <Text className="text-base text-gray-900 font-medium">Private Account</Text>
                <Text className="text-sm text-gray-500">Only approved followers can see your posts</Text>
              </View>
              <Switch
                trackColor={{ false: "#767577", true: "#0ea5e9" }}
                thumbColor={formData.is_private ? "#fff" : "#f4f3f4"}
                ios_backgroundColor="#767577"
                onValueChange={handlePrivacyToggle}
                value={formData.is_private}
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
};

export default EditProfileScreen; 