import { formatDateTime } from "@/utils/date";
import { supabase } from "@/utils/supabase";
import { FontAwesome } from "@expo/vector-icons";
import { Text } from "@rneui/themed";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
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
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#168676" />
      </View>
    );
  }

  if (!issue) {
    return (
      <View style={styles.container}>
        <Text>Issue not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        <View
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <Text h2 style={styles.title}>
            {issue.title}
          </Text>
          <TouchableOpacity>
            <FontAwesome name="star" size={24} color={"black"} />
          </TouchableOpacity>
        </View>

        {issue.latitude && issue.longitude ? (
          <View style={styles.mapContainer}>
            <MapView
              style={styles.map}
              initialRegion={{
                latitude: issue.latitude,
                longitude: issue.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
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
        ) : (
          <Text style={styles.noLocation}>No location data available</Text>
        )}
        <Text h4 style={styles.sectionTitle}>
          Issue Details
        </Text>
        <Text style={styles.description}>{issue.description}</Text>

        {issue?.photo_url && (
          <Image
            source={{ uri: issue?.photo_url }}
            style={{
              width: "100%",
              height: 300,
              borderRadius: 8,
              marginBottom: 12,
            }}
            resizeMode="cover"
          />
        )}

        <View style={styles.detailRow}>
          <Text style={styles.label}>Created by:</Text>
          <Text style={styles.value}>{issue.owner_email || "Loading..."}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.label}>Status:</Text>
          <Text style={styles.value}>{issue.status}</Text>
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
          <Text style={styles.label}>Created:</Text>
          <Text style={styles.value}>{formatDateTime(issue.created_at)}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.label}>Last Updated:</Text>
          <Text style={styles.value}>{formatDateTime(issue.updated_at)}</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    paddingBottom: 8,
  },
  content: {
    paddingHorizontal: 16,
    marginTop: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    color: "#168676",
  },
  detailRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  label: {
    fontWeight: "bold",
    width: 120,
    color: "#495057",
  },
  value: {
    flex: 1,
    color: "#6c757d",
  },
  sectionTitle: {
    color: "#168676",
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: "#495057",
    marginBottom: 18,
  },
  mapContainer: {
    borderRadius: 12,
    shadowColor: "#168676",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
    backgroundColor: "white",
    marginVertical: 8,
    marginBottom: 16,
  },
  map: {
    height: 250,
    width: "100%",
    borderRadius: 12,
  },
  noLocation: {
    color: "#6c757d",
    fontStyle: "italic",
    textAlign: "center",
    marginVertical: 20,
  },
});
