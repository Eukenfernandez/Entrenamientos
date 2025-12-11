
import { User, UserData, VideoFile, StrengthRecord, ThrowRecord, PlanFileMetadata, UserProfile, ExerciseDef } from '../types';

const USERS_KEY = 'coachai_users';
const CURRENT_USER_KEY = 'coachai_current_user';
const DATA_PREFIX = 'coachai_data_';

// Default exercises with units
const DEFAULT_EXERCISES: ExerciseDef[] = [
  { name: 'Press Banca', unit: 'kg' },
  { name: 'Sentadilla', unit: 'kg' },
  { name: 'Cargada', unit: 'kg' },
  { name: 'Pull Over', unit: 'kg' },
  { name: 'Arrancada', unit: 'kg' },
  { name: 'Hip Thrust', unit: 'kg' },
  { name: 'Salto Vertical', unit: 'cm' }
];

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
      trainingRecords: [],
      customExercises: DEFAULT_EXERCISES
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
        trainingRecords: [],
        customExercises: DEFAULT_EXERCISES
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
           trainingRecords: [],
           customExercises: DEFAULT_EXERCISES
         };
      }
      const data = JSON.parse(dataJson);
      
      // MIGRATION: Ensure customExercises is in the new ExerciseDef[] format
      if (!data.customExercises) {
        data.customExercises = DEFAULT_EXERCISES;
      } else if (data.customExercises.length > 0 && typeof data.customExercises[0] === 'string') {
        // Migrate legacy string array to object array
        data.customExercises = (data.customExercises as unknown as string[]).map(name => ({
           name,
           unit: name.toLowerCase().includes('salto') ? 'cm' : 'kg' // Simple heuristic for migration
        }));
      }

      return data;
    } catch (e) {
      console.error("Error parsing user data", e);
      return {
        videos: [],
        plans: [],
        strengthRecords: [],
        competitionRecords: [],
        trainingRecords: [],
        customExercises: DEFAULT_EXERCISES
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
  },

  updateCustomExercises: (userId: string, exercises: ExerciseDef[]) => {
    const data = StorageService.getUserData(userId);
    data.customExercises = exercises;
    StorageService.saveUserData(userId, data);
  }
};
