import { View, Text } from 'react-native';
import React, { useEffect } from 'react';
import { Redirect, useRouter } from 'expo-router';

const index = () => {
  return <Redirect href={'/(chat)/(tabs)'} />;
}

export default index;