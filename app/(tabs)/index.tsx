import Auth from "@/components/Auth";
import { supabase } from "@/utils/supabase";
import { Session } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { Button, StyleSheet, View } from "react-native";
import TestScreen from "./test";
import ParallaxScrollView from "@/components/ParallaxScrollView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { ThemedText } from "@/components/ThemedText";
import { Link } from "expo-router";

export default function HomeScreen() {
  const [session, setSession] = useState<Session | null>(null);
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });
    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    console.log("Session2: ", session);
  }, []);

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: "#D0D0D0", dark: "#353636" }}
      headerImage={
        <IconSymbol
          size={310}
          color="#808080"
          name="chevron.left.forwardslash.chevron.right"
        />
      }
    >
      {session && session.user ? (
        <View>
          <ThemedText>Test..</ThemedText>
          <Button
            title="Signout"
            onPress={async () => {
              await supabase.auth.signOut();
            }}
          />
          <Link href={"/explore"}>Go to Explore</Link>
        </View>
      ) : (
        <Auth />
      )}
    </ParallaxScrollView>
  );
}
