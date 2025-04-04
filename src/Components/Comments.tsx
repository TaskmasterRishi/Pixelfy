import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, FlatList, ActivityIndicator, Image } from "react-native";
import { supabase } from "~/lib/supabase";
import { StyleSheet } from "react-native";
import { useAuth } from "~/providers/AuthProvider";
import { formatDistanceToNow } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';

interface Comment {
  id: string;
  user_id: string;
  post_id: string;
  content: string;
  created_at: string;
  users?: {
    username: string;
    avatar_url: string;
  } | null;
}

interface CommentsProps {
  postId: string;
  isVisible: boolean;
  onClose: () => void;
  onCommentChange?: () => void;
}

const Comments: React.FC<CommentsProps> = ({ postId, isVisible, onClose, onCommentChange }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (isVisible) {
      fetchComments();
    }
  }, [isVisible, postId]);

  useEffect(() => {
    const subscription = supabase
      .channel('comments')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'comments' },
        (payload) => {
          const newComment: Comment = {
            id: payload.new.id,
            user_id: payload.new.user_id,
            post_id: payload.new.post_id,
            content: payload.new.content,
            created_at: payload.new.created_at,
            users: payload.new.users || [],
          };
          setComments((prevComments) => [newComment, ...prevComments]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [postId]);

  const fetchComments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          id,
          user_id,
          post_id,
          content,
          created_at,
          users:user_id (
            username,
            avatar_url
          )
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setComments(data || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCommentCount = async (postId: string): Promise<number> => {
    try {
      const { count, error } = await supabase
        .from('comments')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', postId);

      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('Error fetching comment count:', error);
      return 0;
    }
  };

  const handleAddComment = async () => {
    if (!user || !newComment?.trim()) {
      console.warn("Comment cannot be empty");
      return;
    }

    try {
      // Insert the new comment
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

      // Fetch the user data for the newly inserted comment
      if (insertedComment) {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('username, avatar_url')
          .eq('id', insertedComment.user_id)
          .single();

        if (userError) throw userError;

        // Combine the comment with the user data
        const newCommentWithUser = {
          ...insertedComment,
          users: userData,
        };

        // Update the comments state
        setComments((prevComments) => [newCommentWithUser, ...prevComments]);
      }

      // Clear the input field
      setNewComment("");

      // Trigger the callback to refresh the comment count
      if (onCommentChange) onCommentChange();
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      const { data, error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;

      setComments((prevComments) => prevComments.filter((comment) => comment.id !== commentId));

      // Trigger the callback to refresh the comment count
      if (onCommentChange) onCommentChange();
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  if (!isVisible) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Comments</Text>
        <TouchableOpacity onPress={onClose}>
          <Ionicons name="close" size={24} color="black" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <FlatList
          data={comments}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.commentContainer}>
              <Image
                source={{ uri: item.users?.avatar_url || 'https://your-default-avatar-url.com/default.png' }}
                style={styles.avatar}
              />
              <View style={styles.commentContent}>
                <Text style={styles.username}>{item.users?.username || "Anonymous"}</Text>
                <Text style={styles.commentText}>{item.content}</Text>
                <Text style={styles.timestamp}>
                  {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                </Text>
              </View>
              {item.user_id === user?.id && (
                <TouchableOpacity onPress={() => handleDeleteComment(item.id)}>
                  <Ionicons name="trash" size={20} color="#FF0000" />
                </TouchableOpacity>
              )}
            </View>
          )}
        />
      )}

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={newComment}
          onChangeText={setNewComment}
          placeholder="Add a comment..."
          multiline
        />
        <TouchableOpacity
          style={styles.sendButton}
          onPress={handleAddComment}
          disabled={!newComment.trim()}
        >
          <Ionicons
            name="send"
            size={24}
            color={newComment.trim() ? "#007AFF" : "#999"}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  commentContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 8,
  },
  commentContent: {
    flex: 1,
  },
  username: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  commentText: {
    fontSize: 14,
    marginBottom: 4,
  },
  timestamp: {
    fontSize: 12,
    color: '#666',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#ccc',
    paddingTop: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 8,
    marginRight: 8,
  },
  sendButton: {
    padding: 8,
  },
});

export default Comments;
