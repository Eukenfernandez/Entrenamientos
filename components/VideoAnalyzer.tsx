
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { VideoFile, ChatMessage } from '../types';
import { analyzeFrame } from '../services/geminiService';
import { 
  Play, Pause, ChevronLeft, ChevronRight, X, 
  Maximize2, RotateCcw, MessageSquare, Send, Loader2,
  ZoomIn, ZoomOut, Move, PenTool, Trash2, Eraser,
  SplitSquareHorizontal, Link, Unlink, Plus
} from 'lucide-react';

interface VideoAnalyzerProps {
  video: VideoFile;
  onBack: () => void;
}

interface Line {
  start: { x: number; y: number };
  end: { x: number; y: number };
  color: string;
}

const DRAWING_COLORS = [
  { id: 'red', hex: '#ef4444' },
  { id: 'yellow', hex: '#eab308' },
  { id: 'green', hex: '#22c55e' },
  { id: 'blue', hex: '#3b82f6' },
];

// --- EXTRACTED COMPONENTS TO PREVENT RE-RENDERING ISSUES ---

interface ScrubberProps {
  curr: number;
  dur: number;
  setTime: (t: number) => void;
  isSmall?: boolean;
  onScrubStart: () => void;
  onScrubEnd: () => void;
}

const Scrubber: React.FC<ScrubberProps> = ({ 
  curr, dur, setTime, isSmall = false, onScrubStart, onScrubEnd 
}) => {
   return (
    <div className={`relative flex items-center w-full touch-none ${isSmall ? 'h-6' : 'h-8 md:h-12'}`}>
      <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 flex justify-between px-1 pointer-events-none opacity-30">
        {!isSmall && Array.from({ length: 40 }).map((_, i) => (
          <div key={i} className={`w-[1px] bg-neutral-400 ${i % 5 === 0 ? 'h-4 bg-neutral-200' : 'h-2'}`} />
        ))}
      </div>
      <input
        type="range"
        min="0"
        max={dur || 100}
        step="0.001"
        value={curr}
        onChange={(e) => setTime(parseFloat(e.target.value))}
        onMouseDown={onScrubStart}
        onTouchStart={onScrubStart}
        onMouseUp={onScrubEnd}
        onTouchEnd={onScrubEnd}
        className="absolute w-full h-full opacity-0 cursor-pointer z-20 pointer-events-auto"
      />
      {/* Orange Progress Bar */}
      <div className="absolute top-1/2 -translate-y-1/2 left-0 h-1 bg-orange-500 z-10 pointer-events-none" style={{ width: `${(curr / (dur || 1)) * 100}%` }}></div>
      <div className="absolute top-1/2 -translate-y-1/2 w-full h-1 bg-neutral-700 -z-0 pointer-events-none"></div>
      
      {/* Thumb Indicator */}
      <div 
        className={`absolute top-1/2 -translate-y-1/2 bg-orange-500 rounded-sm border-2 border-neutral-900 z-10 pointer-events-none shadow-[0_0_15px_rgba(249,115,22,0.5)] ${isSmall ? 'w-3 h-4' : 'w-4 h-6 md:w-5 md:h-8'}`}
        style={{ left: `calc(${(curr / (dur || 1)) * 100}% - ${isSmall ? '6px' : '10px'})` }}
      >
        {!isSmall && <div className="w-[2px] h-full bg-white/50 mx-auto"></div>}
      </div>
    </div>
   );
};

interface ControlGroupProps {
  target: 'primary' | 'secondary' | 'linked';
  curr: number;
  dur: number;
  isPlayingState: boolean;
  onSeek: (t: number) => void;
  onTogglePlay: () => void;
  onStep: (dir: 'forward' | 'backward') => void;
  onReset?: () => void;
  onCycleSpeed?: () => void;
  playbackRate?: number;
  onScrubStart: () => void;
  onScrubEnd: () => void;
  onResetView?: () => void;
  zoom?: number;
}

