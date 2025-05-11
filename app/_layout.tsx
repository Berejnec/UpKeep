import { Colors } from "@/constants/Colors";
import { AuthProvider } from "@/provider/AuthProvider";
import { supabase } from "@/utils/supabase";
import { FontAwesome, Ionicons } from "@expo/vector-icons";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Session } from "@supabase/supabase-js";
import { useFonts } from "expo-font";
import { Stack, usePathname, useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useCallback, useEffect, useState } from "react";
import {
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";

SplashScreen.preventAutoHideAsync();

export { ErrorBoundary } from "expo-router";

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === "dark" ? DarkTheme : DefaultTheme;
  const [loaded, error] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  const router = useRouter();
  const [_, setSession] = useState<Session | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      checkSessionAndRedirect(session);
    });
    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      checkSessionAndRedirect(session);
    });
  }, []);

  const path = usePathname();

  const checkSessionAndRedirect = (session: Session | null) => {
    if (session?.user) return;

    if (!session?.user) {
      router.replace("/sign-in");
    }
  };

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync();
  }, [loaded]);

  const getHeaderTitle = useCallback(() => {
    if (!path) return "UpKeep";

    switch (path) {
      case "/issues":
        return "Issues";
      case "/map":
        return "Map";
      case "/profile":
        return "Profile";
      default:
        return "UpKeep";
    }
  }, [path]);

  if (!loaded) {
    return null;
  }

  return (
    <ThemeProvider value={theme}>
      <AuthProvider>
        <Stack>
          <Stack.Screen
            name="(tabs)"
            options={{
              headerShown: true,
              headerTitle: getHeaderTitle(),
              headerTitleAlign: "center",
              headerStyle: {
                backgroundColor: Colors.light.primaryColor,
              },
              headerTintColor: "white",
              headerLeft: () => (
                <TouchableOpacity style={styles.headerButton}>
                  <Ionicons name="menu" size={28} color={theme.colors.card} />
                </TouchableOpacity>
              ),
              headerRight: () => (
                <TouchableOpacity
                  style={styles.headerButton}
                  onPress={() => router.push("/(tabs)/profile")}
                >
                  <FontAwesome
                    name="user-circle-o"
                    size={28}
                    color={theme.colors.card}
                  />
                </TouchableOpacity>
              ),
            }}
          />
          <Stack.Screen name="sign-in" options={{ headerShown: false }} />
          <Stack.Screen name="sign-up" options={{ headerShown: false }} />
          <Stack.Screen
            name="new-issue/index"
            options={{
              title: "Report a new issue",
              headerTitleAlign: "center",
              headerStyle: {
                backgroundColor: Colors.light.primaryColor,
              },
              headerTintColor: theme.colors.card,
              headerLeft: () => (
                <TouchableOpacity
                  style={styles.headerButton}
                  onPress={() => router.back()}
                >
                  <Ionicons
                    name="arrow-back"
                    size={24}
                    color={theme.colors.card}
                  />
                </TouchableOpacity>
              ),
              headerRight: () => <View />,
            }}
          />
          <Stack.Screen
            name="issue-details/[id]"
            options={{
              title: "Issue Details",
              headerTitleAlign: "center",
              headerStyle: {
                backgroundColor: Colors.light.primaryColor,
              },
              headerTintColor: theme.colors.card,
              headerLeft: () => (
                <TouchableOpacity
                  style={styles.headerButton}
                  onPress={() => router.back()}
                >
                  <Ionicons
                    name="arrow-back"
                    size={24}
                    color={theme.colors.card}
                  />
                </TouchableOpacity>
              ),
              headerRight: () => (
                <View
                  style={{ display: "flex", flexDirection: "row", gap: 16 }}
                >
                  <TouchableOpacity style={styles.headerButton}>
                    <FontAwesome
                      name="edit"
                      size={24}
                      color={theme.colors.card}
                    />
                  </TouchableOpacity>
                </View>
              ),
            }}
          />
        </Stack>
      </AuthProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  headerButton: {},
});
