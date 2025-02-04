import { Text, View, Image, TextInput, Pressable } from "react-native";
import { useEffect, useState } from "react";
import * as ImagePicker from "expo-image-picker";
import Button from "~/src/Components/Button";

export default function CreatePost() {
  const [caption, setCaption] = useState("");
  const [image, setImage] = useState(null); // Default to null

  useEffect(() => {
    if (!image || image == null) {
      pickImage();
    }
  }, []); // Run only on component mount

  const pickImage = async () => {
    // No permissions request is necessary for launching the image library
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images", "videos"],
      allowsEditing: true,
      // aspect: [4,3],
      quality: 1,
    });

    if (!result.canceled && result.assets && result.assets[0].uri) {
      setImage(result.assets[0].uri);
    }
  };

  return (
    <View className="p-3 items-center flex-1">
      {/* Image Picker */}
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

      {/* TextInput for caption */}
      <TextInput
        value={caption}
        onChangeText={(newValue) => setCaption(newValue)}
        placeholder="What's on your mind?"
        className="w-full p-3"
      />

      {/* Button */}
      <View className="mt-auto w-full">

        <Button title="Share"/>
      </View>
    </View>
  );
}
