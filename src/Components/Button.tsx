import React from 'react';
import { Pressable, Text, ActivityIndicator } from "react-native";

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  disabled?: boolean;
  className?: string;
}

export default function Button({ 
  title, 
  onPress, 
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  className = ""
}: ButtonProps) {
  const baseStyles = "flex items-center justify-center rounded-xl";
  
  const variantStyles = {
    primary: "bg-blue-500",
    secondary: "bg-gray-500",
    outline: "bg-transparent border-2 border-blue-500"
  };

  const sizeStyles = {
    sm: "px-4 py-2",
    md: "px-6 py-3",
    lg: "px-8 py-4"
  };

  const textStyles = {
    primary: "text-white font-bold",
    secondary: "text-white font-bold",
    outline: "text-blue-500 font-bold"
  };

  return (
    <Pressable 
      onPress={!isLoading && !disabled ? onPress : undefined}
      className={`
        ${baseStyles} 
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${disabled ? 'opacity-50' : 'opacity-100'}
        ${className}
      `}
    >
      {isLoading ? (
        <ActivityIndicator color={variant === 'outline' ? '#3b82f6' : 'white'} />
      ) : (
        <Text className={textStyles[variant]}>{title}</Text>
      )}
    </Pressable>
  );
}
