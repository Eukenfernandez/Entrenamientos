
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
  distance: number;
}

export interface User {
  id: string;
  username: string;
  password?: string; // In a real app, never store raw passwords. This is for local demo only.
  createdAt: string;
}

export interface UserData {
  videos: VideoFile[];
  plans: PlanFileMetadata[]; 
  strengthRecords: StrengthRecord[];
  competitionRecords: ThrowRecord[];
  trainingRecords: ThrowRecord[];
}

export type Screen = 'login' | 'dashboard' | 'gallery' | 'analyzer' | 'strength' | 'competition' | 'training' | 'planning' | 'planViewer' | 'coach' | 'calculator';
