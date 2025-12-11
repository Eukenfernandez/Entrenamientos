
export interface VideoFile {
  id: string;
  url: string;
  thumbnail: string;
  name: string;
  date: string;
  duration: string;
  isLocal?: boolean;
}

export interface PlanFile {
  id: string;
  file: File;
  name: string;
  date: string;
}

// Helper for storing Plan metadata in localStorage (since we can't store full File objects easily)
export interface PlanFileMetadata {
  id: string;
  name: string;
  date: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export interface StrengthRecord {
  id: string;
  date: string;
  exercise: 'Press Banca' | 'Sentadilla' | 'Cargada' | 'Pull Over' | 'Arrancada' | 'Hip Thrust';
  weight: number;
}

export interface ThrowRecord {
  id: string;
  date: string;
  location: string;
  distance: number; // This acts as the generic "Result" value (Meters or Seconds)
}

export type SportType = 'sprint' | 'middle_distance' | 'jumps' | 'throws' | 'weightlifting' | 'other';

export interface UserProfile {
  firstName: string;
  lastName: string;
  age: number;
  role: 'athlete' | 'coach';
  sport: SportType;
  discipline: string; // Specific name e.g., "60m", "Javelin", "Long Jump"
}

export interface User {
  id: string;
  username: string;
  password?: string; 
  createdAt: string;
  profile?: UserProfile;
}

export interface UserData {
  videos: VideoFile[];
  plans: PlanFileMetadata[]; 
  strengthRecords: StrengthRecord[];
  competitionRecords: ThrowRecord[];
  trainingRecords: ThrowRecord[];
}

export type Screen = 'login' | 'onboarding' | 'dashboard' | 'gallery' | 'analyzer' | 'strength' | 'competition' | 'training' | 'planning' | 'planViewer' | 'coach' | 'calculator';
