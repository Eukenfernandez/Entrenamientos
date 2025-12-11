
import React, { useRef, useState, useEffect } from 'react';
import { VideoFile } from '../types';
import { Upload, MoreVertical, Cloud, Star, Film, Trash2, Camera, X, Circle, StopCircle, AlertTriangle } from 'lucide-react';
import { generateVideoThumbnail, CAMERA_CONSTRAINTS } from '../utils/videoUtils';

interface GalleryProps {
  videos: VideoFile[];
  onSelectVideo: (video: VideoFile) => void;
  onUpload: (file: File, thumbnail: string) => void;
  onDelete: (id: string) => void;
}

export const Gallery: React.FC<GalleryProps> = ({ videos, onSelectVideo, onUpload, onDelete }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  
  // Custom Delete Modal State
  const [videoToDelete, setVideoToDelete] = useState<string | null>(null);

  // Camera State
  const [showCamera, setShowCamera] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const videoPreviewRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      await processUpload(file);
    }
  };

  const processUpload = async (file: File) => {
    setIsUploading(true);
    try {
      const thumb = await generateVideoThumbnail(file);
      onUpload(file, thumb);
    } catch (e) {
      console.error("Error generating thumbnail", e);
    } finally {
      setIsUploading(false);
    }
  };

  const toggleMenu = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    e.preventDefault();
    setActiveMenuId(activeMenuId === id ? null : id);
  };

  const handleDeleteClick = (e: React.MouseEvent, id: string) => {
    // Prevent event from bubbling to Card
    e.stopPropagation();
    e.preventDefault();
    
    // Close menu immediately
    setActiveMenuId(null);

    // Open Custom Modal
    setVideoToDelete(id);
  };

  const confirmDelete = () => {
    if (videoToDelete) {
      onDelete(videoToDelete);
      setVideoToDelete(null);
    }
  };

  const cancelDelete = () => {
    setVideoToDelete(null);
  };

  // Close menu when clicking outside
  useEffect(() => {
    const closeMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('.menu-dropdown') || target.closest('.menu-toggle')) return;
      setActiveMenuId(null);
    };
    
    window.addEventListener('click', closeMenu, true);
    return () => window.removeEventListener('click', closeMenu, true);
  }, []);

  // --- CAMERA LOGIC ---

  // Fix: Assign stream to video element AFTER modal is mounted
  useEffect(() => {
    if (showCamera && cameraStream && videoPreviewRef.current) {
      videoPreviewRef.current.srcObject = cameraStream;
    }
  }, [showCamera, cameraStream]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia(CAMERA_CONSTRAINTS);
      setCameraStream(stream);
      // We set showCamera true here, but the ref assignment happens in the useEffect above
      // once the DOM updates and videoPreviewRef.current is not null.
      setShowCamera(true);
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert("No se pudo acceder a la cámara. Verifica los permisos.");
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setShowCamera(false);
    setIsRecording(false);
    setRecordingTime(0);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const startRecording = () => {
    if (!cameraStream) return;
    chunksRef.current = [];
    
    // Check supported mime types
    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9') 
      ? 'video/webm;codecs=vp9' 
      : (MediaRecorder.isTypeSupported('video/mp4') ? 'video/mp4' : 'video/webm');

    const recorder = new MediaRecorder(cameraStream, { mimeType });
    
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = async () => {
      const blob = new Blob(chunksRef.current, { type: mimeType });
      const file = new File([blob], `grabacion_${Date.now()}.${mimeType === 'video/mp4' ? 'mp4' : 'webm'}`, { type: mimeType });
      stopCamera();
      await processUpload(file);
    };

    recorder.start();
    mediaRecorderRef.current = recorder;
    setIsRecording(true);
    
    timerRef.current = setInterval(() => {
      setRecordingTime(t => t + 1);
    }, 1000);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="h-full bg-neutral-950 p-6 md:p-10 overflow-y-auto relative">
      {/* Header */}
      <div className="flex flex-col items-start mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Análisis de Técnica</h1>
        <p className="text-neutral-400">Sube tus vídeos y utiliza la IA para diseccionar cada movimiento.</p>
      </div>

      {videos.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[60vh] text-center border-2 border-dashed border-neutral-800 rounded-3xl">
          <div className="w-20 h-20 bg-neutral-900 rounded-full flex items-center justify-center mb-6">
            <Film size={32} className="text-neutral-500" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">Tu galería está vacía</h3>
          <p className="text-neutral-500 max-w-sm mb-8">Sube o graba tu primer lanzamiento para comenzar el análisis.</p>
          <div className="flex gap-4">
             <button 
               onClick={() => fileInputRef.current?.click()}
               className="flex items-center gap-2 bg-neutral-800 hover:bg-neutral-700 text-white font-bold py-3 px-6 rounded-xl transition-colors"
             >
               <Upload size={20} />
               <span>Subir Archivo</span>
             </button>
             <button 
               onClick={startCamera}
               className="flex items-center gap-2 bg-orange-600 hover:bg-orange-500 text-white font-bold py-3 px-6 rounded-xl transition-colors shadow-lg shadow-orange-900/20"
             >
               <Camera size={20} />
               <span>Grabar (4K)</span>
             </button>
          </div>
        </div>
      ) : (
        /* Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-24">
          {videos.map((video) => (
            <div 
              key={video.id} 
              className="group relative bg-neutral-900 rounded-xl cursor-pointer transition-all duration-200 hover:-translate-y-1 shadow-lg shadow-black/50"
              onClick={(e) => {
                 const target = e.target as HTMLElement;
                 if (target.closest('button') || target.closest('.menu-dropdown')) return;
                 onSelectVideo(video);
              }}
            >
              {/* Image Container - Rounded Top */}
              <div className="aspect-video relative overflow-hidden bg-neutral-800 rounded-t-xl">
                <img 
                  src={video.thumbnail} 
                  alt={video.name} 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 opacity-90 group-hover:opacity-100"
                />
                
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="bg-black/50 p-1.5 rounded-full backdrop-blur-sm">
                     <Star size={14} className="text-yellow-500" fill="currentColor" />
                  </div>
                </div>
                
                <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/90 via-black/50 to-transparent">
                  <div className="flex justify-between items-end">
                     <span className="px-1.5 py-0.5 bg-black/60 rounded text-[10px] font-mono text-white border border-white/10">{video.duration}</span>
                  </div>
                </div>
              </div>

              {/* Card Footer - Rounded Bottom */}
              <div className="p-4 flex justify-between items-start bg-neutral-900 relative rounded-b-xl z-10">
                <div className="overflow-hidden pr-2">
                  <h4 className="text-sm text-white font-medium truncate mb-1">{video.name}</h4>
                  <p className="text-xs text-neutral-500">{video.date}</p>
                </div>
                
                <div className="relative">
                  <button 
                    onClick={(e) => toggleMenu(e, video.id)}
                    className="menu-toggle text-neutral-500 hover:text-white p-1 rounded hover:bg-neutral-800 transition-colors"
                  >
                    <MoreVertical size={16} />
                  </button>
                  
                  {/* Dropdown Menu */}
                  {activeMenuId === video.id && (
                    <div 
                      className="menu-dropdown absolute bottom-full right-0 mb-2 w-36 bg-neutral-800 border border-neutral-700 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-100 z-[50]"
                      onClick={(e) => e.stopPropagation()} 
                    >
                      <button 
                        type="button"
                        onClick={(e) => handleDeleteClick(e, video.id)}
                        className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-neutral-700 hover:text-red-300 flex items-center gap-2 transition-colors font-semibold cursor-pointer z-[60]"
                      >
                        <Trash2 size={16} />
                        Eliminar
                      </button>
                    </div>
                  )}
                </div>
                
                {/* Discrete Orange Bar */}
                <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-orange-500 transition-all duration-300 group-hover:w-full rounded-b-xl"></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Floating Action Buttons */}
      <div className="fixed bottom-8 right-8 z-20 flex flex-col gap-4">
        {videos.length > 0 && (
          <>
            <button 
              onClick={startCamera}
              className="flex items-center justify-center w-14 h-14 bg-neutral-800 hover:bg-neutral-700 text-white rounded-full shadow-[0_4px_10px_rgba(0,0,0,0.5)] transition-all transform hover:scale-105"
              title="Grabar Vídeo"
            >
              <Camera size={24} />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
              disabled={isUploading}
              className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 px-6 rounded-2xl shadow-[0_8px_30px_rgba(249,115,22,0.3)] transition-all transform hover:scale-105 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isUploading ? (
                <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
              ) : (
                <Upload size={20} />
              )}
              <span>Subir Video</span>
            </button>
          </>
        )}
      </div>

      <input 
        type="file" 
        ref={fileInputRef}
        className="hidden"
        accept="video/*"
        onChange={handleFileChange}
      />

      {/* Custom Delete Confirmation Modal */}
      {videoToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
           <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-3xl max-w-sm w-full shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
              <div className="flex flex-col items-center text-center">
                 <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
                    <AlertTriangle size={32} className="text-red-500" />
                 </div>
                 <h3 className="text-xl font-bold text-white mb-2">¿Eliminar vídeo?</h3>
                 <p className="text-neutral-400 text-sm mb-6">
                    Esta acción no se puede deshacer. El vídeo se borrará permanentemente de tu galería.
                 </p>
                 <div className="flex gap-3 w-full">
                    <button 
                       onClick={cancelDelete}
                       className="flex-1 py-3 px-4 bg-neutral-800 hover:bg-neutral-700 text-white font-medium rounded-xl transition-colors"
                    >
                       Cancelar
                    </button>
                    <button 
                       onClick={confirmDelete}
                       className="flex-1 py-3 px-4 bg-red-600 hover:bg-red-500 text-white font-medium rounded-xl transition-colors"
                    >
                       Sí, eliminar
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* Camera Overlay */}
      {showCamera && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
           <div className="relative flex-1 bg-black overflow-hidden flex items-center justify-center">
              <video 
                ref={videoPreviewRef} 
                autoPlay 
                playsInline 
                muted 
                className="w-full h-full object-cover"
              />
              {isRecording && (
                <div className="absolute top-8 left-1/2 -translate-x-1/2 bg-red-600/90 text-white px-4 py-2 rounded-full flex items-center gap-2 backdrop-blur-md animate-pulse">
                   <div className="w-3 h-3 bg-white rounded-full"></div>
                   <span className="font-mono font-bold">{formatTime(recordingTime)}</span>
                </div>
              )}
              {!isRecording && (
                <button 
                   onClick={stopCamera}
                   className="absolute top-6 right-6 p-3 bg-black/50 text-white rounded-full hover:bg-black/70 backdrop-blur-md"
                >
                   <X size={24} />
                </button>
              )}
           </div>
           <div className="h-32 bg-black flex items-center justify-center gap-10">
              {isRecording ? (
                 <button 
                    onClick={stopRecording}
                    className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center group"
                 >
                    <div className="w-8 h-8 bg-red-600 rounded-md group-hover:scale-90 transition-transform"></div>
                 </button>
              ) : (
                 <button 
                    onClick={startRecording}
                    className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center p-1 group"
                 >
                    <div className="w-full h-full bg-red-600 rounded-full group-hover:scale-90 transition-transform"></div>
                 </button>
              )}
           </div>
        </div>
      )}
    </div>
  );
};
