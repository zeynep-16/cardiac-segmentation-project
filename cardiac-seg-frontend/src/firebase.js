import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAFa8iFHrYsnU42bZghx34XZ94FQ6qiuOM",
  authDomain: "cardiac-mri-seg.firebaseapp.com",
  projectId: "cardiac-mri-seg",
  storageBucket: "cardiac-mri-seg.appspot.com",
  messagingSenderId: "955437450166",
  appId: "1:955437450166:web:6bef76bbc67a12003af717",
  measurementId: "G-9E8KQMY3LT"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
