import { Text, View, Image, TextInput } from "react-native";
import { useEffect, useState } from "react";
import * as ImagePicker from "expo-image-picker";
import Button from "~/src/Components/Button";
import { uploadImage } from "~/src/lib/cloudinary"; // Adjust path if necessary

export default function CreatePost() {
  const [caption, setCaption] = useState("");
  const [image, setImage] = useState(null);

  useEffect(() => {
    if (!image) {
      pickImage();
    }
  }, []);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });

    if (!result.canceled && result.assets?.length > 0) {
      setImage(result.assets[0].uri);
    }
  };

  const createPost = async () => {
    const uploadedImageUrl = await uploadImage(image);
    if (uploadedImageUrl) {
      console.log("Post Created with Image:", uploadedImageUrl);
      // Handle post creation (e.g., save to backend with caption)
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
      />

      {/* Share Button */}
      <View className="mt-auto w-full">
        <Button title="Share" onPress={createPost} />
      </View>
    </View>
  );
}
