import React from 'react';
import { BottomSheet, ListItem } from '@rneui/themed';

interface LikesBottomSheetProps {
  postId: string;
  isVisible: boolean;
  onClose: () => void;
}

const LikesBottomSheet: React.FunctionComponent<LikesBottomSheetProps> = ({ postId, isVisible, onClose }) => {
  // Static list of likes for testing
  const staticLikes = [
    { id: '1', username: 'User1' },
    { id: '2', username: 'User2' },
    { id: '3', username: 'User3' },
  ];

  return (
    <BottomSheet isVisible={isVisible}>
      {staticLikes.map((user) => (
        <ListItem key={user.id} onPress={onClose}>
          <ListItem.Content>
            <ListItem.Title>{user.username}</ListItem.Title>
          </ListItem.Content>
        </ListItem>
      ))}
      <ListItem onPress={onClose}>
        <ListItem.Content>
          <ListItem.Title style={{ color: 'red' }}>Cancel</ListItem.Title>
        </ListItem.Content>
      </ListItem>
    </BottomSheet>
  );
};

export default LikesBottomSheet;
