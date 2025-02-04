import { Text, View, Image, Pressable, TextInput } from "react-native";
import { useState } from "react";
import * as ImagePicker from "expo-image-picker";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import Button from "~/src/Components/Button";

export default function ProfileScreen() {
  const [image, setImage] = useState(null); // Default to null
  const [username, setUsername] = useState(null);
  const pickImage = async () => {
    // No permissions request is necessary for launching the image library
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images", "videos"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  return (
    <View className="p-3 items-center flex-1">
      {/* Avatar image picker */}
      <Pressable onPress={pickImage} className="items-center">
        {image ? (
          <Image
            source={{ uri: image }}
            className="w-60 aspect-square rounded-full shadow-black bg-slate-300"
          />
        ) : (
          <View className="w-60 aspect-square rounded-full shadow-black bg-slate-300 justify-center items-center">
            <FontAwesome name="user" size={150} color="gray" />
          </View>
        )}

        {/* Change Button */}
        <Text className="text-blue-500 font-semibold m-5">Change</Text>
      </Pressable>

      {/* Form */}
      <Text className="text-gray-700 mr-auto p-3 font-semibold">Username</Text>
      <TextInput
        placeholder="Username"
        value={username}
        onChangeText={setUsername}
        className="border border-gray-300 p-3 rounded-md w-full"
      />

      {/* Add additional form fields or content here */}

      {/* Button */}
      <View className="gap-3 w-full mt-auto">
        <Button title="Update Profile" />
        <Button title="Sign out"></Button>
      </View>
    </View>
  );
}
