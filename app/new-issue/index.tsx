import { supabase } from "@/utils/supabase";
import { zodResolver } from "@hookform/resolvers/zod";
import { Session } from "@supabase/supabase-js";
import * as Location from "expo-location";
import { router, Stack } from "expo-router";
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
  SafeAreaView,
  Dimensions,
  Modal,
} from "react-native";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/Colors";

const { width } = Dimensions.get("window");
import MapView, { Marker } from "react-native-maps";
import { z } from "zod";
import * as ImagePicker from "expo-image-picker";
import uuid from "react-native-uuid";
import { Image } from "react-native";
import { decode } from "base64-arraybuffer";
import * as FileSystem from "expo-file-system";
import { createNewIssueNotifications } from "@/utils/notifications";
import { LinearGradient } from "expo-linear-gradient";

const categories = [
  { id: "road", name: "Road", icon: "directions-car" },
  { id: "lighting", name: "Lighting", icon: "lightbulb" },
  { id: "waste", name: "Waste", icon: "delete" },
  { id: "water", name: "Water", icon: "water-drop" },
  { id: "safety", name: "Safety", icon: "security" },
  { id: "other", name: "Other", icon: "more-horiz" },
];

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
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  const handleCategorySelect = (
    categoryId: string,
    onChange: (value: string) => void
  ) => {
    setSelectedCategory(categoryId);
    onChange(categoryId);
    setCategoryModalVisible(false);
  };

  const getCategoryDisplayName = (categoryId: string) => {
    const category = categories.find((cat) => cat.id === categoryId);
    return category ? category.name : "";
  };

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

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsEditing: true,
      quality: 0.7,
    });

    if (!result.canceled && result.assets.length > 0) {
      setImageUri(result.assets[0].uri);
    }
  };

  const uploadImageToSupabase = async (uri: string) => {
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: "base64",
    });
    const filePath = `${uuid.v4()}.png`;
    const contentType = "image/png";
    const { error } = await supabase.storage
      .from("avatars")
      .upload(filePath, decode(base64), { contentType, upsert: true });

    if (error) throw error;

    const { data: publicUrlData } = supabase.storage
      .from("avatars")
      .getPublicUrl(filePath);

    return publicUrlData?.publicUrl ?? null;
  };

  const onSubmit = async (data: AddIssueFormValues) => {
    try {
      let photoUrl: string | null = null;

      if (imageUri) {
        photoUrl = await uploadImageToSupabase(imageUri);
      }

      const { data: insertedIssue, error } = await supabase
        .from("issues")
        .insert([
          {
            ...data,
            owner_id: session?.user.id,
            photo_url: photoUrl,
          },
        ])
        .select()
        .single();

      if (error) {
        console.error(error);
        Alert.alert("Error", "Failed to submit issue. Please try again.");
      } else {
        // Create notifications for all admin users
        if (insertedIssue) {
          await createNewIssueNotifications(
            insertedIssue.id,
            insertedIssue.title
          );
        }

        Alert.alert("Success", "Issue reported successfully!");
        reset();
        setMapRegion(null);
        setImageUri(null);
        router.push("/(tabs)/issues");
      }
    } catch (error) {
      console.error("Error submitting issue:", error);
      Alert.alert("Error", "An unexpected error occurred. Please try again.");
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
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <View style={styles.headerContent}>
              <Text style={styles.headerTitle}>Report Issue</Text>
              <Text style={styles.headerSubtitle}>
                Help improve your community
              </Text>
            </View>
          </View>
        </LinearGradient>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Basic Information Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <MaterialIcons
                name="info"
                size={24}
                color={Colors.light.primaryColor}
              />
              <Text style={styles.cardTitle}>Basic Information</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Issue Title *</Text>
              <Controller
                control={control}
                name="title"
                render={({ field: { onChange, value } }) => (
                  <View style={styles.inputContainer}>
                    <MaterialIcons
                      name="title"
                      size={20}
                      color="#666"
                      style={styles.inputIcon}
                    />
                    <TextInput
                      placeholder="What's the problem?"
                      style={styles.input}
                      onChangeText={onChange}
                      value={value}
                      placeholderTextColor="#999"
                    />
                  </View>
                )}
              />
              {errors.title && (
                <Text style={styles.error}>{errors.title.message}</Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description *</Text>
              <Controller
                control={control}
                name="description"
                render={({ field: { onChange, value } }) => (
                  <View
                    style={[styles.inputContainer, styles.multilineContainer]}
                  >
                    <MaterialIcons
                      name="description"
                      size={20}
                      color="#666"
                      style={styles.inputIconTop}
                    />
                    <TextInput
                      placeholder="Provide detailed information about the issue..."
                      multiline
                      style={[styles.input, styles.multilineInput]}
                      onChangeText={onChange}
                      value={value}
                      placeholderTextColor="#999"
                      textAlignVertical="top"
                    />
                  </View>
                )}
              />
              {errors.description && (
                <Text style={styles.error}>{errors.description.message}</Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Category *</Text>
              <Controller
                control={control}
                name="category"
                render={({ field: { onChange, value } }) => (
                  <TouchableOpacity
                    style={styles.categorySelector}
                    onPress={() => setCategoryModalVisible(true)}
                  >
                    <MaterialIcons
                      name="category"
                      size={20}
                      color="#666"
                      style={styles.inputIcon}
                    />
                    <Text
                      style={[
                        styles.categorySelectorText,
                        !value && styles.placeholderText,
                      ]}
                    >
                      {value
                        ? getCategoryDisplayName(value)
                        : "Select a category"}
                    </Text>
                    <MaterialIcons
                      name="keyboard-arrow-down"
                      size={20}
                      color="#666"
                    />
                  </TouchableOpacity>
                )}
              />
              {errors.category && (
                <Text style={styles.error}>{errors.category.message}</Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Address (Optional)</Text>
              <Controller
                control={control}
                name="address"
                render={({ field: { onChange, value } }) => (
                  <View style={styles.inputContainer}>
                    <MaterialIcons
                      name="location-on"
                      size={20}
                      color="#666"
                      style={styles.inputIcon}
                    />
                    <TextInput
                      placeholder="Street address or landmark"
                      style={styles.input}
                      onChangeText={onChange}
                      value={value}
                      placeholderTextColor="#999"
                    />
                  </View>
                )}
              />
            </View>
          </View>

          {/* Location Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <MaterialIcons
                name="place"
                size={24}
                color={Colors.light.primaryColor}
              />
              <Text style={styles.cardTitle}>Location</Text>
            </View>

            <TouchableOpacity
              style={styles.locationButton}
              onPress={getCurrentLocation}
              disabled={locationLoading}
            >
              <View style={styles.buttonContent}>
                {locationLoading ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <MaterialIcons name="my-location" size={20} color="white" />
                )}
                <Text style={styles.locationButtonText}>
                  {locationLoading
                    ? "Getting Location..."
                    : "Use Current Location"}
                </Text>
              </View>
            </TouchableOpacity>

            <View style={styles.mapContainer}>
              <MapView
                style={styles.map}
                region={mapRegion}
                onPress={onMapPress}
              >
                {mapRegion && (
                  <Marker
                    coordinate={{
                      latitude: mapRegion.latitude,
                      longitude: mapRegion.longitude,
                    }}
                    title="Issue Location"
                    description="Tap to adjust position"
                  />
                )}
              </MapView>
              {!mapRegion && (
                <View style={styles.mapPlaceholder}>
                  <MaterialIcons name="map" size={48} color="#ccc" />
                  <Text style={styles.mapPlaceholderText}>
                    Tap "Use Current Location" or tap on the map to set location
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Photo Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <MaterialIcons
                name="photo-camera"
                size={24}
                color={Colors.light.primaryColor}
              />
              <Text style={styles.cardTitle}>Photo Evidence</Text>
            </View>

            <TouchableOpacity style={styles.photoButton} onPress={pickImage}>
              <View style={styles.buttonContent}>
                <MaterialIcons
                  name="add-a-photo"
                  size={20}
                  color={Colors.light.primaryColor}
                />
                <Text style={styles.photoButtonText}>
                  {imageUri ? "Change Photo" : "Add Photo"}
                </Text>
              </View>
            </TouchableOpacity>

            {imageUri && (
              <View style={styles.imageContainer}>
                <Image
                  source={{ uri: imageUri }}
                  style={styles.previewImage}
                  resizeMode="cover"
                />
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={() => setImageUri(null)}
                >
                  <MaterialIcons name="close" size={20} color="white" />
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              isSubmitting && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit(onSubmit)}
            disabled={isSubmitting}
          >
            <View style={styles.buttonContent}>
              {isSubmitting ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <MaterialIcons name="send" size={20} color="white" />
              )}
              <Text style={styles.submitButtonText}>
                {isSubmitting ? "Submitting..." : "Submit Issue"}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Bottom Spacing */}
          <View style={styles.bottomSpacing} />
        </ScrollView>

        {/* Category Selection Modal */}
        <Modal
          visible={categoryModalVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setCategoryModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Category</Text>
                <TouchableOpacity
                  onPress={() => setCategoryModalVisible(false)}
                  style={styles.modalCloseButton}
                >
                  <MaterialIcons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>

              <Controller
                control={control}
                name="category"
                render={({ field: { onChange } }) => (
                  <ScrollView style={styles.categoryList}>
                    {categories.map((category) => (
                      <TouchableOpacity
                        key={category.id}
                        style={styles.categoryOption}
                        onPress={() =>
                          handleCategorySelect(category.id, onChange)
                        }
                      >
                        <MaterialIcons
                          name={category.icon as any}
                          size={24}
                          color={Colors.light.primaryColor}
                        />
                        <Text style={styles.categoryOptionText}>
                          {category.name}
                        </Text>
                        <MaterialIcons
                          name="chevron-right"
                          size={20}
                          color="#ccc"
                        />
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
              />
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    paddingTop: 10,
    paddingBottom: 10,
    paddingHorizontal: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    marginBottom: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
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

  // Scroll View Styles
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },

  // Card Styles
  card: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    gap: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },

  // Input Styles
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e9ecef",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  multilineContainer: {
    alignItems: "flex-start",
    paddingVertical: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  inputIconTop: {
    marginRight: 12,
    marginTop: 2,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#333",
    padding: 0,
  },
  multilineInput: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  error: {
    color: "#dc3545",
    fontSize: 14,
    marginTop: 4,
    marginLeft: 4,
  },

  // Button Styles
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  locationButton: {
    backgroundColor: Colors.light.primaryColor,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  locationButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  photoButton: {
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderWidth: 2,
    borderColor: Colors.light.primaryColor,
    borderStyle: "dashed",
    marginBottom: 16,
  },
  photoButtonText: {
    color: Colors.light.primaryColor,
    fontSize: 16,
    fontWeight: "600",
  },
  submitButton: {
    backgroundColor: Colors.light.primaryColor,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  submitButtonDisabled: {
    backgroundColor: "#ccc",
    elevation: 0,
  },
  submitButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },

  // Map Styles
  mapContainer: {
    borderRadius: 12,
    overflow: "hidden",
    height: 200,
    backgroundColor: "#f8f9fa",
    position: "relative",
  },
  map: {
    width: "100%",
    height: "100%",
  },
  mapPlaceholder: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    padding: 20,
  },
  mapPlaceholderText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginTop: 12,
    lineHeight: 20,
  },

  // Image Styles
  imageContainer: {
    position: "relative",
    borderRadius: 12,
    overflow: "hidden",
  },
  previewImage: {
    width: "100%",
    height: 200,
    borderRadius: 12,
  },
  removeImageButton: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 16,
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },

  // Category Selector Styles
  categorySelector: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e9ecef",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  categorySelectorText: {
    flex: 1,
    fontSize: 16,
    color: "#333",
  },
  placeholderText: {
    color: "#999",
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "70%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  modalCloseButton: {
    padding: 4,
  },
  categoryList: {
    maxHeight: 400,
  },
  categoryOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  categoryOptionText: {
    flex: 1,
    fontSize: 16,
    color: "#333",
    marginLeft: 12,
  },

  // Spacing
  bottomSpacing: {
    height: 40,
  },
});
