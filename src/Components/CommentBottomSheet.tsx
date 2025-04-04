import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import BottomSheet, { BottomSheetFlatList } from '@gorhom/bottom-sheet';
import { supabase } from '~/lib/supabase';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '~/providers/AuthProvider';
import { Ionicons } from '@expo/vector-icons';
import FontAwesome from '@expo/vector-icons/FontAwesome';
interface Comment {
  id: string;
  users: {
    username: string;
    avatar_url: string;
  };
  content: string;
  created_at: string;
}

interface CommentBottomSheetProps {
  postId: string;
  sheetRef: React.RefObject<BottomSheet>;
  visible: boolean;
  onClose: () => void;
}

export default function CommentBottomSheet({ 
  postId, 
  sheetRef, 
  visible,
  onClose 
}: CommentBottomSheetProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newComment, setNewComment] = useState("");
  const { user } = useAuth();
  const [selectedCommentId, setSelectedCommentId] = useState<string | null>(null);
  const [commentPosition, setCommentPosition] = useState({ x: 0, y: 0 });

  const fetchComments = async (postId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("comments")
        .select(`
          id,
          content,
          created_at,
          user_id,
          users:user_id (
            username,
            avatar_url
          )
        `)
        .eq("post_id", postId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching comments:", error.message);
        setError("Failed to fetch comments");
        setComments([]);
      } else {
        const transformedData = data.map(comment => ({
          id: comment.id,
          user_id: comment.user_id,
          users: {
            username: comment.users.username,
            avatar_url: comment.users.avatar_url
          },
          content: comment.content,
          created_at: comment.created_at
        }));
        setComments(transformedData);
      }
    } catch (error) {
      console.error("Error fetching comments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!user || !newComment?.trim()) {
      console.warn("Comment cannot be empty");
      return;
    }

    try {
      const { data: insertedComment, error: insertError } = await supabase
        .from('comments')
        .insert({
          user_id: user.id,
          post_id: postId,
          content: newComment.trim(),
        })
        .select('*')
        .single();

      if (insertError) throw insertError;

      if (insertedComment) {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('username, avatar_url')
          .eq('id', insertedComment.user_id)
          .single();

        if (userError) throw userError;

        const newCommentWithUser = {
          ...insertedComment,
          users: userData,
        };

        setComments((prevComments) => [newCommentWithUser, ...prevComments]);
        setNewComment("");
      }
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId);

      if (error) {
        console.error('Supabase delete error:', error);
        throw error;
      }
      
      setComments(prev => {
        const newComments = prev.filter(comment => comment.id !== commentId);
        return newComments;
      });
      
      setSelectedCommentId(null);
    } catch (error) {
      console.error('Error deleting comment:', error);
      setError('Failed to delete comment. Please try again.');
    }
  };

  const handleOutsidePress = () => {
    setSelectedCommentId(null);
  };

  const handleLongPress = (item: Comment, event: any) => {
    const { pageX, pageY } = event.nativeEvent;
    setSelectedCommentId(item.id);
    setCommentPosition({
      x: pageX,
      y: pageY
    });
  };

  const selectedComment = comments.find(comment => comment.id === selectedCommentId);

  React.useEffect(() => {
    if (postId) {
      fetchComments(postId);
    }
  }, [postId]);

  React.useEffect(() => {
    if (visible) {
      sheetRef.current?.snapToIndex(0);
    } else {
      sheetRef.current?.close();
    }
  }, [visible]);

  return (
    <BottomSheet
      ref={sheetRef}
      snapPoints={['90%', '90%']}
      index={0}
      enableDynamicSizing={false}
      enablePanDownToClose={true}
      onChange={(index) => {
        if (index === -1) {
          onClose();
        }
      }}
      onClose={onClose}
      backgroundComponent={() => (
        <View className="bg-gray-100 flex-1 rounded-t-2xl" />
      )}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.select({ ios: 100, android: 0 })}
      >
        <View className="flex-1 bg-gray-100 rounded-t-2xl">
          {selectedCommentId && (
            <View className="absolute inset-0 z-10">
              <TouchableOpacity
                className="absolute inset-0"
                activeOpacity={1}
                onPress={handleOutsidePress}
              />
              <View
                className="absolute bg-white p-2 rounded-lg shadow-lg"
                style={{
                  top: commentPosition.y - 150,
                  left: commentPosition.x - 40,
                  zIndex: 20,
                  minWidth: 100
                }}
              >
                {user?.id === selectedComment?.user_id ? (
                  <TouchableOpacity
                    className="flex-row items-center px-3 py-2"
                    onPress={async () => {
                      try {
                        await handleDeleteComment(selectedCommentId);
                        setSelectedCommentId(null);
                      } catch (error) {
                        console.error('Error during deletion:', error);
                      }
                    }}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="trash" size={16} color="red" />
                    <Text className="text-red-500 ml-2">Delete</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    className="flex-row items-center px-3 py-2"
                    onPress={async () => {
                      console.log('Report button pressed');
                      // Add your report logic here
                      setSelectedCommentId(null);
                    }}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="flag" size={16} color="orange" />
                    <Text className="text-orange-500 ml-2">Report</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}

          <View className={`flex-row justify-between items-center p-4 bg-gray-100 border-b border-gray-200 rounded-t-2xl ${
            selectedCommentId ? 'opacity-30' : ''
          }`}>
            <Text className="text-xl font-bold">Comments</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="black" />
            </TouchableOpacity>
          </View>

          <BottomSheetFlatList
            data={comments}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => {
              const commentDate = item.created_at ? new Date(item.created_at) : null;
              const timeText = commentDate && !isNaN(commentDate.getTime()) 
                ? formatDistanceToNow(commentDate, { addSuffix: true })
                : 'Recently';

              return (
                <TouchableOpacity
                  onLongPress={(e) => handleLongPress(item, e)}
                  activeOpacity={0.8}
                  delayLongPress={500}
                >
                  <View className="flex-row items-start p-3 bg-gray-100 border-b border-gray-200">
                    {item.users.avatar_url ? (
                      <Image
                        source={{ uri: item.users.avatar_url }}
                        className="w-10 h-10 rounded-full mr-3"
                      />
                    ) : (
                      <View className="w-10 h-10 rounded-full mr-3 bg-gray-300 justify-center items-center">
                        <FontAwesome name="user" size={24} color="gray" />
                      </View>
                    )}
                    <View className="flex-1">
                      <Text className="font-bold">{item.users.username}</Text>
                      <Text className="text-sm">{item.content}</Text>
                      <Text className="text-xs text-gray-500">{timeText}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            }}
            contentContainerStyle={{ paddingBottom: 100 }}
            ListEmptyComponent={
              <View className={`flex-1 justify-center items-center bg-gray-100 ${
                selectedCommentId ? 'opacity-30' : ''
              }`}>
                <Text>{loading ? 'Loading...' : 'No comments yet'}</Text>
              </View>
            }
            className="flex-1 bg-gray-200"
          />

          <View className={`flex-row items-center p-4 bg-gray-100 border-t border-gray-200 ${
            selectedCommentId ? 'opacity-30' : ''
          }`}>
            <TextInput
              className="flex-1 border border-gray-100 rounded-lg px-4 py-2 mr-2 bg-white"
              value={newComment}
              onChangeText={setNewComment}
              placeholder="Add a comment..."
              multiline
              returnKeyType="send"
              onSubmitEditing={handleAddComment}
              editable={!selectedCommentId}
            />
            <TouchableOpacity
              className="p-2"
              onPress={handleAddComment}
              disabled={!newComment.trim() || !!selectedCommentId}
            >
              <Ionicons
                name="send"
                size={24}
                color={newComment.trim() && !selectedCommentId ? "#007AFF" : "#999"}
              />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </BottomSheet>
  );
} 