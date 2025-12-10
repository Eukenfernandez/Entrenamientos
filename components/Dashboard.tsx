
import React from 'react';
import { VideoFile, StrengthRecord, ThrowRecord, Screen } from '../types';
import { Activity, TrendingUp, Video, Trophy, Target, CalendarRange } from 'lucide-react';

interface DashboardProps {
  userName?: string;
  videos: VideoFile[];
  strengthRecords: StrengthRecord[];
  throwRecords: ThrowRecord[]; // Competition
  trainingRecords: ThrowRecord[]; // Training
  onNavigate: (screen: Screen) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ 
  userName = "Atleta", 
  videos, 
  strengthRecords, 
  throwRecords, 
  trainingRecords,
  onNavigate 
}) => {
  const bestThrow = throwRecords.length > 0 ? Math.max(...throwRecords.map(r => r.distance)) : 0;
  const totalLifts = strengthRecords.length;

  // --- Graph Data Logic ---
  const renderGlobalGraph = () => {
    // 1. Gather all dates
    const allDates = [
      ...throwRecords.map(r => r.date),
      ...trainingRecords.map(r => r.date),
      ...strengthRecords.map(r => r.date)
    ];
    
    // If absolutely no data, show placeholder
    if (allDates.length === 0) {
      return (
        <div className="h-64 flex flex-col items-center justify-center text-neutral-500 bg-neutral-900/50 rounded-2xl border border-neutral-800">
          <TrendingUp size={32} className="mb-2 opacity-50" />
          <p>Añade registros para ver tu evolución global.</p>
        </div>
      );
    }

    // 2. Sort and find Range
    const uniqueDates = [...new Set(allDates)].sort();
    const minDateObj = new Date(uniqueDates[0]).getTime();
    const maxDateObj = new Date(uniqueDates[uniqueDates.length - 1]).getTime();
    
    // If all dates are the same (or only 1 date), create a fake range of 1 day to allow centering
    let timeRange = maxDateObj - minDateObj;
    if (timeRange === 0) timeRange = 24 * 60 * 60 * 1000; // 1 day in ms

    // 3. Find Max Values for Normalization (0-100% scale)
    const maxComp = Math.max(...throwRecords.map(r => r.distance), 1);
    const maxTrain = Math.max(...trainingRecords.map(r => r.distance), 1);
    // Strength: average weight of the day relative to max weight
    const maxStrength = Math.max(...strengthRecords.map(r => r.weight), 1);

    // 4. Helper to map date to X and value to Y
    const width = 1000;
    const height = 300;
    const padding = 30; // Increased padding
    const graphW = width - padding * 2;
    const graphH = height - padding * 2;

    const getX = (dateStr: string) => {
      const t = new Date(dateStr).getTime();
      // If only 1 date, center it. Else spread.
      const percent = (t - minDateObj) / timeRange;
      return padding + percent * graphW;
    };

    const getY = (val: number, maxVal: number) => {
      const normalized = val / maxVal; 
      return height - padding - (normalized * graphH);
    };

    // 5. Build Points Data
    const getPoints = (data: any[], valKey: string, maxVal: number) => {
      if (data.length < 1) return [];
      const sorted = [...data].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      const grouped: Record<string, number[]> = {};
      sorted.forEach(item => {
        if (!grouped[item.date]) grouped[item.date] = [];
        grouped[item.date].push(item[valKey]);
      });

      return Object.keys(grouped).sort().map((date) => {
        const vals = grouped[date];
        const avg = vals.reduce((a,b) => a+b, 0) / vals.length;
        return { x: getX(date), y: getY(avg, maxVal), val: avg, date };
      });
    };

    const compPoints = getPoints(throwRecords, 'distance', maxComp);
    const trainPoints = getPoints(trainingRecords, 'distance', maxTrain);
    const strengthPoints = getPoints(strengthRecords, 'weight', maxStrength);

    // Helper to make path string
    const makePath = (points: {x:number, y:number}[]) => {
       if (points.length === 0) return "";
       if (points.length === 1) return ""; // Cannot draw line with 1 point
       return points.map((p, i) => `${i===0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    };

    const compPath = makePath(compPoints);
    const trainPath = makePath(trainPoints);
    const strengthPath = makePath(strengthPoints);

    return (
      <div className="w-full overflow-hidden">
         <div className="w-full h-[300px] bg-neutral-900 rounded-2xl border border-neutral-800 relative shadow-inner overflow-hidden">
            {/* Legend Overlay */}
            <div className="absolute top-4 right-4 flex flex-col gap-2 bg-neutral-950/80 p-3 rounded-xl border border-neutral-800 backdrop-blur-sm z-10 text-xs">
               <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-orange-500 rounded-full border border-black shadow-[0_0_8px_rgba(249,115,22,0.8)]"></div>
                  <span className="text-orange-200">Competición</span>
               </div>
               <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-emerald-500 rounded-full border border-black shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
                  <span className="text-emerald-200">Entrenamiento</span>
               </div>
               <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-purple-500 rounded-full border border-black shadow-[0_0_8px_rgba(168,85,247,0.8)]"></div>
                  <span className="text-purple-200">Fuerza</span>
               </div>
            </div>

            {/* SVG Content */}
            <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="absolute inset-0">
               {/* Grid Guides */}
               <line x1="0" y1={height-padding} x2={width} y2={height-padding} stroke="#333" strokeWidth="1" />
               <line x1="0" y1={height/2} x2={width} y2={height/2} stroke="#333" strokeWidth="1" strokeDasharray="5,5" />
               <line x1="0" y1={padding} x2={width} y2={padding} stroke="#333" strokeWidth="1" strokeDasharray="5,5" />
               
               {/* Strength Layer */}
               <path d={strengthPath} fill="none" stroke="#a855f7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-50" />
               {strengthPoints.map((p, i) => (
                  <circle key={`s-${i}`} cx={p.x} cy={p.y} r="4" fill="#a855f7" className="stroke-neutral-900 stroke-2" />
               ))}

               {/* Training Layer */}
               <path d={trainPath} fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-70" />
               {trainPoints.map((p, i) => (
                  <circle key={`t-${i}`} cx={p.x} cy={p.y} r="4" fill="#10b981" className="stroke-neutral-900 stroke-2" />
               ))}

               {/* Competition Layer (Top) */}
               <path d={compPath} fill="none" stroke="#f97316" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-[0_0_10px_rgba(249,115,22,0.5)]" />
               {compPoints.map((p, i) => (
                  <circle key={`c-${i}`} cx={p.x} cy={p.y} r="6" fill="#f97316" className="stroke-white stroke-2 shadow-[0_0_10px_rgba(249,115,22,1)]" />
               ))}
            </svg>
            
            {/* Axis Label */}
            <div className="absolute bottom-2 left-4 text-[10px] text-neutral-600 font-mono">
               {uniqueDates.length > 0 ? new Date(uniqueDates[0]).toLocaleDateString() : 'INICIO'}
            </div>
            <div className="absolute bottom-2 right-4 text-[10px] text-neutral-600 font-mono">
               ACTUALIDAD
            </div>
         </div>
      </div>
    );
  };
  
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

      {/* Global Progression Chart */}
      <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        <CalendarRange size={20} className="text-neutral-400" />
        Progreso de Carrera
        <span className="text-xs font-normal text-neutral-500 bg-neutral-900 px-2 py-1 rounded ml-2">Tendencia Normalizada</span>
      </h3>
      <div className="mb-10">
        {renderGlobalGraph()}
      </div>
    </div>
  );
};
