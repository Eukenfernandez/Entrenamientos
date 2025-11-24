
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { VideoFile, ChatMessage } from '../types';
import { analyzeFrame } from '../services/geminiService';
import { 
  Play, Pause, ChevronLeft, ChevronRight, X, 
  Maximize2, RotateCcw, MessageSquare, Send, Loader2 
} from 'lucide-react';

interface VideoAnalyzerProps {
  video: VideoFile;
  onBack: () => void;
}

export const VideoAnalyzer: React.FC<VideoAnalyzerProps> = ({ video, onBack }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [showChat, setShowChat] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: 'Hola. Pausa el vídeo en el momento clave y pregúntame sobre tu técnica.',
      timestamp: new Date()
    }
  ]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Initialize video
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    const handleTimeUpdate = () => setCurrentTime(v.currentTime);
    const handleDurationChange = () => setDuration(v.duration);
    const handleEnded = () => setIsPlaying(false);

    v.addEventListener('timeupdate', handleTimeUpdate);
    v.addEventListener('loadedmetadata', handleDurationChange);
    v.addEventListener('ended', handleEnded);

    return () => {
      v.removeEventListener('timeupdate', handleTimeUpdate);
      v.removeEventListener('loadedmetadata', handleDurationChange);
      v.removeEventListener('ended', handleEnded);
    };
  }, []);

  // Keyboard Navigation Handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Do not trigger if user is typing in the chat input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (!videoRef.current) return;

      // Adjusted step: 0.05s (50ms). 
      // Previously 0.01s was too slow. 0.05s is roughly 1-2 frames depending on fps.
      const microStep = 0.07; 

      if (e.key === 'ArrowRight') {
        e.preventDefault();
        // Pause if playing to ensure precise stop
        if (!videoRef.current.paused) {
          videoRef.current.pause();
          setIsPlaying(false);
        }
        videoRef.current.currentTime = Math.min(videoRef.current.duration, videoRef.current.currentTime + microStep);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (!videoRef.current.paused) {
          videoRef.current.pause();
          setIsPlaying(false);
        }
        videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - microStep);
      } else if (e.key === ' ') {
        // Spacebar to toggle play
        e.preventDefault();
        togglePlay();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []); // No dependencies needed as we use ref for video logic

  // Play/Pause toggle
  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  // Seek handler
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  // Frame step (approx 30fps) for UI buttons
  const stepFrame = (direction: 'forward' | 'backward') => {
    if (!videoRef.current) return;
    const frameTime = 1 / 30; 
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
    videoRef.current.currentTime += direction === 'forward' ? frameTime : -frameTime;
  };

  // Speed change
  const cycleSpeed = () => {
    if (!videoRef.current) return;
    const rates = [1.0, 0.5, 0.25, 0.1];
    const nextIdx = (rates.indexOf(playbackRate) + 1) % rates.length;
    const newRate = rates[nextIdx];
    setPlaybackRate(newRate);
    videoRef.current.playbackRate = newRate;
  };

  // AI Analysis Logic
  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!chatInput.trim() || isAnalyzing || !videoRef.current) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: chatInput,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setIsAnalyzing(true);

    try {
      // Capture frame
      const canvas = document.createElement('canvas');
      // Capture at native resolution for maximum quality
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      
      // High quality JPEG (0.98)
      const base64Image = canvas.toDataURL('image/jpeg', 0.98).split(',')[1]; 

      const history = messages.map(m => `${m.role}: ${m.text}`);
      const responseText = await analyzeFrame(base64Image, userMsg.text, history);

      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMsg]);

    } catch (error) {
      console.error(error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Render "Ticks" for the visual timeline
  const renderTicks = () => {
    return (
      <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 flex justify-between px-1 pointer-events-none opacity-50">
        {Array.from({ length: 40 }).map((_, i) => (
          <div 
            key={i} 
            className={`w-[1px] bg-neutral-400 ${i % 5 === 0 ? 'h-4 md:h-6 bg-neutral-200' : 'h-2 md:h-3'}`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="flex h-full w-full bg-black relative overflow-hidden">
      {/* Main Content */}
      <div className={`flex-1 flex flex-col relative transition-all duration-300 ${showChat ? 'lg:mr-80' : 'mr-0'} h-full`}>
        
        {/* Header Overlay */}
        <div className="absolute top-0 left-0 right-0 z-10 p-2 md:p-4 flex justify-between items-start bg-gradient-to-b from-black/90 to-transparent pointer-events-none">
          <button onClick={onBack} className="pointer-events-auto text-white/80 hover:text-white flex items-center gap-2 bg-black/40 p-2 rounded-full backdrop-blur-sm md:bg-transparent md:p-0 md:backdrop-blur-none transition-colors">
            <ChevronLeft size={20} className="md:w-6 md:h-6" />
            <span className="font-medium hidden md:inline">Volver a la galería</span>
          </button>
          
          <div className="text-center pointer-events-auto bg-black/40 px-3 py-1 rounded-full backdrop-blur-sm md:bg-transparent md:p-0">
            <h2 className="text-sm md:text-lg font-semibold truncate max-w-[150px] md:max-w-none">{video.name}</h2>
            <p className="text-[10px] md:text-xs text-neutral-400">{video.date}</p>
          </div>

          <button onClick={() => setShowChat(!showChat)} className="pointer-events-auto relative group bg-black/40 rounded-full backdrop-blur-sm md:bg-transparent">
            {/* Gemini Icon */}
             <div className={`p-2 rounded-full transition-colors ${showChat ? 'bg-blue-500/20 text-blue-400' : 'bg-neutral-800/80 md:bg-neutral-800 text-white hover:bg-neutral-700'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-sparkles md:w-6 md:h-6"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L12 3Z"/></svg>
             </div>
             {!showChat && <span className="hidden md:block absolute top-full right-0 mt-2 px-2 py-1 bg-neutral-800 text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">Analizar con Gemini</span>}
          </button>
        </div>

        {/* Video Area */}
        <div className="flex-1 flex items-center justify-center bg-neutral-900 overflow-hidden relative group w-full">
          <video 
            ref={videoRef}
            src={video.url}
            className="max-h-full max-w-full object-contain"
            playsInline
            loop={false}
            onClick={togglePlay}
          />
          {/* Keyboard Hint */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 px-3 py-1 rounded-full text-white/50 text-xs pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity hidden md:block">
            Usa las flechas ⬅ ➡ para moverte lentamente
          </div>
        </div>

        {/* Custom Controls Bar */}
        <div className="bg-neutral-950 border-t border-neutral-800 p-3 pb-6 md:p-6 md:pb-8 z-20 flex-shrink-0">
          
          {/* Time Display */}
          <div className="flex justify-end mb-1 md:mb-2">
             <span className="text-xl md:text-3xl font-mono font-light tracking-widest text-white">
               {currentTime.toFixed(3)} <span className="text-xs md:text-sm text-neutral-500">s</span>
             </span>
          </div>

          {/* Scrubber Area */}
          <div className="relative h-8 md:h-12 mb-4 md:mb-6 flex items-center w-full max-w-3xl mx-auto touch-none">
             {/* Ticks Background */}
             {renderTicks()}
             
             {/* Actual Range Input */}
             <input
              type="range"
              min="0"
              max={duration || 100}
              step="0.001"
              value={currentTime}
              onChange={handleSeek}
              className="absolute w-full h-full opacity-0 cursor-pointer z-20"
             />

             {/* Visual Progress Bar */}
             <div className="absolute top-1/2 -translate-y-1/2 left-0 h-1 bg-orange-500 z-10 pointer-events-none" style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}></div>
             <div className="absolute top-1/2 -translate-y-1/2 w-full h-1 bg-neutral-700 -z-0"></div>
             
             {/* Visual Thumb */}
             <div 
                className="absolute top-1/2 -translate-y-1/2 w-4 h-6 md:w-5 md:h-8 bg-orange-500 rounded-sm border-2 border-neutral-900 z-10 pointer-events-none shadow-[0_0_15px_rgba(249,115,22,0.5)]"
                style={{ left: `calc(${(currentTime / (duration || 1)) * 100}% - ${window.innerWidth < 768 ? '8px' : '10px'})` }}
             >
                <div className="w-[2px] h-full bg-white/50 mx-auto"></div>
             </div>
          </div>

          {/* Control Buttons */}
          <div className="flex items-center justify-between max-w-xl mx-auto px-0 md:px-4">
             <button onClick={cycleSpeed} className="text-sm md:text-xl font-medium text-white w-10 md:w-16 text-left hover:text-orange-400 transition-colors">
               {playbackRate}x
             </button>
             
             <div className="flex items-center gap-4 md:gap-8">
                <button onClick={() => { if(videoRef.current) { videoRef.current.currentTime = 0; videoRef.current.play(); setIsPlaying(true); }}} className="text-neutral-400 hover:text-white transition-colors">
                   <RotateCcw size={20} className="md:w-6 md:h-6" />
                </button>
                
                <button onClick={() => stepFrame('backward')} className="text-white hover:text-orange-400 transition-colors">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="md:w-8 md:h-8"><polygon points="19 20 9 12 19 4 19 20"></polygon><line x1="5" y1="19" x2="5" y2="5"></line></svg>
                </button>

                <button 
                  onClick={togglePlay} 
                  className="w-12 h-12 md:w-16 md:h-16 flex items-center justify-center rounded-full bg-white text-black hover:bg-neutral-200 transition-colors shadow-lg shadow-white/10"
                >
                  {isPlaying ? <Pause fill="black" size={24} className="md:w-8 md:h-8" /> : <Play fill="black" size={24} className="ml-1 md:w-8 md:h-8" />}
                </button>

                <button onClick={() => stepFrame('forward')} className="text-white hover:text-orange-400 transition-colors">
                   <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="md:w-8 md:h-8"><polygon points="5 4 15 12 5 20 5 4"></polygon><line x1="19" y1="5" x2="19" y2="19"></line></svg>
                </button>

                <button className="text-neutral-400 hover:text-white transition-colors hidden xs:block">
                   <Maximize2 size={20} className="md:w-6 md:h-6" />
                </button>
             </div>
             
             <div className="w-10 md:w-16"></div> {/* Spacer */}
          </div>
        </div>
      </div>

      {/* AI Drawer (Overlay on Mobile, Sidebar on Desktop) */}
      <div className={`fixed top-0 bottom-0 right-0 w-full sm:w-80 bg-neutral-900 border-l border-neutral-800 transform transition-transform duration-300 ease-in-out z-30 shadow-2xl flex flex-col ${showChat ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-900">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-tr from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
               <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-sparkles"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
            </div>
            <h3 className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">Gemini Coach</h3>
          </div>
          <button onClick={() => setShowChat(false)} className="text-neutral-500 hover:text-white p-2">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-neutral-900/50">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${
                msg.role === 'user' 
                ? 'bg-orange-600 text-white rounded-br-none' 
                : 'bg-neutral-800 text-gray-100 rounded-bl-none border border-neutral-700'
              }`}>
                {msg.text}
              </div>
            </div>
          ))}
          {isAnalyzing && (
             <div className="flex justify-start">
                <div className="bg-neutral-800 p-3 rounded-2xl rounded-bl-none border border-neutral-700 flex items-center gap-2">
                   <Loader2 size={16} className="animate-spin text-blue-400" />
                   <span className="text-xs text-gray-400">Analizando frame...</span>
                </div>
             </div>
          )}
        </div>

        <div className="p-4 bg-neutral-900 border-t border-neutral-800 pb-8 md:pb-4">
          <form onSubmit={handleSendMessage} className="relative">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Pregunta sobre la técnica..."
              className="w-full bg-neutral-800 text-white rounded-full py-3 pl-4 pr-12 focus:outline-none focus:ring-2 focus:ring-orange-500/50 text-sm placeholder-neutral-500"
            />
            <button 
              type="submit" 
              disabled={!chatInput.trim() || isAnalyzing}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-orange-600 rounded-full text-white hover:bg-orange-500 disabled:opacity-50 disabled:hover:bg-orange-600 transition-colors"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
