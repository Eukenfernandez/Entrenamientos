
import { User, UserData, VideoFile, StrengthRecord, ThrowRecord, PlanFileMetadata, UserProfile, ExerciseDef } from '../types';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, updateDoc, collection, getDocs, deleteDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

// --- CONFIGURACIÓN DE FIREBASE ---
const firebaseConfig = {
  apiKey: "AIzaSyAiSaQ_H7Ja3rLg2IPm_7k6lZL_XmWaPX4",
  authDomain: "entrenamientos-bfac2.firebaseapp.com",
  projectId: "entrenamientos-bfac2",
  storageBucket: "entrenamientos-bfac2.firebasestorage.app",
  messagingSenderId: "708498062460",
  appId: "1:708498062460:web:83cb6635febcd927d75df9"
};

// Detect if Firebase is configured
const isFirebaseConfigured = !!firebaseConfig.apiKey;

let auth: any;
let db: any;
let storage: any;

if (isFirebaseConfigured) {
  try {
    const app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
    console.log("Firebase initialized successfully");
  } catch (e) {
    console.error("Firebase initialization failed:", e);
  }
}

// --- CONSTANTS FOR LOCAL MODE ---
const USERS_KEY = 'coachai_users';
const CURRENT_USER_KEY = 'coachai_current_user';
const DATA_PREFIX = 'coachai_data_';

// Default exercises
const DEFAULT_EXERCISES: ExerciseDef[] = [
  { name: 'Press Banca', unit: 'kg' },
  { name: 'Sentadilla', unit: 'kg' },
  { name: 'Cargada', unit: 'kg' },
  { name: 'Pull Over', unit: 'kg' },
  { name: 'Arrancada', unit: 'kg' },
  { name: 'Hip Thrust', unit: 'kg' },
  { name: 'Salto Vertical', unit: 'cm' }
];

// --- INDEXED DB FOR LOCAL VIDEO FILES (Caching) ---
const DB_NAME = 'CoachAI_VideoDB';
const STORE_NAME = 'videos';

