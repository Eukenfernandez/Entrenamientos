
import React from 'react';
import { Screen } from '../types';
import { LayoutDashboard, Video, Dumbbell, Target, MessageSquareQuote, LogOut, Trophy, FileText, X } from 'lucide-react';

interface SidebarProps {
  currentScreen: Screen;
  onNavigate: (screen: Screen) => void;
  onLogout: () => void;
  onClose?: () => void; // Optional prop for mobile closing
}

export const Sidebar: React.FC<SidebarProps> = ({ currentScreen, onNavigate, onLogout, onClose }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Inicio', icon: LayoutDashboard },
    { id: 'gallery', label: 'Video Análisis', icon: Video },
    { id: 'strength', label: 'Fuerza & RM', icon: Dumbbell },
    { id: 'planning', label: 'Entrenamientos', icon: FileText },
    { id: 'competition', label: 'Competiciones', icon: Trophy },
    { id: 'training', label: 'Práctica Técnica', icon: Target },
    { id: 'coach', label: 'Entrenador AI', icon: MessageSquareQuote },
  ] as const;

  return (
    <div className="bg-neutral-900 h-full flex flex-col border-r border-neutral-800 w-full">
      <div className="p-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center rotate-3">
             <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">Velocity<span className="text-orange-500">View</span></h1>
        </div>
        {onClose && (
          <button onClick={onClose} className="md:hidden text-neutral-400 hover:text-white">
            <X size={24} />
          </button>
        )}
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = currentScreen === item.id || 
                           (currentScreen === 'analyzer' && item.id === 'gallery') ||
                           (currentScreen === 'planViewer' && item.id === 'planning');
          
          return (
            <button
              key={item.id}
              onClick={() => {
                onNavigate(item.id as Screen);
                if (onClose) onClose();
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                isActive 
                ? 'bg-orange-600 text-white shadow-[0_0_15px_rgba(234,88,12,0.3)]' 
                : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'
              }`}
            >
              <item.icon size={20} />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-neutral-800">
        <button 
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-neutral-500 hover:text-red-400 hover:bg-red-950/30 rounded-xl transition-colors"
        >
          <LogOut size={20} />
          Cerrar Sesión
        </button>
      </div>
    </div>
  );
};
