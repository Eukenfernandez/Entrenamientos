
import React, { useRef, useState } from 'react';
import { VideoFile } from '../types';
import { Upload, MoreVertical, Cloud, Star, Film } from 'lucide-react';
import { generateVideoThumbnail } from '../utils/videoUtils';

interface GalleryProps {
  videos: VideoFile[];
  onSelectVideo: (video: VideoFile) => void;
  onUpload: (file: File, thumbnail: string) => void;
}

export const Gallery: React.FC<GalleryProps> = ({ videos, onSelectVideo, onUpload }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setIsUploading(true);
      try {
        const thumb = await generateVideoThumbnail(file);
        onUpload(file, thumb);
      } catch (e) {
        console.error("Error generating thumbnail", e);
      } finally {
        setIsUploading(false);
      }
    }
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
          <p className="text-neutral-500 max-w-sm mb-8">No has subido ningún video aún. Sube tu primer lanzamiento o levantamiento para comenzar el análisis.</p>
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 bg-orange-600 hover:bg-orange-500 text-white font-bold py-3 px-8 rounded-xl transition-colors"
          >
            <Upload size={20} />
            <span>Subir primer vídeo</span>
          </button>
        </div>
      ) : (
        /* Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {videos.map((video) => (
            <div 
              key={video.id} 
              className="group relative bg-neutral-900 rounded-xl overflow-hidden cursor-pointer transition-all duration-200 hover:-translate-y-1 shadow-lg shadow-black/50"
              onClick={() => onSelectVideo(video)}
            >
              {/* Image Container */}
              <div className="aspect-video relative overflow-hidden bg-neutral-800">
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

              {/* Card Footer */}
              <div className="p-4 flex justify-between items-start bg-neutral-900 relative">
                <div className="overflow-hidden">
                  <h4 className="text-sm text-white font-medium truncate mb-1">{video.name}</h4>
                  <p className="text-xs text-neutral-500">{video.date}</p>
                </div>
                <button className="text-neutral-500 hover:text-white p-1 rounded hover:bg-neutral-800 transition-colors">
                  <MoreVertical size={16} />
                </button>
                
                {/* Discrete Orange Bar */}
                <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-orange-500 transition-all duration-300 group-hover:w-full"></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Button (FAB) - Only show if there are videos */}
      {videos.length > 0 && (
        <div className="fixed bottom-8 right-8 z-20">
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 px-6 rounded-2xl shadow-[0_8px_30px_rgba(249,115,22,0.3)] transition-all transform hover:scale-105 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isUploading ? (
              <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
            ) : (
              <Upload size={20} />
            )}
            <span>{isUploading ? 'Procesando...' : 'Subir Video'}</span>
          </button>
        </div>
      )}

      <input 
        type="file" 
        ref={fileInputRef}
        className="hidden"
        accept="video/*"
        onChange={handleFileChange}
      />
    </div>
  );
};
