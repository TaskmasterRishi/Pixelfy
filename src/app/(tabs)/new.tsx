import { Text, View, Image, TextInput, ActivityIndicator } from "react-native";
import { useState, useEffect } from "react";
import * as ImagePicker from "expo-image-picker";
import Button from "~/src/Components/Button";
import { uploadImage } from "~/src/lib/cloudinary";
import { supabase } from "~/src/lib/supabase";
import { useAuth } from "~/src/providers/AuthProvider";
import { router } from "expo-router";

export default function CreatePost() {
  const [caption, setCaption] = useState("");
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false); // Loading state for button
  const [isPageReady, setIsPageReady] = useState(false); // Track if page is ready

  const { session } = useAuth();

  useEffect(() => {
    // Set page ready to true when component is mounted
    setIsPageReady(true);
  }, []);

  useEffect(() => {
    if (isPageReady) {
      pickImage(); // Open Image Picker after page is ready
    }
  }, [isPageReady]); // Only run this when isPageReady changes

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.5,
    });

    if (!result.canceled && result.assets?.length > 0) {
      setImage(result.assets[0].uri);
    } else {
      router.back(); // Go back if no image is selected
    }
  };

  const createPost = async () => {
    if (!image) {
      alert("Please select an image");
      return;
    }

    setLoading(true); // Start loading

    const response = await uploadImage(image);

    if (response) {
      const postImageUrl = response;

      // Ensure user exists in profiles table
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", session?.user.id)
        .maybeSingle(); // Using maybeSingle to handle multiple or no rows

      if (profileError) {
        console.log("Profile error:", profileError); // Log the error for debugging
        alert("Profile not found. Please create a profile first.");
        setLoading(false); // Stop loading
        return;
      }

      if (!profileData) {
        alert("Profile not found. Please create a profile first.");
        setLoading(false); // Stop loading
        return;
      }

      // Create post in the "post" table
      const { data, error } = await supabase
        .from("post")
        .insert([{ caption, image: postImageUrl, user_id: session?.user.id }])
        .select();

      if (error) {
        alert("Error creating post");
      } else {
        router.push("/(tabs)?refresh=true");
      }
    } else {
      alert("Image upload failed, please try again.");
    }

    setLoading(false); // Stop loading
  };

  return (
    <View className="p-3 items-center flex-1">
      {/* Image Preview */}
      {image ? (
        <Image
          source={{ uri: image }}
          className="w-60 aspect-[3/4] rounded-xl shadow-black bg-slate-300"
        />
      ) : (
        <View className="w-60 aspect-[3/4] rounded-xl shadow-black bg-slate-300" />
      )}

      {/* Change Button */}
      <Text onPress={pickImage} className="text-blue-500 font-semibold m-5">
        Change
      </Text>

      {/* Caption Input */}
      <TextInput
        value={caption}
        onChangeText={setCaption}
        placeholder="What's on your mind?"
        className="w-full p-3"
        style={{ height: 100, borderColor: "#ddd", borderWidth: 1, borderRadius: 5 }}
      />

      {/* Share Button with Loading */}
      <View className="mt-auto w-full">
        {loading ? (
          <ActivityIndicator size="large" color="#0000ff" />
        ) : (
          <Button title="Share" onPress={createPost} />
        )}
      </View>
    </View>
  );
}