const ControlGroup: React.FC<ControlGroupProps> = ({ 
  target, curr, dur, isPlayingState, onSeek, onTogglePlay, onStep, onReset, onCycleSpeed, playbackRate, onScrubStart, onScrubEnd, onResetView, zoom
}) => (
   <div className="flex flex-col gap-2 w-full">
      {/* Time & Scrubber */}
      <div className="flex flex-col w-full">
         <div className="flex justify-end mb-1">
             <span className="text-xs md:text-sm font-mono font-light tracking-widest text-white">
                {curr.toFixed(3)} s
             </span>
          </div>
          <Scrubber 
            curr={curr} 
            dur={dur} 
            setTime={onSeek} 
            isSmall={target !== 'linked'} 
            onScrubStart={onScrubStart}
            onScrubEnd={onScrubEnd}
          />
      </div>
      
      {/* Buttons Row */}
      <div className="flex items-center justify-between mt-1">
           {target === 'linked' && onCycleSpeed && (
              <button onClick={onCycleSpeed} className="text-sm font-medium text-white w-10 text-left hover:text-orange-400">
                {playbackRate}x
              </button>
           )}
           {target !== 'linked' && <div className="w-8"></div>}

           <div className="flex items-center gap-4">
             {target === 'linked' && onReset && (
               <button onClick={onReset} className="text-neutral-400 hover:text-white">
                   <RotateCcw size={16} />
                </button>
             )}
              
              <button onClick={() => onStep('backward')} className="text-white hover:text-orange-400">
                 <ChevronLeft size={20} />
              </button>

              <button 
                onClick={onTogglePlay} 
                className={`flex items-center justify-center rounded-full bg-white text-black hover:bg-neutral-200 shadow-lg ${target === 'linked' ? 'w-12 h-12' : 'w-10 h-10'}`}
              >
                {isPlayingState ? <Pause fill="black" size={target === 'linked' ? 20 : 16} /> : <Play fill="black" size={target === 'linked' ? 20 : 16} className="ml-0.5" />}
              </button>

              <button onClick={() => onStep('forward')} className="text-white hover:text-orange-400">
                 <ChevronRight size={20} />
              </button>

              {target === 'linked' && onResetView && (
                 <button onClick={onResetView} className={`text-neutral-400 hover:text-white hidden xs:block ${zoom && zoom > 1 ? 'text-orange-500' : ''}`}>
                    <Maximize2 size={16} />
                 </button>
              )}
           </div>
           
           <div className="w-8"></div>
      </div>
   </div>
);


