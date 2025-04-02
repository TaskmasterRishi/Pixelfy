import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';

const FAQScreen = () => {
  const faqItems = [
    {
      question: 'How do I create an account?',
      answer: 'You can create an account by clicking the "Sign Up" button and following the registration process.'
    },
    {
      question: 'How do I reset my password?',
      answer: 'Go to the login page and click "Forgot Password". Follow the instructions sent to your email.'
    },
    {
      question: 'How do I report inappropriate content?',
      answer: 'Tap the three dots on the post and select "Report". Our team will review it promptly.'
    },
    {
      question: 'How do I change my profile picture?',
      answer: 'Go to your profile, tap on your current profile picture, and select a new one from your device.'
    }
  ];

  return (
    <ScrollView className="flex-1 bg-white pt-0">
      {/* Header */}
      <View className="bg-blue-50 p-6 pt-20">
        <Text className="text-3xl font-bold mb-2">FAQs & Guides</Text>
        <Text className="text-base text-gray-600">
          Find answers to common questions about using Pixelfy.
        </Text>
      </View>

      {/* FAQ Items */}
      <View className="p-6">
        {faqItems.map((item, index) => (
          <View key={index} className="mb-6 bg-white p-4 rounded-lg shadow-sm border border-gray-100">
            <View className="flex-row items-center mb-2">
              <View className="w-10 h-10 rounded-full bg-blue-50 items-center justify-center mr-3">
                <Feather name="help-circle" size={20} color="#3b82f6" />
              </View>
              <Text className="text-lg font-semibold">{item.question}</Text>
            </View>
            <Text className="text-gray-600 ml-13">{item.answer}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

export default FAQScreen; 