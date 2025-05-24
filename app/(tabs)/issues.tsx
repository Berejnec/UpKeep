import { Colors } from "@/constants/Colors";
import { formatDateTime } from "@/utils/date";
import { supabase } from "@/utils/supabase";
import { FontAwesome, MaterialIcons, Octicons } from "@expo/vector-icons";
import { Button, Card, Text } from "@rneui/themed";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

interface Issue {
  id: string;
  title: string;
  description: string;
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

  useEffect(() => {
    const fetchIssues = async () => {
      setLoading(true);
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
            setLoading(false);
            return;
          }
        }

        const { data: fetchedIssues, error } = await query;

        if (error) {
          console.error("Error fetching issues:", error);
          setIssues([]);
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
      } finally {
        setLoading(false);
      }
    };

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
      activeOpacity={0.7}
      style={[styles.pressableCard, isInGroup && styles.groupedIssueCard]}
    >
      <Card
        containerStyle={{
          ...styles.card,
          ...(isInGroup && styles.groupedCard),
          marginBottom: isInGroup
            ? 8
            : index === displayItems.length - 1
            ? 16
            : 0,
        }}
      >
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.description} numberOfLines={2}>
          {item.description}
        </Text>
        <Text style={styles.date}>
          Reported at {formatDateTime(item.created_at)}
        </Text>
      </Card>
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
        <View
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            gap: 16,
            flexWrap: "wrap",
            paddingTop: 16,
            marginBottom: 8,
          }}
        >
          <Text h4 style={styles.screenTitle}>
            Reported Issues
          </Text>
          <Button
            icon={<FontAwesome name="user" size={24} color={"white"} />}
            buttonStyle={{
              backgroundColor: Colors.light.primaryColor,
              borderRadius: 12,
            }}
            onPress={() => setShowAllIssues((prev) => !prev)}
          >
            <Text style={{ color: "white", marginLeft: 8 }}>
              {showAllIssues ? "My issues" : "All issues"}
            </Text>
          </Button>
        </View>
        <View style={styles.noIssuesContainer}>
          <Text style={styles.noIssuesText}>No issues reported yet.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const handlePress = () => {
    router.push("/new-issue");
  };

  return (
    <SafeAreaView style={styles.container}>
      <View
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          gap: 16,
          flexWrap: "wrap",
          paddingTop: 16,
          marginBottom: 8,
        }}
      >
        <Text h4 style={styles.screenTitle}>
          Reported Issues
        </Text>
        <Button
          icon={<FontAwesome name="user" size={24} color={"white"} />}
          buttonStyle={{
            backgroundColor: Colors.light.primaryColor,
            borderRadius: 12,
          }}
          onPress={() => setShowAllIssues((prev) => !prev)}
        >
          <Text style={{ color: "white", marginLeft: 8 }}>
            {showAllIssues ? "My issues" : "All issues"}
          </Text>
        </Button>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.light.primaryColor} />
          <Text style={styles.loadingText}>Loading Issues...</Text>
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
        />
      )}

      <TouchableOpacity style={styles.floatingButton} onPress={handlePress}>
        <Octicons name="diff-added" size={24} color="white" />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  list: {
    flex: 1,
    zIndex: 0,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    elevation: 4,
    marginVertical: 8,
    padding: 16,
    borderLeftWidth: 6,
    borderLeftColor: "#168676",
    shadowColor: "#168676",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  screenTitle: {
    fontWeight: "bold",
    color: "#168676",
    paddingLeft: 16,
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#168676",
    marginBottom: 6,
  },
  description: {
    fontSize: 16,
    color: "#495057",
    marginBottom: 8,
    lineHeight: 22,
  },
  date: {
    fontSize: 12,
    color: "#6c757d",
    fontStyle: "italic",
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
    borderLeftWidth: 6,
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
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#168676",
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
