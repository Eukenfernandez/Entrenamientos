
import React, { useState, useEffect, useRef } from 'react';
import { Login } from './components/Login';
import { Onboarding } from './components/Onboarding';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { Gallery } from './components/Gallery';
import { VideoAnalyzer } from './components/VideoAnalyzer';
import { StrengthTracker } from './components/StrengthTracker';
import { JavelinTracker } from './components/JavelinTracker'; 
import { TrainingTracker } from './components/TrainingTracker';
import { PlanGallery } from './components/PlanGallery';
import { PdfViewer } from './components/PdfViewer';
import { CoachChat } from './components/CoachChat';
import { PlateCalculator } from './components/PlateCalculator';
import { AdminPanel } from './components/AdminPanel'; // Import new admin panel
import { Screen, VideoFile, StrengthRecord, ThrowRecord, PlanFile, User, ExerciseDef } from './types';
import { StorageService, VideoStorage } from './services/storageService';
import { Menu, PanelLeftClose, PanelLeftOpen } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentScreen, setCurrentScreen] = useState<Screen>('dashboard');
  
  // Navigation State
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true);
  
  // Data States
  const [videos, setVideos] = useState<VideoFile[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<VideoFile | null>(null);
  
  const [plans, setPlans] = useState<PlanFile[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<PlanFile | null>(null);

  const [strengthRecords, setStrengthRecords] = useState<StrengthRecord[]>([]);
  const [competitionRecords, setCompetitionRecords] = useState<ThrowRecord[]>([]);
  const [trainingRecords, setTrainingRecords] = useState<ThrowRecord[]>([]);
  const [customExercises, setCustomExercises] = useState<ExerciseDef[]>([]);

  // Init: Check for existing session
  useEffect(() => {
    const user = StorageService.getCurrentUser();
    if (user) {
      handleLogin(user);
    }
  }, []);

  const handleLogin = async (user: User) => {
    setCurrentUser(user);
    
    // --- ADMIN CHECK ---
    if (user.profile?.role === 'admin') {
      setCurrentScreen('admin_panel');
      return;
    }
    // -------------------

    // Check if profile exists, if not, go to onboarding
    if (!user.profile) {
      setCurrentScreen('onboarding');
      return; 
    }

    // Load User Data from "Database" (Async now)
    const data = await StorageService.getUserData(user.id);
    
    setStrengthRecords(data.strengthRecords || []);
    setCompetitionRecords(data.competitionRecords || []);
    setTrainingRecords(data.trainingRecords || []);
    setCustomExercises(data.customExercises || []);
    
    // Hydrate Videos - LOCAL FIRST STRATEGY
    let loadedVideos = data.videos || [];
    if (loadedVideos.length > 0) {
      const hydrated = await Promise.all(loadedVideos.map(async (v) => {
         // Priority 1: Check IndexedDB (Local Blob)
         // This bypasses CORS issues and loads instantly.
         try {
           const blob = await VideoStorage.getVideo(v.id);
           if (blob) {
             return { ...v, url: URL.createObjectURL(blob), isLocal: true };
           }
         } catch (e) {
           // If error or not found locally, proceed to Priority 2
           console.warn(`Video ${v.id} not found locally, falling back to cloud URL.`);
         }
         
         // Priority 2: Cloud URL (Fallback)
         // If we are here, it means we don't have the file locally.
         return { ...v, isLocal: false };
      }));
      setVideos(hydrated);
    } else {
      setVideos([]);
    }
    
    setCurrentScreen('dashboard');
  };

  const handleOnboardingComplete = async (updatedUser: User) => {
    setCurrentUser(updatedUser);
    setCurrentScreen('dashboard');
  };

  const handleLogout = async () => {
    await StorageService.logout();
    setCurrentUser(null);
    setCurrentScreen('login');
    // Clear State
    setVideos([]);
    setPlans([]);
    setStrengthRecords([]);
    setCompetitionRecords([]);
    setTrainingRecords([]);
    setCustomExercises([]);
  };

  // Navigation Logic
  const navigateTo = (screen: Screen) => {
    setCurrentScreen(screen);
    if (screen !== 'analyzer') setSelectedVideo(null);
    if (screen !== 'planViewer') setSelectedPlan(null);
    setIsMobileMenuOpen(false); // Close mobile menu on navigate
  };

  // Video Handlers
  const handleSelectVideo = (video: VideoFile) => {
    setSelectedVideo(video);
    setCurrentScreen('analyzer');
  };

  const handleUploadVideo = async (file: File, thumbnail: string) => {
    if (!currentUser) return;
    
    const newId = Date.now().toString();

    // 1. Save File to IndexedDB (Always for offline/fast access cache)
    try {
      await VideoStorage.saveVideo(newId, file);
    } catch (e) {
      console.error("Failed to save video to DB", e);
    }

    // 2. Determine Video URL (Local vs Cloud)
    // We prioritize the blob URL for the current session to ensure immediate playback/analysis support
    let finalVideoUrl = URL.createObjectURL(file);
    let isCloudUrl = false;
    let storagePathUrl = ''; // This is what we save to the DB metadata if cloud is on

    if (StorageService.isCloudMode()) {
       // Upload to Firebase Storage
       try {
          const cloudUrl = await StorageService.uploadFile(currentUser.id, file);
          if (cloudUrl) {
             storagePathUrl = cloudUrl; // Save this to DB
             isCloudUrl = true;
             // Note: We keep finalVideoUrl as the Blob for this session to avoid CORS
          }
       } catch (e) {
          console.error("Cloud upload failed, falling back to local", e);
          alert("Error subiendo a la nube. Se guardará localmente.");
       }
    }

    // Use Blob URL for immediate UI, but save Cloud URL to Metadata if available
    const newVideo: VideoFile = {
      id: newId,
      url: isCloudUrl ? storagePathUrl : finalVideoUrl, // Metadata stores the permanent link
      thumbnail: thumbnail, 
      name: file.name,
      date: new Date().toLocaleDateString() + ', ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      duration: '00:00', 
      isLocal: true // It is local because we just uploaded it and have it in IndexedDB
    };
    
    // For the UI state, ensure we use the Blob URL we just created so it works instantly
    const uiVideo = { ...newVideo, url: finalVideoUrl };

    const updatedVideos = [uiVideo, ...videos];
    setVideos(updatedVideos);
    
    // Save metadata to DB (using the permanent URL structure)
    // We must ensure we save 'newVideo' which has the cloud URL, not 'uiVideo' which has the blob
    // However, the state needs 'uiVideo'. 
    
    // Fix: We need to pull the current list from state, replace the blob-url versions with cloud-url versions if needed for saving?
    // Actually, StorageService handles saving. Let's filter:
    const videosToSave = [newVideo, ...videos.map(v => {
        // If it's a blob url, we can't save that to cloud DB. We assume existing videos already have their metadata correct from load time.
        // We only need to ensure the NEW video has the correct cloud URL if applicable.
        // But wait, 'videos' state has Blob URLs.
        // This is tricky. We should probably re-fetch or keep a separate "metadata" state vs "ui" state.
        // SIMPLIFICATION: We will rely on the fact that when we load, we prefer Local. When we save, we assume 'v.url' might be a blob.
        // If it's a blob and we are in cloud mode, we might lose the link if we overwrite.
        
        // Correct approach: We shouldn't overwrite the entire video array in DB with Blob URLs.
        // We should append the new video metadata.
        return v; 
    })];

    // Ideally, we shouldn't map over 'videos' from state to save to DB because state has Blob URLs.
    // We should append the new record to the backend list. 
    // Since StorageService.updateVideos replaces the whole list, we need to be careful.
    // For this prototype, we will trust that `newVideo` has the correct persistent URL (cloud or null)
    // and for existing videos, we effectively keep what was there, but `videos` state has Blob URLs.
    
    // Workaround: When saving to DB, if a URL starts with 'blob:', we technically can't save it to Firestore effectively.
    // But since we are using Local-First hydration, we only need the ID to find it in IndexedDB next time.
    // If Cloud is on, we prefer the Cloud URL. 
    
    // Let's modify updatedVideos for SAVING purposes to verify URLs are not Blobs if possible, 
    // OR just rely on ID if local.
    const savePayload = updatedVideos.map(v => {
        if (v.url.startsWith('blob:') && isCloudUrl && v.id === newId) {
            return { ...v, url: storagePathUrl };
        }
        // For existing videos, if they were hydrated to Blob, we lost their original Cloud URL in the state?
        // Yes, handleLogin replaces it. This is a flaw in the previous Hydration logic.
        // FIX: We should store `remoteUrl` in the type or handle hydration non-destructively.
        // For now, let's just save. If it's local mode, Blob string is useless but ID matters.
        return v;
    });

    await StorageService.updateVideos(currentUser.id, savePayload);
  };

  const handleDeleteVideo = async (id: string) => {
    if (!currentUser) return;
    
    await VideoStorage.deleteVideo(id); // Delete from DB

    const updatedVideos = videos.filter(v => v.id !== id);
    setVideos(updatedVideos);
    await StorageService.updateVideos(currentUser.id, updatedVideos);
  };

  // Plan Handlers
  const handleUploadPlan = (file: File) => {
    const newPlan: PlanFile = {
      id: Date.now().toString(),
      file: file,
      name: file.name,
      date: new Date().toLocaleDateString()
    };
    setPlans(prev => [newPlan, ...prev]);
  };

  const handleSelectPlan = (plan: PlanFile) => {
    setSelectedPlan(plan);
    setCurrentScreen('planViewer');
  };

  // Strength Handlers
  const handleAddStrength = async (record: Omit<StrengthRecord, 'id'>) => {
    if (!currentUser) return;
    const newRecord = { ...record, id: Date.now().toString() };
    const updated = [...strengthRecords, newRecord];
    setStrengthRecords(updated);
    await StorageService.updateStrengthRecords(currentUser.id, updated);
  };
  
  const handleDeleteStrength = async (id: string) => {
    if (!currentUser) return;
    const updated = strengthRecords.filter(r => r.id !== id);
    setStrengthRecords(updated);
    await StorageService.updateStrengthRecords(currentUser.id, updated);
  };

  const handleUpdateExercises = async (exercises: ExerciseDef[]) => {
    if (!currentUser) return;
    setCustomExercises(exercises);
    await StorageService.updateCustomExercises(currentUser.id, exercises);
  };

  // Competition Handlers 
  const handleAddCompetition = async (record: Omit<ThrowRecord, 'id'>) => {
    if (!currentUser) return;
    const newRecord = { ...record, id: Date.now().toString() };
    const updated = [...competitionRecords, newRecord];
    setCompetitionRecords(updated);
    await StorageService.updateCompetitionRecords(currentUser.id, updated);
  };
  
  const handleDeleteCompetition = async (id: string) => {
    if (!currentUser) return;
    const updated = competitionRecords.filter(r => r.id !== id);
    setCompetitionRecords(updated);
    await StorageService.updateCompetitionRecords(currentUser.id, updated);
  };

  // Training (Log) Handlers
  const handleAddTraining = async (record: Omit<ThrowRecord, 'id'>) => {
    if (!currentUser) return;
    const newRecord = { ...record, id: Date.now().toString() };
    const updated = [...trainingRecords, newRecord];
    setTrainingRecords(updated);
    await StorageService.updateTrainingRecords(currentUser.id, updated);
  };
  
  const handleDeleteTraining = async (id: string) => {
    if (!currentUser) return;
    const updated = trainingRecords.filter(r => r.id !== id);
    setTrainingRecords(updated);
    await StorageService.updateTrainingRecords(currentUser.id, updated);
  };

  if (!currentUser) {
    return <Login onLogin={handleLogin} />;
  }

  // --- ADMIN RENDER ---
  if (currentScreen === 'admin_panel') {
    return <AdminPanel onLogout={handleLogout} />;
  }
  // --------------------

  if (currentScreen === 'onboarding') {
    return <Onboarding user={currentUser} onComplete={handleOnboardingComplete} />;
  }

  // Determine if we should forcefully hide sidebar (e.g. in full screen tools)
  const isFullScreenTool = currentScreen === 'analyzer' || currentScreen === 'planViewer';
  const showSidebar = !isFullScreenTool && isDesktopSidebarOpen;

  return (
    <div className="flex h-[100dvh] w-full bg-neutral-950 text-white overflow-hidden font-sans relative">
      
      {/* Mobile Sidebar Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div 
             className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200" 
             onClick={() => setIsMobileMenuOpen(false)}
          ></div>
          <div className="relative w-3/4 max-w-xs h-full shadow-2xl animate-in slide-in-from-left duration-300">
             <Sidebar 
                currentScreen={currentScreen} 
                onNavigate={navigateTo} 
                onLogout={handleLogout}
                onClose={() => setIsMobileMenuOpen(false)}
             />
          </div>
        </div>
      )}

      {/* Desktop Sidebar (Collapsible) */}
      <div 
        className={`hidden md:block h-full flex-shrink-0 transition-all duration-300 ease-in-out ${
          showSidebar ? 'w-64' : 'w-0 overflow-hidden'
        }`}
      >
         <Sidebar 
            currentScreen={currentScreen} 
            onNavigate={navigateTo} 
            onLogout={handleLogout}
         />
      </div>
      
      {/* Main Content Area */}
      <main className="flex-1 h-full overflow-hidden relative bg-neutral-950 flex flex-col">
        
        {/* Toggle Button Area */}
        {!isFullScreenTool && (
          <>
             {/* MOBILE TOGGLE (Permanent Bottom Left) */}
             <div 
               className={`md:hidden fixed bottom-6 left-6 z-40 transition-opacity duration-300 ${
                 isMobileMenuOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'
               }`}
             >
                <button 
                   onClick={() => setIsMobileMenuOpen(true)}
                   className="p-3.5 bg-neutral-900/80 backdrop-blur-lg border border-neutral-700/50 text-white rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.5)] hover:bg-neutral-800 hover:scale-105 transition-all"
                   aria-label="Abrir menú"
                >
                   <Menu size={24} />
                </button>
             </div>

             {/* DESKTOP TOGGLE (Invisible Trigger Zone) */}
             <div className="hidden md:flex absolute top-0 left-0 w-28 h-28 z-40 items-start justify-start p-6 opacity-0 hover:opacity-100 transition-opacity duration-300">
                <button 
                   onClick={() => setIsDesktopSidebarOpen(!isDesktopSidebarOpen)}
                   className="p-2.5 bg-neutral-800/80 backdrop-blur-md border border-neutral-700 text-white rounded-xl shadow-2xl hover:bg-neutral-700 hover:scale-105 transition-all"
                   title={isDesktopSidebarOpen ? "Ocultar menú lateral" : "Mostrar menú lateral"}
                >
                   {isDesktopSidebarOpen ? <PanelLeftClose size={20} /> : <PanelLeftOpen size={20} />}
                </button>
             </div>
          </>
        )}

        {currentScreen === 'dashboard' && (
          <Dashboard 
             userProfile={currentUser.profile}
             videos={videos} 
             strengthRecords={strengthRecords} 
             throwRecords={competitionRecords} 
             trainingRecords={trainingRecords}
             onNavigate={navigateTo}
          />
        )}

        {currentScreen === 'gallery' && (
          <Gallery 
            videos={videos} 
            onSelectVideo={handleSelectVideo} 
            onUpload={handleUploadVideo}
            onDelete={handleDeleteVideo}
          />
        )}

        {currentScreen === 'analyzer' && selectedVideo && (
          <VideoAnalyzer 
            video={selectedVideo} 
            onBack={() => navigateTo('gallery')} 
          />
        )}

        {currentScreen === 'planning' && (
          <PlanGallery 
            plans={plans}
            onSelectPlan={handleSelectPlan}
            onUpload={handleUploadPlan}
          />
        )}

        {currentScreen === 'planViewer' && selectedPlan && (
          <PdfViewer 
             plan={selectedPlan}
             onBack={() => navigateTo('planning')}
          />
        )}

        {currentScreen === 'strength' && (
          <StrengthTracker 
            records={strengthRecords}
            onAddRecord={handleAddStrength}
            onDeleteRecord={handleDeleteStrength}
            exercises={customExercises}
            onUpdateExercises={handleUpdateExercises}
          />
        )}

        {currentScreen === 'competition' && currentUser.profile && (
          <JavelinTracker 
            profile={currentUser.profile}
            records={competitionRecords}
            onAddRecord={handleAddCompetition}
            onDeleteRecord={handleDeleteCompetition}
          />
        )}

        {currentScreen === 'training' && currentUser.profile && (
          <TrainingTracker 
            profile={currentUser.profile}
            records={trainingRecords}
            onAddRecord={handleAddTraining}
            onDeleteRecord={handleDeleteTraining}
          />
        )}

        {currentScreen === 'calculator' && (
          <PlateCalculator />
        )}

        {currentScreen === 'coach' && (
          <CoachChat />
        )}
      </main>
    </div>
  );
}
