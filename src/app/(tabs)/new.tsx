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
  const [media, setMedia] = useState(null);
  const [loading, setLoading] = useState(false);
  const [postType, setPostType] = useState('post'); // 'post', 'story', or 'reel'
  const { session } = useAuth();
  const [selectedMedia, setSelectedMedia] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const pickMedia = async (type = 'image') => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        alert('Sorry, we need camera roll permissions to make this work!');
        return;
      }

      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: type === 'video' ? ImagePicker.MediaTypeOptions.Videos : ImagePicker.MediaTypeOptions.Images,
        quality: 0.7,
        allowsEditing: true,
        allowsMultipleSelection: true,
        selectionLimit: 3
      });

      if (!result.canceled && result.assets?.length > 0) {
        setSelectedMedia(result.assets);
        setMedia(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Media picker error:', error);
      alert('Failed to select media. Please try again.');
      setLoading(false);
    }
  };

  const createContent = async () => {
    if (selectedMedia.length === 0) {
      alert("Please select media first.");
      return;
    }

    setLoading(true);

    try {
      if (!session || !session.user) {
        throw new Error("No active session found");
      }

      const uploadPromises = selectedMedia.map(async (media) => {
        const uploadedMedia = await uploadImage(media.uri);
        if (!uploadedMedia) {
          throw new Error("Media upload failed");
        }
        return uploadedMedia;
      });

      const uploadedMediaUrls = await Promise.all(uploadPromises);

      const table = postType === 'story' ? 'stories' : postType === 'reel' ? 'reels' : 'posts';
      
      const contentData = uploadedMediaUrls.map((mediaUrl) => ({
        user_id: session.user.id,
        created_at: new Date().toISOString(),
        media_url: mediaUrl,
        caption: caption,
        ...(postType === 'post' && { media_type: mediaUrl.includes('video') ? 'video' : 'image' })
      }));

      const { error } = await supabase
        .from(table)
        .insert(contentData);

      if (error) {
        throw error;
      }

      router.push("/(tabs)?refresh=true");
    } catch (error) {
      alert(`Error creating ${postType}: ` + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-white">
      {/* Media Selection Section */}
      <View className="flex-row justify-around p-4 border-b border-gray-200">
        <TouchableOpacity 
          onPress={() => setPostType('post')}
          className={`p-2 ${postType === 'post' ? 'border-b-2 border-blue-500' : ''}`}
        >
          <Text className={`text-lg ${postType === 'post' ? 'font-bold text-blue-500' : 'text-gray-500'}`}>Post</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={() => setPostType('story')}
          className={`p-2 ${postType === 'story' ? 'border-b-2 border-blue-500' : ''}`}
        >
          <Text className={`text-lg ${postType === 'story' ? 'font-bold text-blue-500' : 'text-gray-500'}`}>Story</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={() => setPostType('reel')}
          className={`p-2 ${postType === 'reel' ? 'border-b-2 border-blue-500' : ''}`}
        >
          <Text className={`text-lg ${postType === 'reel' ? 'font-bold text-blue-500' : 'text-gray-500'}`}>Reel</Text>
        </TouchableOpacity>
      </View>

      {/* Media Preview Section */}
      <View className="flex-1 bg-white">
        {loading ? (
          <ActivityIndicator size="large" color="#000" className="flex-1 justify-center" />
        ) : selectedMedia.length > 0 ? (
          <View className="flex-1">
            <Image
              source={{ uri: selectedMedia[currentIndex].uri }}
              className="w-full h-full"
              resizeMode="contain"
            />
            
            {/* Media Indicator Dots */}
            <View className="absolute bottom-4 w-full flex-row justify-center space-x-2">
              {selectedMedia.map((_, index) => (
                <View
                  key={index}
                  className={`w-2 h-2 rounded-full ${index === currentIndex ? 'bg-black' : 'bg-gray-300'}`}
                />
              ))}
            </View>

            {/* Navigation Arrows */}
            {selectedMedia.length > 1 && (
              <>
                <TouchableOpacity
                  onPress={() => setCurrentIndex(prev => (prev > 0 ? prev - 1 : prev))}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/80 rounded-full border border-gray-200"
                >
                  <Ionicons name="chevron-back" size={24} color="black" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setCurrentIndex(prev => (prev < selectedMedia.length - 1 ? prev + 1 : prev))}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/80 rounded-full border border-gray-200"
                >
                  <Ionicons name="chevron-forward" size={24} color="black" />
                </TouchableOpacity>
              </>
            )}
          </View>
        ) : (
          <TouchableOpacity 
            onPress={() => pickMedia(postType === 'reel' ? 'video' : 'image')} 
            className="flex-1 justify-center items-center"
          >
            <Ionicons name={postType === 'reel' ? "videocam-outline" : "image-outline"} size={64} color="#666" className="mb-4" />
            <Text className="text-gray-600 text-lg font-medium">
              Tap to select {postType === 'reel' ? 'a video' : 'an image'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Content Creation Section */}
      <View className="p-4 bg-white border-t border-gray-200">
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
          className="p-3 bg-gray-50 text-black rounded-xl"
          style={{ minHeight: 80 }}
        />

        <TouchableOpacity 
          onPress={createContent} 
          disabled={loading || selectedMedia.length === 0}
          className={`mt-4 p-3 rounded-xl items-center ${loading || selectedMedia.length === 0 ? 'bg-blue-300' : 'bg-blue-500'}`}
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
