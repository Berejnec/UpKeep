import { Colors } from "@/constants/Colors";
import { formatDateTime } from "@/utils/date";
import { supabase } from "@/utils/supabase";
import { MaterialIcons } from "@expo/vector-icons";
import { Card, Text } from "@rneui/themed";
import { Stack, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
  View,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { HeaderLogo } from "@/components/Logo";

const { width } = Dimensions.get("window");

interface Issue {
  id: string;
  title: string;
  description: string;
  status: string;
  created_at: string;
  is_merged?: boolean;
  merged_group_title?: string;
  merged_count?: number;
  merged_group_id?: string;
}

interface MergedGroup {
  id: string;
  title: string;
  issues: Issue[];
  created_at: string;
}

interface DisplayItem {
  type: "issue" | "merged_group";
  data: Issue | MergedGroup;
}

const IssuesScreen = () => {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [displayItems, setDisplayItems] = useState<DisplayItem[]>([]);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAllIssues, setShowAllIssues] = useState(true);
  const router = useRouter();

  const processDisplayItems = (issuesList: Issue[]) => {
    const mergedGroups = new Map<string, MergedGroup>();
    const individualIssues: Issue[] = [];

    issuesList.forEach((issue) => {
      if (
        issue.is_merged &&
        issue.merged_group_id &&
        issue.merged_group_title
      ) {
        if (!mergedGroups.has(issue.merged_group_id)) {
          mergedGroups.set(issue.merged_group_id, {
            id: issue.merged_group_id,
            title: issue.merged_group_title,
            issues: [],
            created_at: issue.created_at,
          });
        }
        mergedGroups.get(issue.merged_group_id)!.issues.push(issue);
      } else {
        individualIssues.push(issue);
      }
    });

    mergedGroups.forEach((group) => {
      const earliestDate = group.issues.reduce((earliest, issue) => {
        return new Date(issue.created_at) < new Date(earliest)
          ? issue.created_at
          : earliest;
      }, group.issues[0]?.created_at || new Date().toISOString());
      group.created_at = earliestDate;
    });

    const items: DisplayItem[] = [
      ...Array.from(mergedGroups.values()).map((group) => ({
        type: "merged_group" as const,
        data: group,
      })),
      ...individualIssues.map((issue) => ({
        type: "issue" as const,
        data: issue,
      })),
    ];

    items.sort((a, b) => {
      const dateA = new Date(a.data.created_at);
      const dateB = new Date(b.data.created_at);
      return dateB.getTime() - dateA.getTime();
    });

    setDisplayItems(items);
  };

  const toggleGroupExpansion = (groupId: string) => {
    setExpandedGroups((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(groupId)) {
        newSet.delete(groupId);
      } else {
        newSet.add(groupId);
      }
      return newSet;
    });
  };

  const fetchIssues = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

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

      if (!showAllIssues) {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          query = query.eq("owner_id", user.id);
        } else {
          console.warn("User is not logged in. Cannot fetch owned issues.");
          setIssues([]);
          setDisplayItems([]);
          return;
        }
      }

      const { data: fetchedIssues, error } = await query;

      if (error) {
        console.error("Error fetching issues:", error);
        setIssues([]);
        setDisplayItems([]);
        return;
      }

      if (fetchedIssues) {
        const issuesWithMergeInfo = await Promise.all(
          fetchedIssues.map(async (issue) => {
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
              is_merged: !!mergeData,
              merged_group_title: mergeData?.merged_issues?.title,
              merged_group_id: mergeData?.merged_issues?.id,
              merged_count: mergedCount,
            };
          })
        );

        setIssues(issuesWithMergeInfo);
        processDisplayItems(issuesWithMergeInfo);
      }
    } catch (error) {
      console.error("Error fetching issues:", error);
      setIssues([]);
      setDisplayItems([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    fetchIssues(true);
  };

  useEffect(() => {
    fetchIssues();
  }, [showAllIssues]);

  const handleIssuePress = (issueId: string) => {
    router.push(`/issue-details/${issueId}`);
  };

  const renderIndividualIssue = (
    item: Issue,
    index: number,
    isInGroup = false
  ) => (
    <TouchableOpacity
      key={item.id}
      onPress={() => handleIssuePress(item.id)}
      activeOpacity={0.8}
      style={[
        styles.issueCard,
        isInGroup && styles.groupedIssueCard,
        { marginBottom: isInGroup ? 8 : 16 },
      ]}
    >
      <View style={styles.issueCardContent}>
        <View style={styles.issueHeader}>
          <View style={styles.issueIconContainer}>
            <MaterialIcons
              name="report-problem"
              size={20}
              color={Colors.light.primaryColor}
            />
          </View>
          <View style={styles.issueInfo}>
            <Text style={styles.issueTitle} numberOfLines={2}>
              {item.title}
            </Text>
            <Text style={styles.issueDate}>
              {formatDateTime(item.created_at)}
            </Text>
          </View>
        </View>

        <Text style={styles.issueDescription} numberOfLines={3}>
          {item.description}
        </Text>

        <View style={styles.issueFooter}>
          <View style={styles.statusIndicator}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
          <MaterialIcons name="chevron-right" size={20} color="#ccc" />
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderMergedGroup = (group: MergedGroup, index: number) => {
    const isExpanded = expandedGroups.has(group.id);
    const firstIssue = group.issues[0];

    return (
      <View key={group.id} style={styles.mergedGroupContainer}>
        <TouchableOpacity
          onPress={() => toggleGroupExpansion(group.id)}
          activeOpacity={0.7}
          style={styles.pressableCard}
        >
          <Card
            containerStyle={{
              ...styles.card,
              ...styles.mergedGroupCard,
              marginBottom: index === displayItems.length - 1 ? 16 : 0,
            }}
          >
            <View style={styles.mergedGroupHeader}>
              <View style={styles.mergedGroupInfo}>
                <View style={styles.mergedGroupTitleRow}>
                  <MaterialIcons name="merge-type" size={18} color="#4caf50" />
                  <Text style={styles.mergedGroupTitle}>{group.title}</Text>
                  <Text style={styles.mergedGroupCount}>
                    ({group.issues.length})
                  </Text>
                </View>
                <Text style={styles.mergedGroupSubtitle}>
                  {group.issues.length} merged issues
                </Text>
              </View>
              <MaterialIcons
                name={isExpanded ? "expand-less" : "expand-more"}
                size={24}
                color="#666"
              />
            </View>

            {!isExpanded && firstIssue && (
              <View style={styles.previewContainer}>
                <Text style={styles.previewTitle} numberOfLines={1}>
                  {firstIssue.title}
                </Text>
                <Text style={styles.previewDescription} numberOfLines={1}>
                  {firstIssue.description}
                </Text>
                <Text style={styles.previewDate}>
                  Latest: {formatDateTime(firstIssue.created_at)}
                </Text>
              </View>
            )}
          </Card>
        </TouchableOpacity>

        {/* Expanded issues */}
        {isExpanded && (
          <View style={styles.expandedIssues}>
            {group.issues.map((issue, issueIndex) =>
              renderIndividualIssue(issue, issueIndex, true)
            )}
          </View>
        )}
      </View>
    );
  };

  const renderDisplayItem = ({
    item,
    index,
  }: {
    item: DisplayItem;
    index: number;
  }) => {
    if (item.type === "merged_group") {
      return renderMergedGroup(item.data as MergedGroup, index);
    } else {
      return renderIndividualIssue(item.data as Issue, index);
    }
  };

  if (!displayItems || displayItems.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <LinearGradient
          colors={[Colors.light.primaryColor, "#0a5d54", "#083d36"]}
          style={styles.header}
        >
          <View style={styles.headerLeft}>
            <HeaderLogo />
          </View>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Issues</Text>
            <Text style={styles.headerSubtitle}>
              {showAllIssues ? "Community reports" : "Your reports"}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setShowAllIssues((prev) => !prev)}
          >
            <MaterialIcons
              name={showAllIssues ? "person" : "people"}
              size={20}
              color="white"
            />
          </TouchableOpacity>
        </LinearGradient>

        {/* Empty State */}
        <View style={styles.emptyStateContainer}>
          <View style={styles.emptyStateIcon}>
            <MaterialIcons name="report-problem" size={64} color="#e0e0e0" />
          </View>
          <Text style={styles.emptyStateTitle}>No Issues Found</Text>
          <Text style={styles.emptyStateSubtitle}>
            {showAllIssues
              ? "No issues have been reported yet. Be the first to report one!"
              : "You haven't reported any issues yet. Tap the + button to get started."}
          </Text>
        </View>

        {/* Floating Action Button */}
        <TouchableOpacity
          style={styles.fab}
          onPress={() => router.push("/new-issue")}
        >
          <MaterialIcons name="add" size={28} color="white" />
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <LinearGradient
          colors={[Colors.light.primaryColor, "#0a5d54", "#083d36"]}
          style={styles.header}
        >
          <View style={styles.headerLeft}>
            <HeaderLogo />
          </View>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Issues</Text>
            <Text style={styles.headerSubtitle}>
              {showAllIssues ? "Community reports" : "Your reports"} •{" "}
              {displayItems.length} total
            </Text>
          </View>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setShowAllIssues((prev) => !prev)}
          >
            <MaterialIcons
              name={showAllIssues ? "person" : "people"}
              size={20}
              color="white"
            />
          </TouchableOpacity>
        </LinearGradient>

        {/* Content */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.light.primaryColor} />
            <Text style={styles.loadingText}>Loading issues...</Text>
          </View>
        ) : (
          <FlatList
            data={displayItems}
            renderItem={renderDisplayItem}
            keyExtractor={(item) =>
              item.type === "merged_group"
                ? `group-${(item.data as MergedGroup).id}`
                : `issue-${(item.data as Issue).id}`
            }
            style={styles.list}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[Colors.light.primaryColor]}
                tintColor={Colors.light.primaryColor}
              />
            }
          />
        )}

        {/* Floating Action Button */}
        <TouchableOpacity
          style={styles.fab}
          onPress={() => router.push("/new-issue")}
        >
          <MaterialIcons name="add" size={28} color="white" />
        </TouchableOpacity>
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },

  // Header Styles
  header: {
    paddingTop: 30,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    marginBottom: 20,
  },
  headerLeft: {
    marginRight: 12,
    alignSelf: "center",
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "white",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
  },
  filterButton: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 12,
    padding: 12,
    marginLeft: 16,
  },

  // List Styles
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  mergedContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    marginBottom: 8,
    padding: 6,
    backgroundColor: "#e8f5e8",
    borderRadius: 6,
    gap: 6,
  },
  mergedText: {
    fontSize: 12,
    color: "#4caf50",
    fontWeight: "500",
  },
  mergedGroupContainer: {
    marginBottom: 8,
  },
  mergedGroupCard: {
    backgroundColor: "#f8fffe",
    borderLeftColor: "#4caf50",
  },
  groupedIssueCard: {
    marginLeft: 16,
  },
  groupedCard: {
    backgroundColor: "#fafafa",
    borderLeftWidth: 3,
    borderLeftColor: "#4caf50",
    elevation: 1,
  },
  mergedGroupHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  mergedGroupInfo: {
    flex: 1,
  },
  mergedGroupTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  mergedGroupTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2e7d32",
    flex: 1,
  },
  mergedGroupCount: {
    fontSize: 14,
    color: "#4caf50",
    fontWeight: "600",
  },
  mergedGroupSubtitle: {
    fontSize: 12,
    color: "#66bb6a",
    fontWeight: "500",
  },
  previewContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#e8f5e8",
  },
  previewTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  previewDescription: {
    fontSize: 13,
    color: "#666",
    marginBottom: 4,
  },
  previewDate: {
    fontSize: 11,
    color: "#999",
    fontStyle: "italic",
  },
  expandedIssues: {
    marginTop: 8,
  },
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

  // Issue Card Styles
  issueCard: {
    backgroundColor: "white",
    borderRadius: 16,
    marginBottom: 16,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  issueCardContent: {
    padding: 20,
  },
  issueHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
    gap: 12,
  },
  issueIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f0f8ff",
    justifyContent: "center",
    alignItems: "center",
  },
  issueInfo: {
    flex: 1,
  },
  issueTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
    lineHeight: 24,
  },
  issueDate: {
    fontSize: 12,
    color: "#666",
  },
  issueDescription: {
    fontSize: 15,
    color: "#555",
    lineHeight: 22,
    marginBottom: 16,
  },
  issueFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#4caf50",
  },
  statusText: {
    fontSize: 12,
    color: "#4caf50",
    fontWeight: "500",
  },

  // Empty State Styles
  emptyStateContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyStateIcon: {
    marginBottom: 24,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
    textAlign: "center",
  },
  emptyStateSubtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 24,
  },

  // Floating Action Button
  fab: {
    position: "absolute",
    bottom: 30,
    right: 20,
    backgroundColor: Colors.light.primaryColor,
    borderRadius: 28,
    width: 56,
    height: 56,
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },

  card: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    elevation: 4,
    marginVertical: 8,
    marginHorizontal: 0,
    padding: 16,
    borderLeftWidth: 6,
    borderLeftColor: "#168676",
    shadowColor: "#168676",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  noIssuesContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  noIssuesText: {
    fontSize: 18,
    color: "#168676",
    textAlign: "center",
    fontWeight: "500",
  },
  pressableCard: {
    opacity: 0.9,
  },
  floatingButton: {
    backgroundColor: Colors.light.primaryColor,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    bottom: 40,
    right: 30,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    zIndex: 1,
  },
});

export default IssuesScreen;
