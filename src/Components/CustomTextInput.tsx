import React from 'react';
import { Text, TextInput, View, TextInputProps } from 'react-native';

interface CustomTextInputProps extends TextInputProps {
  label: string;
  required?: boolean;
  error?: string;
  helperText?: string;
}

export default function CustomTextInput({ 
  label, 
  required = false,
  error,
  helperText,
  className = "",
  ...textInputProps 
}: CustomTextInputProps) {
  return (
    <View className="mb-4">
      <Text className="text-sm text-gray-500 mb-1 ml-1">
        {label}
        {required && <Text className="text-red-500"> *</Text>}
      </Text>
      <TextInput
        {...textInputProps}
        className={`bg-gray-50 rounded-xl px-4 py-3 text-base ${error ? 'border-red-500 border' : ''} ${className}`}
      />
      {error && (
        <Text className="text-red-500 text-xs mt-1 ml-1">{error}</Text>
      )}
      {helperText && !error && (
        <Text className="text-gray-500 text-xs mt-1 ml-1">{helperText}</Text>
      )}
    </View>
  );
}