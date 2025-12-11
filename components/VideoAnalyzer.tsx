
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { VideoFile, ChatMessage } from '../types';
import { analyzeFrame } from '../services/geminiService';
import { 
  Play, Pause, ChevronLeft, ChevronRight, X, 
  Maximize2, RotateCcw, MessageSquare, Send, Loader2,
  ZoomIn, ZoomOut, Move, PenTool, Trash2, Eraser
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

export const VideoAnalyzer: React.FC<VideoAnalyzerProps> = ({ video, onBack }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Video State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
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

  // Reset View & Drawings on video change
  useEffect(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setLines([]);
    setIsDrawingMode(false);
  }, [video.id]);

  // Keyboard Navigation Handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (!videoRef.current) return;

      const microStep = 0.033; // ~30fps frame

      if (e.key === 'ArrowRight') {
        e.preventDefault();
        videoRef.current.pause();
        setIsPlaying(false);
        videoRef.current.currentTime = Math.min(videoRef.current.duration, videoRef.current.currentTime + microStep);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        videoRef.current.pause();
        setIsPlaying(false);
        videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - microStep);
      } else if (e.key === ' ') {
        e.preventDefault();
        togglePlay();
      } else if (e.key === 'Escape') {
        if (isDrawingMode) setIsDrawingMode(false);
        else if (showChat) setShowChat(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDrawingMode, showChat]);

  // --- Handlers ---

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

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const stepFrame = (direction: 'forward' | 'backward') => {
    if (!videoRef.current) return;
    const frameTime = 1 / 30; 
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
    videoRef.current.currentTime += direction === 'forward' ? frameTime : -frameTime;
  };

  const cycleSpeed = () => {
    if (!videoRef.current) return;
    const rates = [1.0, 0.5, 0.25, 0.1];
    const nextIdx = (rates.indexOf(playbackRate) + 1) % rates.length;
    const newRate = rates[nextIdx];
    setPlaybackRate(newRate);
    videoRef.current.playbackRate = newRate;
  };

  // --- Coordinate Calculation Helper ---
  // Transforms screen mouse coordinates into the zoomed/panned coordinate space of the video
  const getLocalCoordinates = (clientX: number, clientY: number) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    
    // Logic: 
    // Screen Coordinate = (Local Coordinate * Zoom) + Pan + ContainerOffset
    // Therefore: Local Coordinate = (Screen Coordinate - ContainerOffset - Pan) / Zoom
    
    return {
      x: (clientX - rect.left - pan.x) / zoom,
      y: (clientY - rect.top - pan.y) / zoom
    };
  };

  // --- Interaction Logic (Draw vs Pan) ---
  
  const handleMouseDown = (e: React.MouseEvent) => {
    if (showChat) return; 

    // DRAWING LOGIC
    if (isDrawingMode) {
      e.preventDefault(); // Prevent text selection etc
      const coords = getLocalCoordinates(e.clientX, e.clientY);
      setIsDrawingLine(true);
      setCurrentLine({
        start: coords,
        end: coords, // Initially start and end are same
        color: selectedColor
      });
      return;
    }

    // PANNING LOGIC (Only if zoomed in)
    if (zoom > 1) {
      e.preventDefault();
      setIsDraggingPan(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    // DRAWING UPDATE
    if (isDrawingLine && currentLine) {
      const coords = getLocalCoordinates(e.clientX, e.clientY);
      setCurrentLine({
        ...currentLine,
        end: coords
      });
      return;
    }

    // PANNING UPDATE
    if (isDraggingPan && zoom > 1) {
      e.preventDefault();
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    // FINISH DRAWING
    if (isDrawingLine && currentLine) {
      // Only add if it has some length
      const dx = currentLine.start.x - currentLine.end.x;
      const dy = currentLine.start.y - currentLine.end.y;
      if (Math.sqrt(dx*dx + dy*dy) > 2) {
         setLines(prev => [...prev, currentLine]);
      }
      setCurrentLine(null);
      setIsDrawingLine(false);
    }

    // FINISH PANNING
    setIsDraggingPan(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (showChat) return;
    // e.preventDefault(); // React synthetic events can't preventDefault on passive listeners sometimes, handled via style usually
    
    const scaleAmount = -e.deltaY * 0.001;
    const newZoom = Math.min(Math.max(1, zoom + scaleAmount * 5), 8);
    
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      
      // Calculate mouse position relative to the container (0,0 is top-left of container)
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      // Smart Zoom Logic:
      // We want the point under the mouse to remain stationary after the zoom.
      // (mouseX - oldPan) / oldZoom  ===  (mouseX - newPan) / newZoom
      // Solving for newPan:
      // newPan = mouseX - (mouseX - oldPan) * (newZoom / oldZoom)

      const newPanX = mouseX - (mouseX - pan.x) * (newZoom / zoom);
      const newPanY = mouseY - (mouseY - pan.y) * (newZoom / zoom);

      setPan({ x: newPanX, y: newPanY });
      setZoom(newZoom);
      
      // Reset if zoomed out completely
      if (newZoom === 1) {
         setPan({ x: 0, y: 0 });
      }
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
      ctx?.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
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
    <div className="flex h-full w-full bg-black relative overflow-hidden select-none">
      {/* Main Content */}
      <div className={`flex-1 flex flex-col relative transition-all duration-300 ${showChat ? 'lg:mr-80' : 'mr-0'} h-full`}>
        
        {/* Header Overlay */}
        <div className="absolute top-0 left-0 right-0 z-10 p-2 md:p-4 flex justify-between items-start pointer-events-none">
          {/* Top Left: Back Button */}
          <button onClick={onBack} className="pointer-events-auto text-white/80 hover:text-white flex items-center gap-2 bg-black/40 p-2 rounded-full backdrop-blur-sm transition-colors">
            <ChevronLeft size={20} className="md:w-6 md:h-6" />
          </button>
          
          {/* Top Center: Tools (Title, Pen, etc) */}
          <div className="pointer-events-auto flex items-center gap-2 bg-black/60 p-1.5 rounded-xl backdrop-blur-md border border-white/10 shadow-lg">
             <div className="px-3 border-r border-white/10">
               <h2 className="text-sm font-semibold truncate max-w-[100px] md:max-w-xs">{video.name}</h2>
             </div>
             
             {/* Drawing Tools Toggle */}
             <button 
                onClick={() => setIsDrawingMode(!isDrawingMode)}
                className={`p-2 rounded-lg transition-all flex items-center gap-2 ${isDrawingMode ? 'bg-orange-600 text-white' : 'hover:bg-white/10 text-neutral-300'}`}
                title="Herramienta de Dibujo"
             >
                <PenTool size={18} />
                {isDrawingMode && <span className="text-xs font-bold uppercase hidden md:inline">Dibujando</span>}
             </button>

             {/* Color Picker (Visible only when drawing) */}
             {isDrawingMode && (
               <div className="flex items-center gap-1.5 px-2 animate-in fade-in slide-in-from-left-2 duration-200 border-l border-white/10">
                  {DRAWING_COLORS.map(c => (
                     <button
                        key={c.id}
                        onClick={() => setSelectedColor(c.hex)}
                        className={`w-5 h-5 rounded-full border-2 transition-transform hover:scale-110 ${selectedColor === c.hex ? 'border-white scale-110' : 'border-transparent'}`}
                        style={{ backgroundColor: c.hex }}
                     />
                  ))}
                  <div className="w-[1px] h-4 bg-white/20 mx-1"></div>
                  <button 
                     onClick={() => setLines([])} 
                     className="p-1.5 text-neutral-400 hover:text-red-400 hover:bg-white/10 rounded-md transition-colors"
                     title="Borrar todo"
                  >
                     <Eraser size={16} />
                  </button>
               </div>
             )}
          </div>

          {/* Top Right: Chat Toggle */}
          <button onClick={() => setShowChat(!showChat)} className="pointer-events-auto relative group bg-black/40 rounded-full backdrop-blur-sm md:bg-transparent">
             <div className={`p-2 rounded-full transition-colors ${showChat ? 'bg-blue-500/20 text-blue-400' : 'bg-neutral-800/80 md:bg-neutral-800 text-white hover:bg-neutral-700'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-sparkles md:w-6 md:h-6"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L12 3Z"/></svg>
             </div>
          </button>
        </div>

        {/* Video Area */}
        <div 
          ref={containerRef}
          className={`flex-1 flex items-center justify-center bg-neutral-900 overflow-hidden relative group w-full ${isDrawingMode ? 'cursor-crosshair' : (zoom > 1 ? 'cursor-move' : 'cursor-default')}`}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Zoom/Pan Transform Container */}
          <div 
            style={{ 
              transformOrigin: '0 0', // Crucial for correct math mapping
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transition: (isDraggingPan || isDrawingLine) ? 'none' : 'transform 0.1s ease-out'
            }}
            className="w-full h-full flex items-center justify-center relative"
          >
            <video 
              ref={videoRef}
              src={video.url}
              className="max-h-full max-w-full object-contain pointer-events-none" 
              playsInline
              loop={false}
            />
            
            {/* Drawing Layer (SVG) - Sits exactly on top of video inside the transform */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
               {lines.map((line, i) => (
                  <line 
                     key={i}
                     x1={line.start.x} y1={line.start.y}
                     x2={line.end.x} y2={line.end.y}
                     stroke={line.color}
                     strokeWidth={4 / zoom} // Keep line width consistent visually
                     strokeLinecap="round"
                  />
               ))}
               {currentLine && (
                  <line 
                     x1={currentLine.start.x} y1={currentLine.start.y}
                     x2={currentLine.end.x} y2={currentLine.end.y}
                     stroke={currentLine.color}
                     strokeWidth={4 / zoom}
                     strokeLinecap="round"
                     opacity={0.8}
                  />
               )}
            </svg>
          </div>

          {/* Zoom Controls Overlay (Only when NOT drawing) */}
          {!isDrawingMode && (
            <div className="absolute top-1/2 right-4 -translate-y-1/2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-auto z-20">
               <button 
                  onClick={() => setZoom(z => Math.min(z + 0.5, 8))}
                  className="p-2 bg-black/50 hover:bg-black/80 rounded-full text-white backdrop-blur-sm transition-colors"
                  title="Zoom In"
               >
                  <ZoomIn size={20} />
               </button>
               <button 
                  onClick={() => { setZoom(1); setPan({x:0, y:0}); }}
                  className="p-2 bg-black/50 hover:bg-black/80 rounded-full text-white backdrop-blur-sm transition-colors"
                  title="Reset Zoom"
               >
                  <Maximize2 size={20} />
               </button>
               <button 
                  onClick={() => setZoom(z => Math.max(1, z - 0.5))}
                  className="p-2 bg-black/50 hover:bg-black/80 rounded-full text-white backdrop-blur-sm transition-colors"
                  title="Zoom Out"
               >
                  <ZoomOut size={20} />
               </button>
            </div>
          )}

          {/* Hints */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 px-3 py-1 rounded-full text-white/50 text-xs pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity hidden md:flex items-center gap-2">
            {isDrawingMode ? (
               <span>Clica y arrastra para dibujar líneas</span>
            ) : zoom > 1 ? (
              <>
                <Move size={12} />
                <span>Arrastra para mover</span>
              </>
            ) : (
              <span>Espacio: Play/Pause · Scroll: Zoom</span>
            )}
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

                <button onClick={() => { setZoom(1); setPan({x:0, y:0}); }} className={`text-neutral-400 hover:text-white transition-colors hidden xs:block ${zoom > 1 ? 'text-orange-500' : ''}`}>
                   <Maximize2 size={20} className="md:w-6 md:h-6" />
                </button>
             </div>
             
             <div className="w-10 md:w-16"></div> 
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
