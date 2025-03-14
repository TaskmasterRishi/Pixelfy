import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs>
      {/* Your other tabs */}
      <Tabs.Screen
        name="notification"
        options={{
          title: 'Notifications',
          tabBarIcon: ({ color }) => (
            <FontAwesome name="bell" size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
} 