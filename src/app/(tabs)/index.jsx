import { FlatList } from "react-native";
import posts from "../../../assets/data/post.json";
import PostListItem from "~/src/Components/PostListItem";

export default function FeedScreen() {
  return (
    <>
      <FlatList
        data={posts}
        className="flex "
        renderItem={({ item }) => <PostListItem post={item} />}
        contentContainerStyle={{gap:10, maxWidth: 512, width: "100%"}}
        showsVerticalScrollIndicator={false}
      />
    </>
  );
}
