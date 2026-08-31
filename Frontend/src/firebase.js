import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, serverTimestamp } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyCwo8AWA73WhLOQ1FeHuroRSDlUg1GXhB8",
  authDomain: "awdf-ba2b7.firebaseapp.com",
  databaseURL: "https://awdf-ba2b7-default-rtdb.firebaseio.com",
  projectId: "awdf-ba2b7",
  storageBucket: "awdf-ba2b7.firebasestorage.app",
  messagingSenderId: "989761754888",
  appId: "1:989761754888:web:c2f67dba9bc18e3e873ebd"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);

export const saveRepo = async (repo, repoId) => {
  try {
    await set(ref(db, 'githubRepos/' + repoId), {
      ...repo,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    console.log('Repo saved to Real-time Database');
  } catch (error) {
    console.error('Error saving repo:', error);
  }
};