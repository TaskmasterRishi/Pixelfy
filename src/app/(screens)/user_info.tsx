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
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '~/lib/supabase';
import { countryCodes } from '~/data/countryCodes';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Font from 'expo-font';
import { useNavigation } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { useRouter } from 'expo-router';
import { uploadAvatar } from '~/lib/cloudinary';

export default function UserInfo() {
  const navigation = useNavigation();
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: '',
    fullName: '',
    phoneNumber: '',
    dateOfBirth: '',
    bio: '',
    website: '',
    gender: '',
    avatarUri: '',
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
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadFont() {
      await Font.loadAsync({
        'NicolassFont': require('~/../assets/fonts/nicolassfonts-onrydisplay-extrabold.otf'),
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

  useEffect(() => {
    const checkProfileCompletion = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('users')
          .select('id')
          .eq('id', user.id)
          .single();

        if (profile) {
          // If profile already exists, redirect to index
          router.replace('/(tabs)/');
        }
      }
    };

    checkProfileCompletion();
  }, []);

  const validateForm = async () => {
    const newErrors: Record<string, string> = {};

    // Validate username
    if (!formData.username) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    } else {
      const { data: usernameData } = await supabase
        .from('users')
        .select('username')
        .eq('username', formData.username)
        .single();

      if (usernameData) {
        newErrors.username = 'Username already exists';
      }
    }

    // Validate email
    if (!userEmail) {
      newErrors.email = 'Email is required';
    } else {
      const { data: emailData } = await supabase
        .from('users')
        .select('email')
        .eq('email', userEmail)
        .single();

      if (emailData) {
        // Redirect to (tabs)/ if email already exists
        setTimeout(() => {
          router.replace('/(tabs)/');
        }, 1000);
        return false; // Prevent further validation
      }
    }

    // Validate phone number
    if (!formData.phoneNumber) {
      newErrors.phoneNumber = 'Phone number is required';
    }

    // Validate date of birth
    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = 'Date of birth is required';
    } else {
      const dob = new Date(formData.dateOfBirth);
      const age = new Date().getFullYear() - dob.getFullYear();
      if (age < 13) {
        newErrors.dateOfBirth = 'You must be at least 13 years old';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);

      // Basic validation
      if (!userEmail) {
        setErrors(prev => ({...prev, email: 'Email is required'}));
        setIsSubmitting(false);
        return;
      }

      // Validate form
      const isValid = await validateForm();
      if (!isValid) {
        setIsSubmitting(false);
        return;
      }

      // Get the current user's ID from Supabase auth
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('No authenticated user found');
        setIsSubmitting(false);
        return;
      }

      // Upload avatar if provided
      let avatarUrl = '';
      if (formData.avatarUri) {
        avatarUrl = await uploadAvatar(formData.avatarUri);
      }

      // Create user profile
      const { data, error } = await supabase
        .from('users')
        .insert([{
          id: user.id,
          username: formData.username,
          full_name: formData.fullName,
          email: userEmail,
          phone: `${selectedCountry.value}${formData.phoneNumber}`,
          avatar_url: avatarUrl,
          bio: formData.bio,
          website: formData.website,
          gender: formData.gender,
          date_of_birth: formData.dateOfBirth,
          is_private: isPrivate,
          verified: false,
          created_at: new Date().toISOString()
        }]);

      if (error) {
        console.error('Error creating user:', error);
        setIsSubmitting(false);
        return;
      }

      console.log('User created:', data);
      
      // Redirect to index page after 1 second
      setTimeout(() => {
        router.replace('/(tabs)/');
      }, 1000);
      
    } catch (error) {
      console.error('Error creating user:', error);
      setIsSubmitting(false);
    }
  };

  const handleDateChange = (event, date) => {
    setShowDatePicker(false);
    if (date) {
      // Create a new date object with UTC time to avoid timezone issues
      const utcDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
      setSelectedDate(utcDate);
      // Convert to ISO format without timezone offset
      setFormData({...formData, dateOfBirth: utcDate.toISOString().split('T')[0]});
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

      <ScrollView className="flex-1 bg-white pt-">
        {/* Header Section */}
        <View className="bg-blue-50 p-6 pt-20">
          <Text 
            style={{ fontFamily: 'NicolassFont' }}
            className="text-3xl text-blue-500 mb-2"
          >
            Welcome to Pixelfy!
          </Text>
          <Text className="text-base text-gray-600">
            Let's create your perfect profile
          </Text>
        </View>

        {/* Form Section */}
        <View className="p-6">
          <View className="mb-4">
            <Text className="text-base text-gray-700 mb-2">Username</Text>
            <View className="relative">
              <Ionicons name="at-outline" size={20} color="#6b7280" className="absolute left-3 top-1/2 -translate-y-2.5 z-10" />
              <TextInput
                className={`border ${errors.username ? 'border-red-500' : 'border-gray-200'} rounded-lg pl-10 pr-3 py-3 text-base bg-white`}
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
                className="border border-gray-200 rounded-lg pl-10 pr-3 py-3 text-base bg-white"
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
                className="flex-row items-center justify-between border border-gray-200 rounded-l-lg pl-3 pr-2 py-3 w-28 bg-white"
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
                  className={`border ${errors.phoneNumber ? 'border-red-500' : 'border-gray-200'} rounded-r-lg pl-10 pr-3 py-3 text-base flex-1 bg-white`}
                  placeholder="Phone number"
                  keyboardType="phone-pad"
                  value={formData.phoneNumber}
                  onChangeText={(text) => setFormData({...formData, phoneNumber: text})}
                />
              </View>
            </View>
            {errors.phoneNumber && (
              <Text className="text-red-500 text-sm mt-1">{errors.phoneNumber}</Text>
            )}
          </View>

          <View className="mb-4">
            <Text className="text-base text-gray-700 mb-2">Date of Birth</Text>
            <View className="relative">
              <Ionicons name="calendar-outline" size={20} color="#6b7280" className="absolute left-3 top-1/2 -translate-y-2.5 z-10" />
              <TouchableOpacity 
                className={`flex-row items-center justify-between border ${errors.dateOfBirth ? 'border-red-500' : 'border-gray-200'} rounded-lg pl-10 pr-3 py-3 bg-white`}
                onPress={() => setShowDatePicker(true)}
              >
                <Text className="text-base">
                  {formData.dateOfBirth ? 
                    new Date(formData.dateOfBirth).toLocaleDateString() : 
                    'Select date of birth'
                  }
                </Text>
              </TouchableOpacity>
            </View>
            {errors.dateOfBirth && (
              <Text className="text-red-500 text-sm mt-1">{errors.dateOfBirth}</Text>
            )}
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
              className="border border-gray-200 rounded-lg pl-3 py-3 text-base bg-white"
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
                className="border border-gray-200 rounded-lg pl-10 pr-3 py-3 text-base bg-white"
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
              className="flex-row items-center justify-between border border-gray-200 rounded-lg pl-3 py-3 bg-white"
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
            className={`bg-blue-500 px-6 py-3 rounded-full items-center mt-6 mb-8 ${isSubmitting ? 'opacity-50' : ''}`}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text className="text-white text-base font-semibold">
                Create Profile
              </Text>
            )}
          </TouchableOpacity>
        </View>

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
