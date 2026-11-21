import React from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { LoadingSpinner } from "@/components/feedback/LoadingSpinner";
import { colors } from "@/constants/theme";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 30,
    },
  },
});

function NavigationGuard() {
  const { user, status, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  React.useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === "(auth)";
    const inOnboardingGroup = segments[0] === "(onboarding)";

    if (status === "unauthenticated") {
      if (!inAuthGroup) router.replace("/(auth)/welcome");
    } else if (status === "authenticated" && user) {
      if (!user.onboardingCompleted) {
        if (!inOnboardingGroup) router.replace("/(onboarding)");
      } else if (inAuthGroup || inOnboardingGroup) {
        router.replace("/(tabs)");
      }
    }
  }, [user, status, isLoading, segments, router]);

  if (isLoading) return <LoadingSpinner message="Starting SkillBarter..." />;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(onboarding)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="exchanges/[id]" />
      <Stack.Screen name="exchanges/new" />
      <Stack.Screen name="conversations/[id]" />
      <Stack.Screen name="profiles/[id]" />
      <Stack.Screen name="notifications/index" />
      <Stack.Screen name="settings/index" />
      <Stack.Screen name="community/index" />
      <Stack.Screen name="safety/index" />
      <Stack.Screen name="admin/index" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <StatusBar style="light" backgroundColor={colors.background} />
          <NavigationGuard />
        </AuthProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
