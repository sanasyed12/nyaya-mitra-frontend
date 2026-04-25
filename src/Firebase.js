// Import the functions you need from the SDKs you need
import { initializeApp } from "Firebase/app";
import { getAuth, GoogleAuthProvider } from "Firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBspHac8mnUKo6udxafafn4ifJV-PIKtx8",
  authDomain: "nyaya-mitr.firebaseapp.com",
  projectId: "nyaya-mitr",
  storageBucket: "nyaya-mitr.firebasestorage.app",
  messagingSenderId: "529050313613",
  appId: "1:529050313613:web:d796f4a3a6b2a5b71d13c4",
  measurementId: "G-K0NMQ132CV"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();