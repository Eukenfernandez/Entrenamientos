
import React, { useState } from 'react';
import { ThrowRecord, UserProfile } from '../types';
import { MapPin, Trash2, Trophy, Timer } from 'lucide-react';

interface CompetitionTrackerProps {
  profile: UserProfile;
  records: ThrowRecord[];
  onAddRecord: (record: Omit<ThrowRecord, 'id'>) => void;
  onDeleteRecord: (id: string) => void;
}

export const JavelinTracker: React.FC<CompetitionTrackerProps> = ({ profile, records, onAddRecord, onDeleteRecord }) => {
  const [value, setValue] = useState('');
  const [location, setLocation] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  // Adapt to sport
  const isTimeBased = profile.sport === 'sprint' || profile.sport === 'middle_distance';
  const unit = isTimeBased ? 's' : 'm';
  const label = isTimeBased ? 'Tiempo' : 'Marca';
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value || !date) return;
    onAddRecord({
      distance: parseFloat(value), // Note: 'distance' field stores generic value (meters or seconds)
      location: location || 'Competición Oficial',
      date
    });
    setValue('');
    setLocation('');
  };

  const sortedRecords = [...records].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  const bestRecord = records.length > 0 
    ? (isTimeBased 
        ? Math.min(...records.map(r => r.distance)) 
        : Math.max(...records.map(r => r.distance)))
    : 0;

  // Simple Graph Calculation
  const renderGraph = () => {
    if (sortedRecords.length < 2) return <div className="h-64 flex items-center justify-center text-neutral-500">Añade al menos 2 competiciones para ver tu progresión.</div>;

    const height = 300;
    const width = 800;
    const padding = 40;
    
    const minVal = Math.min(...sortedRecords.map(r => r.distance));
    const maxVal = Math.max(...sortedRecords.map(r => r.distance));
    
    // Safety for flat lines
    let rangeY = maxVal - minVal;
    if (rangeY === 0) rangeY = 1;

    // Expand view slightly
    const viewMin = minVal - (rangeY * 0.1);
    const viewMax = maxVal + (rangeY * 0.1);
    const viewRange = viewMax - viewMin;

    const points = sortedRecords.map((rec, i) => {
      const x = padding + (i / (sortedRecords.length - 1)) * (width - padding * 2);
      // For time: lower is better (higher on graph? or lower on graph?)
      // Standard: Y axis goes up. So higher value = higher pixel (lower Y coord).
      // We'll keep standard graph logic: Up is higher value. 
      // User just knows that for time, down trend is good.
      const y = height - padding - ((rec.distance - viewMin) / viewRange) * (height - padding * 2);
      return `${x},${y}`;
    }).join(' ');

    return (
      <div className="w-full overflow-x-auto pb-4">
        <div className="min-w-[600px]">
          <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="bg-neutral-900/50 rounded-xl border border-neutral-800">
             {/* Grid Lines */}
             <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#333" strokeWidth="1" />
             <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#333" strokeWidth="1" />
             
             {/* Path */}
             <polyline points={points} fill="none" stroke="#ea580c" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
             
             {/* Dots */}
             {sortedRecords.map((rec, i) => {
               const x = padding + (i / (sortedRecords.length - 1)) * (width - padding * 2);
               const y = height - padding - ((rec.distance - viewMin) / viewRange) * (height - padding * 2);
               return (
                 <g key={rec.id} className="group">
                    <circle cx={x} cy={y} r="5" className="fill-neutral-900 stroke-orange-500 stroke-2 group-hover:r-7 transition-all cursor-pointer" />
                    <rect x={x - 30} y={y - 40} width="60" height="25" rx="4" fill="#333" className="opacity-0 group-hover:opacity-100 transition-opacity" />
                    <text x={x} y={y - 23} textAnchor="middle" fill="white" fontSize="10" className="opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">
                       {rec.distance}{unit}
                    </text>
                 </g>
               );
             })}
          </svg>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full bg-neutral-950 p-6 md:p-10 overflow-y-auto">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-end mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Competiciones: {profile.discipline}</h1>
            <p className="text-neutral-400">Historial oficial de resultados.</p>
          </div>
          <div className="bg-neutral-900 px-6 py-3 rounded-xl border border-yellow-500/20">
            <span className="block text-xs text-neutral-400 uppercase tracking-wider">Mejor {label} (PB)</span>
            <span className="text-3xl font-bold text-yellow-500">{bestRecord} {unit}</span>
          </div>
        </div>

        {/* Graph Section */}
        <div className="mb-10">
           <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
             <Trophy size={18} className="text-yellow-500" />
             Progresión de Temporada
           </h3>
           {renderGraph()}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Add Form */}
          <div className="bg-neutral-900 p-6 rounded-2xl border border-neutral-800 h-fit">
            <h3 className="text-white font-semibold mb-4">Registrar Competición</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs text-neutral-400 mb-1">{label} ({unit})</label>
                <input 
                  type="number" 
                  step="0.01"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  className="w-full bg-neutral-800 text-white p-3 rounded-lg border border-neutral-700 focus:border-orange-500 focus:outline-none"
                  placeholder="00.00"
                  required
                />
              </div>
              <div>
                 <label className="block text-xs text-neutral-400 mb-1">Sede / Campeonato</label>
                 <input 
                  type="text" 
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full bg-neutral-800 text-white p-3 rounded-lg border border-neutral-700 focus:border-orange-500 focus:outline-none"
                  placeholder="Ej. Cto. de España"
                 />
              </div>
              <div>
                <label className="block text-xs text-neutral-400 mb-1">Fecha</label>
                <input 
                  type="date" 
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-neutral-800 text-white p-3 rounded-lg border border-neutral-700 focus:border-orange-500 focus:outline-none"
                  required
                />
              </div>
              <button 
                type="submit"
                className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold py-3 rounded-lg transition-colors mt-2"
              >
                Guardar Resultado
              </button>
            </form>
          </div>

          {/* List */}
          <div className="lg:col-span-2 space-y-3">
             <h3 className="text-white font-semibold mb-4">Resultados Oficiales</h3>
             {records.length === 0 && <p className="text-neutral-500">No hay competiciones registradas.</p>}
             {[...records].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(record => (
               <div key={record.id} className="flex items-center justify-between bg-neutral-900 p-4 rounded-xl border border-neutral-800 hover:border-yellow-500/30 transition-colors">
                  <div className="flex items-center gap-4">
                     <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center text-yellow-500 font-bold">
                        {isTimeBased ? <Timer size={18} /> : <Trophy size={18} />}
                     </div>
                     <div>
                        <p className="text-white font-bold text-lg">{record.distance}{unit}</p>
                        <div className="flex items-center gap-3 text-xs text-neutral-500">
                           <span>{record.date}</span>
                           <span className="flex items-center gap-1">
                              <MapPin size={10} />
                              {record.location}
                           </span>
                        </div>
                     </div>
                  </div>
                  <button onClick={() => onDeleteRecord(record.id)} className="text-neutral-600 hover:text-red-500 p-2">
                     <Trash2 size={18} />
                  </button>
               </div>
             ))}
          </div>
        </div>
      </div>
    </div>
  );
};
