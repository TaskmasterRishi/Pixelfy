import { useEffect } from 'react';
import { useRouter } from 'expo-router'; // Import useRouter hook
import { useAuth } from '~/src/providers/AuthProvider';
import { Stack } from 'expo-router';

export default function AuthLayout() {
  const { isAuthenticated } = useAuth();
  const router = useRouter(); // Initialize the router

  useEffect(() => {
    if (isAuthenticated) {
      // Redirect using the router object when authenticated
      router.push('/(tabs)'); // Use router.push for redirection
    }
  }, [isAuthenticated, router]); // Ensure router is included as a dependency

  return <Stack />;
}
