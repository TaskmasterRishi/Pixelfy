import React, { useEffect, useState, useRef } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  StyleSheet,
  TouchableWithoutFeedback,
} from "react-native";
import { supabase } from "~/lib/supabase";
import BottomSheet from '@gorhom/bottom-sheet';

interface SimpleBottomSheetProps {
  isVisible: boolean;
  onClose: () => void;
  postId: string | null;
}

const SimpleBottomSheet: React.FC<SimpleBottomSheetProps> = ({
  isVisible,
  onClose,
  postId,
}) => {
  const [likes, setLikes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomSheetRef = useRef<BottomSheet>(null);

  const fetchLikes = async () => {
    if (loading || !postId) return; // Prevent duplicate API calls

    setLoading(true);
    console.log("🚀 Fetching likes for post:", postId);

    try {
      const { data, error } = await supabase
        .from("likes")
        .select("id, post_id, user_id, users!likes_user_id_fkey(username, avatar_url)")
        .eq("post_id", postId);

      if (error) {
        console.error("❌ Error fetching likes:", error.message);
        setError("Failed to fetch likes");
        setLikes([]);
      } else {
        console.log("✅ Likes fetched:", data);
        setLikes([...data]);
      }
    } catch (error) {
      console.error("❌ Error fetching likes:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isVisible && postId) {
      fetchLikes();
    }
  }, [isVisible, postId]);

  useEffect(() => {
    if (isVisible) {
      bottomSheetRef.current?.expand();
    } else {
      bottomSheetRef.current?.close();
    }
  }, [isVisible]);

  useEffect(() => {
    console.log("Sheet visibility changed: ", isVisible);
  }, [isVisible]);

  const LikesList = ({ likes, loading }) => {
    console.log("🎯 Likes data received:", likes);

    if (loading) {
      return <Text style={{ fontSize: 20, color: "blue" }}>⏳ Loading...</Text>;
    }

    if (!likes || likes.length === 0) {
      return <Text style={{ fontSize: 20, color: "red" }}>⚠️ No likes yet!</Text>;
    }

    return (
      <View>
        {likes.map((like, index) => (
          <Text key={index} style={{ fontSize: 20, color: "green" }}>
            {like.users.username}
          </Text>
        ))}
      </View>
    );
  };

  console.log("🔄 Rendering Likes Component: isVisible =", isVisible, "Likes =", likes);

  return isVisible ? (
    <BottomSheet
      isVisible={isVisible}
      onClose={onClose}
      snapPoints={['40%', '80%']}
      enablePanDownToClose
    >
      <TouchableWithoutFeedback onPress={(event) => event.stopPropagation()}>
        <View style={styles.content}>
          <Text style={styles.title}>Liked by</Text>
          <LikesList likes={likes} loading={loading} />
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={{ color: "red", fontSize: 16 }}>Close</Text>
          </TouchableOpacity>
        </View>
      </TouchableWithoutFeedback>
    </BottomSheet>
  ) : (
    <Text>Sheet Hidden</Text>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  content: {
    backgroundColor: "white",
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    minHeight: 200,
    maxHeight: "80%",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  emptyText: {
    textAlign: "center",
    fontSize: 16,
    color: "gray",
  },
  errorText: {
    textAlign: "center",
    fontSize: 16,
    color: "red",
  },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  username: {
    fontSize: 16,
    fontWeight: "500",
  },
  closeButton: {
    marginTop: 10,
    alignSelf: "center",
  },
});

export default SimpleBottomSheet;
