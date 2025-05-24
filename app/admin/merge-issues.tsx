import { Colors } from "@/constants/Colors";
import { useAuth } from "@/provider/AuthProvider";
import { formatDateTime } from "@/utils/date";
import { supabase } from "@/utils/supabase";
import { FontAwesome, Ionicons, MaterialIcons } from "@expo/vector-icons";
import { Button, CheckBox, Text } from "@rneui/themed";
import { Stack, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TextInput,
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
  owner_email?: string;
  is_merged?: boolean;
  merged_group_id?: string;
  merged_group_title?: string;
}

interface MergedGroup {
  id: string;
  title: string;
  description: string;
  created_at: string;
  issue_count: number;
  issues: Issue[];
}

const MergeIssuesScreen = () => {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [mergedGroups, setMergedGroups] = useState<MergedGroup[]>([]);
  const [selectedIssues, setSelectedIssues] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [mergeTitle, setMergeTitle] = useState("");
  const [mergeDescription, setMergeDescription] = useState("");
  const [creating, setCreating] = useState(false);
  const { isAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAdmin) {
      Alert.alert("Access Denied", "You don't have admin privileges.");
      router.back();
      return;
    }
    fetchData();
  }, [isAdmin]);

  const fetchData = async () => {
    try {
      await Promise.all([fetchIssues(), fetchMergedGroups()]);
    } catch (error) {
      console.error("Error fetching data:", error);
      Alert.alert("Error", "Failed to fetch data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchIssues = async () => {
    const { data: issuesData, error: issuesError } = await supabase
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

    if (issuesError) {
      console.error("Error fetching issues:", issuesError);
      return;
    }

    if (issuesData) {
      const issuesWithOwners = await Promise.all(
        issuesData.map(async (issue) => {
          const { data: owner } = await supabase
            .from("profiles")
            .select("email")
            .eq("id", issue.owner_id)
            .single();

          const mergeData = issue.issue_merges?.[0];
          return {
            ...issue,
            owner_email: owner?.email || "Unknown",
            is_merged: !!mergeData,
            merged_group_id: mergeData?.merged_issues?.id,
            merged_group_title: mergeData?.merged_issues?.title,
          };
        })
      );

      setIssues(issuesWithOwners);
    }
  };

  const fetchMergedGroups = async () => {
    const { data: groupsData, error: groupsError } = await supabase
      .from("merged_issues")
      .select(
        `
        *,
        issue_merges (
          issue_id,
          issues (
            id,
            title,
            description,
            status,
            created_at
          )
        )
      `
      )
      .eq("status", "ACTIVE")
      .order("created_at", { ascending: false });

    if (groupsError) {
      console.error("Error fetching merged groups:", groupsError);
      return;
    }

    if (groupsData) {
      const formattedGroups = groupsData.map((group) => ({
        ...group,
        issue_count: group.issue_merges?.length || 0,
        issues: group.issue_merges?.map((merge: any) => merge.issues) || [],
      }));

      setMergedGroups(formattedGroups);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const toggleIssueSelection = (issueId: string) => {
    setSelectedIssues((prev) =>
      prev.includes(issueId)
        ? prev.filter((id) => id !== issueId)
        : [...prev, issueId]
    );
  };

  const handleCreateMerge = async () => {
    if (selectedIssues.length < 2) {
      Alert.alert("Error", "Please select at least 2 issues to merge.");
      return;
    }

    if (!mergeTitle.trim()) {
      Alert.alert("Error", "Please enter a title for the merged group.");
      return;
    }

    setCreating(true);
    try {
      const { data: mergedIssue, error: mergeError } = await supabase
        .from("merged_issues")
        .insert({
          title: mergeTitle.trim(),
          description: mergeDescription.trim() || null,
        })
        .select()
        .single();

      if (mergeError) throw mergeError;

      const mergeRelations = selectedIssues.map((issueId) => ({
        merged_issue_id: mergedIssue.id,
        issue_id: issueId,
      }));

      const { error: relationsError } = await supabase
        .from("issue_merges")
        .insert(mergeRelations);

      if (relationsError) throw relationsError;

      Alert.alert("Success", "Issues merged successfully!");
      setShowMergeModal(false);
      setSelectedIssues([]);
      setMergeTitle("");
      setMergeDescription("");
      fetchData();
    } catch (error) {
      console.error("Error creating merge:", error);
      Alert.alert("Error", "Failed to merge issues");
    } finally {
      setCreating(false);
    }
  };

  const handleUnmergeGroup = async (groupId: string) => {
    Alert.alert(
      "Unmerge Issues",
      "Are you sure you want to unmerge this group? All issues will become individual again.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Unmerge",
          style: "destructive",
          onPress: async () => {
            try {
              // Delete merge relationships
              const { error: deleteError } = await supabase
                .from("issue_merges")
                .delete()
                .eq("merged_issue_id", groupId);

              if (deleteError) throw deleteError;

              // Delete merged issue group
              const { error: groupDeleteError } = await supabase
                .from("merged_issues")
                .delete()
                .eq("id", groupId);

              if (groupDeleteError) throw groupDeleteError;

              Alert.alert("Success", "Issues unmerged successfully!");
              fetchData();
            } catch (error) {
              console.error("Error unmerging:", error);
              Alert.alert("Error", "Failed to unmerge issues");
            }
          },
        },
      ]
    );
  };

  const renderIssueItem = ({ item }: { item: Issue }) => (
    <TouchableOpacity
      style={[
        styles.issueCard,
        item.is_merged && styles.mergedIssueCard,
        selectedIssues.includes(item.id) && styles.selectedIssueCard,
      ]}
      onPress={() => !item.is_merged && toggleIssueSelection(item.id)}
      disabled={item.is_merged}
    >
      <View style={styles.issueHeader}>
        <View style={styles.issueInfo}>
          <Text style={styles.issueTitle} numberOfLines={1}>
            {item.title}
          </Text>
          {item.is_merged && (
            <View style={styles.mergedBadge}>
              <MaterialIcons name="merge-type" size={14} color="#168676" />
              <Text style={styles.mergedText}>
                Merged: {item.merged_group_title}
              </Text>
            </View>
          )}
        </View>
        {!item.is_merged && (
          <CheckBox
            checked={selectedIssues.includes(item.id)}
            onPress={() => toggleIssueSelection(item.id)}
            containerStyle={styles.checkboxContainer}
          />
        )}
      </View>
      <Text style={styles.issueDescription} numberOfLines={2}>
        {item.description}
      </Text>
      <View style={styles.issueDetails}>
        <Text style={styles.issueDetailText}>
          {item.category} • {formatDateTime(item.created_at)}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderMergedGroup = ({ item }: { item: MergedGroup }) => (
    <View style={styles.mergedGroupCard}>
      <View style={styles.mergedGroupHeader}>
        <View style={styles.mergedGroupInfo}>
          <Text style={styles.mergedGroupTitle}>{item.title}</Text>
          <Text style={styles.mergedGroupCount}>
            {item.issue_count} issues merged
          </Text>
        </View>
        <TouchableOpacity
          style={styles.unmergeButton}
          onPress={() => handleUnmergeGroup(item.id)}
        >
          <MaterialIcons name="call-split" size={20} color="#ff6b6b" />
        </TouchableOpacity>
      </View>
      {item.description && (
        <Text style={styles.mergedGroupDescription}>{item.description}</Text>
      )}
      <Text style={styles.mergedGroupDate}>
        Created {formatDateTime(item.created_at)}
      </Text>
    </View>
  );

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
          <Text style={styles.loadingText}>Loading merge data...</Text>
        </View>
      </>
    );
  }

  const unmergedIssues = issues.filter((issue) => !issue.is_merged);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 24 }}>
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color={"white"} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Merge Issues</Text>
          </View>
          <Text style={styles.headerSubtitle}>
            Group related issues together
          </Text>
        </View>

        <ScrollView
          style={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {selectedIssues.length > 0 && (
            <View style={styles.selectionBar}>
              <Text style={styles.selectionText}>
                {selectedIssues.length} issues selected
              </Text>
              <Button
                title="Merge Selected"
                onPress={() => setShowMergeModal(true)}
                buttonStyle={styles.mergeButton}
                titleStyle={styles.mergeButtonText}
                disabled={selectedIssues.length < 2}
              />
            </View>
          )}

          {mergedGroups.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Merged Groups</Text>
              <FlatList
                data={mergedGroups}
                renderItem={renderMergedGroup}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
              />
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Available Issues ({unmergedIssues.length})
            </Text>
            <FlatList
              data={unmergedIssues}
              renderItem={renderIssueItem}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              ListEmptyComponent={
                <Text style={styles.emptyText}>
                  All issues are already merged or no issues available.
                </Text>
              }
            />
          </View>
        </ScrollView>

        <Modal
          visible={showMergeModal}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowMergeModal(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Create Merge Group</Text>
              <TouchableOpacity onPress={handleCreateMerge} disabled={creating}>
                <Text
                  style={[
                    styles.modalSaveText,
                    creating && styles.disabledText,
                  ]}
                >
                  {creating ? "Creating..." : "Create"}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalContent}>
              <Text style={styles.inputLabel}>Group Title *</Text>
              <TextInput
                style={styles.textInput}
                value={mergeTitle}
                onChangeText={setMergeTitle}
                placeholder="Enter a title for this merged group"
                maxLength={100}
              />

              <Text style={styles.inputLabel}>Description (Optional)</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={mergeDescription}
                onChangeText={setMergeDescription}
                placeholder="Explain why these issues are grouped together"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                maxLength={500}
              />

              <Text style={styles.selectedIssuesTitle}>
                Selected Issues ({selectedIssues.length})
              </Text>
              {selectedIssues.map((issueId) => {
                const issue = issues.find((i) => i.id === issueId);
                return issue ? (
                  <View key={issueId} style={styles.selectedIssueItem}>
                    <Text style={styles.selectedIssueTitle}>{issue.title}</Text>
                  </View>
                ) : null;
              })}
            </View>
          </SafeAreaView>
        </Modal>
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
    backgroundColor: Colors.light.primaryColor,
    padding: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.8)",
  },
  content: {
    flex: 1,
  },
  selectionBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#e3f2fd",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  selectionText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1976d2",
  },
  mergeButton: {
    backgroundColor: Colors.light.primaryColor,
    borderRadius: 8,
    paddingHorizontal: 16,
  },
  mergeButtonText: {
    fontSize: 14,
    fontWeight: "600",
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
  issueCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  mergedIssueCard: {
    backgroundColor: "#f8f9fa",
    opacity: 0.7,
  },
  selectedIssueCard: {
    borderWidth: 2,
    borderColor: Colors.light.primaryColor,
  },
  issueHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  issueInfo: {
    flex: 1,
  },
  issueTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  mergedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  mergedText: {
    fontSize: 12,
    color: "#168676",
    fontWeight: "500",
  },
  checkboxContainer: {
    margin: 0,
    padding: 0,
  },
  issueDescription: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
    lineHeight: 20,
  },
  issueDetails: {
    borderTopWidth: 1,
    borderTopColor: "#eee",
    paddingTop: 8,
  },
  issueDetailText: {
    fontSize: 12,
    color: "#999",
  },
  mergedGroupCard: {
    backgroundColor: "#e8f5e8",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#4caf50",
  },
  mergedGroupHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  mergedGroupInfo: {
    flex: 1,
  },
  mergedGroupTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2e7d32",
    marginBottom: 4,
  },
  mergedGroupCount: {
    fontSize: 12,
    color: "#4caf50",
    fontWeight: "500",
  },
  unmergeButton: {
    padding: 8,
  },
  mergedGroupDescription: {
    fontSize: 14,
    color: "#388e3c",
    marginBottom: 8,
    lineHeight: 20,
  },
  mergedGroupDate: {
    fontSize: 12,
    color: "#66bb6a",
    fontStyle: "italic",
  },
  emptyText: {
    textAlign: "center",
    color: "#999",
    fontSize: 16,
    padding: 32,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "white",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  modalCancelText: {
    fontSize: 16,
    color: "#666",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  modalSaveText: {
    fontSize: 16,
    color: Colors.light.primaryColor,
    fontWeight: "600",
  },
  disabledText: {
    color: "#ccc",
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
    marginTop: 16,
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "white",
  },
  textArea: {
    minHeight: 100,
  },
  selectedIssuesTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginTop: 24,
    marginBottom: 12,
  },
  selectedIssueItem: {
    backgroundColor: "#f8f9fa",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  selectedIssueTitle: {
    fontSize: 14,
    color: "#333",
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
});

export default MergeIssuesScreen;
