import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCddFzhaJmFIeL2HMdG2-QBR1QQq5_U6dQ",
  authDomain: "portfolio-4e3dc.firebaseapp.com",
  projectId: "portfolio-4e3dc",
  storageBucket: "portfolio-4e3dc.firebasestorage.app",
  messagingSenderId: "860985474347",
  appId: "1:860985474347:web:d33071f3e1dc28f5cb596e",
  measurementId: "G-X07QRJGNGZ"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage, firebaseConfig };
