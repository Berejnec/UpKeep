import { ThemedText } from "@/components/ThemedText";
import { supabase } from "@/utils/supabase";
import { Button } from "@rneui/themed";
import { Session } from "@supabase/supabase-js";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";

export default function HomeScreen() {
  const [session, setSession] = useState<Session | null>(null);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });
    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
  }, []);

  return (
    <View style={styles.container}>
      <ThemedText>Home Screen. Hello {session?.user.email}</ThemedText>
      <Button
        onPress={async () => {
          await supabase.auth.signOut();
          router.replace("/sign-in");
        }}
      >
        Sign out
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
