import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';

function PostListItem({ post }) {
  if (!post) {
    return null;
  }

  return (
    <View>
      <Text>{post.username}</Text>
      {/* ... rest of your component code ... */}
    </View>
  );
}

export default PostListItem; 