
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
import { Screen, VideoFile, StrengthRecord, ThrowRecord, PlanFile, User, ExerciseDef } from './types';
import { StorageService } from './services/storageService';
import { Menu, PanelLeftClose, PanelLeftOpen } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentScreen, setCurrentScreen] = useState<Screen>('dashboard');
  
  // Navigation State
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true);
  
  // Mobile Menu Button Visibility State
  const [showMobileMenuBtn, setShowMobileMenuBtn] = useState(false);
  const menuBtnTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    
    // Check if profile exists, if not, go to onboarding
    if (!user.profile) {
      setCurrentScreen('onboarding');
      return; 
    }

    // Load User Data from "Database"
    const data = StorageService.getUserData(user.id);
    setStrengthRecords(data.strengthRecords || []);
    setCompetitionRecords(data.competitionRecords || []);
    setTrainingRecords(data.trainingRecords || []);
    setVideos(data.videos || []);
    setCustomExercises(data.customExercises || []);
    
    setCurrentScreen('dashboard');
  };

  const handleOnboardingComplete = (updatedUser: User) => {
    setCurrentUser(updatedUser);
    setCurrentScreen('dashboard');
  };

  const handleLogout = () => {
    StorageService.logout();
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

  const handleUploadVideo = (file: File, thumbnail: string) => {
    if (!currentUser) return;
    
    const objectUrl = URL.createObjectURL(file);
    const newVideo: VideoFile = {
      id: Date.now().toString(),
      url: objectUrl,
      thumbnail: thumbnail, 
      name: file.name,
      date: new Date().toLocaleDateString() + ', ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      duration: '00:00', 
      isLocal: true
    };
    
    const updatedVideos = [newVideo, ...videos];
    setVideos(updatedVideos);
    StorageService.updateVideos(currentUser.id, updatedVideos);
  };

  const handleDeleteVideo = (id: string) => {
    if (!currentUser) return;
    const updatedVideos = videos.filter(v => v.id !== id);
    setVideos(updatedVideos);
    StorageService.updateVideos(currentUser.id, updatedVideos);
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
  const handleAddStrength = (record: Omit<StrengthRecord, 'id'>) => {
    if (!currentUser) return;
    const newRecord = { ...record, id: Date.now().toString() };
    const updated = [...strengthRecords, newRecord];
    setStrengthRecords(updated);
    StorageService.updateStrengthRecords(currentUser.id, updated);
  };
  
  const handleDeleteStrength = (id: string) => {
    if (!currentUser) return;
    const updated = strengthRecords.filter(r => r.id !== id);
    setStrengthRecords(updated);
    StorageService.updateStrengthRecords(currentUser.id, updated);
  };

  const handleUpdateExercises = (exercises: ExerciseDef[]) => {
    if (!currentUser) return;
    setCustomExercises(exercises);
    StorageService.updateCustomExercises(currentUser.id, exercises);
  };

  // Competition Handlers 
  const handleAddCompetition = (record: Omit<ThrowRecord, 'id'>) => {
    if (!currentUser) return;
    const newRecord = { ...record, id: Date.now().toString() };
    const updated = [...competitionRecords, newRecord];
    setCompetitionRecords(updated);
    StorageService.updateCompetitionRecords(currentUser.id, updated);
  };
  
  const handleDeleteCompetition = (id: string) => {
    if (!currentUser) return;
    const updated = competitionRecords.filter(r => r.id !== id);
    setCompetitionRecords(updated);
    StorageService.updateCompetitionRecords(currentUser.id, updated);
  };

  // Training (Log) Handlers
  const handleAddTraining = (record: Omit<ThrowRecord, 'id'>) => {
    if (!currentUser) return;
    const newRecord = { ...record, id: Date.now().toString() };
    const updated = [...trainingRecords, newRecord];
    setTrainingRecords(updated);
    StorageService.updateTrainingRecords(currentUser.id, updated);
  };
  
  const handleDeleteTraining = (id: string) => {
    if (!currentUser) return;
    const updated = trainingRecords.filter(r => r.id !== id);
    setTrainingRecords(updated);
    StorageService.updateTrainingRecords(currentUser.id, updated);
  };

  // Global Click Handler for Mobile Menu Toggle Logic
  const handleAppClick = (e: React.MouseEvent) => {
    // Only logic for mobile menu appearing/disappearing if needed
    if (window.innerWidth >= 768) return;
    if (isMobileMenuOpen) return;

    const target = e.target as HTMLElement;
    const isInteractive = target.closest('button') || 
                          target.closest('a') || 
                          target.closest('input') || 
                          target.closest('select') || 
                          target.closest('textarea') || 
                          target.closest('video') || 
                          target.closest('[role="button"]');

    if (!isInteractive) {
      setShowMobileMenuBtn(true);
      if (menuBtnTimerRef.current) {
        clearTimeout(menuBtnTimerRef.current);
      }
      menuBtnTimerRef.current = setTimeout(() => {
        setShowMobileMenuBtn(false);
      }, 3000);
    }
  };

  useEffect(() => {
    return () => {
      if (menuBtnTimerRef.current) clearTimeout(menuBtnTimerRef.current);
    };
  }, []);

  if (!currentUser) {
    return <Login onLogin={handleLogin} />;
  }

  if (currentScreen === 'onboarding') {
    return <Onboarding user={currentUser} onComplete={handleOnboardingComplete} />;
  }

  // Determine if we should forcefully hide sidebar (e.g. in full screen tools)
  const isFullScreenTool = currentScreen === 'analyzer' || currentScreen === 'planViewer';
  const showSidebar = !isFullScreenTool && isDesktopSidebarOpen;

  return (
    <div 
      className="flex h-[100dvh] w-full bg-neutral-950 text-white overflow-hidden font-sans relative"
      onClick={handleAppClick}
    >
      
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
             {/* MOBILE TOGGLE (Always Visible when active or tapped) */}
             <div 
               className={`md:hidden absolute top-4 left-4 z-40 transition-all duration-500 ease-in-out ${
                 showMobileMenuBtn ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'
               }`}
             >
                <button 
                   onClick={() => setIsMobileMenuOpen(true)}
                   className="p-3 bg-neutral-900 border border-neutral-800 text-white rounded-xl shadow-lg hover:border-orange-500 transition-all"
                >
                   <Menu size={20} />
                </button>
             </div>

             {/* DESKTOP TOGGLE (Invisible Trigger Zone) */}
             {/* This creates a 100x100px area in top-left that reveals the button on hover */}
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
