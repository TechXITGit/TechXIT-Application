import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";

import React, { useEffect, useState } from "react";

import { SafeAreaView } from "react-native-safe-area-context";

import { auth, db } from "../firebaseConfig";

import { doc, getDoc, setDoc } from "firebase/firestore";

import { User, Save } from "lucide-react-native";

const Profile = ({ navigation }) => {
  const user = auth.currentUser;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [designation, setDesignation] = useState("");
  const [skills, setSkills] = useState("");
  const [bio, setBio] = useState("");
  const [role, setRole] = useState("client");

  const showWorkFields = role === "employee" || role === "admin";

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const userRef = doc(db, "users", user.uid);

        const snapshot = await getDoc(userRef);

        if (snapshot.exists()) {
          const data = snapshot.data();

          setName(data.name || user.displayName || "");

          setEmail(data.email || user.email || "");

          setPhone(data.phone || "");

          setDesignation(data.designation || "");

          setSkills(
            Array.isArray(data.skills)
              ? data.skills.join(", ")
              : data.skills || "",
          );

          setBio(data.bio || "");

          setRole(data.role || "client");
        } else {
          setName(user.displayName || "");

          setEmail(user.email || "");
        }
      } catch (error) {
        console.log("Profile load error:", error.message);

        Alert.alert("Error", "Could not load your profile.");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const handleSave = async () => {
    if (!user) {
      Alert.alert("Error", "Please login again.");
      return;
    }

    if (!name.trim()) {
      Alert.alert("Missing Name", "Please enter your name.");
      return;
    }

    setSaving(true);

    try {
      const skillsArray = skills
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

      const profileData = {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        bio: bio.trim(),
      };

      if (showWorkFields) {
        profileData.designation = designation.trim();
        profileData.skills = skillsArray;
      }

      await setDoc(doc(db, "users", user.uid), profileData, {
        merge: true,
      });

      Alert.alert(
        "Profile Updated",
        "Your profile has been saved successfully.",
      );
    } catch (error) {
      console.log("Profile save error:", error.message);

      Alert.alert("Error", "Could not save your profile.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#1e90ff" />

          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.container}
      >
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => {
            if (navigation.canGoBack()) {
              navigation.goBack();
            } else {
              navigation.navigate('Home');
            }
          }}
        >
          <Text style={styles.backBtnText}>‹ Back</Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <View style={styles.avatar}>
            <User size={38} color="#1e90ff" />
          </View>

          <Text style={styles.title}>My Profile</Text>

          <Text style={styles.role}>{role.toUpperCase()}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Full Name</Text>

          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Enter your name"
            placeholderTextColor="#8fa8bf"
          />

          <Text style={styles.label}>Email</Text>

          <TextInput
            style={[styles.input, styles.disabledInput]}
            value={email}
            editable={false}
          />

          <Text style={styles.label}>Phone</Text>

          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            placeholder="Enter phone number"
            placeholderTextColor="#8fa8bf"
            keyboardType="phone-pad"
          />

          {showWorkFields && (
            <>
              <Text style={styles.label}>Designation</Text>

              <TextInput
                style={styles.input}
                value={designation}
                onChangeText={setDesignation}
                placeholder="e.g. React Native Developer"
                placeholderTextColor="#8fa8bf"
              />

              <Text style={styles.label}>Skills</Text>

              <TextInput
                style={styles.input}
                value={skills}
                onChangeText={setSkills}
                placeholder="React, React Native, Firebase"
                placeholderTextColor="#8fa8bf"
              />

              <Text style={styles.helper}>Separate skills with commas</Text>
            </>
          )}

          <Text style={styles.label}>Bio</Text>

          <TextInput
            style={[styles.input, styles.textArea]}
            value={bio}
            onChangeText={setBio}
            placeholder="Tell us about yourself..."
            placeholderTextColor="#8fa8bf"
            multiline
            textAlignVertical="top"
          />

          <TouchableOpacity
            style={[styles.saveBtn, saving && styles.disabledBtn]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <>
                <Save size={18} color="#ffffff" />

                <Text style={styles.saveText}>Save Profile</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Profile;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fdfdfd",
  },

  container: {
    paddingBottom: 35,
  },

  backBtn: {
    paddingHorizontal: 15,
    paddingTop: 15,
    paddingBottom: 5,
  },

  backBtnText: {
    fontSize: 16,
    color: "#1e90ff",
    fontWeight: "600",
  },

  header: {
    alignItems: "center",
    paddingVertical: 20,
  },

  avatar: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: "#eaf6ff",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },

  title: {
    fontSize: 25,
    fontWeight: "bold",
    color: "#0b3d5c",
  },

  role: {
    marginTop: 5,
    fontSize: 11,
    fontWeight: "700",
    color: "#1e90ff",
    letterSpacing: 1,
  },

  card: {
    backgroundColor: "#ffffff",
    marginHorizontal: 20,
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: "#eaeaea",
    elevation: 2,
  },

  label: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0b3d5c",
    marginTop: 13,
    marginBottom: 6,
  },

  input: {
    height: 50,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: "#cfe9fb",
    backgroundColor: "#f2faff",
    paddingHorizontal: 14,
    color: "#0b3d5c",
    fontSize: 15,
  },

  disabledInput: {
    opacity: 0.65,
  },

  textArea: {
    height: 100,
    paddingTop: 13,
  },

  helper: {
    fontSize: 11,
    color: "#8fa8bf",
    marginTop: 4,
  },

  saveBtn: {
    height: 52,
    borderRadius: 14,
    backgroundColor: "#1e90ff",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginTop: 25,
  },

  disabledBtn: {
    opacity: 0.7,
  },

  saveText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
  },

  centerBox: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  loadingText: {
    marginTop: 10,
    color: "#8fa8bf",
  },
});