export const VideoAnalyzer: React.FC<VideoAnalyzerProps> = ({ video, onBack }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoRef2 = useRef<HTMLVideoElement>(null); // Ref for second video
  const containerRef = useRef<HTMLDivElement>(null); // Outer container for Pan/Zoom
  const drawingSurfaceRef = useRef<HTMLDivElement>(null); // Inner container for Drawing Calculation
  
  // NEW: Specific Ref for Primary Video Container to calculate drawing coordinates accurately
  const primaryVideoContainerRef = useRef<HTMLDivElement>(null);

  const secondaryFileInputRef = useRef<HTMLInputElement>(null);

  // Video 1 State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  
  // Video 2 State (Comparison)
  const [secondaryUrl, setSecondaryUrl] = useState<string | null>(null);
  const [isPlaying2, setIsPlaying2] = useState(false);
  const [currentTime2, setCurrentTime2] = useState(0);
  const [duration2, setDuration2] = useState(0);
  
  // Comparison Logic
  const [isLinked, setIsLinked] = useState(true);
  // NEW: Sync Offset stores the difference (Time2 - Time1) when linking videos
  const [syncOffset, setSyncOffset] = useState(0);
  
  // Scrubber Logic - Use Ref to avoid state closure issues in listeners
  const isScrubbingRef = useRef(false);

  // Common State
  const [playbackRate, setPlaybackRate] = useState(1.0);
  
  // AI Chat State
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

  // Zoom & Pan State
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDraggingPan, setIsDraggingPan] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Drawing State
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [selectedColor, setSelectedColor] = useState(DRAWING_COLORS[0].hex);
  const [lines, setLines] = useState<Line[]>([]);
  const [currentLine, setCurrentLine] = useState<Line | null>(null);
  const [isDrawingLine, setIsDrawingLine] = useState(false);

  // --- Initialization Effects ---

  // Video 1 Events
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    const handleTimeUpdate = () => {
      // Only update state if we are NOT scrubbing
      if (!isScrubbingRef.current) {
        setCurrentTime(v.currentTime);
      }
    };
    const handleDurationChange = () => setDuration(v.duration);
    const handleEnded = () => {
       setIsPlaying(false);
       if (isLinked && videoRef2.current) {
          videoRef2.current.pause();
          setIsPlaying2(false);
       }
    };

    v.addEventListener('timeupdate', handleTimeUpdate);
    v.addEventListener('loadedmetadata', handleDurationChange);
    v.addEventListener('ended', handleEnded);

    return () => {
      v.removeEventListener('timeupdate', handleTimeUpdate);
      v.removeEventListener('loadedmetadata', handleDurationChange);
      v.removeEventListener('ended', handleEnded);
    };
  }, [isLinked]);

  // Video 2 Events
  useEffect(() => {
    const v = videoRef2.current;
    if (!v) return;

    const handleTimeUpdate = () => {
      if (!isScrubbingRef.current) {
        setCurrentTime2(v.currentTime);
      }
    };
    const handleDurationChange = () => setDuration2(v.duration);
    const handleEnded = () => setIsPlaying2(false);

    v.addEventListener('timeupdate', handleTimeUpdate);
    v.addEventListener('loadedmetadata', handleDurationChange);
    v.addEventListener('ended', handleEnded);

    return () => {
      v.removeEventListener('timeupdate', handleTimeUpdate);
      v.removeEventListener('loadedmetadata', handleDurationChange);
      v.removeEventListener('ended', handleEnded);
    };
  }, [secondaryUrl]);

  // Reset View on video change
  useEffect(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setLines([]);
    setIsDrawingMode(false);
    setSyncOffset(0);
  }, [video.id]);

  // --- Handlers ---

  const handleScrubStart = () => { isScrubbingRef.current = true; };
  const handleScrubEnd = () => { 
     // Slight delay to ensure video seek finishes before we resume state updates from video
     setTimeout(() => { isScrubbingRef.current = false; }, 100); 
  };

  const handleUploadSecondary = (e: React.ChangeEvent<HTMLInputElement>) => {
     const file = e.target.files?.[0];
     if (file) {
        const url = URL.createObjectURL(file);
        setSecondaryUrl(url);
        // Reset zoom to fit both
        setZoom(1);
        setPan({x: 0, y: 0});
        setSyncOffset(0);
        setIsLinked(true);
     }
  };

  const closeSecondary = () => {
     setSecondaryUrl(null);
     setIsLinked(true);
     setSyncOffset(0);
  };

  // Toggle Linked/Unlinked State with Offset Calculation
  const toggleSyncMode = () => {
    if (!isLinked) {
      // User is enabling Sync.
      // Calculate offset so V2 follows V1 relative to current positions.
      // offset = time2 - time1
      setSyncOffset(currentTime2 - currentTime);
    } else {
      // User is unlinking. Reset offset? 
      // It's usually better to reset offset when unlinking to avoid confusion later,
      // or we can keep it. For now, let's keep it 0 to keep logic simple when re-linking manually.
      // Actually, if they unlink, they want to move them independently. When they re-link, we recalculate.
      setSyncOffset(0);
    }
    setIsLinked(!isLinked);
  };

  const togglePlay = (target: 'primary' | 'secondary' | 'linked') => {
    if (target === 'linked' || (isLinked && secondaryUrl)) {
       // Control Both
       if (isPlaying || isPlaying2) {
          videoRef.current?.pause();
          videoRef2.current?.pause();
          setIsPlaying(false);
          setIsPlaying2(false);
       } else {
          videoRef.current?.play();
          videoRef2.current?.play();
          setIsPlaying(true);
          setIsPlaying2(true);
       }
    } else if (target === 'primary') {
       if (videoRef.current?.paused) {
          videoRef.current.play();
          setIsPlaying(true);
       } else {
          videoRef.current?.pause();
          setIsPlaying(false);
       }
    } else if (target === 'secondary') {
       if (videoRef2.current?.paused) {
          videoRef2.current.play();
          setIsPlaying2(true);
       } else {
          videoRef2.current?.pause();
          setIsPlaying2(false);
       }
    }
  };

  // Robust Seek Handler with Offset
  const handleSeek = (time: number, target: 'primary' | 'secondary' | 'linked') => {
    if (target === 'linked' || (isLinked && secondaryUrl)) {
       // Primary moves to 'time'
       setCurrentTime(time);
       if (videoRef.current) videoRef.current.currentTime = time;
       
       // Secondary moves to 'time' + 'offset'
       const t2 = time + syncOffset;
       setCurrentTime2(t2);
       if (videoRef2.current) videoRef2.current.currentTime = t2;

    } else if (target === 'primary') {
       setCurrentTime(time);
       if (videoRef.current) videoRef.current.currentTime = time;
    } else if (target === 'secondary') {
       setCurrentTime2(time);
       if (videoRef2.current) videoRef2.current.currentTime = time;
    }
  };

  const stepFrame = (direction: 'forward' | 'backward', target: 'primary' | 'secondary' | 'linked') => {
    const frameTime = 1 / 30; 
    const step = direction === 'forward' ? frameTime : -frameTime;

    if (target === 'linked' || (isLinked && secondaryUrl)) {
       // Pause both first
       videoRef.current?.pause();
       videoRef2.current?.pause();
       setIsPlaying(false);
       setIsPlaying2(false);

       // Apply step to V1
       const newTime1 = currentTime + step;
       setCurrentTime(newTime1);
       if (videoRef.current) videoRef.current.currentTime = newTime1;

       // Apply step + offset to V2
       const newTime2 = newTime1 + syncOffset;
       setCurrentTime2(newTime2);
       if (videoRef2.current) videoRef2.current.currentTime = newTime2;

    } else if (target === 'primary') {
       if (videoRef.current) {
          videoRef.current.pause();
          setIsPlaying(false);
          videoRef.current.currentTime += step;
       }
    } else if (target === 'secondary') {
       if (videoRef2.current) {
          videoRef2.current.pause();
          setIsPlaying2(false);
          videoRef2.current.currentTime += step;
       }
    }
  };

  const cycleSpeed = () => {
    const rates = [1.0, 0.5, 0.25, 0.1];
    const nextIdx = (rates.indexOf(playbackRate) + 1) % rates.length;
    const newRate = rates[nextIdx];
    setPlaybackRate(newRate);
    
    if (videoRef.current) videoRef.current.playbackRate = newRate;
    if (videoRef2.current) videoRef2.current.playbackRate = newRate;
  };

  // --- Zoom/Pan/Draw Logic ---
  
  const getLocalCoordinates = (clientX: number, clientY: number) => {
    // UPDATED: Calculate relative to the specific video container, not the whole drawing surface
    // This ensures that when comparing videos, drawing on the left video is accurate relative to its SVG origin.
    const targetRef = primaryVideoContainerRef.current || drawingSurfaceRef.current;
    
    if (!targetRef) return { x: 0, y: 0 };
    const rect = targetRef.getBoundingClientRect();
    
    // We only need to account for ZOOM in the coordinate system, 
    // because clientX/Y - rect.left/top handles the pan/position/container offset.
    return {
      x: (clientX - rect.left) / zoom,
      y: (clientY - rect.top) / zoom
    };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (showChat) return; 
    if (isDrawingMode) {
      e.preventDefault();
      const coords = getLocalCoordinates(e.clientX, e.clientY);
      setIsDrawingLine(true);
      setCurrentLine({ start: coords, end: coords, color: selectedColor });
      return;
    }
    if (zoom > 1) {
      e.preventDefault();
      setIsDraggingPan(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDrawingLine && currentLine) {
      const coords = getLocalCoordinates(e.clientX, e.clientY);
      setCurrentLine({ ...currentLine, end: coords });
      return;
    }
    if (isDraggingPan && zoom > 1) {
      e.preventDefault();
      setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    }
  };

  const handleMouseUp = () => {
    if (isDrawingLine && currentLine) {
      const dx = currentLine.start.x - currentLine.end.x;
      const dy = currentLine.start.y - currentLine.end.y;
      if (Math.sqrt(dx*dx + dy*dy) > 2) {
         setLines(prev => [...prev, currentLine]);
      }
      setCurrentLine(null);
      setIsDrawingLine(false);
    }
    setIsDraggingPan(false);
  };

  // --- NEW: Touch Event Handlers for Mobile ---
  const handleTouchStart = (e: React.TouchEvent) => {
    if (showChat) return;
    const touch = e.touches[0];
    const clientX = touch.clientX;
    const clientY = touch.clientY;

    if (isDrawingMode) {
      // Logic identical to mouse down but with touch coords
      const coords = getLocalCoordinates(clientX, clientY);
      setIsDrawingLine(true);
      setCurrentLine({ start: coords, end: coords, color: selectedColor });
      return;
    }
    
    // Panning logic for mobile
    if (zoom > 1) {
      setIsDraggingPan(true);
      setDragStart({ x: clientX - pan.x, y: clientY - pan.y });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (showChat) return;
    const touch = e.touches[0];
    const clientX = touch.clientX;
    const clientY = touch.clientY;

    if (isDrawingLine && currentLine) {
      const coords = getLocalCoordinates(clientX, clientY);
      setCurrentLine({ ...currentLine, end: coords });
      return;
    }

    if (isDraggingPan && zoom > 1) {
      // Dragging logic
      setPan({ x: clientX - dragStart.x, y: clientY - dragStart.y });
    }
  };

  const handleTouchEnd = () => {
      // Reuse cleanup logic from mouse up
      handleMouseUp();
  };


  const handleWheel = (e: React.WheelEvent) => {
    if (showChat) return;
    const scaleAmount = -e.deltaY * 0.001;
    const newZoom = Math.min(Math.max(1, zoom + scaleAmount * 5), 8);
    
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const newPanX = mouseX - (mouseX - pan.x) * (newZoom / zoom);
      const newPanY = mouseY - (mouseY - pan.y) * (newZoom / zoom);

      setPan({ x: newPanX, y: newPanY });
      setZoom(newZoom);
      if (newZoom === 1) setPan({ x: 0, y: 0 });
    }
  };

  // --- AI Analysis ---
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
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      }
      const base64Image = canvas.toDataURL('image/jpeg', 0.9).split(',')[1]; 
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

  // --- Render ---

  return (
    <div className="flex h-full w-full bg-black relative overflow-hidden select-none">
      <input type="file" ref={secondaryFileInputRef} onChange={handleUploadSecondary} className="hidden" accept="video/*" />
      
      {/* Main Content */}
      <div className={`flex-1 flex flex-col relative transition-all duration-300 ${showChat ? 'lg:mr-80' : 'mr-0'} h-full`}>
        
        {/* Header Overlay */}
        <div className="absolute top-0 left-0 right-0 z-10 p-2 md:p-4 flex justify-between items-start pointer-events-none">
          <div className="flex items-center gap-2 pointer-events-auto bg-black/40 p-1.5 rounded-full backdrop-blur-sm border border-white/10">
            <button onClick={onBack} className="text-white/80 hover:text-white flex items-center gap-2 p-2 rounded-full hover:bg-white/10 transition-colors" title="Atrás">
              <ChevronLeft size={20} />
            </button>
            <div className="w-[1px] h-6 bg-white/20"></div>
            {/* Compare Toggle */}
            <button 
               onClick={() => secondaryFileInputRef.current?.click()}
               className="text-white/80 hover:text-orange-400 flex items-center gap-2 px-3 py-2 rounded-full hover:bg-white/10 transition-colors"
               title="Comparar Video"
            >
               {secondaryUrl ? <SplitSquareHorizontal size={20} /> : <Plus size={20} />}
               <span className="text-xs font-semibold hidden md:inline">{secondaryUrl ? 'Cambiar Video 2' : 'Comparar'}</span>
            </button>
            <div className="w-[1px] h-6 bg-white/20"></div>
            {/* Drawing Tools - Moved to Left Group */}
            <button 
                onClick={() => setIsDrawingMode(!isDrawingMode)}
                className={`p-2 rounded-full transition-all flex items-center gap-2 ${isDrawingMode ? 'bg-orange-600 text-white shadow-lg' : 'hover:bg-white/10 text-neutral-300 hover:text-white'}`}
                title="Dibujar"
             >
                <PenTool size={18} />
             </button>
             {isDrawingMode && (
               <div className="flex items-center gap-1.5 px-2">
                  {DRAWING_COLORS.map(c => (
                     <button
                        key={c.id}
                        onClick={() => setSelectedColor(c.hex)}
                        className={`w-4 h-4 rounded-full border border-white/50 ${selectedColor === c.hex ? 'scale-125 border-white' : ''}`}
                        style={{ backgroundColor: c.hex }}
                     />
                  ))}
                  <button onClick={() => setLines([])} className="p-1.5 text-neutral-400 hover:text-red-400"><Eraser size={16} /></button>
               </div>
             )}
          </div>
          
          <button onClick={() => setShowChat(!showChat)} className="pointer-events-auto bg-black/40 rounded-full backdrop-blur-sm p-2 text-white hover:bg-neutral-700 border border-white/10">
             <MessageSquare size={20} />
          </button>
        </div>

        {/* --- VIDEO AREA --- */}
        <div 
          ref={containerRef} // Handlers for Pan/Zoom attached here
          className={`flex-1 flex items-center justify-center bg-neutral-900 overflow-hidden relative group w-full touch-none ${isDrawingMode ? 'cursor-crosshair' : (zoom > 1 ? 'cursor-move' : 'cursor-default')}`}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Transform Container */}
          <div 
            style={{ 
              transformOrigin: '0 0',
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transition: (isDraggingPan || isDrawingLine) ? 'none' : 'transform 0.1s ease-out'
            }}
            className="w-full h-full flex items-center justify-center relative will-change-transform"
          >
             {/* THE DRAWING SURFACE: Wraps videos and SVG. We use this ref for drawing calculations to match video position/size */}
             <div 
                ref={drawingSurfaceRef} 
                className={`flex items-center justify-center w-full h-full gap-1 ${secondaryUrl ? 'px-4' : ''} relative`}
             >
                {/* VIDEO 1 (Primary) */}
                <div 
                  ref={primaryVideoContainerRef} 
                  className="relative max-h-full max-w-full flex-1 flex justify-center"
                >
                  <video 
                     ref={videoRef}
                     src={video.url}
                     className="max-h-full max-w-full object-contain pointer-events-none" 
                     playsInline loop={false}
                  />
                  {/* Drawing Layer Video 1 */}
                  <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
                     {lines.map((line, i) => (
                        <line key={i} x1={line.start.x} y1={line.start.y} x2={line.end.x} y2={line.end.y} stroke={line.color} strokeWidth={4 / zoom} strokeLinecap="round" />
                     ))}
                     {currentLine && (
                        <line x1={currentLine.start.x} y1={currentLine.start.y} x2={currentLine.end.x} y2={currentLine.end.y} stroke={currentLine.color} strokeWidth={4 / zoom} strokeLinecap="round" opacity={0.8} />
                     )}
                  </svg>
                </div>

                {/* VIDEO 2 (If Exists) */}
                {secondaryUrl && (
                  <div className="relative max-h-full max-w-full flex-1 flex justify-center border-l border-white/10 pl-1">
                     <video 
                        ref={videoRef2}
                        src={secondaryUrl}
                        className="max-h-full max-w-full object-contain pointer-events-none" 
                        playsInline loop={false}
                     />
                     <button onClick={closeSecondary} className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-full pointer-events-auto hover:bg-red-600 z-50">
                        <X size={14} />
                     </button>
                  </div>
                )}
             </div>
          </div>
          
          {!isDrawingMode && (
             <div className="absolute top-1/2 right-4 -translate-y-1/2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-auto z-20">
               <button onClick={() => setZoom(z => Math.min(z + 0.5, 8))} className="p-2 bg-black/50 rounded-full text-white"><ZoomIn size={20} /></button>
               <button onClick={() => { setZoom(1); setPan({x:0, y:0}); }} className="p-2 bg-black/50 rounded-full text-white"><Maximize2 size={20} /></button>
               <button onClick={() => setZoom(z => Math.max(1, z - 0.5))} className="p-2 bg-black/50 rounded-full text-white"><ZoomOut size={20} /></button>
             </div>
          )}
        </div>

        {/* --- FOOTER CONTROLS --- */}
        <div className="bg-neutral-950 border-t border-neutral-800 p-3 pb-6 md:p-6 md:pb-8 z-20 flex-shrink-0">
          
          {/* Link Toggle (Only if secondary exists) */}
          {secondaryUrl && (
             <div className="flex justify-center mb-4">
                <button 
                  onClick={toggleSyncMode}
                  className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold transition-all ${isLinked ? 'bg-blue-600 text-white' : 'bg-neutral-800 text-neutral-400'}`}
                >
                   {isLinked ? <><Link size={14} /> Sincronizados (Linked)</> : <><Unlink size={14} /> Independientes (Unlinked)</>}
                </button>
             </div>
          )}

          {/* Controls Container */}
          <div className="max-w-4xl mx-auto">
             {(!secondaryUrl || isLinked) ? (
                // SINGLE / LINKED MODE
                <ControlGroup 
                  target="linked" 
                  curr={currentTime} 
                  dur={duration} 
                  isPlayingState={isPlaying || isPlaying2} 
                  onSeek={(t) => handleSeek(t, 'linked')}
                  onTogglePlay={() => togglePlay('linked')}
                  onStep={(dir) => stepFrame(dir, 'linked')}
                  onReset={() => { 
                      handleSeek(0, 'linked'); 
                      setIsPlaying(true); 
                      setIsPlaying2(true); 
                      videoRef.current?.play(); 
                      videoRef2.current?.play(); 
                  }}
                  onCycleSpeed={cycleSpeed}
                  playbackRate={playbackRate}
                  onScrubStart={handleScrubStart}
                  onScrubEnd={handleScrubEnd}
                  onResetView={() => { setZoom(1); setPan({x:0, y:0}); }}
                  zoom={zoom}
                />
             ) : (
                // UNLINKED MODE (Split Controls)
                <div className="grid grid-cols-2 gap-8">
                   {/* Left Video Controls */}
                   <div className="border-r border-neutral-800 pr-4">
                      <div className="text-xs text-neutral-500 mb-2 font-bold uppercase">Video 1</div>
                      <ControlGroup 
                        target="primary" 
                        curr={currentTime} 
                        dur={duration} 
                        isPlayingState={isPlaying}
                        onSeek={(t) => handleSeek(t, 'primary')}
                        onTogglePlay={() => togglePlay('primary')}
                        onStep={(dir) => stepFrame(dir, 'primary')}
                        onScrubStart={handleScrubStart}
                        onScrubEnd={handleScrubEnd}
                      />
                   </div>
                   {/* Right Video Controls */}
                   <div className="pl-4">
                      <div className="text-xs text-neutral-500 mb-2 font-bold uppercase">Video 2</div>
                      <ControlGroup 
                        target="secondary" 
                        curr={currentTime2} 
                        dur={duration2} 
                        isPlayingState={isPlaying2} 
                        onSeek={(t) => handleSeek(t, 'secondary')}
                        onTogglePlay={() => togglePlay('secondary')}
                        onStep={(dir) => stepFrame(dir, 'secondary')}
                        onScrubStart={handleScrubStart}
                        onScrubEnd={handleScrubEnd}
                      />
                   </div>
                </div>
             )}
          </div>
        </div>
      </div>

      {/* AI Drawer */}
      <div className={`fixed top-0 bottom-0 right-0 w-full sm:w-80 bg-neutral-900 border-l border-neutral-800 transform transition-transform duration-300 ease-in-out z-30 shadow-2xl flex flex-col ${showChat ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-900">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">Gemini Coach</h3>
          </div>
          <button onClick={() => setShowChat(false)} className="text-neutral-500 hover:text-white p-2">
            <X size={24} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-neutral-900/50">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-orange-600 text-white rounded-br-none' : 'bg-neutral-800 text-gray-100 rounded-bl-none border border-neutral-700'}`}>
                {msg.text}
              </div>
            </div>
          ))}
          {isAnalyzing && <div className="flex justify-start"><Loader2 size={16} className="animate-spin text-blue-400" /></div>}
        </div>
        <div className="p-4 bg-neutral-900 border-t border-neutral-800 pb-8 md:pb-4">
          <form onSubmit={handleSendMessage} className="relative">
            <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Pregunta sobre la técnica..." className="w-full bg-neutral-800 text-white rounded-full py-3 pl-4 pr-12 text-sm" />
            <button type="submit" disabled={!chatInput.trim() || isAnalyzing} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-orange-600 rounded-full text-white hover:bg-orange-500"><Send size={16} /></button>
          </form>
        </div>
      </div>
    </div>
  );
};
