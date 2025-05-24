import { Colors } from "@/constants/Colors";
import { useAuth } from "@/provider/AuthProvider";
import { supabase } from "@/utils/supabase";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { Text } from "@rneui/themed";
import { decode } from "base64-arraybuffer";
import * as FileSystem from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  Dimensions,
} from "react-native";

const { width } = Dimensions.get("window");

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
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.headerBackground}>
        <View style={styles.headerContent}>
          <View style={styles.avatarContainer}>
            <TouchableOpacity
              onPress={onSelectImage}
              style={styles.avatarTouchable}
            >
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Ionicons
                    name="person"
                    size={60}
                    color="rgba(255,255,255,0.8)"
                  />
                </View>
              )}
              <View style={styles.cameraOverlay}>
                <Ionicons name="camera" size={16} color="#fff" />
              </View>
            </TouchableOpacity>
          </View>

          <Text style={styles.userName}>
            {user.email?.split("@")[0] || "User"}
          </Text>
          <Text style={styles.userEmail}>{user.email}</Text>

          <View
            style={[
              styles.roleBadge,
              isAdmin && styles.adminBadge,
              !isAdmin && styles.userBadge,
            ]}
          >
            <MaterialIcons
              name={isAdmin ? "admin-panel-settings" : "person"}
              size={24}
              color={isAdmin ? "#ff9800" : "#666"}
            />
            <Text style={[styles.roleText, isAdmin && styles.adminRoleText]}>
              {isAdmin ? "Administrator" : "User"}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.statsCard}>
        <View style={styles.statItem}>
          <View style={styles.statIconContainer}>
            <Ionicons name="flag" size={24} color={Colors.light.primaryColor} />
          </View>
          <View style={styles.statContent}>
            <Text style={styles.statNumber}>
              {issueCount ?? (
                <ActivityIndicator
                  size="small"
                  color={Colors.light.primaryColor}
                />
              )}
            </Text>
            <Text style={styles.statLabel}>Issues Reported</Text>
          </View>
        </View>

        <View style={styles.statDivider} />

        <View style={styles.statItem}>
          <View style={styles.statIconContainer}>
            <Ionicons name="time" size={24} color="#4caf50" />
          </View>
          <View style={styles.statContent}>
            <Text style={styles.statNumber}>
              {user.last_sign_in_at
                ? new Date(user.last_sign_in_at).toLocaleDateString("en-GB", {
                    year: "numeric",
                    month: "numeric",
                    day: "numeric",
                  })
                : "N/A"}
            </Text>
            <Text style={styles.statLabel}>Last Active</Text>
          </View>
        </View>
      </View>

      {/* Account Details Card */}
      <View style={styles.detailsCard}>
        <Text style={styles.cardTitle}>Account Details</Text>

        <View style={styles.detailItem}>
          <View style={styles.detailIconContainer}>
            <Ionicons name="mail" size={20} color="#666" />
          </View>
          <View style={styles.detailContent}>
            <Text style={styles.detailLabel}>Email Address</Text>
            <Text style={styles.detailValue}>{user.email}</Text>
          </View>
        </View>

        <View style={styles.detailDivider} />

        <View style={styles.detailItem}>
          <View style={styles.detailIconContainer}>
            <Ionicons name="calendar" size={20} color="#666" />
          </View>
          <View style={styles.detailContent}>
            <Text style={styles.detailLabel}>Member Since</Text>
            <Text style={styles.detailValue}>
              {user.created_at
                ? new Date(user.created_at).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })
                : "N/A"}
            </Text>
          </View>
        </View>

        <View style={styles.detailDivider} />

        <View style={styles.detailItem}>
          <View style={styles.detailIconContainer}>
            <Ionicons name="shield-checkmark" size={20} color="#666" />
          </View>
          <View style={styles.detailContent}>
            <Text style={styles.detailLabel}>Account Status</Text>
            <View style={styles.statusContainer}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>Active</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        {isAdmin && (
          <TouchableOpacity
            style={styles.adminButton}
            onPress={() => router.push("/admin")}
          >
            <View style={styles.buttonContent}>
              <MaterialIcons
                name="admin-panel-settings"
                size={24}
                color="#fff"
              />
              <View style={styles.buttonTextContainer}>
                <Text style={styles.buttonTitle}>Admin Dashboard</Text>
                <Text style={{ color: "#fff", fontSize: 12 }}>
                  Manage issues and users
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color="rgba(255,255,255,0.7)"
              />
            </View>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.signOutButton}
          onPress={() => supabase.auth.signOut()}
        >
          <View style={styles.buttonContent}>
            <Ionicons name="log-out" size={24} color="#ff4757" />
            <View style={styles.buttonTextContainer}>
              <Text style={[styles.buttonTitle, { color: "#ff4757" }]}>
                Sign Out
              </Text>
              <Text style={styles.buttonSubtitle}>Log out of your account</Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>

      {/* Bottom Spacing */}
      <View style={styles.bottomSpacing} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
  },

  // Header Section
  headerBackground: {
    backgroundColor: Colors.light.primaryColor,
    paddingTop: 24,
    paddingBottom: 40,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    marginBottom: 20,
  },
  headerContent: {
    alignItems: "center",
  },

  // Avatar Section
  avatarContainer: {
    marginBottom: 20,
  },
  avatarTouchable: {
    position: "relative",
  },
  avatarImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: "rgba(255,255,255,0.3)",
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: "rgba(255,255,255,0.3)",
  },
  cameraOverlay: {
    position: "absolute",
    bottom: 5,
    right: 5,
    backgroundColor: "rgba(0,0,0,0.7)",
    borderRadius: 15,
    padding: 6,
  },

  // User Info
  userName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
    marginBottom: 4,
    textAlign: "center",
  },
  userEmail: {
    fontSize: 16,
    color: "rgba(255,255,255,0.8)",
    marginBottom: 16,
    textAlign: "center",
  },

  // Role Badge
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  userBadge: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.5)",
  },
  adminBadge: {
    backgroundColor: "rgba(255, 152, 0, 0.2)",
    borderWidth: 2,
    borderColor: "#ff9800",
  },
  roleText: {
    fontSize: 16,
    color: "rgba(255,255,255,0.9)",
    fontWeight: "bold",
  },
  adminRoleText: {
    color: "#ff9800",
    fontWeight: "bold",
    fontSize: 16,
  },

  // Stats Card
  statsCard: {
    backgroundColor: "white",
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
    flexDirection: "row",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  statItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#f8f9fa",
    justifyContent: "center",
    alignItems: "center",
  },
  statContent: {
    flex: 1,
  },
  statNumber: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
  },
  statDivider: {
    width: 1,
    backgroundColor: "#e9ecef",
    marginHorizontal: 16,
  },

  // Details Card
  detailsCard: {
    backgroundColor: "white",
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    gap: 16,
  },
  detailIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f8f9fa",
    justifyContent: "center",
    alignItems: "center",
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
  detailDivider: {
    height: 1,
    backgroundColor: "#f1f3f4",
    marginLeft: 56,
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#4caf50",
  },
  statusText: {
    fontSize: 16,
    color: "#4caf50",
    fontWeight: "500",
  },

  // Action Buttons
  actionsContainer: {
    paddingHorizontal: 20,
    gap: 12,
  },
  adminButton: {
    backgroundColor: "#168676",
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  settingsButton: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  signOutButton: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#ffebee",
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  buttonTextContainer: {
    flex: 1,
  },
  buttonTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
    marginBottom: 2,
  },
  buttonSubtitle: {
    fontSize: 12,
    color: "black",
  },

  // Bottom spacing
  bottomSpacing: {
    height: 40,
  },
});
