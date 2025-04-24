import { ThemedText } from "@/components/ThemedText";
import ThemedCard from "@rneui/themed/dist/Card";
import { View } from "react-native";

export default function IssuesScreen() {
  return (
    <View>
      <ThemedCard>
        <ThemedText>Issue1</ThemedText>
      </ThemedCard>
      <ThemedCard>
        <ThemedText>Issue 2</ThemedText>
      </ThemedCard>
    </View>
  );
}
