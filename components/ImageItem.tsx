import { supabase } from "@/utils/supabase";
import { Ionicons } from "@expo/vector-icons";
import { FileObject } from "@supabase/storage-js";
import { useState } from "react";
import { Image, StyleSheet, TouchableOpacity, View } from "react-native";

const ImageItem = ({
  item,
  userId,
  onRemoveImage,
}: {
  item: FileObject;
  userId: string;
  onRemoveImage: () => void;
}) => {
  const [image, setImage] = useState<string>("");

  supabase.storage
    .from("avatars")
    .download(`${userId}/${item.name}`)
    .then(({ data }) => {
      const fr = new FileReader();
      fr.readAsDataURL(data!);
      fr.onload = () => {
        setImage(fr.result as string);
      };
    });

  return (
    <View
      style={{ flexDirection: "row", margin: 1, alignItems: "center", gap: 5 }}
    >
      {image ? (
        <Image style={styles.avatarImage} source={{ uri: image }} />
      ) : (
        <View style={{ width: 80, height: 80, backgroundColor: "#1A1A1A" }} />
      )}

      <TouchableOpacity onPress={onRemoveImage}>
        <Ionicons name="trash-outline" size={20} color={"#fff"} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  avatarImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 16,
  },
});

export default ImageItem;
