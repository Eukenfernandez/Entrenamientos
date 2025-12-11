import React, { useState } from 'react';
import { User, UserProfile, SportType } from '../types';
import { StorageService } from '../services/storageService';
import { ArrowRight, User as UserIcon, Activity, Trophy, ChevronRight, Check } from 'lucide-react';

interface OnboardingProps {
  user: User;
  onComplete: (updatedUser: User) => void;
}

// Data structure for sports and their specific disciplines
const SPORT_CATEGORIES: Record<string, { label: string, type: SportType, disciplines: string[] }> = {
  sprint: {
    label: 'Velocidad',
    type: 'sprint',
    disciplines: ['60m Lisos', '100m Lisos', '200m Lisos', '400m Lisos', '60m Vallas', '100m Vallas', '110m Vallas', '400m Vallas', 'Relevos']
  },
  middle_distance: {
    label: 'Fondo',
    type: 'middle_distance',
    disciplines: ['800m', '1500m', '3000m', '3000m Obstáculos', '5000m', '10000m', 'Maratón', 'Marcha Atlética', 'Cross']
  },
  jumps: {
    label: 'Saltos',
    type: 'jumps',
    disciplines: ['Salto de Longitud', 'Triple Salto', 'Salto de Altura', 'Salto con Pértiga']
  },
  throws: {
    label: 'Lanzamientos',
    type: 'throws',
    disciplines: ['Lanzamiento de Jabalina', 'Lanzamiento de Peso', 'Lanzamiento de Disco', 'Lanzamiento de Martillo']
  }
};

