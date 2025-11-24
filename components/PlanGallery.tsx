import React, { useRef } from 'react';
import { PlanFile } from '../types';
import { Upload, MoreVertical, FileText } from 'lucide-react';

interface PlanGalleryProps {
  plans: PlanFile[];
  onSelectPlan: (plan: PlanFile) => void;
  onUpload: (file: File) => void;
}

export const PlanGallery: React.FC<PlanGalleryProps> = ({ plans, onSelectPlan, onUpload }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onUpload(file);
    }
  };

  return (
    <div className="h-full bg-neutral-950 p-6 md:p-10 overflow-y-auto relative">
      {/* Header */}
      <div className="flex flex-col items-start mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Entrenamientos</h1>
        <p className="text-neutral-400">Tus hojas de planificación y rutinas (PDF).</p>
      </div>

      {plans.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[60vh] text-center border-2 border-dashed border-neutral-800 rounded-3xl">
          <div className="w-20 h-20 bg-neutral-900 rounded-full flex items-center justify-center mb-6">
            <FileText size={32} className="text-red-600" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">Sin planificaciones</h3>
          <p className="text-neutral-500 max-w-sm mb-8">Sube el archivo PDF de tu entrenador para tenerlo siempre a mano.</p>
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 bg-orange-600 hover:bg-orange-500 text-white font-bold py-3 px-8 rounded-xl transition-colors"
          >
            <Upload size={20} />
            <span>Subir PDF</span>
          </button>
        </div>
      ) : (
        /* Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {plans.map((plan) => (
            <div 
              key={plan.id} 
              className="group relative bg-neutral-900 rounded-xl overflow-hidden cursor-pointer transition-all duration-200 hover:-translate-y-1 shadow-lg shadow-black/50"
              onClick={() => onSelectPlan(plan)}
            >
              {/* Fake Preview Container */}
              <div className="aspect-[4/5] relative overflow-hidden bg-neutral-800 flex items-center justify-center group-hover:bg-neutral-800/80 transition-colors">
                
                {/* Visual Document Effect */}
                <div className="absolute inset-0 opacity-10 p-4">
                   <div className="w-full h-full border-2 border-dashed border-white/20 rounded-md"></div>
                </div>

                <div className="relative z-10 flex flex-col items-center gap-2">
                   <div className="w-16 h-16 bg-red-600 rounded-xl flex items-center justify-center shadow-lg transform rotate-[-5deg] group-hover:rotate-0 transition-transform duration-300">
                      <FileText size={32} className="text-white" />
                   </div>
                   <span className="text-xs font-mono text-neutral-400 uppercase tracking-widest mt-2">.PDF</span>
                </div>
                
                <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/90 via-black/50 to-transparent">
                  <div className="flex justify-between items-end">
                     <span className="px-1.5 py-0.5 bg-red-900/50 text-red-400 rounded text-[10px] font-mono border border-red-900">DOCUMENTO</span>
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="p-4 flex justify-between items-start bg-neutral-900 relative">
                <div className="overflow-hidden">
                  <h4 className="text-sm text-white font-medium truncate mb-1">{plan.name}</h4>
                  <p className="text-xs text-neutral-500">{plan.date}</p>
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

      {/* Upload Button (FAB) */}
      {plans.length > 0 && (
        <div className="fixed bottom-8 right-8 z-20">
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 px-6 rounded-2xl shadow-[0_8px_30px_rgba(249,115,22,0.3)] transition-all transform hover:scale-105"
          >
            <Upload size={20} />
            <span>Subir Rutina</span>
          </button>
        </div>
      )}

      <input 
        type="file" 
        ref={fileInputRef}
        className="hidden"
        accept=".pdf"
        onChange={handleFileChange}
      />
    </div>
  );
};