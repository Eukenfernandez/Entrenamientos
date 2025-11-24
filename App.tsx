
import React, { useState, useRef, useEffect } from 'react';
import { Login } from './components/Login';
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
import { Screen, VideoFile, StrengthRecord, ThrowRecord, PlanFile } from './types';
import { Menu } from 'lucide-react';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentScreen, setCurrentScreen] = useState<Screen>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
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

  const handleLogin = () => {
    setIsLoggedIn(true);
    setCurrentScreen('dashboard');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentScreen('login');
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
    setVideos(prev => [newVideo, ...prev]);
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
    setStrengthRecords(prev => [...prev, { ...record, id: Date.now().toString() }]);
  };
  const handleDeleteStrength = (id: string) => {
    setStrengthRecords(prev => prev.filter(r => r.id !== id));
  };

  // Competition Handlers 
  const handleAddCompetition = (record: Omit<ThrowRecord, 'id'>) => {
    setCompetitionRecords(prev => [...prev, { ...record, id: Date.now().toString() }]);
  };
  const handleDeleteCompetition = (id: string) => {
    setCompetitionRecords(prev => prev.filter(r => r.id !== id));
  };

  // Training (Log) Handlers
  const handleAddTraining = (record: Omit<ThrowRecord, 'id'>) => {
    setTrainingRecords(prev => [...prev, { ...record, id: Date.now().toString() }]);
  };
  const handleDeleteTraining = (id: string) => {
    setTrainingRecords(prev => prev.filter(r => r.id !== id));
  };

  // Global Click Handler for Mobile Menu Toggle
  const handleAppClick = (e: React.MouseEvent) => {
    // Only apply logic on mobile screens
    if (window.innerWidth >= 768) return;
    
    // If menu is already open, ignore
    if (isMobileMenuOpen) return;

    const target = e.target as HTMLElement;

    // Determine if the clicked element is "interactive"
    const isInteractive = target.closest('button') || 
                          target.closest('a') || 
                          target.closest('input') || 
                          target.closest('select') || 
                          target.closest('textarea') || 
                          target.closest('video') || 
                          target.closest('[role="button"]');

    // If user clicked background (not interactive), show the menu button temporarily
    if (!isInteractive) {
      setShowMobileMenuBtn(true);
      
      // Clear existing timer
      if (menuBtnTimerRef.current) {
        clearTimeout(menuBtnTimerRef.current);
      }
      
      // Hide after 3 seconds
      menuBtnTimerRef.current = setTimeout(() => {
        setShowMobileMenuBtn(false);
      }, 3000);
    }
  };

  // Cleanup timer
  useEffect(() => {
    return () => {
      if (menuBtnTimerRef.current) clearTimeout(menuBtnTimerRef.current);
    };
  }, []);

  // Render Logic
  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} />;
  }

  // Use dvh for mobile viewport height to avoid address bar overlapping
  return (
    <div 
      className="flex h-[100dvh] w-full bg-neutral-950 text-white overflow-hidden font-sans relative"
      onClick={handleAppClick}
    >
      
      {/* Dynamic Floating Menu Button (Mobile Only) */}
      <div 
        className={`md:hidden fixed top-6 left-6 z-50 transition-all duration-500 ease-in-out ${
          showMobileMenuBtn ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'
        }`}
      >
         <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-3 bg-orange-600 text-white rounded-full shadow-[0_4px_20px_rgba(234,88,12,0.6)] hover:bg-orange-500 transition-transform transform active:scale-95 border border-orange-400/50"
         >
            <Menu size={24} />
         </button>
      </div>

      {/* Mobile Sidebar Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          {/* Backdrop */}
          <div 
             className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200" 
             onClick={() => setIsMobileMenuOpen(false)}
          ></div>
          {/* Sidebar */}
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

      {/* Desktop Sidebar */}
      {/* Hide sidebar completely when in Analyzer mode to give full screen to video */}
      <div className={`hidden md:block h-full flex-shrink-0 transition-all duration-300 ${currentScreen === 'analyzer' || currentScreen === 'planViewer' ? 'w-0 overflow-hidden' : 'w-64'}`}>
         <Sidebar 
            currentScreen={currentScreen} 
            onNavigate={navigateTo} 
            onLogout={handleLogout}
         />
      </div>
      
      {/* Main Content Area */}
      <main className="flex-1 h-full overflow-hidden relative bg-neutral-950">
        {currentScreen === 'dashboard' && (
          <Dashboard 
             videos={videos} 
             strengthRecords={strengthRecords} 
             throwRecords={competitionRecords} 
             onNavigate={navigateTo}
          />
        )}

        {currentScreen === 'gallery' && (
          <Gallery 
            videos={videos} 
            onSelectVideo={handleSelectVideo} 
            onUpload={handleUploadVideo}
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
          />
        )}

        {currentScreen === 'competition' && (
          <JavelinTracker 
            records={competitionRecords}
            onAddRecord={handleAddCompetition}
            onDeleteRecord={handleDeleteCompetition}
          />
        )}

        {currentScreen === 'training' && (
          <TrainingTracker 
            records={trainingRecords}
            onAddRecord={handleAddTraining}
            onDeleteRecord={handleDeleteTraining}
          />
        )}

        {currentScreen === 'coach' && (
          <CoachChat />
        )}
      </main>
    </div>
  );
}
