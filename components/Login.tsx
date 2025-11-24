import React from 'react';

interface LoginProps {
  onLogin: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  return (
    <div className="relative h-screen w-full bg-black overflow-hidden flex items-center justify-center">
      {/* Background Image (Sprinter) */}
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1552674605-46d530310524?q=80&w=2067&auto=format&fit=crop" 
          alt="Sprinter starting block" 
          className="w-full h-full object-cover opacity-40 grayscale" 
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-transparent"></div>
      </div>

      {/* SVG Analysis Overlay (The "Parameters") */}
      <svg className="absolute inset-0 w-full h-full z-10 pointer-events-none opacity-30">
        {/* Grid lines */}
        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(234, 88, 12, 0.2)" strokeWidth="0.5"/>
        </pattern>
        <rect width="100%" height="100%" fill="url(#grid)" />
        
        {/* Velocity Curves / Graphics */}
        <path d="M 0 800 C 300 800, 400 600, 600 400 S 900 100, 1200 100" stroke="#ea580c" strokeWidth="2" fill="none" strokeDasharray="10 5" />
        <circle cx="600" cy="400" r="5" fill="#ea580c" />
        <text x="620" y="400" fill="#ea580c" className="text-xs font-mono">V: 10.2 m/s</text>
        
        <path d="M 0 900 L 1920 900" stroke="white" strokeWidth="1" />
        <line x1="300" y1="800" x2="300" y2="900" stroke="white" strokeWidth="1" strokeDasharray="4 4" />
        <text x="310" y="890" fill="white" className="text-xs font-mono">t: 0.00s</text>
      </svg>

      {/* Content */}
      <div className="relative z-20 max-w-md w-full p-8 bg-neutral-900/80 backdrop-blur-md border border-neutral-800 rounded-2xl shadow-2xl">
        <div className="flex flex-col items-center text-center">
           <div className="w-16 h-16 bg-orange-500 rounded-2xl flex items-center justify-center mb-6 rotate-3 shadow-[0_0_20px_rgba(234,88,12,0.5)]">
             <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
           </div>
           
           <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">Velocity<span className="text-orange-500">View</span></h1>
           <p className="text-neutral-400 mb-8">Plataforma avanzada de análisis de video biomecánico asistido por IA.</p>

           <button 
             onClick={onLogin}
             className="w-full py-4 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-lg transition-all transform hover:scale-[1.02] shadow-lg mb-4 flex items-center justify-center gap-2"
           >
             <span>Iniciar Sesión</span>
             <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
           </button>
           
           <p className="text-xs text-neutral-500">
             Al continuar, aceptas los Términos de Servicio y la Política de Privacidad.
           </p>
        </div>
      </div>
    </div>
  );
};