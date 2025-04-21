import { Stack, Slot } from 'expo-router';

export default function ChannelStack() {
  return (
    <Slot screenOptions={{ headerShown: false }}>
      {/* Add your channel screens here */}
    </Slot>
  );
}
