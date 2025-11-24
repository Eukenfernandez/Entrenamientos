
import React from 'react';
import { VideoFile, StrengthRecord, ThrowRecord, Screen } from '../types';
import { Activity, TrendingUp, Video, Trophy } from 'lucide-react';

interface DashboardProps {
  userName?: string;
  videos: VideoFile[];
  strengthRecords: StrengthRecord[];
  throwRecords: ThrowRecord[]; // This is competition records passed from App
  onNavigate: (screen: Screen) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ userName = "Atleta", videos, strengthRecords, throwRecords, onNavigate }) => {
  const bestThrow = throwRecords.length > 0 ? Math.max(...throwRecords.map(r => r.distance)) : 0;
  const totalLifts = strengthRecords.length;
  
  return (
    <div className="p-6 md:p-10 bg-neutral-950 h-full overflow-y-auto">
      <h1 className="text-3xl font-bold text-white mb-1">Hola, {userName} 👋</h1>
      <p className="text-neutral-400 mb-8">Aquí tienes el resumen de tu rendimiento hoy.</p>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div onClick={() => onNavigate('competition')} className="bg-gradient-to-br from-neutral-900 to-neutral-900 border border-neutral-800 p-6 rounded-2xl hover:border-orange-500/50 transition-colors cursor-pointer group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-orange-500/10 rounded-lg text-orange-500 group-hover:bg-orange-500 group-hover:text-white transition-colors">
              <Trophy size={24} />
            </div>
            <span className="text-xs font-mono text-neutral-500">PB COMPETICIÓN</span>
          </div>
          <p className="text-4xl font-bold text-white">{bestThrow} <span className="text-lg text-neutral-500 font-normal">m</span></p>
        </div>

        <div onClick={() => onNavigate('gallery')} className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl hover:border-blue-500/50 transition-colors cursor-pointer group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-blue-500/10 rounded-lg text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-colors">
              <Video size={24} />
            </div>
            <span className="text-xs font-mono text-neutral-500">VÍDEOS</span>
          </div>
          <p className="text-4xl font-bold text-white">{videos.length} <span className="text-lg text-neutral-500 font-normal">analizados</span></p>
        </div>

        <div onClick={() => onNavigate('strength')} className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl hover:border-purple-500/50 transition-colors cursor-pointer group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-purple-500/10 rounded-lg text-purple-500 group-hover:bg-purple-500 group-hover:text-white transition-colors">
              <Activity size={24} />
            </div>
            <span className="text-xs font-mono text-neutral-500">REGISTROS FUERZA</span>
          </div>
          <p className="text-4xl font-bold text-white">{totalLifts} <span className="text-lg text-neutral-500 font-normal">entradas</span></p>
        </div>
      </div>

      {/* Recent Activity Section */}
      <h3 className="text-xl font-bold text-white mb-4">Actividad Reciente</h3>
      <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6 min-h-[200px] flex items-center justify-center text-neutral-500">
        {videos.length === 0 && strengthRecords.length === 0 ? (
          <p>No hay actividad reciente. Empieza subiendo un video o registrando una marca.</p>
        ) : (
          <div className="w-full space-y-4">
            {/* Simple list of recent items combined */}
            {videos.slice(0, 2).map(v => (
               <div key={v.id} className="flex items-center gap-4 p-3 bg-neutral-950/50 rounded-xl border border-neutral-800">
                  <div className="w-10 h-10 rounded bg-neutral-800 flex items-center justify-center text-blue-400"><Video size={18} /></div>
                  <div>
                    <p className="text-white text-sm font-medium">Video Subido: {v.name}</p>
                    <p className="text-neutral-500 text-xs">{v.date}</p>
                  </div>
               </div>
            ))}
            {strengthRecords.slice(0, 2).map(r => (
               <div key={r.id} className="flex items-center gap-4 p-3 bg-neutral-950/50 rounded-xl border border-neutral-800">
                  <div className="w-10 h-10 rounded bg-neutral-800 flex items-center justify-center text-purple-400"><TrendingUp size={18} /></div>
                  <div>
                    <p className="text-white text-sm font-medium">Nuevo RM: {r.exercise} - {r.weight}kg</p>
                    <p className="text-neutral-500 text-xs">{r.date}</p>
                  </div>
               </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
