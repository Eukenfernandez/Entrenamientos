
import { User, UserData, VideoFile, StrengthRecord, ThrowRecord, PlanFileMetadata, UserProfile } from '../types';

const USERS_KEY = 'velocityview_users';
const CURRENT_USER_KEY = 'velocityview_current_user';
const DATA_PREFIX = 'velocityview_data_';

export const StorageService = {
  // --- AUTHENTICATION ---

  getUsers: (): User[] => {
    try {
      const usersJson = localStorage.getItem(USERS_KEY);
      const parsed = usersJson ? JSON.parse(usersJson) : [];
      if (!Array.isArray(parsed)) return [];
      return parsed;
    } catch (e) {
      console.error("Error parsing users from storage", e);
      return [];
    }
  },

  register: (username: string, password: string): User => {
    // Sanitize inputs: remove leading/trailing whitespace
    const cleanUsername = username.trim();
    const cleanPassword = password.trim();

    if (!cleanUsername || !cleanPassword) {
      throw new Error('Usuario y contraseña son obligatorios.');
    }

    const users = StorageService.getUsers();
    
    // Check for existing user (case insensitive)
    if (users.find(u => u.username && u.username.toLowerCase() === cleanUsername.toLowerCase())) {
      throw new Error('Este correo o usuario ya está registrado.');
    }

    const newUser: User = {
      id: Date.now().toString(),
      username: cleanUsername,
      password: cleanPassword, 
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

    // Auto-login after register
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(newUser));

    return newUser;
  },

  login: (username: string, password: string): User => {
    const cleanUsername = username.trim();
    const cleanPassword = password.trim();

    if (!cleanUsername || !cleanPassword) {
      throw new Error('Por favor ingresa usuario y contraseña.');
    }

    const users = StorageService.getUsers();
    
    // 1. Find user by username first
    const user = users.find(u => 
      u.username && 
      u.username.toLowerCase() === cleanUsername.toLowerCase()
    );
    
    if (!user) {
      throw new Error('Usuario no encontrado. ¿Te has registrado?');
    }

    // 2. Check password
    if (user.password !== cleanPassword) {
      throw new Error('Contraseña incorrecta.');
    }
    
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    return user;
  },

  loginWithGoogle: (): User => {
    // Simulating Google Auth Provider flow
    const users = StorageService.getUsers();
    const googleUsername = "Usuario Google"; // Consistent ID for the simulated Google User

    // Check if we already have a google user registered
    let googleUser = users.find(u => u.username === googleUsername);

    if (!googleUser) {
      // Register new Google User automatically
      googleUser = {
        id: 'google_user_main', // Fixed ID so data persists for this "Google User" always
        username: googleUsername,
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
    try {
      const userJson = localStorage.getItem(CURRENT_USER_KEY);
      return userJson ? JSON.parse(userJson) : null;
    } catch (e) {
      return null;
    }
  },

  updateUserProfile: (userId: string, profile: UserProfile): User => {
    const users = StorageService.getUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    
    if (userIndex === -1) throw new Error("User not found");

    // Update user in main list
    users[userIndex].profile = profile;
    localStorage.setItem(USERS_KEY, JSON.stringify(users));

    // Update current session user
    const updatedUser = users[userIndex];
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updatedUser));
    
    return updatedUser;
  },

  // --- DATA PERSISTENCE ---

  getUserData: (userId: string): UserData => {
    try {
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
    } catch (e) {
      console.error("Error parsing user data", e);
      return {
        videos: [],
        plans: [],
        strengthRecords: [],
        competitionRecords: [],
        trainingRecords: []
      };
    }
  },

  saveUserData: (userId: string, data: UserData) => {
    try {
      localStorage.setItem(`${DATA_PREFIX}${userId}`, JSON.stringify(data));
    } catch (e) {
      console.error("Storage Quota Exceeded or Error", e);
      try {
        const minimalData = { ...data, videos: [] }; 
        localStorage.setItem(`${DATA_PREFIX}${userId}`, JSON.stringify(minimalData));
      } catch (e2) {
        // Critical failure
      }
    }
  },

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
    data.videos = videos; 
    StorageService.saveUserData(userId, data);
  }
};
