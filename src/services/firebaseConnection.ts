import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDCYSGmqfa-7RBifv8ke5p0HytYaZwnr3s",
  authDomain: "webcarros-23312.firebaseapp.com",
  projectId: "webcarros-23312",
  storageBucket: "webcarros-23312.appspot.com",
  messagingSenderId: "256358722032",
  appId: "1:256358722032:web:419a1716f9ccbbaf59d535"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

export { db, auth, storage };