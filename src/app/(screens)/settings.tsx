import React, { useState } from 'react';
import { View, Text, Switch, TouchableOpacity, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '~/providers/AuthProvider';
import { supabase } from '~/lib/supabase';
import { Feather, Ionicons, MaterialIcons } from '@expo/vector-icons';
import CloseFriendsScreen from '~/app/(screens)/closefriend';

const SettingsScreen = () => {
  const { user } = useAuth();
  if (!user) {
    // Handle the case where user is undefined, e.g., redirect or show a message
    return <Text>User not found</Text>; // Example handling
  }
  const [isPrivate, setIsPrivate] = useState(user?.is_private || false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [showOptions, setShowOptions] = useState(false);
  const [closeFriends, setCloseFriends] = useState<{ id: number; name: string }[]>([]);

  const handleTogglePrivacy = async () => {
    const newPrivacy = !isPrivate;
    setIsPrivate(newPrivacy);
    try {
      await supabase
        .from('users')
        .update({ is_private: newPrivacy })
        .eq('id', user.id);
    } catch (error) {
      console.error('Error updating privacy:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      router.replace('/(auth)/');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <ScrollView className="flex-1 bg-white">
      {/* Header */}
      <View className="bg-blue-50 p-6 pt-20">
        <Text className="text-3xl font-bold mb-2">Settings</Text>
        <Text className="text-base text-gray-600">
          Manage your account preferences and privacy settings
        </Text>
      </View>

      {/* Account Settings */}
      <View className="p-6">
        <Text className="text-xl font-semibold mb-4">Account</Text>
        
        <View className="space-y-2">
          <TouchableOpacity 
            className="flex-row items-center p-4 bg-white rounded-lg"
            onPress={() => router.push('/(screens)/edit-profile')}
          >
            <View className="w-10 h-10 rounded-full items-center justify-center bg-blue-50">
              <Feather name="user" size={20} color="#3b82f6" />
            </View>
            <View className="ml-4 flex-1">
              <Text className="text-base font-medium">Edit Profile</Text>
              <Text className="text-sm text-gray-500">Update your profile information</Text>
            </View>
            <Feather name="chevron-right" size={20} color="#9ca3af" />
          </TouchableOpacity>

          <View className="flex-row items-center p-4 bg-white rounded-lg">
            <View className="w-10 h-10 rounded-full items-center justify-center bg-blue-50">
              <Ionicons name="lock-closed" size={20} color="#3b82f6" />
            </View>
            <View className="ml-4 flex-1">
              <Text className="text-base font-medium">Private Account</Text>
              <Text className="text-sm text-gray-500">Make your account private</Text>
            </View>
            <Switch
              value={isPrivate}
              onValueChange={handleTogglePrivacy}
              trackColor={{ false: '#e5e7eb', true: '#3b82f6' }}
              thumbColor="#ffffff"
            />
          </View>

          <TouchableOpacity 
            className="flex-row items-center p-4 bg-white rounded-lg"
            onPress={() => router.push('/(screens)/closefriend')}
          >
            <View className="w-10 h-10 rounded-full items-center justify-center bg-blue-50">
              <MaterialIcons name="people" size={20} color="#3b82f6" />
            </View>
            <View className="ml-4 flex-1">
              <Text className="text-base font-medium">Close Friends</Text>
              <Text className="text-sm text-gray-500">Manage your close friends list</Text>
            </View>
            <Feather name="chevron-right" size={20} color="#9ca3af" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Notifications */}
      <View className="p-6 bg-gray-50">
        <Text className="text-xl font-semibold mb-4">Notifications</Text>
        
        <View className="space-y-2">
          <View className="flex-row items-center p-4 bg-white rounded-lg">
            <View className="w-10 h-10 rounded-full items-center justify-center bg-green-50">
              <Feather name="mail" size={20} color="#10b981" />
            </View>
            <View className="ml-4 flex-1">
              <Text className="text-base font-medium">Email Notifications</Text>
              <Text className="text-sm text-gray-500">Receive email notifications</Text>
            </View>
            <Switch
              value={emailNotifications}
              onValueChange={setEmailNotifications}
              trackColor={{ false: '#e5e7eb', true: '#10b981' }}
              thumbColor="#ffffff"
            />
          </View>

          <View className="flex-row items-center p-4 bg-white rounded-lg">
            <View className="w-10 h-10 rounded-full items-center justify-center bg-green-50">
              <Ionicons name="notifications" size={20} color="#10b981" />
            </View>
            <View className="ml-4 flex-1">
              <Text className="text-base font-medium">Push Notifications</Text>
              <Text className="text-sm text-gray-500">Receive push notifications</Text>
            </View>
            <Switch
              value={pushNotifications}
              onValueChange={setPushNotifications}
              trackColor={{ false: '#e5e7eb', true: '#10b981' }}
              thumbColor="#ffffff"
            />
          </View>
        </View>
      </View>

      {/* Privacy & Security */}
      <View className="p-6">
        <Text className="text-xl font-semibold mb-4">Privacy & Security</Text>
        
        <View className="space-y-2">
          <TouchableOpacity 
            className="flex-row items-center p-4 bg-white rounded-lg"
            onPress={() => router.push('/(screens)/blocked-users')}
          >
            <View className="w-10 h-10 rounded-full items-center justify-center bg-red-50">
              <Feather name="slash" size={20} color="#ef4444" />
            </View>
            <View className="ml-4 flex-1">
              <Text className="text-base font-medium">Blocked Users</Text>
              <Text className="text-sm text-gray-500">Manage blocked users</Text>
            </View>
            <Feather name="chevron-right" size={20} color="#9ca3af" />
          </TouchableOpacity>

          <TouchableOpacity 
            className="flex-row items-center p-4 bg-white rounded-lg"
            onPress={() => router.push('/(screens)/activity-log')}
          >
            <View className="w-10 h-10 rounded-full items-center justify-center bg-purple-50">
              <Feather name="activity" size={20} color="#8b5cf6" />
            </View>
            <View className="ml-4 flex-1">
              <Text className="text-base font-medium">Activity Log</Text>
              <Text className="text-sm text-gray-500">View your account activity</Text>
            </View>
            <Feather name="chevron-right" size={20} color="#9ca3af" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Support */}
      <View className="p-6 bg-gray-50">
        <Text className="text-xl font-semibold mb-4">Support</Text>
        
        <View className="space-y-2">
          <TouchableOpacity 
            className="flex-row items-center p-4 bg-white rounded-lg"
            onPress={() => router.push({
              pathname: '/(screens)/Help',
              params: { fromSettings: true }
            })}
          >
            <View className="w-10 h-10 rounded-full items-center justify-center bg-blue-50">
              <Feather name="help-circle" size={20} color="#3b82f6" />
            </View>
            <View className="ml-4 flex-1">
              <Text className="text-base font-medium">Help Center</Text>
              <Text className="text-sm text-gray-500">Get help and support</Text>
            </View>
            <Feather name="chevron-right" size={20} color="#9ca3af" />
          </TouchableOpacity>

          <TouchableOpacity 
            className="flex-row items-center p-4 bg-white rounded-lg"
            onPress={() => {
              setShowOptions(false);
              router.push({
                pathname: '/(screens)/report-problem',
                params: { 
                  fromSettings: true,
                  email: 'pixelfyhelp@gmail.com',
                  subject: 'Issue Report',
                  body: `Hello Pixelfy Team,\n\nI would like to report the following issue:\n\n[Please describe the issue here]\n\nAdditional Information:\n- Device: [Your device model]\n- OS Version: [Your OS version]\n- App Version: 1.0.0\n\nThank you!`
                }
              });
            }}
          >
            <View className="w-10 h-10 rounded-full items-center justify-center bg-red-50">
              <Feather name="alert-circle" size={20} color="#ef4444" />
            </View>
            <View className="ml-4 flex-1">
              <Text className="text-base font-medium">Report a Problem</Text>
              <Text className="text-sm text-gray-500">Report a problem to the support team</Text>
            </View>
            <Feather name="chevron-right" size={20} color="#9ca3af" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Logout */}
      <TouchableOpacity 
        className="flex-row items-center justify-center py-4 mt-6 mx-4 bg-red-50 rounded-lg"
        onPress={handleLogout}
      >
        <Text className="text-red-600 font-medium">Log Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default SettingsScreen; 