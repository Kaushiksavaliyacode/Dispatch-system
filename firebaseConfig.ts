import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD5aAS5dPDWOIejnYK6C-pp8BBHiajrG4g",
  authDomain: "rdms-55601.firebaseapp.com",
  projectId: "rdms-55601",
  storageBucket: "rdms-55601.firebasestorage.app",
  messagingSenderId: "88273977398",
  appId: "1:88273977398:web:e3fe4b6b137e09363c9897",
  measurementId: "G-30X23H9S2K"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore (Database)
export const db = getFirestore(app);
