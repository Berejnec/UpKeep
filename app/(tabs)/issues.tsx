import { Colors } from "@/constants/Colors";
import { formatDateTime } from "@/utils/date";
import { supabase } from "@/utils/supabase";
import { Octicons } from "@expo/vector-icons";
import { Card } from "@rneui/themed";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface Issue {
  id: string;
  title: string;
  description: string;
  created_at: string;
}

const IssuesScreen = () => {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchIssues = async () => {
      try {
        const { data: fetchedIssues, error } = await supabase
          .from("issues")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Error fetching issues:", error);
          return;
        }
        if (fetchedIssues) {
          setIssues(fetchedIssues);
        }
      } catch (error) {
        console.error("Error fetching issues:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchIssues();
  }, []);

  const handleIssuePress = (issueId: string) => {
    router.push(`/issue-details/${issueId}`);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007BFF" />
        <Text style={styles.loadingText}>Loading Issues...</Text>
      </View>
    );
  }

  if (!issues || issues.length === 0) {
    return (
      <View style={styles.noIssuesContainer}>
        <Text style={styles.noIssuesText}>No issues reported yet.</Text>
      </View>
    );
  }

  const handlePress = () => {
    router.push("/new-issue");
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.floatingButton} onPress={handlePress}>
        <Octicons name="diff-added" size={24} color="white" />
      </TouchableOpacity>
      <FlatList
        data={issues}
        renderItem={({ item, index }) => (
          <TouchableOpacity
            onPress={() => handleIssuePress(item.id)}
            activeOpacity={0.7}
            style={styles.pressableCard}
          >
            <Card
              containerStyle={{
                ...styles.card,
                marginBottom: index === issues.length - 1 ? 16 : 0,
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
        )}
        keyExtractor={(item) => item.id}
        style={styles.list}
      />
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
