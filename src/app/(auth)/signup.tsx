// src/app/(auth)/signup.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { signUp } from '~/services/authService'; // Import the signUp service
import Button from '~/Components/Button';
import { useAuth } from '~/providers/AuthProvider';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import '~/../global.css';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const { setSession } = useAuth();

  async function signUpWithEmail() {
    setError('');
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    setLoading(true);

    try {
      const { session } = await signUp(email, password); // Use the signUp service

      if (session) {
        setSession(session); // Set the session in context
        router.push('/(tabs)/'); // Redirect to profile
      } else {
        Alert.alert(
          'Verify Your Email',
          'A confirmation link has been sent to your email address. Please verify to continue.',
          [{ text: 'OK', onPress: () => router.push('/(tabs)/profile') }]
        );
      }
    } catch (err) {
      setError(err.message); // Set error message
      Alert.alert('Signup Error', err.message); // Show alert
    } finally {
      setLoading(false);
    }
  }

  return (
    <View className="flex-1 bg-gradient-to-b from-blue-50 to-white p-6">
      <View className="flex-1 justify-center">
        {/* Logo Section */}
        <View className="items-center mb-12">
          <Text className="text-6xl text-blue-600 mb-2 font-bold">Pixelfy</Text>
          <Text className="text-gray-600 text-lg">Join Our Creative Community</Text>
        </View>

        {/* Signup Form */}
        <View className="bg-white rounded-2xl p-6 shadow-md">
          {/* Email Input */}
          <View className="mb-6">
            <Text className="text-gray-700 mb-2 font-medium">Email Address</Text>
            <View className="flex-row items-center border border-gray-200 rounded-lg px-4 bg-gray-50">
              <Ionicons name="mail-outline" size={20} color="#6B7280" />
              <TextInput
                className="flex-1 h-12 ml-3 bg-transparent"
                placeholder="name@example.com"
                placeholderTextColor="#9CA3AF"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                accessibilityLabel="Email Address"
              />
            </View>
          </View>

          {/* Password Input */}
          <View className="mb-6">
            <Text className="text-gray-700 mb-2 font-medium">Create Password</Text>
            <View className="flex-row items-center border border-gray-200 rounded-lg px-4 bg-gray-50">
              <Ionicons name="lock-closed-outline" size={20} color="#6B7280" />
              <TextInput
                className="flex-1 h-12 ml-3 bg-transparent"
                placeholder="••••••••"
                placeholderTextColor="#9CA3AF"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword} // This should be a boolean
                autoCapitalize="none"
                accessibilityLabel="Password"
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                className="ml-2"
                accessibilityLabel={showPassword ? "Hide password" : "Show password"}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color="#6B7280"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Confirm Password Input */}
          <View className="mb-8">
            <Text className="text-gray-700 mb-2 font-medium">Confirm Password</Text>
            <View className="flex-row items-center border border-gray-200 rounded-lg px-4 bg-gray-50">
              <Ionicons name="lock-closed-outline" size={20} color="#6B7280" />
              <TextInput
                className="flex-1 h-12 ml-3 bg-transparent"
                placeholder="••••••••"
                placeholderTextColor="#9CA3AF"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                accessibilityLabel="Confirm Password"
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                className="ml-2"
                accessibilityLabel={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
              >
                <Ionicons
                  name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color="#6B7280"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Error Message */}
          {error && (
            <View className="mb-4 flex-row items-center">
              <Ionicons name="alert-circle-outline" size={18} color="#EF4444" />
              <Text className="text-red-500 ml-2 text-sm">{error}</Text>
            </View>
          )}

          {/* Sign Up Button */}
          <Button
            title={loading ? 'Creating Account...' : 'Create Account'}
            onPress={signUpWithEmail}
            disabled={loading}
            className="w-full bg-blue-600 py-4 rounded-lg flex-row justify-center items-center"
            textClassName="text-white font-semibold text-base"
            icon={loading && <ActivityIndicator color="white" className="mr-2" />}
          />
        </View>

        {/* Divider */}
        <View className="flex-row items-center my-8">
          <View className="flex-1 h-px bg-gray-200" />
          <Text className="text-gray-500 px-4">Or sign up with</Text>
          <View className="flex-1 h-px bg-gray-200" />
        </View>

        {/* Google Sign-Up */}
        <TouchableOpacity className="w-full flex-row items-center justify-center border bg-white shadow-md border-gray-200 rounded-lg py-4">
          <Ionicons name="logo-google" size={20} color="#DB4437" />
          <Text className="text-gray-700 font-medium ml-2">Continue with Google</Text>
        </TouchableOpacity>

        {/* Footer Links */}
        <View className="flex-row justify-center mt-8">
          <Text className="text-gray-600">Already have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/')}>
            <Text className="text-blue-600 font-medium">Sign in</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}