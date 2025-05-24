import { Colors } from "@/constants/Colors";
import { useAuth } from "@/provider/AuthProvider";
import { supabase } from "@/utils/supabase";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { Button, Text } from "@rneui/themed";
import { decode } from "base64-arraybuffer";
import * as FileSystem from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

export default function ProfileScreen() {
  const { user, isAdmin } = useAuth();
  const [issueCount, setIssueCount] = useState<number | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!user) return;

    loadAvatarUrl();
    fetchIssueCount();
  }, [user]);

  const loadAvatarUrl = async () => {
    if (!user?.id) return;
    const { data, error } = await supabase.storage
      .from("avatars")
      .createSignedUrl(`${user.id}/avatar.png`, 60 * 60);

    if (data?.signedUrl) {
      setAvatarUrl(data.signedUrl);
    } else {
      console.error("Error loading avatar URL:", error);
      setAvatarUrl(null);
    }
  };

  async function fetchIssueCount() {
    if (!user?.id) {
      console.warn("User ID not available to fetch issue count.");
      setIssueCount(null);
      return;
    }

    try {
      const { count, error } = await supabase
        .from("issues")
        .select("*", { count: "exact", head: true })
        .eq("owner_id", user.id);

      if (error) {
        console.error("Error fetching issue count:", error);
        setIssueCount(null);
      } else {
        setIssueCount(count ?? 0);
      }
    } catch (error) {
      console.error("Error fetching issue count:", error);
      setIssueCount(null);
    }
  }

  const onSelectImage = async () => {
    const options: ImagePicker.ImagePickerOptions = {
      mediaTypes: "images",
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    };

    const result = await ImagePicker.launchImageLibraryAsync(options);

    if (!result.canceled) {
      const img = result.assets[0];
      const base64 = await FileSystem.readAsStringAsync(img.uri, {
        encoding: "base64",
      });
      const filePath = `${user!.id}/avatar.png`;
      const contentType = "image/png";
      const { error } = await supabase.storage
        .from("avatars")
        .upload(filePath, decode(base64), { contentType, upsert: true });

      if (error) {
        console.error("Error uploading avatar:", error);
      } else {
        loadAvatarUrl();
      }
    }
  };

  if (!user) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.light.tint} />
        <Text>Loading profile...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.avatarContainer}>
        <TouchableOpacity onPress={onSelectImage}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person-circle-outline" size={80} color="#fff" />
            </View>
          )}

          <View style={styles.changeAvatarOverlay}>
            <Ionicons name="camera" size={24} color="#fff" />
          </View>
        </TouchableOpacity>
      </View>

      <Text h4 style={styles.userName}>
        {user.email}
      </Text>

      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>
            Issues Reported @{" "}
            <Text style={{ fontWeight: "bold", color: "white" }}>UpKeep</Text>
          </Text>

          <Text style={styles.statNumber}>
            {issueCount ?? <ActivityIndicator size="small" color="#fff" />}
          </Text>
        </View>
      </View>

      <View style={styles.userInfoSection}>
        <View style={styles.userInfoRow}>
          <Ionicons
            name="mail-outline"
            size={20}
            color="#555"
            style={styles.userInfoIcon}
          />
          <View style={styles.userInfoTextContainer}>
            <Text style={styles.userInfoLabel}>Email:</Text>
            <Text style={styles.userInfoValue}>{user.email}</Text>
          </View>
        </View>
        <View style={styles.divider} />
        <View style={styles.userInfoRow}>
          <Ionicons
            name="time-outline"
            size={20}
            color="#555"
            style={styles.userInfoIcon}
          />
          <View style={styles.userInfoTextContainer}>
            <Text style={styles.userInfoLabel}>Last signed in:</Text>
            <Text style={styles.userInfoValue}>
              {user.last_sign_in_at
                ? new Date(user.last_sign_in_at).toLocaleString()
                : "N/A"}
            </Text>
          </View>
        </View>
      </View>

      {isAdmin && (
        <Button
          onPress={() => router.push("/admin")}
          containerStyle={styles.adminButtonContainer}
          buttonStyle={styles.adminButton}
          title="Admin Dashboard"
          icon={
            <MaterialIcons
              name="admin-panel-settings"
              size={20}
              color="white"
              style={{ marginRight: 8 }}
            />
          }
        />
      )}

      <Button
        onPress={() => supabase.auth.signOut()}
        containerStyle={styles.signOutButtonContainer}
        buttonStyle={styles.signOutButton}
        title="Sign Out"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    alignItems: "center",
    backgroundColor: "#f0f0f0",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 20,
  },
  avatarImage: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 3,
    borderColor: Colors.light.tint,
  },
  avatarPlaceholder: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: Colors.light.primaryColor,
    justifyContent: "center",
    alignItems: "center",
  },
  changeAvatarOverlay: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 20,
    padding: 8,
  },
  userName: {
    marginBottom: 20,
    fontWeight: "bold",
    color: "#333",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginBottom: 30,
  },
  statBox: {
    backgroundColor: Colors.light.primaryColor,
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    minWidth: 150,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
  },
  statLabel: {
    fontSize: 14,
    color: "#eee",
    marginTop: 5,
  },
  userInfoSection: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    width: "100%",
    marginBottom: 30,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  userInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
  },
  userInfoIcon: {
    marginRight: 15,
  },
  userInfoTextContainer: {
    flex: 1,
  },
  userInfoLabel: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 2,
  },
  userInfoValue: {
    fontSize: 16,
    color: "#555",
  },
  divider: {
    height: 1,
    backgroundColor: "#eee",
    marginVertical: 8,
    marginLeft: 35,
  },
  adminButtonContainer: {
    width: "100%",
    marginVertical: 10,
  },
  adminButton: {
    backgroundColor: Colors.light.primaryColor,
    borderRadius: 10,
    paddingVertical: 12,
  },
  signOutButtonContainer: {
    width: "100%",
    marginVertical: 10,
  },
  signOutButton: {
    backgroundColor: "red",
    borderRadius: 10,
    paddingVertical: 12,
  },
});
