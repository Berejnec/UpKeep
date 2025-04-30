import { supabase } from "@/utils/supabase";
import { zodResolver } from "@hookform/resolvers/zod";
import { Session } from "@supabase/supabase-js";
import * as Location from "expo-location";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import { z } from "zod";

const addIssueSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  category: z.string().min(1, "Category is required"),
  status: z.string().min(1, "Status is required"),
  address: z.string().optional(),
  latitude: z.number(),
  longitude: z.number(),
  owner_id: z.string().optional(),
});

type AddIssueFormValues = z.infer<typeof addIssueSchema>;

export default function AddNewIssueScreen() {
  const {
    control,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AddIssueFormValues>({
    resolver: zodResolver(addIssueSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "",
      status: "OPEN",
      address: "",
      latitude: 0,
      longitude: 0,
      owner_id: "",
    },
  });

  const [mapRegion, setMapRegion] = useState<any>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [session, setSession] = useState<Session | null>(null);

  const getCurrentLocation = async () => {
    setLocationLoading(true);
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Location Permission Denied",
        "Please enable location services to report an issue."
      );
      setLocationLoading(false);
      return;
    }

    try {
      let location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      setValue("latitude", latitude);
      setValue("longitude", longitude);
      setMapRegion({
        latitude,
        longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      });
    } catch (error) {
      console.error("Error getting location:", error);
      Alert.alert(
        "Location Error",
        "Failed to retrieve your location. Please try again."
      );
    } finally {
      setLocationLoading(false);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });
    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
  }, []);

  const onMapPress = (e: any) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    setValue("latitude", latitude);
    setValue("longitude", longitude);
    setMapRegion({
      latitude,
      longitude,
      latitudeDelta: 0.005,
      longitudeDelta: 0.005,
    });
  };

  useEffect(() => {
    // getCurrentLocation();
  }, []);

  const onSubmit = async (data: AddIssueFormValues) => {
    try {
      const { error } = await supabase
        .from("issues")
        .insert([{ ...data, owner_id: session?.user.id }]);
      if (error) {
        console.error(error);
        Alert.alert("Error", "Failed to submit issue. Please try again.");
      } else {
        Alert.alert("Success", "Issue reported successfully!");
        reset();
        setMapRegion(null);
        router.push("/(tabs)/issues");
      }
    } catch (error) {
      console.error("Error submitting issue:", error);
      Alert.alert("Error", "An unexpected error occurred. Please try again.");
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.formContainer}>
        <Text style={styles.title}>Report an Issue</Text>
        <Text style={styles.label}>Title</Text>
        <Controller
          control={control}
          name="title"
          render={({ field: { onChange, value } }) => (
            <TextInput
              placeholder="Enter issue title"
              style={styles.input}
              onChangeText={onChange}
              value={value}
            />
          )}
        />
        {errors.title && (
          <Text style={styles.error}>{errors.title.message}</Text>
        )}

        <Text style={styles.label}>Description</Text>
        <Controller
          control={control}
          name="description"
          render={({ field: { onChange, value } }) => (
            <TextInput
              placeholder="Enter detailed description"
              multiline
              style={[styles.input, styles.multilineInput]}
              onChangeText={onChange}
              value={value}
            />
          )}
        />
        {errors.description && (
          <Text style={styles.error}>{errors.description.message}</Text>
        )}
        <Text style={styles.label}>Category</Text>
        <Controller
          control={control}
          name="category"
          render={({ field: { onChange, value } }) => (
            <TextInput
              placeholder="Enter category (e.g., Road, Lighting)"
              style={styles.input}
              onChangeText={onChange}
              value={value}
            />
          )}
        />
        {errors.category && (
          <Text style={styles.error}>{errors.category.message}</Text>
        )}
        <Text style={styles.label}>Status</Text>
        <Controller
          control={control}
          name="status"
          render={({ field: { onChange, value } }) => (
            <TextInput
              placeholder="Enter status (default: open)"
              style={styles.input}
              onChangeText={onChange}
              value={value}
            />
          )}
        />
        {errors.status && (
          <Text style={styles.error}>{errors.status.message}</Text>
        )}
        <Text style={styles.label}>Address (optional)</Text>
        <Controller
          control={control}
          name="address"
          render={({ field: { onChange, value } }) => (
            <TextInput
              placeholder="Enter address if known"
              style={styles.input}
              onChangeText={onChange}
              value={value}
            />
          )}
        />
        <Text style={styles.label}>Pick Location</Text>
        <TouchableOpacity
          style={styles.locationButton}
          onPress={getCurrentLocation}
          disabled={locationLoading}
        >
          {locationLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.locationButtonText}>Use Current Location</Text>
          )}
        </TouchableOpacity>

        <MapView style={styles.map} region={mapRegion} onPress={onMapPress}>
          {mapRegion && (
            <Marker
              coordinate={{
                latitude: mapRegion.latitude,
                longitude: mapRegion.longitude,
              }}
            />
          )}
        </MapView>

        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleSubmit(onSubmit)}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.submitButtonText}>Submit Issue</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    paddingTop: 12,
  },
  searchContainer: {
    marginBottom: 15,
    zIndex: 1000,
  },
  searchInput: {
    height: 50,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 6,
    paddingHorizontal: 12,
    backgroundColor: "#fff",
  },
  searchResults: {
    position: "absolute",
    top: 50,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 6,
    maxHeight: 200,
  },
  formContainer: {
    backgroundColor: "white",
    padding: 20,
    marginBottom: 32,
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 25,
    textAlign: "center",
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#444",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 6,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  multilineInput: {
    height: 100,
    textAlignVertical: "top",
  },
  error: {
    color: "#ff4444",
    fontSize: 14,
    marginBottom: 10,
  },
  locationButton: {
    backgroundColor: "#007bff",
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: "center",
    marginBottom: 15,
  },
  locationButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    flexDirection: "row",
    alignItems: "center",
  },
  map: {
    width: "100%",
    height: 200,
    borderRadius: 8,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  submitButton: {
    backgroundColor: "#28a745",
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: "center",
    marginTop: 10,
  },
  submitButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
});
