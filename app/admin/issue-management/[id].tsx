import { Colors } from "@/constants/Colors";
import { useAuth } from "@/provider/AuthProvider";
import { formatDateTime } from "@/utils/date";
import { supabase } from "@/utils/supabase";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { Button, Text } from "@rneui/themed";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker } from "react-native-maps";

interface Issue {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  address: string;
  latitude: number;
  longitude: number;
  created_at: string;
  updated_at: string;
  photo_url: string | null;
  owner_id: string;
  admin_notes?: string;
  owner_email?: string;
  owner_role?: string;
}

const AdminIssueManagementScreen = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [issue, setIssue] = useState<Issue | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const { isAdmin } = useAuth();
  const router = useRouter();

  const statusOptions = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"];

  useEffect(() => {
    if (!isAdmin) {
      Alert.alert("Access Denied", "You don't have admin privileges.");
      router.back();
      return;
    }
    fetchIssue();
  }, [id, isAdmin]);

  const fetchIssue = async () => {
    try {
      const { data: issueData, error: issueError } = await supabase
        .from("issues")
        .select("*")
        .eq("id", id)
        .single();

      if (issueError) throw issueError;

      const { data: userData, error: userError } = await supabase
        .from("profiles")
        .select("email, role")
        .eq("id", issueData.owner_id)
        .single();

      if (userError) console.error("Error fetching user data:", userError);

      const issueWithOwner = {
        ...issueData,
        owner_email: userData?.email || "Unknown user",
        owner_role: userData?.role || "USER",
      };

      setIssue(issueWithOwner);
      setNewStatus(issueWithOwner.status);
      setAdminNotes(issueWithOwner.admin_notes || "");
    } catch (error) {
      console.error("Error fetching issue:", error);
      Alert.alert("Error", "Failed to fetch issue details");
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const updateIssue = async () => {
    if (!issue) return;

    setUpdating(true);
    try {
      const { error } = await supabase
        .from("issues")
        .update({
          status: newStatus,
          admin_notes: adminNotes.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", issue.id);

      if (error) throw error;

      Alert.alert("Success", "Issue updated successfully!");
      fetchIssue(); // Refresh the data
    } catch (error) {
      console.error("Error updating issue:", error);
      Alert.alert("Error", "Failed to update issue");
    } finally {
      setUpdating(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "OPEN":
        return "#ff6b6b";
      case "IN_PROGRESS":
        return "#ffa726";
      case "RESOLVED":
        return "#66bb6a";
      case "CLOSED":
        return "#78909c";
      default:
        return "#9e9e9e";
    }
  };

  if (!isAdmin) {
    return (
      <View style={styles.accessDeniedContainer}>
        <MaterialIcons name="block" size={64} color="#ff6b6b" />
        <Text style={styles.accessDeniedText}>Access Denied</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.light.primaryColor} />
          <Text style={styles.loadingText}>Loading issue details...</Text>
        </View>
      </>
    );
  }

  if (!issue) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={64} color="#ff6b6b" />
          <Text style={styles.errorText}>Issue not found</Text>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={"white"} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Issue Management</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Issue Details</Text>

          <View style={styles.detailCard}>
            <Text style={styles.issueTitle}>{issue.title}</Text>
            <Text style={styles.issueDescription}>{issue.description}</Text>

            <View style={styles.detailsGrid}>
              <View style={styles.detailRow}>
                <Text style={styles.label}>Status:</Text>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(issue.status) },
                  ]}
                >
                  <Text style={styles.statusText}>{issue.status}</Text>
                </View>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.label}>Category:</Text>
                <Text style={styles.value}>{issue.category}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.label}>Address:</Text>
                <Text style={styles.value}>{issue.address}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.label}>Reported by:</Text>
                <Text style={styles.value}>
                  {issue.owner_email} ({issue.owner_role})
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.label}>Created:</Text>
                <Text style={styles.value}>
                  {formatDateTime(issue.created_at)}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.label}>Last Updated:</Text>
                <Text style={styles.value}>
                  {formatDateTime(issue.updated_at)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {issue.photo_url && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Photo</Text>
            <Image
              source={{ uri: issue.photo_url }}
              style={styles.issuePhoto}
            />
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location</Text>
          <View style={styles.mapContainer}>
            <MapView
              style={styles.map}
              initialRegion={{
                latitude: issue.latitude,
                longitude: issue.longitude,
                latitudeDelta: 0.005,
                longitudeDelta: 0.005,
              }}
            >
              <Marker
                coordinate={{
                  latitude: issue.latitude,
                  longitude: issue.longitude,
                }}
                title={issue.title}
                description={issue.address}
              />
            </MapView>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Admin Controls</Text>

          <View style={styles.adminCard}>
            <Text style={styles.inputLabel}>Update Status</Text>
            <View style={styles.statusPicker}>
              {statusOptions.map((status) => (
                <TouchableOpacity
                  key={status}
                  style={[
                    styles.statusOption,
                    newStatus === status && styles.selectedStatusOption,
                    { borderColor: getStatusColor(status) },
                  ]}
                  onPress={() => setNewStatus(status)}
                >
                  <Text
                    style={[
                      styles.statusOptionText,
                      newStatus === status && { color: getStatusColor(status) },
                    ]}
                  >
                    {status.replace("_", " ")}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>Admin Notes</Text>
            <TextInput
              style={styles.notesInput}
              value={adminNotes}
              onChangeText={setAdminNotes}
              placeholder="Add notes about this issue (optional)..."
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            <Button
              title={updating ? "Updating..." : "Update Issue"}
              onPress={updateIssue}
              disabled={
                updating ||
                (newStatus === issue.status &&
                  adminNotes === (issue.admin_notes || ""))
              }
              buttonStyle={[
                styles.updateButton,
                (updating ||
                  (newStatus === issue.status &&
                    adminNotes === (issue.admin_notes || ""))) &&
                  styles.disabledButton,
              ]}
              titleStyle={styles.updateButtonText}
              loading={updating}
            />
          </View>
        </View>

        {issue.admin_notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Current Admin Notes</Text>
            <View style={styles.currentNotesCard}>
              <Text style={styles.currentNotesText}>{issue.admin_notes}</Text>
            </View>
          </View>
        )}
      </ScrollView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    marginTop: -25,
  },
  header: {
    backgroundColor: Colors.light.primaryColor,
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    paddingTop: 50,
  },
  backButton: {
    marginRight: 16,
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "white",
  },
  section: {
    margin: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
  },
  detailCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  issueTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  issueDescription: {
    fontSize: 16,
    color: "#666",
    lineHeight: 24,
    marginBottom: 16,
  },
  detailsGrid: {
    gap: 12,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    flex: 1,
  },
  value: {
    fontSize: 14,
    color: "#666",
    flex: 2,
    textAlign: "right",
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
  issuePhoto: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    resizeMode: "cover",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  mapContainer: {
    height: 200,
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  map: {
    flex: 1,
  },
  adminCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
  },
  statusPicker: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 20,
  },
  statusOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 2,
    backgroundColor: "white",
  },
  selectedStatusOption: {
    backgroundColor: "#f0f0f0",
  },
  statusOptionText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#666",
  },
  notesInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "white",
    marginBottom: 20,
    minHeight: 100,
  },
  updateButton: {
    backgroundColor: Colors.light.primaryColor,
    borderRadius: 8,
    paddingVertical: 12,
  },
  disabledButton: {
    backgroundColor: "#ccc",
  },
  updateButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  currentNotesCard: {
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: Colors.light.primaryColor,
  },
  currentNotesText: {
    fontSize: 14,
    color: "#555",
    fontStyle: "italic",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
  },
  accessDeniedContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  accessDeniedText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ff6b6b",
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  errorText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#ff6b6b",
    marginTop: 16,
  },
});

export default AdminIssueManagementScreen;
