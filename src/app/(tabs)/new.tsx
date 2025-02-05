import { Text, View, Image, TextInput } from "react-native";
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

  const { session } = useAuth();

  useEffect(() => {
    pickImage(); // Open Image Picker on mount
  }, []);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
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

    const response = await uploadImage(image);

    if (response) {
      const postImageUrl = response;

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

      {/* Share Button */}
      <View className="mt-auto w-full">
        <Button title="Share" onPress={createPost} />
      </View>
    </View>
  );
}
