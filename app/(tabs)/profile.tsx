import { Colors } from "@/constants/Colors";
import { supabase } from "@/utils/supabase";
import { Button, Text } from "@rneui/themed";
import { Session } from "@supabase/supabase-js";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { View } from "react-native";

export default function ProfileScreen() {
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
    <View style={{ alignItems: "center", marginTop: 12 }}>
      <Text>Profile for user: {session?.user.email}</Text>

      <Button
        onPress={() => supabase.auth.signOut()}
        style={{ backgroundColor: Colors.light.primaryColor }}
      >
        Sign out
      </Button>
    </View>
  );
}
