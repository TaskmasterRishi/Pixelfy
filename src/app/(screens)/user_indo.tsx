import { useState } from 'react';
import { View, Text, TextInput, ScrollView, Switch, Platform, TouchableOpacity } from 'react-native';
import { Stack, router } from 'expo-router';

export default function UserInfo() {
  const [formData, setFormData] = useState({
    username: '',
    full_name: '',
    email: '',
    avatar_url: '',
    bio: '',
    website: '',
    gender: '',
    date_of_birth: '',
    is_private: false
  });

  const handleSubmit = async () => {
    try {
      const response = await fetch('YOUR_API_ENDPOINT/update-user-info', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Error updating user info:', error);
    }
  };

  return (
    <View className="flex-1 bg-gray-50">
      <Stack.Screen 
        options={{
          title: 'Complete Your Profile',
          headerShadowVisible: false,
          headerStyle: { backgroundColor: '#f9fafb' },
        }} 
      />
      
      <ScrollView className="flex-1 px-4">
        <Text className="text-2xl font-bold text-center mt-6 text-gray-900">
          Complete Your Profile
        </Text>
        <Text className="text-sm text-center mt-2 text-gray-600">
          Please provide your additional information
        </Text>

        <View className="mt-6 space-y-4">
          <View>
            <Text className="text-sm font-medium text-gray-700">Username</Text>
            <TextInput
              className="mt-1 p-3 border border-gray-300 rounded-md bg-white"
              value={formData.username}
              onChangeText={(text) => setFormData(prev => ({ ...prev, username: text }))}
              placeholder="Enter username"
            />
          </View>

          <View>
            <Text className="text-sm font-medium text-gray-700">Full Name</Text>
            <TextInput
              className="mt-1 p-3 border border-gray-300 rounded-md bg-white"
              value={formData.full_name}
              onChangeText={(text) => setFormData(prev => ({ ...prev, full_name: text }))}
              placeholder="Enter full name"
            />
          </View>

          <View>
            <Text className="text-sm font-medium text-gray-700">Email</Text>
            <TextInput
              className="mt-1 p-3 border border-gray-300 rounded-md bg-white"
              value={formData.email}
              onChangeText={(text) => setFormData(prev => ({ ...prev, email: text }))}
              placeholder="Enter email"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View>
            <Text className="text-sm font-medium text-gray-700">Bio</Text>
            <TextInput
              className="mt-1 p-3 border border-gray-300 rounded-md bg-white"
              value={formData.bio}
              onChangeText={(text) => setFormData(prev => ({ ...prev, bio: text }))}
              placeholder="Tell us about yourself"
              multiline
              numberOfLines={4}
            />
          </View>

          <View>
            <Text className="text-sm font-medium text-gray-700">Website</Text>
            <TextInput
              className="mt-1 p-3 border border-gray-300 rounded-md bg-white"
              value={formData.website}
              onChangeText={(text) => setFormData(prev => ({ ...prev, website: text }))}
              placeholder="Enter website URL"
              keyboardType="url"
              autoCapitalize="none"
            />
          </View>

          <View>
            <Text className="text-sm font-medium text-gray-700">Gender</Text>
            {/* You might want to use a custom picker or modal for this */}
            <TextInput
              className="mt-1 p-3 border border-gray-300 rounded-md bg-white"
              value={formData.gender}
              onChangeText={(text) => setFormData(prev => ({ ...prev, gender: text }))}
              placeholder="Select gender"
            />
          </View>

          <View>
            <Text className="text-sm font-medium text-gray-700">Date of Birth</Text>
            {/* You might want to use DateTimePicker from @react-native-community/datetimepicker */}
            <TextInput
              className="mt-1 p-3 border border-gray-300 rounded-md bg-white"
              value={formData.date_of_birth}
              onChangeText={(text) => setFormData(prev => ({ ...prev, date_of_birth: text }))}
              placeholder="Select date of birth"
            />
          </View>

          <View className="flex-row items-center justify-between">
            <Text className="text-sm font-medium text-gray-700">Make profile private</Text>
            <Switch
              value={formData.is_private}
              onValueChange={(value) => setFormData(prev => ({ ...prev, is_private: value }))}
            />
          </View>

          <TouchableOpacity
            onPress={handleSubmit}
            className="mt-6 bg-indigo-600 p-4 rounded-md"
          >
            <Text className="text-white text-center font-medium">Save Information</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}