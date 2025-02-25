import { Text, View, Image, TextInput, ActivityIndicator, TouchableOpacity, ScrollView, Dimensions } from "react-native";
import { useState, useEffect } from "react";
import * as ImagePicker from "expo-image-picker";
import { supabase } from "~/src/lib/supabase";
import { useAuth } from "~/src/providers/AuthProvider";
import { router } from "expo-router";
import { Ionicons } from '@expo/vector-icons';
import { uploadImage, deleteImage } from "~/src/lib/cloudinary";
import * as ImageManipulator from 'expo-image-manipulator';
const { width, height } = Dimensions.get("window");

export default function CreatePost() {
  const [caption, setCaption] = useState("");
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const { session } = useAuth();

  const pickImage = async () => {
    try {
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        alert('Sorry, we need camera roll permissions to make this work!');
        return;
      }

      // Launch image picker with cropping
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.7,
        allowsEditing: true,
      });

      if (!result.canceled && result.assets?.length > 0) {
        const selectedImage = result.assets[0];
        
        // Check image type
        if (!selectedImage.uri.toLowerCase().match(/\.(jpg|jpeg|png|gif)$/)) {
          alert('Only JPG, PNG, and GIF images are allowed');
          return;
        }

        // Compress and resize the image
        const manipulatedImage = await ImageManipulator.manipulateAsync(
          selectedImage.uri,
          [{ resize: { width: 1080 } }],
          {
            compress: 0.6,
            format: ImageManipulator.SaveFormat.JPEG,
          }
        );

        // Set the processed image
        setImage(manipulatedImage.uri);
      }
    } catch (error) {
      console.error('Image picker error:', error);
      alert('Failed to select image. Please try again.');
      setLoading(false);
    }
  };

  const createPost = async () => {
    if (!image) {
      alert("Please select an image first.");
      return;
    }

    setLoading(true);

    try {
      if (!session || !session.user) {
        throw new Error("No active session found");
      }

      // Upload image only when sharing
      const uploadedImage = await uploadImage(image);
      if (!uploadedImage) {
        throw new Error("Image upload failed");
      }

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, username, avatar_url, verified')
        .eq('id', session.user.id)
        .single();

      if (userError || !userData) {
        throw new Error("User data not found");
      }

      const { data, error } = await supabase
        .from("posts")
        .insert([{ 
          user_id: session.user.id,
          caption,
          media_url: uploadedImage,
          media_type: "image",
          created_at: new Date().toISOString()
        }])
        .select();

      if (error) {
        throw error;
      }

      const postId = data[0].id;
      console.log('Created post with ID:', postId);

      router.push("/(tabs)?refresh=true");
    } catch (error) {
      alert("Error creating post: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-white">
      <TouchableOpacity 
        onPress={pickImage} 
        className="flex-1 justify-center items-center bg-gray-50"
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator size="large" color="#999" />
        ) : image ? (
          <Image
            source={{ uri: image }}
            className="w-full"
            style={{ height: height * 0.6 }}
            resizeMode="contain"
          />
        ) : (
          <View className="items-center">
            <Ionicons name="image-outline" size={64} color="#999" className="mb-4" />
            <Text className="text-gray-500 text-lg font-medium">Tap to select an image</Text>
          </View>
        )}
      </TouchableOpacity>

      <View className="p-4 bg-white">
        <TextInput
          value={caption}
          onChangeText={setCaption}
          placeholder="Write a caption..."
          placeholderTextColor="#666"
          multiline
          className="p-3 bg-gray-50 text-black rounded-xl"
          style={{ minHeight: 80 }}
        />

        <TouchableOpacity 
          onPress={createPost} 
          disabled={loading || !image}
          className={`mt-4 p-3 rounded-xl items-center ${loading || !image ? 'bg-blue-300' : 'bg-blue-500'}`}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text className="text-white font-semibold text-lg">
              {image ? 'Share' : 'Select an image to share'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
