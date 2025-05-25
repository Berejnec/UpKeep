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
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { FontAwesome, MaterialIcons } from "@expo/vector-icons";
import { Colors } from "@/constants/Colors";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { AuthLogo } from "@/components/Logo";

export default function SignInScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function signInWithEmail() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) Alert.alert("Sign In Error", error.message);
    setLoading(false);

    if (!error) {
      router.replace("/(tabs)/issues");
    }
  }

  return (
    <>
      <StatusBar style="light" />
      <LinearGradient
        colors={[Colors.light.primaryColor, "#0a5d54", "#083d36"]}
        style={styles.container}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardAvoidingView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
          >
            {/* Header Section */}
            <View style={styles.header}>
              <AuthLogo />
              <Text style={styles.title}>Welcome Back</Text>
              <Text style={styles.subtitle}>Sign in to UpKeep</Text>
            </View>

            {/* Form Section */}
            <View style={styles.formContainer}>
              <View style={styles.inputContainer}>
                <Input
                  label="Email"
                  labelStyle={styles.inputLabel}
                  leftIcon={
                    <FontAwesome
                      name="envelope"
                      size={20}
                      color={Colors.light.primaryColor}
                    />
                  }
                  onChangeText={(text) => setEmail(text)}
                  value={email}
                  placeholder="email@address.com"
                  placeholderTextColor="#999"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  inputContainerStyle={styles.inputField}
                  containerStyle={styles.inputWrapper}
                />
              </View>

              <View style={styles.inputContainer}>
                <Input
                  label="Password"
                  labelStyle={styles.inputLabel}
                  leftIcon={
                    <FontAwesome
                      name="lock"
                      size={24}
                      color={Colors.light.primaryColor}
                    />
                  }
                  onChangeText={(text) => setPassword(text)}
                  value={password}
                  secureTextEntry
                  placeholder="Password"
                  placeholderTextColor="#999"
                  autoCapitalize="none"
                  inputContainerStyle={styles.inputField}
                  containerStyle={styles.inputWrapper}
                />
              </View>

              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={signInWithEmail}
                disabled={loading}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={
                    loading
                      ? ["#ccc", "#999"]
                      : [Colors.light.primaryColor, "#0a5d54"]
                  }
                  style={styles.buttonGradient}
                >
                  {loading ? (
                    <ActivityIndicator color="white" size="small" />
                  ) : (
                    <>
                      <MaterialIcons
                        name="login"
                        size={20}
                        color="white"
                        style={styles.buttonIcon}
                      />
                      <Text style={styles.buttonText}>Sign In</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* Footer Section */}
            <View style={styles.footer}>
              <TouchableOpacity
                onPress={() => router.push("/sign-up")}
                style={styles.linkContainer}
                activeOpacity={0.7}
              >
                <Text style={styles.signUpText}>Don't have an account? </Text>
                <Text style={styles.signUpLink}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
    paddingTop: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "white",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 18,
    color: "rgba(255, 255, 255, 0.8)",
    textAlign: "center",
  },
  formContainer: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 30,
    marginHorizontal: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputWrapper: {
    paddingHorizontal: 0,
  },
  inputLabel: {
    color: Colors.light.primaryColor,
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  inputField: {
    borderBottomWidth: 2,
    borderBottomColor: "#e0e0e0",
    paddingBottom: 8,
    backgroundColor: "transparent",
  },
  button: {
    marginTop: 30,
    borderRadius: 15,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 30,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  footer: {
    marginTop: 40,
    alignItems: "center",
  },
  linkContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  signUpText: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 16,
  },
  signUpLink: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    textDecorationLine: "underline",
  },
});
