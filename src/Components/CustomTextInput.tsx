import React from 'react';
import { Text, TextInput, View, TextInputProps } from 'react-native';

interface CustomTextInputProps extends TextInputProps {
  label: string;
  required?: boolean;
}

export default function CustomTextInput({ 
  label, 
  required = false,
  className = "",
  ...textInputProps 
}: CustomTextInputProps) {
  return (
    <View>
      <Text className="text-sm text-gray-500 mb-1 ml-1">
        {label}
        {required && <Text className="text-red-500"> *</Text>}
      </Text>
      <TextInput
        {...textInputProps}
        className={`bg-gray-50 rounded-xl px-4 py-3 text-base text-gray-900 ${className}`}
      />
    </View>
  );
}