export const Onboarding: React.FC<OnboardingProps> = ({ user, onComplete }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<Partial<UserProfile>>({
    role: 'athlete',
  });

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      handleFinish();
    }
  };

  const handleFinish = async () => {
    if (formData.firstName && formData.lastName && formData.age && formData.sport && formData.discipline) {
      const profile = formData as UserProfile;
      try {
        const updatedUser = await StorageService.updateUserProfile(user.id, profile);
        onComplete(updatedUser);
      } catch (e) {
        console.error("Failed to save profile", e);
      }
    }
  };

  const selectSportCategory = (categoryKey: string) => {
    const category = SPORT_CATEGORIES[categoryKey];
    setFormData({
      ...formData, 
      sport: category.type,
      discipline: undefined // Reset discipline if category changes
    });
  };

  const isStep1Valid = !!formData.firstName && !!formData.lastName && !!formData.age;
  const isStep2Valid = !!formData.role;
  const isStep3Valid = !!formData.sport && !!formData.discipline;

  return (
    <div className="min-h-screen w-full bg-neutral-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-neutral-900 border border-neutral-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Progress Bar */}
        <div className="absolute top-0 left-0 w-full h-1 bg-neutral-800">
          <div 
            className="h-full bg-orange-600 transition-all duration-500 ease-out"
            style={{ width: `${(step / 3) * 100}%` }}
          ></div>
        </div>

        <div className="mb-6 mt-2 flex-shrink-0">
          <h1 className="text-2xl font-bold text-white mb-2">
            {step === 1 && "Configura tu Perfil"}
            {step === 2 && "¿Cuál es tu rol?"}
            {step === 3 && "Elige tu Prueba"}
          </h1>
          <p className="text-neutral-400 text-sm">
            {step === 1 && "Queremos saber cómo llamarte."}
            {step === 2 && "Para adaptar la experiencia a ti."}
            {step === 3 && "Selecciona tu categoría y disciplina principal."}
          </p>
        </div>

        {/* STEP 1: Personal Info */}
        {step === 1 && (
          <div className="space-y-4 animate-in slide-in-from-right fade-in duration-300">
            <div>
              <label className="text-xs text-neutral-500 ml-1">Nombre</label>
              <input 
                type="text" 
                value={formData.firstName || ''}
                onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                className="w-full bg-black/50 border border-neutral-700 rounded-xl p-3 text-white focus:border-orange-500 focus:outline-none"
                placeholder="Ej. Carlos"
              />
            </div>
            <div>
              <label className="text-xs text-neutral-500 ml-1">Apellidos</label>
              <input 
                type="text" 
                value={formData.lastName || ''}
                onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                className="w-full bg-black/50 border border-neutral-700 rounded-xl p-3 text-white focus:border-orange-500 focus:outline-none"
                placeholder="Ej. Pérez"
              />
            </div>
            <div>
              <label className="text-xs text-neutral-500 ml-1">Edad</label>
              <input 
                type="number" 
                value={formData.age || ''}
                onChange={(e) => setFormData({...formData, age: parseInt(e.target.value)})}
                className="w-full bg-black/50 border border-neutral-700 rounded-xl p-3 text-white focus:border-orange-500 focus:outline-none"
                placeholder="24"
              />
            </div>
            <button 
              onClick={handleNext} 
              disabled={!isStep1Valid}
              className="w-full py-3 bg-orange-600 rounded-xl text-white font-bold mt-4 disabled:opacity-50 hover:bg-orange-500 transition-colors"
            >
              Siguiente
            </button>
          </div>
        )}

        {/* STEP 2: Role */}
        {step === 2 && (
          <div className="space-y-4 animate-in slide-in-from-right fade-in duration-300">
            <button 
              onClick={() => setFormData({...formData, role: 'athlete'})}
              className={`w-full p-4 rounded-xl border flex items-center gap-4 transition-all ${
                formData.role === 'athlete' 
                ? 'bg-orange-600/20 border-orange-500 text-white' 
                : 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:bg-neutral-800/80'
              }`}
            >
              <div className="p-2 bg-neutral-900 rounded-lg"><UserIcon size={24} /></div>
              <div className="text-left">
                <span className="block font-bold">Atleta</span>
                <span className="text-xs opacity-70">Quiero registrar mis marcas y analizar mis vídeos.</span>
              </div>
            </button>

            <button 
              onClick={() => setFormData({...formData, role: 'coach'})}
              className={`w-full p-4 rounded-xl border flex items-center gap-4 transition-all ${
                formData.role === 'coach' 
                ? 'bg-orange-600/20 border-orange-500 text-white' 
                : 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:bg-neutral-800/80'
              }`}
            >
              <div className="p-2 bg-neutral-900 rounded-lg"><Activity size={24} /></div>
              <div className="text-left">
                <span className="block font-bold">Entrenador</span>
                <span className="text-xs opacity-70">Quiero gestionar y analizar atletas.</span>
              </div>
            </button>

            <button 
              onClick={handleNext} 
              disabled={!isStep2Valid}
              className="w-full py-3 bg-white text-black rounded-xl font-bold mt-4 hover:bg-neutral-200 transition-colors"
            >
              Siguiente
            </button>
          </div>
        )}

        {/* STEP 3: Sport & Discipline */}
        {step === 3 && (
          <div className="flex flex-col h-full animate-in slide-in-from-right fade-in duration-300 overflow-hidden">
            
            <div className="flex-1 overflow-y-auto pr-1 space-y-6">
              {/* Categories */}
              <div>
                <label className="text-xs text-neutral-500 mb-2 block ml-1">1. Selecciona Categoría</label>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(SPORT_CATEGORIES).map(([key, data]) => {
                    const isSelected = formData.sport === data.type;
                    return (
                      <button
                        key={key}
                        onClick={() => selectSportCategory(key)}
                        className={`p-4 rounded-xl border text-left transition-all relative ${
                          isSelected 
                          ? 'bg-orange-600 border-orange-500 text-white shadow-lg shadow-orange-900/20' 
                          : 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:bg-neutral-700'
                        }`}
                      >
                        <span className="font-bold block text-sm">{data.label}</span>
                        {isSelected && <div className="absolute top-2 right-2"><Check size={14} /></div>}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Specific Disciplines (Shown only after sport is selected) */}
              {formData.sport && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                  <label className="text-xs text-neutral-500 mb-2 block ml-1">2. Selecciona Prueba Específica</label>
                  <div className="bg-neutral-800/50 rounded-xl border border-neutral-800 overflow-hidden">
                    {Object.values(SPORT_CATEGORIES).find(c => c.type === formData.sport)?.disciplines.map((disc) => (
                      <button
                        key={disc}
                        onClick={() => setFormData({...formData, discipline: disc})}
                        className={`w-full p-3 text-left text-sm border-b border-neutral-800 last:border-0 flex justify-between items-center transition-colors ${
                          formData.discipline === disc 
                          ? 'bg-orange-500/20 text-orange-400 font-medium' 
                          : 'text-neutral-300 hover:bg-neutral-800'
                        }`}
                      >
                        {disc}
                        {formData.discipline === disc && <Check size={16} />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button 
              onClick={handleFinish} 
              disabled={!isStep3Valid}
              className="w-full py-3 bg-orange-600 rounded-xl text-white font-bold mt-4 flex-shrink-0 flex items-center justify-center gap-2 hover:bg-orange-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>Comenzar</span>
              <ArrowRight size={18} />
            </button>
          </div>
        )}

      </div>
    </div>
  );
};