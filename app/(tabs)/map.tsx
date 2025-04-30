import { supabase } from "@/utils/supabase";
import { Text } from "@rneui/themed";
import { useRouter } from "expo-router";
import React, { useState, useEffect } from "react";
import { StyleSheet, View, ActivityIndicator, Alert } from "react-native";
import MapView, { Marker } from "react-native-maps";

interface Issue {
  id: string;
  latitude: number;
  longitude: number;
  address: string;
  title: string;
}

const MapScreen = () => {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [region, setRegion] = useState({
    latitude: 37.7749,
    longitude: -122.4194,
    latitudeDelta: 25,
    longitudeDelta: 25,
  });
  const router = useRouter();

  useEffect(() => {
    const fetchIssues = async () => {
      try {
        const { data: fetchedIssues, error } = await supabase
          .from("issues")
          .select("id, latitude, longitude, address, title")
          .not("latitude", "is", null)
          .not("longitude", "is", null);

        if (error) {
          console.error("Error fetching issues for map:", error);
          Alert.alert("Error", "Failed to load issues from the database.");
          return;
        }

        if (fetchedIssues && fetchedIssues.length > 0) {
          setIssues(fetchedIssues);
          let maxLat = -Infinity;
          let minLat = Infinity;
          let maxLng = -Infinity;
          let minLng = Infinity;

          fetchedIssues.forEach((issue) => {
            maxLat = Math.max(maxLat, issue.latitude);
            minLat = Math.min(minLat, issue.latitude);
            maxLng = Math.max(maxLng, issue.longitude);
            minLng = Math.min(minLng, issue.longitude);
          });

          const centerLat = (maxLat + minLat) / 2;
          const centerLng = (maxLng + minLng) / 2;
          const latDelta = (maxLat - minLat) * 1.3;
          const lngDelta = (maxLng - minLng) * 1.3;
          setRegion({
            latitude: centerLat,
            longitude: centerLng,
            latitudeDelta: Math.max(0.005, latDelta),
            longitudeDelta: Math.max(0.005, lngDelta),
          });
        } else {
          Alert.alert(
            "No Issues",
            "There are no issues to display on the map."
          );
        }
      } catch (error) {
        console.error("Error fetching issues:", error);
        Alert.alert("Error", "Failed to load issues.");
      } finally {
        setLoading(false);
      }
    };

    fetchIssues();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007BFF" />
        <Text style={styles.loadingText}>Loading Issues...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView style={styles.map} region={region}>
        {issues.map((issue) => (
          <Marker
            key={issue.id}
            coordinate={{
              latitude: issue.latitude,
              longitude: issue.longitude,
            }}
            title={issue.title}
            description={issue.address}
            onCalloutPress={() => router.push(`/issue-details/${issue.id}`)}
          />
        ))}
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: "100%",
    height: "100%",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
});

export default MapScreen;
