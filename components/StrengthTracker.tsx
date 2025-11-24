
import React, { useState } from 'react';
import { StrengthRecord } from '../types';
import { Plus, Trash2, TrendingUp, Calendar } from 'lucide-react';

interface StrengthTrackerProps {
  records: StrengthRecord[];
  onAddRecord: (record: Omit<StrengthRecord, 'id'>) => void;
  onDeleteRecord: (id: string) => void;
}

const EXERCISES = ['Press Banca', 'Sentadilla', 'Cargada', 'Pull Over', 'Arrancada', 'Hip Thrust'] as const;

export const StrengthTracker: React.FC<StrengthTrackerProps> = ({ records, onAddRecord, onDeleteRecord }) => {
  const [exercise, setExercise] = useState<typeof EXERCISES[number]>('Sentadilla');
  const [weight, setWeight] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!weight || !date) return;
    
    onAddRecord({
      exercise,
      weight: parseFloat(weight),
      date
    });
    setWeight('');
  };

  // Group records by exercise to show maxes
  const maxes = EXERCISES.reduce((acc, ex) => {
    const exRecords = records.filter(r => r.exercise === ex);
    const max = exRecords.length > 0 ? Math.max(...exRecords.map(r => r.weight)) : 0;
    acc[ex] = max;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="h-full bg-neutral-950 p-6 md:p-10 overflow-y-auto">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-2">Marcas de Fuerza (1RM)</h1>
        <p className="text-neutral-400 mb-8">Registra tu progreso mensual en levantamientos máximos.</p>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10">
          {EXERCISES.map(ex => (
            <div key={ex} className="bg-neutral-900 p-4 rounded-xl border border-neutral-800 hover:border-orange-500/30 transition-colors">
              <p className="text-neutral-500 text-sm mb-1">{ex}</p>
              <div className="flex items-end gap-1">
                <span className="text-2xl font-bold text-white">{maxes[ex]}</span>
                <span className="text-sm text-orange-500 font-medium mb-1">kg</span>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Input Form */}
          <div className="bg-neutral-900 p-6 rounded-2xl border border-neutral-800 h-fit">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Plus className="text-orange-500" size={20} />
              Añadir Marca
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs text-neutral-400 mb-1">Ejercicio</label>
                <select 
                  value={exercise}
                  onChange={(e) => setExercise(e.target.value as any)}
                  className="w-full bg-neutral-800 text-white p-3 rounded-lg border border-neutral-700 focus:border-orange-500 focus:outline-none appearance-none"
                >
                  {EXERCISES.map(ex => <option key={ex} value={ex}>{ex}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-neutral-400 mb-1">Peso (kg)</label>
                <input 
                  type="number" 
                  step="0.5"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="w-full bg-neutral-800 text-white p-3 rounded-lg border border-neutral-700 focus:border-orange-500 focus:outline-none"
                  placeholder="0.0"
                  required
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
                Guardar Registro
              </button>
            </form>
          </div>

          {/* History List */}
          <div className="lg:col-span-2">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="text-orange-500" size={20} />
              Historial
            </h2>
            <div className="bg-neutral-900 rounded-2xl border border-neutral-800 overflow-hidden">
              {records.length === 0 ? (
                <div className="p-8 text-center text-neutral-500">No hay registros aún.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-neutral-950 text-neutral-400 text-xs uppercase">
                      <tr>
                        <th className="p-4">Fecha</th>
                        <th className="p-4">Ejercicio</th>
                        <th className="p-4">Peso</th>
                        <th className="p-4 text-right">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-800">
                      {[...records].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(record => (
                        <tr key={record.id} className="hover:bg-neutral-800/50 transition-colors">
                          <td className="p-4 text-neutral-300 font-mono text-sm">
                            <div className="flex items-center gap-2">
                              <Calendar size={14} className="text-neutral-500" />
                              {record.date}
                            </div>
                          </td>
                          <td className="p-4 text-white font-medium">{record.exercise}</td>
                          <td className="p-4 text-orange-400 font-bold">{record.weight} kg</td>
                          <td className="p-4 text-right">
                            <button 
                              onClick={() => onDeleteRecord(record.id)}
                              className="text-neutral-600 hover:text-red-500 transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
