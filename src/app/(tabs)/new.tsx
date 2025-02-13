import { Text, View, Image, TextInput, ActivityIndicator, TouchableOpacity, ScrollView, Dimensions } from "react-native";
import { useState } from "react";
import * as ImagePicker from "expo-image-picker";
import { uploadImage } from "~/src/lib/cloudinary";
import { supabase } from "~/src/lib/supabase";
import { useAuth } from "~/src/providers/AuthProvider";
import { router } from "expo-router";

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
    } else {
      router.back();
    }
  };

  const uploadAndSetImage = async (selectedImage) => {
    setLoading(true);
    const response = await uploadImage(selectedImage);

    if (response) {
      setImage(response);
      setFilteredImage(response);
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

    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", session?.user.id)
      .maybeSingle();

    if (profileError || !profileData) {
      alert("Profile not found. Please create a profile first.");
      setLoading(false);
      return;
    }

    const { error } = await supabase
      .from("post")
      .insert([{ caption, image: filteredImage, user_id: session?.user.id }]);

    if (error) {
      alert("Error creating post");
    } else {
      router.push("/(tabs)?refresh=true");
    }

    setLoading(false);
  };

  return (
    <View className="flex-1 bg-white">
      {/* Image Preview */}
      <TouchableOpacity onPress={pickImage} className="flex-1 justify-center items-center">
        {filteredImage ? (
          <Image
            source={{ uri: filteredImage }}
            className="w-full"
            style={{ height: height * 0.7 }}
            resizeMode="contain"
          />
        ) : (
          <Text className="text-gray-500 text-lg">Select Image</Text>
        )}
      </TouchableOpacity>

      {/* Filter Previews */}
      {filteredImage && (
        <View className="w-full mt-2">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="p-3">
            {filters.map((filter) => {
              const previewUrl =
                filter.transformation === ""
                  ? image
                  : image.replace("/upload/", `/upload/${filter.transformation}/`);

              return (
                <TouchableOpacity key={filter.name} onPress={() => applyFilter(filter.transformation)} className="mx-2">
                  <Image
                    source={{ uri: previewUrl }}
                    className={`w-20 h-20 rounded-xl ${filteredImage === previewUrl ? "border-2 border-blue-500" : ""}`}
                    resizeMode="cover"
                  />
                  <Text className="text-gray-700 text-xs text-center mt-1">{filter.name}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Caption Input */}
      <TextInput
        value={caption}
        onChangeText={setCaption}
        placeholder="Write a caption..."
        placeholderTextColor="#555"
        className="mt-4 mx-4 p-3 bg-gray-100 text-black rounded-lg"
        style={{ borderColor: "#ddd", borderWidth: 1 }}
      />

      {/* Share Button */}
      <TouchableOpacity onPress={createPost} className="mt-4 mx-4 bg-blue-500 p-3 rounded-lg items-center">
        {loading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text className="text-white font-semibold text-lg">Share</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}
