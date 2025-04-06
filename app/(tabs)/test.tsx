import ParallaxScrollView from "@/components/ParallaxScrollView";
import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { supabase } from "@/utils/supabase";
import { Link, useRouter } from "expo-router";
import { Button } from "react-native";

export default function TestScreen() {
  const router = useRouter();

  const signOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };
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
      <ThemedText>Test.</ThemedText>
      <Button title="Signout" onPress={signOut} />
      <Link href={"/explore"}>Go to Explore</Link>
    </ParallaxScrollView>
  );
}
