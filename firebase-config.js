// Firebase Configuration
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyDWRg7KKNAnZXF8nxNxGMKAKeoWU3uKrIs",
  authDomain: "get2together-6f197.firebaseapp.com",
  projectId: "get2together-6f197",
  storageBucket: "get2together-6f197.firebasestorage.app",
  messagingSenderId: "879682985030",
  appId: "1:879682985030:web:b539d9ab9cbd6e3c6afe47",
  measurementId: "G-R5GJ5S6KMB"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { auth, db, storage };
