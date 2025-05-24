import { Colors } from "@/constants/Colors";
import { supabase } from "@/utils/supabase";
import { Text } from "@rneui/themed";
import { useRouter } from "expo-router";
import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  View,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Dimensions,
  Animated,
  ScrollView,
} from "react-native";
import MapView, { Marker, Callout } from "react-native-maps";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";

const { width, height } = Dimensions.get("window");

interface Issue {
  id: string;
  latitude: number;
  longitude: number;
  address: string;
  title: string;
  description: string;
  category: string;
  status: string;
  created_at: string;
}

const MapScreen = () => {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [filteredIssues, setFilteredIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const mapRef = useRef<MapView>(null);
  const slideAnim = useRef(new Animated.Value(-300)).current;

  // Default to Romania coordinates as per memory
  const [region, setRegion] = useState({
    latitude: 45.9432,
    longitude: 24.9668,
    latitudeDelta: 8,
    longitudeDelta: 8,
  });
  const router = useRouter();

  const categories = [
    { id: "all", name: "All Issues", icon: "list" },
    { id: "road", name: "Road", icon: "directions-car" },
    { id: "lighting", name: "Lighting", icon: "lightbulb" },
    { id: "waste", name: "Waste", icon: "delete" },
    { id: "water", name: "Water", icon: "water-drop" },
    { id: "safety", name: "Safety", icon: "security" },
  ];

  useEffect(() => {
    let filtered = issues;

    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (issue) =>
          issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          issue.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          issue.address.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedCategory !== "all") {
      filtered = filtered.filter(
        (issue) =>
          issue.category.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    setFilteredIssues(filtered);
  }, [issues, searchQuery, selectedCategory]);

  const toggleFilters = () => {
    setShowFilters(!showFilters);
    Animated.timing(slideAnim, {
      toValue: showFilters ? -300 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const getMarkerColor = (category: string) => {
    switch (category.toLowerCase()) {
      case "road":
        return "#f44336";
      case "lighting":
        return "#ff9800";
      case "waste":
        return "#4caf50";
      case "water":
        return "#2196f3";
      case "safety":
        return "#9c27b0";
      default:
        return Colors.light.primaryColor;
    }
  };

  const focusOnIssue = (issue: Issue) => {
    setSelectedIssue(issue);
    mapRef.current?.animateToRegion(
      {
        latitude: issue.latitude,
        longitude: issue.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      },
      1000
    );
  };

  useEffect(() => {
    const fetchIssues = async () => {
      try {
        const { data: fetchedIssues, error } = await supabase
          .from("issues")
          .select(
            "id, latitude, longitude, address, title, description, category, status, created_at"
          )
          .not("latitude", "is", null)
          .not("longitude", "is", null);

        if (error) {
          console.error("Error fetching issues for map:", error);
          Alert.alert("Error", "Failed to load issues from the database.");
          return;
        }

        if (fetchedIssues && fetchedIssues.length > 0) {
          setIssues(fetchedIssues);

          // Calculate bounds for Romania or issues
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

          // Only update region if we have valid bounds
          if (isFinite(centerLat) && isFinite(centerLng)) {
            setRegion({
              latitude: centerLat,
              longitude: centerLng,
              latitudeDelta: Math.max(0.01, latDelta),
              longitudeDelta: Math.max(0.01, lngDelta),
            });
          }
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
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.light.primaryColor} />
          <Text style={styles.loadingText}>Loading map data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Issues Map</Text>
          <Text style={styles.headerSubtitle}>
            {filteredIssues.length} issue
            {filteredIssues.length !== 1 ? "s" : ""} found
          </Text>
        </View>
        <TouchableOpacity style={styles.filterButton} onPress={toggleFilters}>
          <MaterialIcons name="tune" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <MaterialIcons
            name="search"
            size={20}
            color="#666"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search issues..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#999"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery("")}
              style={styles.clearButton}
            >
              <MaterialIcons name="clear" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Map */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          region={region}
          showsUserLocation={true}
          showsMyLocationButton={false}
          showsCompass={false}
          toolbarEnabled={false}
        >
          {filteredIssues.map((issue) => (
            <Marker
              key={issue.id}
              coordinate={{
                latitude: issue.latitude,
                longitude: issue.longitude,
              }}
              pinColor={getMarkerColor(issue.category)}
              onPress={() => {
                setSelectedIssue(issue);
                focusOnIssue(issue);
              }}
            >
              <Callout
                onPress={() => router.push(`/issue-details/${issue.id}`)}
              >
                <View style={styles.calloutContainer}>
                  <Text style={styles.calloutTitle} numberOfLines={2}>
                    {issue.title}
                  </Text>
                  <View style={styles.calloutMeta}>
                    <View
                      style={[
                        styles.categoryBadge,
                        { backgroundColor: getMarkerColor(issue.category) },
                      ]}
                    >
                      <Text style={styles.categoryText}>{issue.category}</Text>
                    </View>
                    <Text style={styles.calloutStatus}>{issue.status}</Text>
                  </View>
                  <Text style={styles.calloutAddress} numberOfLines={1}>
                    📍 {issue.address}
                  </Text>
                  <Text style={styles.calloutTap}>Tap to view details</Text>
                </View>
              </Callout>
            </Marker>
          ))}
        </MapView>

        <View style={styles.mapControls}>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => {
              if (filteredIssues.length > 0) {
                const bounds = filteredIssues.reduce(
                  (acc, issue) => ({
                    minLat: Math.min(acc.minLat, issue.latitude),
                    maxLat: Math.max(acc.maxLat, issue.latitude),
                    minLng: Math.min(acc.minLng, issue.longitude),
                    maxLng: Math.max(acc.maxLng, issue.longitude),
                  }),
                  {
                    minLat: filteredIssues[0].latitude,
                    maxLat: filteredIssues[0].latitude,
                    minLng: filteredIssues[0].longitude,
                    maxLng: filteredIssues[0].longitude,
                  }
                );

                mapRef.current?.animateToRegion(
                  {
                    latitude: (bounds.minLat + bounds.maxLat) / 2,
                    longitude: (bounds.minLng + bounds.maxLng) / 2,
                    latitudeDelta: Math.max(
                      0.01,
                      (bounds.maxLat - bounds.minLat) * 1.3
                    ),
                    longitudeDelta: Math.max(
                      0.01,
                      (bounds.maxLng - bounds.minLng) * 1.3
                    ),
                  },
                  1000
                );
              }
            }}
          >
            <MaterialIcons
              name="center-focus-strong"
              size={24}
              color={Colors.light.primaryColor}
            />
          </TouchableOpacity>
        </View>
      </View>

      <Animated.View
        style={[
          styles.filtersPanel,
          { transform: [{ translateX: slideAnim }] },
        ]}
      >
        <View style={styles.filtersPanelHeader}>
          <Text style={styles.filtersPanelTitle}>Filter Issues</Text>
          <TouchableOpacity onPress={toggleFilters}>
            <MaterialIcons name="close" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.filtersContent}>
          <Text style={styles.filterSectionTitle}>Category</Text>
          {categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryItem,
                selectedCategory === category.id && styles.categoryItemSelected,
              ]}
              onPress={() => setSelectedCategory(category.id)}
            >
              <MaterialIcons
                name={category.icon as any}
                size={20}
                color={selectedCategory === category.id ? "white" : "#666"}
              />
              <Text
                style={[
                  styles.categoryItemText,
                  selectedCategory === category.id &&
                    styles.categoryItemTextSelected,
                ]}
              >
                {category.name}
              </Text>
              {selectedCategory === category.id && (
                <MaterialIcons name="check" size={20} color="white" />
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </Animated.View>

      {selectedIssue && (
        <View style={styles.bottomSheet}>
          <View style={styles.bottomSheetHandle} />
          <TouchableOpacity
            style={styles.bottomSheetContent}
            onPress={() => router.push(`/issue-details/${selectedIssue.id}`)}
          >
            <View style={styles.bottomSheetHeader}>
              <Text style={styles.bottomSheetTitle} numberOfLines={2}>
                {selectedIssue.title}
              </Text>
              <TouchableOpacity
                onPress={() => setSelectedIssue(null)}
                style={styles.closeBottomSheet}
              >
                <MaterialIcons name="close" size={20} color="#666" />
              </TouchableOpacity>
            </View>

            <Text style={styles.bottomSheetDescription} numberOfLines={3}>
              {selectedIssue.description}
            </Text>

            <View style={styles.bottomSheetMeta}>
              <View
                style={[
                  styles.categoryBadge,
                  { backgroundColor: getMarkerColor(selectedIssue.category) },
                ]}
              >
                <Text style={styles.categoryText}>
                  {selectedIssue.category}
                </Text>
              </View>
              <Text style={styles.bottomSheetStatus}>
                {selectedIssue.status}
              </Text>
            </View>

            <View style={styles.bottomSheetFooter}>
              <MaterialIcons name="location-on" size={16} color="#666" />
              <Text style={styles.bottomSheetAddress} numberOfLines={1}>
                {selectedIssue.address}
              </Text>
              <MaterialIcons name="chevron-right" size={20} color="#ccc" />
            </View>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
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
  header: {
    backgroundColor: Colors.light.primaryColor,
    paddingTop: 24,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "flex-end",
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
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
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#333",
    padding: 0,
  },
  clearButton: {
    padding: 4,
  },
  mapContainer: {
    flex: 1,
    position: "relative",
  },
  map: {
    width: "100%",
    height: "100%",
  },
  mapControls: {
    position: "absolute",
    top: 16,
    right: 16,
  },
  controlButton: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 12,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  calloutContainer: {
    width: 200,
    padding: 12,
  },
  calloutTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  calloutMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryText: {
    fontSize: 10,
    color: "white",
    fontWeight: "600",
    textTransform: "uppercase",
  },
  calloutStatus: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
  },
  calloutAddress: {
    fontSize: 12,
    color: "#666",
    marginBottom: 8,
  },
  calloutTap: {
    fontSize: 11,
    color: Colors.light.primaryColor,
    fontWeight: "600",
    textAlign: "center",
  },
  filtersPanel: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 280,
    backgroundColor: "white",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  filtersPanelHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f3f4",
  },
  filtersPanelTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  filtersContent: {
    flex: 1,
    padding: 20,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 16,
  },
  categoryItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    gap: 12,
  },
  categoryItemSelected: {
    backgroundColor: Colors.light.primaryColor,
  },
  categoryItemText: {
    flex: 1,
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  categoryItemTextSelected: {
    color: "white",
  },
  bottomSheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  bottomSheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: "#ddd",
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 8,
    marginBottom: 16,
  },
  bottomSheetContent: {
    padding: 20,
  },
  bottomSheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  bottomSheetTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginRight: 12,
  },
  closeBottomSheet: {
    padding: 4,
  },
  bottomSheetDescription: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    marginBottom: 16,
  },
  bottomSheetMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  bottomSheetStatus: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
  },
  bottomSheetFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  bottomSheetAddress: {
    flex: 1,
    fontSize: 14,
    color: "#666",
  },
});

export default MapScreen;
