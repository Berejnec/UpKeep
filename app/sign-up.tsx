import { supabase } from "@/utils/supabase";
import { Input } from "@rneui/themed";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { Colors } from "@/constants/Colors";
import { Picker } from "@react-native-picker/picker";

export default function SignUpScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState("USER");

  const router = useRouter();

  async function signUpWithEmail() {
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role,
        },
      },
    });

    if (error) Alert.alert("Sign Up Error", error.message);
    if (!error) {
      Alert.alert("Success", "Please check your inbox for email verification!");
      router.push("/sign-in");
    }
    setLoading(false);
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Sign Up to UpKeep</Text>
      </View>
      <View style={styles.formContainer}>
        <Input
          label="Email"
          leftIcon={<FontAwesome name="envelope" size={20} color="gray" />}
          onChangeText={(text) => setEmail(text)}
          value={email}
          placeholder="email@address.com"
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <Input
          label="Password"
          leftIcon={<FontAwesome name="lock" size={24} color="gray" />}
          onChangeText={(text) => setPassword(text)}
          value={password}
          secureTextEntry
          placeholder="Password"
          autoCapitalize="none"
        />

        <View style={{ paddingHorizontal: 8 }}>
          <View style={{ display: "flex", flexDirection: "row" }}>
            <FontAwesome
              name="shield"
              size={24}
              color="gray"
              style={{ marginRight: 8 }}
            />
            <Text
              style={{
                marginBottom: 5,
                color: "gray",
                fontWeight: "bold",
                fontSize: 18,
              }}
            >
              Role
            </Text>
          </View>

          <Picker
            selectedValue={role}
            onValueChange={(itemValue) => setRole(itemValue)}
            style={{ backgroundColor: "#f0f0f0", borderRadius: 6 }}
          >
            <Picker.Item label="User" value="USER" />
            <Picker.Item label="Admin" value="ADMIN" />
          </Picker>
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={signUpWithEmail}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.buttonText}>Sign Up</Text>
          )}
        </TouchableOpacity>
      </View>
      <TouchableOpacity onPress={() => router.push("/sign-in")}>
        <Text style={styles.signInLink}>Already have an account? Sign In</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  header: {
    marginBottom: 30,
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  formContainer: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  button: {
    backgroundColor: Colors.light.primaryColor,
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: "center",
    marginTop: 20,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  signInLink: {
    marginTop: 20,
    textAlign: "center",
    color: Colors.light.primaryColor,
    fontSize: 16,
    fontWeight: "bold",
  },
});
