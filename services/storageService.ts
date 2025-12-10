
import { User, UserData, VideoFile, StrengthRecord, ThrowRecord, PlanFileMetadata } from '../types';

const USERS_KEY = 'velocityview_users';
const CURRENT_USER_KEY = 'velocityview_current_user';
const DATA_PREFIX = 'velocityview_data_';

export const StorageService = {
  // --- AUTHENTICATION ---

  getUsers: (): User[] => {
    const usersJson = localStorage.getItem(USERS_KEY);
    return usersJson ? JSON.parse(usersJson) : [];
  },

  register: (username: string, password: string): User => {
    const users = StorageService.getUsers();
    
    if (users.find(u => u.username.toLowerCase() === username.toLowerCase())) {
      throw new Error('El nombre de usuario ya existe.');
    }

    const newUser: User = {
      id: Date.now().toString(),
      username,
      password, // Note: In production, hash this!
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    
    // Initialize empty data for new user
    const initialData: UserData = {
      videos: [],
      plans: [],
      strengthRecords: [],
      competitionRecords: [],
      trainingRecords: []
    };
    StorageService.saveUserData(newUser.id, initialData);

    return newUser;
  },

  login: (username: string, password: string): User => {
    const users = StorageService.getUsers();
    const user = users.find(u => u.username.toLowerCase() === username.toLowerCase() && u.password === password);
    
    if (!user) {
      throw new Error('Credenciales inválidas.');
    }
    
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    return user;
  },

  loginWithGoogle: (): User => {
    // Simulating Google Auth Provider flow
    const users = StorageService.getUsers();
    // Check if we already have a google user registered
    let googleUser = users.find(u => u.username === "Usuario Google");

    if (!googleUser) {
      // Register new Google User automatically
      googleUser = {
        id: 'google_' + Date.now().toString(),
        username: "Usuario Google",
        createdAt: new Date().toISOString()
        // No password for OAuth users
      };
      users.push(googleUser);
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
      
      const initialData: UserData = {
        videos: [],
        plans: [],
        strengthRecords: [],
        competitionRecords: [],
        trainingRecords: []
      };
      StorageService.saveUserData(googleUser.id, initialData);
    }

    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(googleUser));
    return googleUser;
  },

  logout: () => {
    localStorage.removeItem(CURRENT_USER_KEY);
  },

  getCurrentUser: (): User | null => {
    const userJson = localStorage.getItem(CURRENT_USER_KEY);
    return userJson ? JSON.parse(userJson) : null;
  },

  // --- DATA PERSISTENCE ---

  getUserData: (userId: string): UserData => {
    const dataJson = localStorage.getItem(`${DATA_PREFIX}${userId}`);
    if (!dataJson) {
       return {
         videos: [],
         plans: [],
         strengthRecords: [],
         competitionRecords: [],
         trainingRecords: []
       };
    }
    return JSON.parse(dataJson);
  },

  saveUserData: (userId: string, data: UserData) => {
    // Note: We filter out blob URLs for videos/plans in a real app, 
    // but for this demo, we will store metadata.
    // Large base64 strings might hit localStorage limits (5MB).
    // We try to save as much as possible.
    try {
      localStorage.setItem(`${DATA_PREFIX}${userId}`, JSON.stringify(data));
    } catch (e) {
      console.error("Storage Quota Exceeded", e);
      alert("⚠️ Límite de almacenamiento local lleno. Algunos vídeos grandes podrían no guardarse.");
    }
  },

  // Helper to update specific slice of data
  updateStrengthRecords: (userId: string, records: StrengthRecord[]) => {
    const data = StorageService.getUserData(userId);
    data.strengthRecords = records;
    StorageService.saveUserData(userId, data);
  },

  updateCompetitionRecords: (userId: string, records: ThrowRecord[]) => {
    const data = StorageService.getUserData(userId);
    data.competitionRecords = records;
    StorageService.saveUserData(userId, data);
  },

  updateTrainingRecords: (userId: string, records: ThrowRecord[]) => {
    const data = StorageService.getUserData(userId);
    data.trainingRecords = records;
    StorageService.saveUserData(userId, data);
  },
  
  updateVideos: (userId: string, videos: VideoFile[]) => {
    const data = StorageService.getUserData(userId);
    // Warning: Persisting Blob URLs isn't possible across sessions. 
    // In a real app, we'd upload to cloud. 
    // Here we save metadata. The user might need to re-upload actual files in this static demo if page refreshes.
    data.videos = videos; 
    StorageService.saveUserData(userId, data);
  }
};
