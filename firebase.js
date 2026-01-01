import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// This is the correct, native-safe auth for React Native
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

// These are YOUR keys
const firebaseConfig = {
  apiKey: "AIzaSyAGNuJXTpo0ssHWeP0niMrq_YRzHRE9Onw",
  authDomain: "animetracker-52b35.firebaseapp.com",
  projectId: "animetracker-52b35",
  storageBucket: "animetracker-52b35.firebasestorage.app",
  messagingSenderId: "1072292331385",
  appId: "1:1072292331385:web:d22ce12a6af3c15c12b9a8",
  measurementId: "G-WHYT3BSQ10"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
const db = getFirestore(app);

// Initialize native-safe auth
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});

// Export the services we need
export { db, auth };