import { initializeApp, getApps, getApp } from "firebase/app";

import {
    initializeAuth,
    getReactNativePersistence,
    browserLocalPersistence,
    getAuth,
} from "firebase/auth";

import { getFirestore } from "firebase/firestore";

import { getAnalytics } from "firebase/analytics";

import AsyncStorage from "@react-native-async-storage/async-storage";

import { Platform } from "react-native";

const firebaseConfig = {
    apiKey: "AIzaSyD9IOWFZvuDHXwi5rDE5z2gcyDTUoUvXv8",
    authDomain: "techxitapp.firebaseapp.com",
    projectId: "techxitapp",
    storageBucket: "techxitapp.firebasestorage.app",
    messagingSenderId: "720388907069",
    appId: "1:720388907069:web:344ca93827358f7d034a54",
    measurementId: "G-JKH241SXMP",
};

// Initialize or reuse existing Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth with persistent storage across app restarts
let auth;

try {
    if (Platform.OS === "web") {
        auth = initializeAuth(app, {
            persistence: browserLocalPersistence,
        });
    } else {
        auth = initializeAuth(app, {
            persistence: getReactNativePersistence(AsyncStorage),
        });
    }
} catch (e) {
    // If Auth is already initialized (e.g. during fast refresh or module re-import)
    auth = getAuth(app);
}

// Initialize Firestore
const db = getFirestore(app);

// Analytics only on Web
let analytics = null;
if (Platform.OS === "web") {
    try {
        analytics = getAnalytics(app);
    } catch (e) {
        // Analytics may fail in certain browser private modes
    }
}

export {
    app,
    auth,
    db,
    analytics,
};


