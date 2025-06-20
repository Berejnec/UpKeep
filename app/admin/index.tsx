import { Colors } from "@/constants/Colors";
import { useAuth } from "@/provider/AuthProvider";
import { formatDateTime } from "@/utils/date";
import { supabase } from "@/utils/supabase";
import { FontAwesome, Ionicons, MaterialIcons } from "@expo/vector-icons";
import { Card, Text } from "@rneui/themed";
import { LinearGradient } from "expo-linear-gradient";
import { Stack, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

interface Issue {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  address: string;
  created_at: string;
  updated_at: string;
  owner_id: string;
  admin_notes?: string;
  owner_email?: string;
  is_merged?: boolean;
  merged_group_title?: string;
  merged_count?: number;
}

const AdminScreen = () => {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const { isAdmin } = useAuth();
  const router = useRouter();

  const statusOptions = ["ALL", "OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"];

  useEffect(() => {
    if (!isAdmin) {
      Alert.alert("Access Denied", "You don't have admin privileges.");
      router.replace("/(tabs)/issues");
      return;
    }
    fetchIssues();
  }, [isAdmin, statusFilter]);

  const fetchIssues = async () => {
    try {
      let query = supabase
        .from("issues")
        .select(
          `
          *,
          issue_merges!left (
            merged_issue_id,
            merged_issues!inner (
              id,
              title
            )
          )
        `
        )
        .order("created_at", { ascending: false });

      if (statusFilter !== "ALL") {
        query = query.eq("status", statusFilter);
      }

      const { data: fetchedIssues, error } = await query;

      if (error) {
        console.error("Error fetching issues:", error);
        Alert.alert("Error", "Failed to fetch issues");
        return;
      }

      if (fetchedIssues) {
        const issuesWithOwners = await Promise.all(
          fetchedIssues.map(async (issue) => {
            const { data: owner } = await supabase
              .from("profiles")
              .select("email")
              .eq("id", issue.owner_id)
              .single();

            const mergeData = issue.issue_merges?.[0];
            let mergedCount = 0;

            if (mergeData?.merged_issues?.id) {
              const { data: mergeCountData } = await supabase
                .from("issue_merges")
                .select("id")
                .eq("merged_issue_id", mergeData.merged_issues.id);

              mergedCount = mergeCountData?.length || 0;
            }

            return {
              ...issue,
              owner_email: owner?.email || "Unknown",
              is_merged: !!mergeData,
              merged_group_title: mergeData?.merged_issues?.title,
              merged_count: mergedCount,
            };
          })
        );

        setIssues(issuesWithOwners);
      }
    } catch (error) {
      console.error("Error fetching issues:", error);
      Alert.alert("Error", "An unexpected error occurred");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchIssues();
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "OPEN":
        return "error-outline";
      case "IN_PROGRESS":
        return "hourglass-bottom";
      case "RESOLVED":
        return "check-circle-outline";
      case "CLOSED":
        return "cancel";
      default:
        return "help-outline";
    }
  };

  const renderIssueCard = ({ item }: { item: Issue }) => (
    <Card containerStyle={styles.card}>
      <TouchableOpacity
        onPress={() => router.push(`/admin/issue-management/${item.id}`)}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.issueTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(item.status) },
            ]}
          >
            <MaterialIcons
              name={getStatusIcon(item.status) as any}
              size={16}
              color="white"
            />
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
        </View>

        <Text style={styles.issueDescription} numberOfLines={2}>
          {item.description}
        </Text>

        <View style={styles.issueDetails}>
          <View style={styles.detailRow}>
            <FontAwesome name="user" size={14} color="#666" />
            <Text style={styles.detailText}>{item.owner_email}</Text>
          </View>
          <View style={styles.detailRow}>
            <FontAwesome name="tag" size={14} color="#666" />
            <Text style={styles.detailText}>{item.category}</Text>
          </View>
          <View style={styles.detailRow}>
            <FontAwesome name="clock-o" size={14} color="#666" />
            <Text style={styles.detailText}>
              {formatDateTime(item.created_at)}
            </Text>
          </View>
        </View>

        {item.is_merged && (
          <View style={styles.mergedContainer}>
            <MaterialIcons name="merge-type" size={16} color="#4caf50" />
            <Text style={styles.mergedLabel}>
              Merged: {item.merged_group_title} ({item.merged_count} issues)
            </Text>
          </View>
        )}

        {item.admin_notes && (
          <View style={styles.adminNotesContainer}>
            <Text style={styles.adminNotesLabel}>Admin Notes:</Text>
            <Text style={styles.adminNotesText} numberOfLines={2}>
              {item.admin_notes}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </Card>
  );

  const renderStatusFilter = () => (
    <View style={styles.filterContainer}>
      <Text style={styles.filterLabel}>Filter by Status:</Text>
      <View style={styles.filterButtons}>
        {statusOptions.map((status) => (
          <TouchableOpacity
            key={status}
            style={[
              styles.filterButton,
              statusFilter === status && styles.activeFilterButton,
            ]}
            onPress={() => setStatusFilter(status)}
          >
            <Text
              style={[
                styles.filterButtonText,
                statusFilter === status && styles.activeFilterButtonText,
              ]}
            >
              {status.replace("_", " ")}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  if (!isAdmin) {
    return (
      <View style={styles.accessDeniedContainer}>
        <MaterialIcons name="block" size={64} color="#ff6b6b" />
        <Text style={styles.accessDeniedText}>Access Denied</Text>
        <Text style={styles.accessDeniedSubtext}>
          You don't have admin privileges to view this page.
        </Text>
      </View>
    );
  }

  if (loading) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.light.primaryColor} />
          <Text style={styles.loadingText}>Loading admin dashboard...</Text>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={[Colors.light.primaryColor, "#0a5d54", "#083d36"]}
          style={styles.header}
        >
          <View style={styles.headerTop}>
            <View style={styles.headerLeft}>
              <TouchableOpacity
                onPress={() => router.back()}
                style={styles.backButton}
              >
                <Ionicons name="arrow-back" size={24} color="white" />
              </TouchableOpacity>
            </View>
            <View style={styles.headerCenter}>
              <Text style={styles.headerTitle}>Admin Dashboard</Text>
              <Text style={styles.headerSubtitle}>
                Manage all issues ({issues.length} total)
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push("/admin/merge-issues" as any)}
              style={styles.mergeButton}
            >
              <MaterialIcons name="merge-type" size={20} color="white" />
            </TouchableOpacity>
          </View>

          {/* Admin Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <MaterialIcons
                name="report-problem"
                size={24}
                color="rgba(255,255,255,0.9)"
              />
              <Text style={styles.statNumber}>{issues.length}</Text>
              <Text style={styles.statLabel}>Total Issues</Text>
            </View>
            <View style={styles.statItem}>
              <MaterialIcons
                name="pending"
                size={24}
                color="rgba(255,255,255,0.9)"
              />
              <Text style={styles.statNumber}>
                {issues.filter((i) => i.status === "OPEN").length}
              </Text>
              <Text style={styles.statLabel}>Open</Text>
            </View>
            <View style={styles.statItem}>
              <MaterialIcons
                name="check-circle"
                size={24}
                color="rgba(255,255,255,0.9)"
              />
              <Text style={styles.statNumber}>
                {issues.filter((i) => i.status === "RESOLVED").length}
              </Text>
              <Text style={styles.statLabel}>Resolved</Text>
            </View>
          </View>
        </LinearGradient>

        {renderStatusFilter()}

        <FlatList
          data={issues}
          renderItem={renderIssueCard}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialIcons name="inbox" size={64} color="#ccc" />
              <Text style={styles.emptyText}>No issues found</Text>
              <Text style={styles.emptySubtext}>
                {statusFilter === "ALL"
                  ? "No issues have been reported yet."
                  : `No issues with status "${statusFilter.replace(
                      "_",
                      " "
                    )}" found.`}
              </Text>
            </View>
          }
        />
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    marginTop: -25,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  mergeButton: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 12,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "white",
    marginBottom: 4,
    textAlign: "center",
  },
  headerSubtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.8)",
    textAlign: "center",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 15,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 10,
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.8)",
    textAlign: "center",
  },
  filterContainer: {
    backgroundColor: "white",
    marginHorizontal: 20,
    marginVertical: 16,
    padding: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
  },
  filterLabel: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 16,
    color: "#333",
  },
  filterButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 2,
    borderRadius: 25,
    backgroundColor: "#f8f9fa",
    borderWidth: 2,
    borderColor: "#e9ecef",
  },
  activeFilterButton: {
    backgroundColor: Colors.light.primaryColor,
    borderColor: Colors.light.primaryColor,
    shadowColor: Colors.light.primaryColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  filterButtonText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "600",
  },
  activeFilterButtonText: {
    color: "white",
    fontWeight: "700",
  },
  listContainer: {
    padding: 20,
  },
  card: {
    borderRadius: 16,
    marginBottom: 10,
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    backgroundColor: "white",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  issueTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
    marginRight: 12,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
  issueDescription: {
    fontSize: 14,
    color: "#666",
    marginBottom: 12,
    lineHeight: 20,
  },
  issueDetails: {
    gap: 6,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  detailText: {
    fontSize: 13,
    color: "#666",
  },
  mergedContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    padding: 8,
    backgroundColor: "#e8f5e8",
    borderRadius: 6,
    gap: 6,
  },
  mergedLabel: {
    fontSize: 12,
    color: "#4caf50",
    fontWeight: "600",
    width: "90%",
  },
  adminNotesContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: Colors.light.primaryColor,
  },
  adminNotesLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.light.primaryColor,
    marginBottom: 4,
  },
  adminNotesText: {
    fontSize: 13,
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
    padding: 32,
  },
  accessDeniedText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ff6b6b",
    marginTop: 16,
    marginBottom: 8,
  },
  accessDeniedSubtext: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#999",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    paddingHorizontal: 32,
  },
});

export default AdminScreen;
