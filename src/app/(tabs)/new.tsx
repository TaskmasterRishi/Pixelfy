import { 
  Text, View, Image, TextInput, ActivityIndicator, 
  TouchableOpacity, ScrollView, Dimensions, Platform 
} from "react-native";
import { useState, useEffect, useCallback } from "react";
import * as ImagePicker from "expo-image-picker";
import { supabase } from "~/src/lib/supabase";
import { useAuth } from "~/src/providers/AuthProvider";
import { router, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { uploadImage } from "~/src/lib/cloudinary";
import * as ImageManipulator from "expo-image-manipulator";

const { width, height } = Dimensions.get("window");

export default function CreatePost() {
  const [caption, setCaption] = useState("");
  const [loading, setLoading] = useState(false);
  const [postType, setPostType] = useState("post"); // 'post', 'story', or 'reel'
  const { session } = useAuth();
  const [selectedMedia, setSelectedMedia] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [uploadProgress, setUploadProgress] = useState(0);

  useFocusEffect(
    useCallback(() => {
      return () => {
        setSelectedMedia([]);
        setCurrentIndex(0);
        setCaption("");
      };
    }, [])
  );

  useEffect(() => {
    setSelectedMedia([]);
    setCurrentIndex(0);
  }, [postType]);

  const compressImage = async (uri) => {
    try {
      const compressed = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 1080 } }],
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
      );
      return compressed.uri;
    } catch (error) {
      console.error("Image compression error:", error);
      return uri; // Fallback to original if compression fails
    }
  };

  const pickMedia = async (type = "image") => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        alert("Sorry, we need camera roll permissions to make this work!");
        return;
      }

      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: type === "video" ? ImagePicker.MediaTypeOptions.Videos : ImagePicker.MediaTypeOptions.Images,
        quality: 0.7,
        allowsEditing: true,
        allowsMultipleSelection: Platform.OS === "android",
        selectionLimit: 3
      });

      if (!result.canceled && result.assets?.length > 0) {
        const newMedia = Platform.OS === "ios" 
          ? [...selectedMedia, ...result.assets].slice(0, 3) // Limit to 3
          : result.assets;
        
        setSelectedMedia(newMedia);
      }
    } catch (error) {
      console.error("Media picker error:", error);
      alert("Failed to select media. Please try again.");
      setLoading(false);
    }
  };

  const createContent = async () => {
    if (selectedMedia.length === 0) {
      alert("Please select media first.");
      return;
    }

    setLoading(true);
    setUploadProgress(0);

    try {
      if (!session || !session.user) {
        throw new Error("No active session found");
      }

      const uploadPromises = selectedMedia.map(async (media, index) => {
        try {
          const optimizedUri = await compressImage(media.uri);
          const uploadedMedia = await uploadImage(optimizedUri);
          if (!uploadedMedia) {
            throw new Error("Media upload failed");
          }
          setUploadProgress((index + 1) / selectedMedia.length);
          return uploadedMedia;
        } catch (error) {
          console.error(`Error uploading media ${index + 1}:`, error);
          alert(`Media ${index + 1} failed to upload. Please try again.`);
          return null;
        }
      });

      const uploadedMediaUrls = (await Promise.all(uploadPromises)).filter(url => url !== null);

      if (uploadedMediaUrls.length === 0) {
        throw new Error("All media uploads failed");
      }

      const table = postType === "story" ? "stories" : postType === "reel" ? "reels" : "posts";
      
      const contentData = uploadedMediaUrls.map((mediaUrl) => ({
        user_id: session.user.id,
        created_at: new Date().toISOString(),
        media_url: mediaUrl,
        caption,
        ...(postType === "post" && { media_type: mediaUrl.includes("video") ? "video" : "image" }),
      }));

      const { error } = await supabase.from(table).insert(contentData);
      if (error) throw error;

      router.push("/(tabs)?refresh=true");
    } catch (error) {
      alert(`Error creating ${postType}: ` + error.message);
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  const handleNext = () => {
    setCurrentIndex(prev => (prev + 1) % selectedMedia.length);
  };

  const handlePrevious = () => {
    setCurrentIndex(prev => (prev - 1 + selectedMedia.length) % selectedMedia.length);
  };

  const getMediaText = () => {
    if (selectedMedia.length > 0) {
      return selectedMedia.length > 1 
        ? `Viewing ${currentIndex + 1}/${selectedMedia.length}` 
        : 'Tap to change media';
    }
    return `Tap to add ${postType === 'reel' ? 'video' : 'image'}`;
  };

  return (
    <View className="flex-1 bg-white">
      {/* Media Selection Section */}
      <View className="flex-row justify-around p-4 border-b border-gray-200 bg-gray-50">
        <TouchableOpacity 
          onPress={() => setPostType('post')}
          className={`p-2 px-4 rounded-full ${postType === 'post' ? 'bg-blue-500' : 'bg-gray-200'}`}
        >
          <Text className={`text-base ${postType === 'post' ? 'font-bold text-white' : 'text-gray-700'}`}>Post</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={() => setPostType('story')}
          className={`p-2 px-4 rounded-full ${postType === 'story' ? 'bg-blue-500' : 'bg-gray-200'}`}
        >
          <Text className={`text-base ${postType === 'story' ? 'font-bold text-white' : 'text-gray-700'}`}>Story</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={() => setPostType('reel')}
          className={`p-2 px-4 rounded-full ${postType === 'reel' ? 'bg-blue-500' : 'bg-gray-200'}`}
        >
          <Text className={`text-base ${postType === 'reel' ? 'font-bold text-white' : 'text-gray-700'}`}>Reel</Text>
        </TouchableOpacity>
      </View>

      {/* Media Preview Section */}
      <View className="flex-1 bg-gray-100">
        {loading ? (
          <View className="flex-1 justify-center items-center bg-white/90">
            <ActivityIndicator size="large" color="#3b82f6" />
            {uploadProgress > 0 && (
              <View className="w-64 mt-4 bg-gray-200 rounded-full">
                <View 
                  className="h-2 bg-blue-500 rounded-full" 
                  style={{ width: `${uploadProgress * 100}%` }}
                />
                <Text className="text-center text-sm text-gray-600 mt-1">
                  Uploading {Math.round(uploadProgress * 100)}%
                </Text>
              </View>
            )}
          </View>
        ) : selectedMedia.length > 0 ? (
          <View className="flex-1 relative">
            <TouchableOpacity 
              onPress={() => pickMedia(postType === 'reel' ? 'video' : 'image')}
              className="flex-1"
            >
              <Image
                source={{ uri: selectedMedia[currentIndex].uri }}
                className="w-full h-full"
                resizeMode="cover"
              />
            </TouchableOpacity>
            
            {/* Media Indicators */}
            <View className="absolute bottom-4 w-full items-center space-y-2">
              <View className="flex-row space-x-2">
                {selectedMedia.map((_, index) => (
                  <View
                    key={index}
                    className={`w-2.5 h-2.5 rounded-full ${index === currentIndex ? 'bg-white' : 'bg-white/50'}`}
                  />
                ))}
              </View>
              <Text className="text-white bg-black/70 px-3 py-1.5 rounded-full text-sm font-medium">
                {getMediaText()}
              </Text>
            </View>

            {/* Navigation Arrows */}
            {selectedMedia.length > 1 && (
              <>
                <TouchableOpacity
                  onPress={handlePrevious}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/90 rounded-full shadow-sm"
                >
                  <Ionicons name="chevron-back" size={24} color="black" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleNext}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/90 rounded-full shadow-sm"
                >
                  <Ionicons name="chevron-forward" size={24} color="black" />
                </TouchableOpacity>
              </>
            )}
          </View>
        ) : (
          <TouchableOpacity 
            onPress={() => pickMedia(postType === 'reel' ? 'video' : 'image')} 
            className="flex-1 justify-center items-center bg-white"
          >
            <View className="p-6 bg-gray-100 rounded-full">
              <Ionicons name={postType === 'reel' ? "videocam-outline" : "image-outline"} size={48} color="#3b82f6" />
            </View>
            <Text className="text-gray-600 text-lg font-medium mt-4">
              {getMediaText()}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Content Creation Section */}
      <View className="p-4 bg-white border-t border-gray-200">
        <View className="mb-4">
          <Text className="text-sm text-gray-600 mb-1">
            {selectedMedia.length > 0 
              ? `Selected ${selectedMedia.length} ${selectedMedia.length > 1 ? 'items' : 'item'}`
              : 'No media selected'}
          </Text>
          <TouchableOpacity 
            onPress={() => pickMedia(postType === 'reel' ? 'video' : 'image')}
            className="flex-row items-center"
          >
            <Ionicons 
              name={selectedMedia.length > 0 ? "swap-horizontal" : "add-circle"} 
              size={16} 
              color="#3b82f6" 
            />
            <Text className="text-blue-500 text-sm ml-1">
              {selectedMedia.length > 0 
                ? 'Change or add more media' 
                : 'Select media to get started'}
            </Text>
          </TouchableOpacity>
        </View>

        <TextInput
          value={caption}
          onChangeText={setCaption}
          placeholder={
            postType === 'reel' ? "Add a caption for your reel..." :
            postType === 'story' ? "Add a caption for your story..." :
            "Write a caption..."
          }
          placeholderTextColor="#666"
          multiline
          className="p-3 bg-gray-50 text-black rounded-xl border border-gray-200"
          style={{ minHeight: 100 }}
        />

        <TouchableOpacity 
          onPress={createContent} 
          disabled={loading || selectedMedia.length === 0}
          className={`mt-4 p-3 rounded-xl items-center ${
            loading || selectedMedia.length === 0 ? 'bg-blue-300' : 'bg-blue-500'
          } shadow-sm`}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text className="text-white font-semibold text-lg">
              {selectedMedia.length > 0 ? 
                (postType === 'story' ? 'Share Story' : 
                 postType === 'reel' ? 'Share Reel' : 
                 `Share ${selectedMedia.length} ${selectedMedia.length > 1 ? 'Posts' : 'Post'}`) : 
                `Select media to ${postType}`}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
