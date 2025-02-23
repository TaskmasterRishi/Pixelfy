'use client';

import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '~/src/lib/supabase';
import { countryCodes } from '~/src/data/countryCodes';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Font from 'expo-font';
import { useNavigation } from '@react-navigation/native';
import { Stack } from 'expo-router';

export default function UserInfo() {
  const navigation = useNavigation();
  const [formData, setFormData] = useState({
    username: '',
    fullName: '',
    phoneNumber: '',
    dateOfBirth: '',
    bio: '',
    website: '',
    gender: '',
  });
  const [selectedCountry, setSelectedCountry] = useState(countryCodes[0]);
  const [isCountryModalVisible, setIsCountryModalVisible] = useState(false);
  const [isGenderModalVisible, setIsGenderModalVisible] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const genderOptions = ['Male', 'Female', 'Trans', 'Non-binary', 'Other'];
  const [fontLoaded, setFontLoaded] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isPrivate, setIsPrivate] = useState(false);

  useEffect(() => {
    async function loadFont() {
      await Font.loadAsync({
        'NicolassFont': require('~/assets/fonts/nicolassfonts-onrydisplay-extrabold.otf'),
      });
      setFontLoaded(true);
    }

    loadFont();
  }, []);

  useEffect(() => {
    const fetchUserEmail = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email);
      }
    };

    fetchUserEmail();
  }, []);

  const validateForm = async () => {
    const newErrors: Record<string, string> = {};

    // Check unique username
    const { data: usernameData } = await supabase
      .from('users')
      .select('username')
      .eq('username', formData.username)
      .single();

    if (usernameData) {
      newErrors.username = 'Username already exists';
    }

    // Check unique phone
    const { data: phoneData } = await supabase
      .from('users')
      .select('phone')
      .eq('phone', formData.phoneNumber)
      .single();

    if (phoneData) {
      newErrors.phoneNumber = 'Phone number already exists';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    try {
      if (!userEmail) {
        console.error('No user email found');
        return;
      }

      const isValid = await validateForm();
      if (!isValid) return;

      const { data, error } = await supabase
        .from('users')
        .insert([{
          username: formData.username,
          full_name: formData.fullName,
          email: userEmail,
          phone: `${selectedCountry.value}${formData.phoneNumber}`,
          avatar_url: '',
          bio: formData.bio,
          website: formData.website,
          gender: formData.gender,
          date_of_birth: formData.dateOfBirth,
          is_private: isPrivate,
          verified: false,
          created_at: new Date().toISOString()
        }]);

      if (error) throw error;
      console.log('User created:', data);
      // Add navigation or success message here
    } catch (error) {
      console.error('Error creating user:', error);
    }
  };

  const handleDateChange = (event, date) => {
    setShowDatePicker(false);
    if (date) {
      setSelectedDate(date);
      setFormData({...formData, dateOfBirth: date.toLocaleDateString()});
    }
  };

  if (!fontLoaded) {
    return null;
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: 'Complete Setup',
          headerTintColor: '#000',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      />

      <ScrollView className="flex-1 bg-white pt-4">
        {/* Welcome Section */}
        <View className="px-6 pb-8">
          <Text 
            style={{ fontFamily: 'NicolassFont' }}
            className="text-3xl text-blue-500 mb-2"
          >
            Welcome to Pixelfy!
          </Text>
          <Text className="text-lg text-gray-600">
            Let's create your perfect profile
          </Text>
        </View>

        {/* Profile Picture Section */}
        <View className="items-center -mt-8">
          <View className="relative">
            <View className="w-24 h-24 rounded-full bg-gray-100 items-center justify-center">
              <Ionicons name="person-outline" size={40} color="#666" />
            </View>
            <TouchableOpacity className="absolute bottom-0 right-0 bg-blue-500 w-7 h-7 rounded-full items-center justify-center">
              <Text className="text-white text-xl">+</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Form */}
        <ScrollView className="flex-1 px-6 pt-4">
          <View className="mb-4">
            <Text className="text-base text-gray-700 mb-2">Username</Text>
            <View className="relative">
              <Ionicons name="at-outline" size={20} color="#6b7280" className="absolute left-3 top-1/2 -translate-y-2.5 z-10" />
              <TextInput
                className={`border ${errors.username ? 'border-red-500' : 'border-gray-200'} rounded-lg pl-10 pr-3 py-3 text-base`}
                placeholder="Enter username"
                value={formData.username}
                onChangeText={(text) => setFormData({...formData, username: text})}
              />
            </View>
            {errors.username && (
              <Text className="text-red-500 text-sm mt-1">{errors.username}</Text>
            )}
          </View>

          <View className="mb-4">
            <Text className="text-base text-gray-700 mb-2">Full Name</Text>
            <View className="relative">
              <Ionicons name="person-outline" size={20} color="#6b7280" className="absolute left-3 top-1/2 -translate-y-2.5 z-10" />
              <TextInput
                className="border border-gray-200 rounded-lg pl-10 pr-3 py-3 text-base"
                placeholder="Enter full name"
                value={formData.fullName}
                onChangeText={(text) => setFormData({...formData, fullName: text})}
              />
            </View>
          </View>

          <View className="mb-4">
            <Text className="text-base text-gray-700 mb-2">Phone Number</Text>
            <View className="flex-row items-center">
              {/* Country Code Selector */}
              <TouchableOpacity 
                className="flex-row items-center justify-between border border-gray-200 rounded-l-lg pl-3 pr-2 py-3 w-28"
                onPress={() => setIsCountryModalVisible(true)}
              >
                <View className="flex-row items-center space-x-2">
                  <Text className="text-base">{selectedCountry.flag}</Text>
                  <Text className="text-base">{selectedCountry.value}</Text>
                </View>
                <Ionicons name="chevron-down" size={16} color="#6b7280" />
              </TouchableOpacity>
              
              {/* Phone Number Input */}
              <View className="flex-1 relative">
                <Ionicons name="call-outline" size={20} color="#6b7280" className="absolute left-3 top-1/2 -translate-y-2.5 z-10" />
                <TextInput
                  className="border border-gray-200 rounded-r-lg pl-10 pr-3 py-3 text-base flex-1"
                  placeholder="Phone number"
                  keyboardType="phone-pad"
                  value={formData.phoneNumber}
                  onChangeText={(text) => setFormData({...formData, phoneNumber: text})}
                />
              </View>
            </View>
          </View>

          <View className="mb-4">
            <Text className="text-base text-gray-700 mb-2">Date of Birth</Text>
            <View className="relative">
              <Ionicons name="calendar-outline" size={20} color="#6b7280" className="absolute left-3 top-1/2 -translate-y-2.5 z-10" />
              <TouchableOpacity 
                className="flex-row items-center justify-between border border-gray-200 rounded-lg pl-10 pr-3 py-3"
                onPress={() => setShowDatePicker(true)}
              >
                <Text className="text-base">{formData.dateOfBirth || 'Select date of birth'}</Text>
              </TouchableOpacity>
            </View>
            {showDatePicker && (
              <DateTimePicker
                value={selectedDate}
                mode="date"
                display="default"
                onChange={handleDateChange}
              />
            )}
          </View>

          <View className="mb-4">
            <Text className="text-base text-gray-700 mb-2">Bio</Text>
            <TextInput
              className="border border-gray-200 rounded-lg pl-3 py-3 text-base"
              placeholder="Tell us about yourself"
              multiline
              numberOfLines={4}
              value={formData.bio}
              onChangeText={(text) => setFormData({...formData, bio: text})}
            />
          </View>

          <View className="mb-4">
            <Text className="text-base text-gray-700 mb-2">Website</Text>
            <View className="relative">
              <Ionicons name="link-outline" size={20} color="#6b7280" className="absolute left-3 top-1/2 -translate-y-2.5 z-10" />
              <TextInput
                className="border border-gray-200 rounded-lg pl-10 pr-3 py-3 text-base"
                placeholder="https://example.com"
                keyboardType="url"
                value={formData.website}
                onChangeText={(text) => setFormData({...formData, website: text})}
              />
            </View>
          </View>

          <View className="mb-4">
            <Text className="text-base text-gray-700 mb-2">Gender</Text>
            <TouchableOpacity 
              className="flex-row items-center justify-between border border-gray-200 rounded-lg pl-3 py-3"
              onPress={() => setIsGenderModalVisible(true)}
            >
              <Text className="text-base">{formData.gender || 'Select gender'}</Text>
              <Ionicons name="chevron-down" size={20} color="#6b7280" />
            </TouchableOpacity>
          </View>

          {/* Privacy Toggle - Moved to bottom */}
          <View className="mb-4">
            <View className="flex-row items-center justify-between">
              <Text className="text-base text-gray-700">Private Profile</Text>
              <TouchableOpacity 
                className={`w-12 h-6 rounded-full p-1 ${isPrivate ? 'bg-blue-500' : 'bg-gray-200'}`}
                onPress={() => setIsPrivate(!isPrivate)}
              >
                <View 
                  className={`bg-white w-4 h-4 rounded-full shadow-sm ${isPrivate ? 'ml-6' : 'ml-0'}`}
                  style={{ transition: 'margin-left 0.2s' }}
                />
              </TouchableOpacity>
            </View>
            <Text className="text-sm text-gray-500 mt-2">
              When enabled, only approved followers can see your content and activity.
            </Text>
          </View>

          <TouchableOpacity 
            className="bg-blue-500 px-6 py-4 rounded-lg items-center mt-6 mb-8"
            onPress={handleSubmit}
          >
            <Text className="text-white text-base font-semibold">
              Create Profile
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Country Code Modal */}
        <Modal
          visible={isCountryModalVisible}
          transparent={true}
          animationType="slide"
        >
          <View className="flex-1 justify-center bg-black/50">
            <View className="bg-white mx-5 rounded-xl max-h-[80%]">
              {/* Modal Header */}
              <View className="flex-row justify-between items-center p-4 border-b border-gray-200">
                <Text className="text-lg font-semibold text-gray-800">Select Country Code</Text>
                <TouchableOpacity onPress={() => setIsCountryModalVisible(false)}>
                  <Ionicons name="close" size={24} color="#374151" />
                </TouchableOpacity>
              </View>

              {/* Country List */}
              <ScrollView className="max-h-[70%]">
                {countryCodes.map((country, index) => (
                  <TouchableOpacity
                    key={`country-${country.value}-${index}`}
                    className="flex-row justify-between items-center py-3 px-4 border-b border-gray-100"
                    onPress={() => {
                      setSelectedCountry(country);
                      setIsCountryModalVisible(false);
                    }}
                  >
                    <Text className="text-base text-gray-700">
                      {country.flag} {country.name}
                    </Text>
                    {selectedCountry.value === country.value && (
                      <Ionicons name="checkmark" size={20} color="#3b82f6" />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Gender Modal */}
        <Modal
          visible={isGenderModalVisible}
          transparent={true}
          animationType="slide"
        >
          <View className="flex-1 justify-center bg-black/50">
            <View className="bg-white mx-5 rounded-xl max-h-[80%]">
              {/* Modal Header */}
              <View className="flex-row justify-between items-center p-4 border-b border-gray-200">
                <Text className="text-lg font-semibold text-gray-800">Select Gender</Text>
                <TouchableOpacity onPress={() => setIsGenderModalVisible(false)}>
                  <Ionicons name="close" size={24} color="#374151" />
                </TouchableOpacity>
              </View>

              {/* Gender List */}
              <ScrollView className="max-h-[70%]">
                {genderOptions.map((gender, index) => (
                  <TouchableOpacity
                    key={`gender-${index}`}
                    className="flex-row justify-between items-center py-3 px-4 border-b border-gray-100"
                    onPress={() => {
                      setFormData({...formData, gender});
                      setIsGenderModalVisible(false);
                    }}
                  >
                    <Text className="text-base text-gray-700">{gender}</Text>
                    {formData.gender === gender && (
                      <Ionicons name="checkmark" size={20} color="#3b82f6" />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </>
  );
}
