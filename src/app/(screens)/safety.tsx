import React from 'react';
import { View, Text, ScrollView, Linking } from 'react-native';
import { Feather } from '@expo/vector-icons';

const SafetyScreen = () => {
  const safetyTips = [
    {
      title: 'Keep Your Account Secure',
      description: 'Use a strong password and enable two-factor authentication.',
      icon: 'lock'
    },
    {
      title: 'Be Careful What You Share',
      description: 'Avoid sharing personal information like your address or phone number.',
      icon: 'shield'
    },
    {
      title: 'Report Suspicious Activity',
      description: 'If you see something that doesn\'t seem right, report it immediately.',
      icon: 'alert-circle'
    },
    {
      title: 'Manage Your Privacy Settings',
      description: 'Review and adjust your privacy settings regularly.',
      icon: 'settings'
    }
  ];

  return (
    <ScrollView className="flex-1 bg-white pt-0">
      {/* Header */}
      <View className="bg-blue-50 p-6 pt-20">
        <Text className="text-3xl font-bold mb-2">Safety Center</Text>
        <Text className="text-base text-gray-600">
          Learn how to stay safe and protect your account on Pixelfy.
        </Text>
      </View>

      {/* Safety Tips */}
      <View className="p-6">
        {safetyTips.map((tip, index) => (
          <View key={index} className="mb-6 bg-white p-4 rounded-lg shadow-sm border border-gray-100">
            <View className="flex-row items-center mb-2">
              <View className="w-10 h-10 rounded-full bg-blue-50 items-center justify-center mr-3">
                <Feather name={tip.icon} size={20} color="#3b82f6" />
              </View>
              <Text className="text-lg font-semibold">{tip.title}</Text>
            </View>
            <Text className="text-gray-600 ml-13">{tip.description}</Text>
          </View>
        ))}
      </View>

      {/* Additional Resources */}
      <View className="p-6 bg-gray-50">
        <Text className="text-base text-gray-600 mb-4">
          For more safety tips, visit our {' '}
          <Text 
            className="text-blue-500" 
            onPress={() => Linking.openURL('https://pixelfy.com/safety')}
          >
            Safety Guide
          </Text>
        </Text>
      </View>
    </ScrollView>
  );
};

export default SafetyScreen; 