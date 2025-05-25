import { Colors } from "@/constants/Colors";
import { formatDateTime } from "@/utils/date";
import { supabase } from "@/utils/supabase";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { Text } from "@rneui/themed";
import { LinearGradient } from "expo-linear-gradient";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
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
  owner_email?: string;
  admin_notes?: string | null;
}

export default function IssueDetailsScreen() {
  const { id } = useLocalSearchParams();
  const [issue, setIssue] = useState<Issue | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchIssue = async () => {
      try {
        const { data: issue, error: issueError } = await supabase
          .from("issues")
          .select("*")
          .eq("id", id)
          .single();

        if (issueError) throw issueError;

        const { data: user, error: userError } = await supabase
          .from("profiles")
          .select("email, role")
          .eq("id", issue.owner_id)
          .single();

        if (userError) console.error("Error at getting user data: ", userError);

        setIssue({
          ...issue,
          owner_email: user?.email || "Unknown user",
        });
      } catch (error) {
        console.error("Error fetching issue:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchIssue();
  }, [id]);

  if (loading) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <SafeAreaView style={styles.container}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.light.primaryColor} />
            <Text style={styles.loadingText}>Loading issue details...</Text>
          </View>
        </SafeAreaView>
      </>
    );
  }

  if (!issue) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <SafeAreaView style={styles.container}>
          <View style={styles.errorContainer}>
            <MaterialIcons name="error-outline" size={64} color="#ccc" />
            <Text style={styles.errorText}>Issue not found</Text>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Text style={styles.backButtonText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "open":
        return "#4caf50";
      case "in progress":
        return "#ff9800";
      case "closed":
        return "#f44336";
      default:
        return "#666";
    }
  };

  const getCategoryIcon = (
    category: string
  ): keyof typeof MaterialIcons.glyphMap => {
    switch (category.toLowerCase()) {
      case "road":
        return "directions-car";
      case "lighting":
        return "lightbulb";
      case "waste":
        return "delete";
      case "water":
        return "water-drop";
      case "safety":
        return "security";
      default:
        return "report-problem";
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <SafeAreaView style={styles.container}>
        {/* Header */}
        <LinearGradient
          colors={[Colors.light.primaryColor, "#0a5d54", "#083d36"]}
          style={styles.header}
        >
          <TouchableOpacity
            style={styles.headerBackButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>

          <View style={styles.headerContent}>
            <Text style={styles.headerTitle} numberOfLines={2}>
              {issue.title}
            </Text>
            <View style={styles.headerMeta}>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: getStatusColor(issue.status) },
                ]}
              >
                <Text style={styles.statusText}>{issue.status}</Text>
              </View>
              <Text style={styles.headerDate}>
                {formatDateTime(issue.created_at)}
              </Text>
            </View>
          </View>
        </LinearGradient>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Photo Section */}
          {issue?.photo_url && (
            <View style={styles.photoContainer}>
              <Image
                source={{ uri: issue.photo_url }}
                style={styles.heroImage}
                resizeMode="cover"
              />
            </View>
          )}

          {/* Description Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <MaterialIcons
                name="description"
                size={24}
                color={Colors.light.primaryColor}
              />
              <Text style={styles.cardTitle}>Description</Text>
            </View>
            <Text style={styles.description}>{issue.description}</Text>
          </View>

          {/* Location Card */}
          {issue.latitude && issue.longitude ? (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <MaterialIcons
                  name="place"
                  size={24}
                  color={Colors.light.primaryColor}
                />
                <Text style={styles.cardTitle}>Location</Text>
              </View>
              <View style={styles.mapContainer}>
                <MapView
                  style={styles.map}
                  initialRegion={{
                    latitude: issue.latitude,
                    longitude: issue.longitude,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                  }}
                  scrollEnabled={false}
                  zoomEnabled={false}
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
              {issue.address && (
                <View style={styles.addressContainer}>
                  <MaterialIcons name="location-on" size={16} color="#666" />
                  <Text style={styles.addressText}>{issue.address}</Text>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <MaterialIcons name="location-off" size={24} color="#ccc" />
                <Text style={styles.cardTitle}>Location</Text>
              </View>
              <Text style={styles.noLocation}>No location data available</Text>
            </View>
          )}

          {/* Details Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <MaterialIcons
                name="info"
                size={24}
                color={Colors.light.primaryColor}
              />
              <Text style={styles.cardTitle}>Issue Details</Text>
            </View>

            <View style={styles.detailsList}>
              <View style={styles.detailItem}>
                <View style={styles.detailIconContainer}>
                  <MaterialIcons
                    name={getCategoryIcon(issue.category)}
                    size={20}
                    color="#666"
                  />
                </View>
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Category</Text>
                  <Text style={styles.detailValue}>{issue.category}</Text>
                </View>
              </View>

              <View style={styles.detailDivider} />

              <View style={styles.detailItem}>
                <View style={styles.detailIconContainer}>
                  <MaterialIcons name="person" size={20} color="#666" />
                </View>
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Reported by</Text>
                  <Text style={styles.detailValue}>
                    {issue.owner_email || "Loading..."}
                  </Text>
                </View>
              </View>

              <View style={styles.detailDivider} />

              <View style={styles.detailItem}>
                <View style={styles.detailIconContainer}>
                  <MaterialIcons name="schedule" size={20} color="#666" />
                </View>
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Last Updated</Text>
                  <Text style={styles.detailValue}>
                    {formatDateTime(issue.updated_at)}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Admin Notes Card */}
          {issue.admin_notes && (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <MaterialIcons
                  name="admin-panel-settings"
                  size={24}
                  color="#168676"
                />
                <Text style={styles.cardTitle}>Official Response</Text>
              </View>
              <View style={styles.adminNotesContainer}>
                <Text style={styles.adminNotesText}>{issue.admin_notes}</Text>
              </View>
            </View>
          )}

          {/* Bottom Spacing */}
          <View style={styles.bottomSpacing} />
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },

  // Loading & Error States
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 50,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  errorText: {
    fontSize: 18,
    color: "#666",
    marginTop: 16,
    marginBottom: 24,
    textAlign: "center",
  },
  backButton: {
    backgroundColor: Colors.light.primaryColor,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },

  // Header Styles
  header: {
    paddingTop: 24,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "flex-start",
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
    marginTop: 4,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "white",
    marginBottom: 8,
    lineHeight: 28,
  },
  headerMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  headerDate: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
  },

  // Scroll View Styles
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },

  // Photo Styles
  photoContainer: {
    marginBottom: 20,
  },
  heroImage: {
    width: "100%",
    height: 250,
    borderRadius: 0,
  },

  // Card Styles
  card: {
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
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    // green color
    color: "#168676",
  },

  // Description Styles
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: "#555",
  },

  // Map Styles
  mapContainer: {
    borderRadius: 12,
    overflow: "hidden",
    height: 200,
    position: "relative",
    marginBottom: 12,
  },
  map: {
    width: "100%",
    height: "100%",
  },
  mapOverlay: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "rgba(0,0,0,0.7)",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  mapOverlayText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
  addressContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f1f3f4",
  },
  addressText: {
    fontSize: 14,
    color: "#666",
    flex: 1,
  },
  noLocation: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    fontStyle: "italic",
  },

  // Details List Styles
  detailsList: {
    gap: 0,
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

  // Admin Notes Styles
  adminNotesContainer: {
    backgroundColor: "#f0fff0", // lighter green
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#168676",
  },
  adminNotesText: {
    fontSize: 15,
    lineHeight: 22,
    color: "#168676",
    fontStyle: "italic",
  },

  // Spacing
  bottomSpacing: {
    height: 40,
  },
});