export const VideoStorage = {
  openDB: (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      request.onupgradeneeded = (e) => {
        const db = (e.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
    });
  },

  saveVideo: async (id: string, blob: Blob): Promise<void> => {
    const db = await VideoStorage.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.put(blob, id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  getVideo: async (id: string): Promise<Blob | null> => {
    const db = await VideoStorage.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => resolve(null);
    });
  },

  deleteVideo: async (id: string): Promise<void> => {
    const db = await VideoStorage.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
};

// --- STORAGE SERVICE INTERFACE ---

export const StorageService = {
  
  isCloudMode: (): boolean => isFirebaseConfigured,

  // --- AUTH ---

  register: async (username: string, password: string): Promise<User> => {
    const cleanUsername = username.trim();
    const cleanPassword = password.trim();

    if (isFirebaseConfigured) {
       // CLOUD REGISTER
       const userCredential = await createUserWithEmailAndPassword(auth, cleanUsername, cleanPassword);
       const fbUser = userCredential.user;
       const newUser: User = {
         id: fbUser.uid,
         username: fbUser.email || cleanUsername,
         createdAt: new Date().toISOString()
       };
       // Initialize Data in Firestore
       const initialData: UserData = {
        videos: [],
        plans: [],
        strengthRecords: [],
        competitionRecords: [],
        trainingRecords: [],
        customExercises: DEFAULT_EXERCISES
       };
       await setDoc(doc(db, "users", newUser.id), { profile: null, ...newUser }); // Base user doc
       await setDoc(doc(db, "userdata", newUser.id), initialData); // Data doc
       
       return newUser;
    } else {
       // LOCAL REGISTER
       const users = StorageService._getLocalUsers();
       if (users.find(u => u.username.toLowerCase() === cleanUsername.toLowerCase())) {
         throw new Error('Usuario ya existe (Local).');
       }
       const newUser: User = {
         id: Date.now().toString(),
         username: cleanUsername,
         password: cleanPassword,
         createdAt: new Date().toISOString()
       };
       users.push(newUser);
       localStorage.setItem(USERS_KEY, JSON.stringify(users));
       
       const initialData: UserData = {
         videos: [],
         plans: [],
         strengthRecords: [],
         competitionRecords: [],
         trainingRecords: [],
         customExercises: DEFAULT_EXERCISES
       };
       StorageService._saveLocalUserData(newUser.id, initialData);
       localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(newUser));
       return newUser;
    }
  },

  login: async (username: string, password: string): Promise<User> => {
    const cleanUsername = username.trim();
    const cleanPassword = password.trim();

    // ADMIN BACKDOOR (Always Local Logic for Safety)
    if (cleanUsername === 'admin@coachai.com' && cleanPassword === 'masterkey_root_2024') {
      const adminUser: User = {
        id: 'ADMIN_MASTER_ROOT',
        username: 'Administrador',
        createdAt: new Date().toISOString(),
        profile: {
          firstName: 'Admin', lastName: 'System', age: 99, role: 'admin', sport: 'other', discipline: 'System'
        }
      };
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(adminUser));
      return adminUser;
    }

    if (isFirebaseConfigured) {
      // CLOUD LOGIN
      try {
         const userCredential = await signInWithEmailAndPassword(auth, cleanUsername, cleanPassword);
         const fbUser = userCredential.user;
         
         // Fetch profile from Firestore
         const userDoc = await getDoc(doc(db, "users", fbUser.uid));
         const profile = userDoc.exists() ? userDoc.data().profile : undefined;

         const user: User = {
           id: fbUser.uid,
           username: fbUser.email || cleanUsername,
           createdAt: new Date().toISOString(),
           profile
         };
         return user;
      } catch (e: any) {
        throw new Error("Error en login nube: " + e.message);
      }
    } else {
      // LOCAL LOGIN
      const users = StorageService._getLocalUsers();
      const user = users.find(u => u.username.toLowerCase() === cleanUsername.toLowerCase());
      if (!user) throw new Error('Usuario no encontrado (Local).');
      if (user.password !== cleanPassword) throw new Error('Contraseña incorrecta.');
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
      return user;
    }
  },

  logout: async () => {
    if (isFirebaseConfigured) {
      await signOut(auth);
    }
    localStorage.removeItem(CURRENT_USER_KEY);
  },

  getCurrentUser: (): User | null => {
    try {
      const userJson = localStorage.getItem(CURRENT_USER_KEY);
      return userJson ? JSON.parse(userJson) : null;
    } catch (e) {
      return null;
    }
  },

  updateUserProfile: async (userId: string, profile: UserProfile): Promise<User> => {
    if (isFirebaseConfigured) {
      // CLOUD UPDATE
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, { profile });
      
      // Update session cache
      const currentUser = StorageService.getCurrentUser();
      if (currentUser && currentUser.id === userId) {
        const updated = { ...currentUser, profile };
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updated));
        return updated;
      }
      return { id: userId, username: '', createdAt: '', profile }; 
    } else {
      // LOCAL UPDATE
      const users = StorageService._getLocalUsers();
      const idx = users.findIndex(u => u.id === userId);
      if (idx === -1) throw new Error("User not found");
      
      users[idx].profile = profile;
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
      
      const updatedUser = users[idx];
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updatedUser));
      return updatedUser;
    }
  },

  // --- DATA ---

  getUserData: async (userId: string): Promise<UserData> => {
    if (isFirebaseConfigured) {
      // CLOUD GET
      const docRef = doc(db, "userdata", userId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data() as UserData;
        if (!data.customExercises) data.customExercises = DEFAULT_EXERCISES;
        return data;
      } else {
        return { videos: [], plans: [], strengthRecords: [], competitionRecords: [], trainingRecords: [], customExercises: DEFAULT_EXERCISES };
      }
    } else {
      // LOCAL GET
      try {
        const dataJson = localStorage.getItem(`${DATA_PREFIX}${userId}`);
        if (!dataJson) return { videos: [], plans: [], strengthRecords: [], competitionRecords: [], trainingRecords: [], customExercises: DEFAULT_EXERCISES };
        const data = JSON.parse(dataJson);
        if (!data.customExercises) data.customExercises = DEFAULT_EXERCISES;
        return data;
      } catch {
        return { videos: [], plans: [], strengthRecords: [], competitionRecords: [], trainingRecords: [], customExercises: DEFAULT_EXERCISES };
      }
    }
  },

  // Helper for saving specific sections
  updateDataSection: async (userId: string, section: keyof UserData, value: any) => {
    if (isFirebaseConfigured) {
      const docRef = doc(db, "userdata", userId);
      await updateDoc(docRef, { [section]: value });
    } else {
      const data = await StorageService.getUserData(userId);
      (data as any)[section] = value;
      StorageService._saveLocalUserData(userId, data);
    }
  },

  updateStrengthRecords: async (userId: string, records: StrengthRecord[]) => {
    await StorageService.updateDataSection(userId, 'strengthRecords', records);
  },

  updateCompetitionRecords: async (userId: string, records: ThrowRecord[]) => {
    await StorageService.updateDataSection(userId, 'competitionRecords', records);
  },

  updateTrainingRecords: async (userId: string, records: ThrowRecord[]) => {
    await StorageService.updateDataSection(userId, 'trainingRecords', records);
  },

  updateVideos: async (userId: string, videos: VideoFile[]) => {
    await StorageService.updateDataSection(userId, 'videos', videos);
  },

  updateCustomExercises: async (userId: string, exercises: ExerciseDef[]) => {
    await StorageService.updateDataSection(userId, 'customExercises', exercises);
  },

  // --- CLOUD STORAGE (FILE UPLOAD) ---
  uploadFile: async (userId: string, file: File): Promise<string | null> => {
     if (!isFirebaseConfigured) return null;
     try {
       const timestamp = Date.now();
       const storageRef = ref(storage, `videos/${userId}/${timestamp}_${file.name}`);
       const snapshot = await uploadBytes(storageRef, file);
       const downloadURL = await getDownloadURL(snapshot.ref);
       return downloadURL;
     } catch (e) {
       console.error("Error uploading file to cloud:", e);
       throw e;
     }
  },

  // --- ADMIN ---

  getSystemReport: async () => {
    if (isFirebaseConfigured) {
      // Basic cloud report implementation
      const usersSnap = await getDocs(collection(db, "users"));
      const report = [];
      for (const docSnap of usersSnap.docs) {
        const u = docSnap.data() as User;
        const uDataSnap = await getDoc(doc(db, "userdata", u.id));
        const d = uDataSnap.exists() ? uDataSnap.data() as UserData : { videos: [], plans: [], strengthRecords: [], competitionRecords: [], trainingRecords: [] };
        
        report.push({
          user: { ...u, id: docSnap.id },
          stats: {
            videos: d.videos?.length || 0,
            plans: d.plans?.length || 0,
            strengthRecords: d.strengthRecords?.length || 0,
            competitionRecords: d.competitionRecords?.length || 0,
            trainingRecords: d.trainingRecords?.length || 0
          }
        });
      }
      return report;
    } else {
      const users = StorageService._getLocalUsers();
      return Promise.all(users.map(async user => {
        const data = await StorageService.getUserData(user.id);
        return {
          user,
          stats: {
            videos: data.videos.length,
            plans: data.plans.length,
            strengthRecords: data.strengthRecords.length,
            competitionRecords: data.competitionRecords.length,
            trainingRecords: data.trainingRecords.length
          }
        };
      }));
    }
  },

  deleteUser: async (userId: string) => {
    if (isFirebaseConfigured) {
       await deleteDoc(doc(db, "users", userId));
       await deleteDoc(doc(db, "userdata", userId));
       // Note: Deleting files from Storage requires listing them, which we skip here for brevity.
    } else {
       const users = StorageService._getLocalUsers().filter(u => u.id !== userId);
       localStorage.setItem(USERS_KEY, JSON.stringify(users));
       localStorage.removeItem(`${DATA_PREFIX}${userId}`);
    }
  },

  // --- PRIVATE LOCAL HELPERS ---
  _getLocalUsers: (): User[] => {
    const u = localStorage.getItem(USERS_KEY);
    return u ? JSON.parse(u) : [];
  },
  _saveLocalUserData: (userId: string, data: UserData) => {
    localStorage.setItem(`${DATA_PREFIX}${userId}`, JSON.stringify(data));
  }
};
