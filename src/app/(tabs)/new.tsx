import { Text, View, Image, TextInput, ActivityIndicator, TouchableOpacity, ScrollView, Dimensions } from "react-native";
import { useState, useEffect } from "react";
import * as ImagePicker from "expo-image-picker";
import { uploadImage, deleteImage } from "~/src/lib/cloudinary";
import { supabase } from "~/src/lib/supabase";
import { useAuth } from "~/src/providers/AuthProvider";
import { router } from "expo-router";
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get("window");

const filters = [
  { name: "Original", transformation: "" },
  { name: "Enhance", transformation: "e_improve" },
  { name: "Grayscale", transformation: "e_grayscale" },
  { name: "Sepia", transformation: "e_sepia" },
  { name: "Brightness", transformation: "e_brightness:50" },
  { name: "Contrast", transformation: "e_contrast:50" },
  { name: "Vignette", transformation: "e_vignette:80" },
  { name: "Blur", transformation: "e_blur:200" },
  { name: "Sharpen", transformation: "e_sharpen:100" },
  { name: "Pixelate", transformation: "e_pixelate:10" },
  { name: "Cartoonify", transformation: "e_cartoonify" },
  { name: "Oil Paint", transformation: "e_oil_paint" },
  { name: "Artistic Zorro", transformation: "e_art:zorro" },
  { name: "Artistic Athena", transformation: "e_art:athena" },
  { name: "Auto Color", transformation: "e_auto_color" },
  { name: "Auto Contrast", transformation: "e_auto_contrast" },
  { name: "Auto Brightness", transformation: "e_auto_brightness" },
  { name: "Hue Adjustment", transformation: "e_hue:50" },
  { name: "Saturation Boost", transformation: "e_saturation:50" },
  { name: "Gamma Correction", transformation: "e_gamma:50" },
];

export default function CreatePost() {
  const [caption, setCaption] = useState("");
  const [image, setImage] = useState(null);
  const [filteredImage, setFilteredImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState(null);
  const { session } = useAuth();

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });

    if (!result.canceled && result.assets?.length > 0) {
      const selectedImage = result.assets[0].uri;
      setImage(selectedImage);
      setFilteredImage(selectedImage);
      await uploadAndSetImage(selectedImage);
    }
  };

  const uploadAndSetImage = async (selectedImage) => {
    setLoading(true);
    const response = await uploadImage(selectedImage);

    if (response) {
      setImage(response);
      setFilteredImage(response);
      setUploadedImageUrl(response);
    } else {
      alert("Image upload failed, please try again.");
    }

    setLoading(false);
  };

  const applyFilter = (transformation) => {
    if (!image) return;

    if (transformation === "") {
      setFilteredImage(image);
    } else {
      const filteredUrl = image.replace("/upload/", `/upload/${transformation}/`);
      setFilteredImage(filteredUrl);
    }
  };

  const createPost = async () => {
    if (!filteredImage) {
      alert("Please select an image first.");
      return;
    }

    setLoading(true);

    try {
      // Verify session exists
      if (!session || !session.user) {
        throw new Error("No active session found");
      }

      // Debug: Log the user ID
      console.log("Session user ID:", session.user.id);

      // Verify user exists in users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, username')
        .eq('id', session.user.id)
        .single();

      // Debug: Log the user data
      console.log("User data:", userData);

      if (userError) {
        console.error("User query error:", userError);
        throw new Error("Error fetching user data");
      }

      if (!userData) {
        throw new Error(`User with ID ${session.user.id} not found in database`);
      }

      // Create the post
      const { data, error } = await supabase
        .from("posts")
        .insert([{ 
          user_id: session.user.id,
          caption,
          media_url: filteredImage,
          media_type: "image",
          created_at: new Date().toISOString()
        }])
        .select();

      if (error) {
        console.error("Post creation error:", error);
        throw error;
      }

      if (data) {
        console.log("Post created:", data[0]);
      }

      router.push("/(tabs)?refresh=true");
    } catch (error) {
      console.error("Full error:", error);
      alert("Error creating post: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      if (uploadedImageUrl) {
        deleteImage(uploadedImageUrl);
      }
    };
  }, [uploadedImageUrl]);

  return (
    <View className="flex-1 bg-white">
      {/* Image Preview */}
      <TouchableOpacity 
        onPress={pickImage} 
        className="flex-1 justify-center items-center bg-gray-50"
      >
        {filteredImage ? (
          <Image
            source={{ uri: filteredImage }}
            className="w-full"
            style={{ height: height * 0.6 }}
            resizeMode="contain"
          />
        ) : (
          <View className="items-center">
            <Ionicons 
              name="image-outline" 
              size={64} 
              color="#999" 
              className="mb-4"
            />
            <Text className="text-gray-500 text-lg font-medium">Tap to select an image</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Filter Previews */}
      {filteredImage && (
        <View className="w-full bg-gray-50 py-3">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-3">
            {filters.map((filter) => {
              const previewUrl = filter.transformation === ""
                ? image
                : image.replace("/upload/", `/upload/${filter.transformation}/`);

              return (
                <TouchableOpacity 
                  key={filter.name} 
                  onPress={() => applyFilter(filter.transformation)} 
                  className="mx-1.5"
                >
                  <Image
                    source={{ uri: previewUrl }}
                    className={`w-16 h-16 rounded-lg ${
                      filteredImage === previewUrl 
                        ? "border-3 border-blue-500" 
                        : "border border-gray-200"
                    }`}
                    resizeMode="cover"
                  />
                  <Text className="text-gray-700 text-xs text-center mt-1 font-medium">
                    {filter.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Caption Input */}
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

        {/* Share Button */}
        <TouchableOpacity 
          onPress={createPost} 
          disabled={loading || !filteredImage}
          className={`mt-4 p-3 rounded-xl items-center ${
            loading || !filteredImage ? 'bg-blue-300' : 'bg-blue-500'
          }`}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text className="text-white font-semibold text-lg">
              {filteredImage ? 'Share' : 'Select an image to share'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}