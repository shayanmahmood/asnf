// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDJnMhRjt6pqIWdYYR1vW6OTia3ymU8Njo",
  authDomain: "asnf-e6798.firebaseapp.com",
  projectId: "asnf-e6798",
  storageBucket: "asnf-e6798.firebasestorage.app",
  messagingSenderId: "758949996176",
  appId: "1:758949996176:web:55551b586522a6d7ce9a15",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
export { db };
