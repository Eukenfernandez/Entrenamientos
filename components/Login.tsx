
import React, { useState } from 'react';
import { User } from '../types';
import { StorageService } from '../services/storageService';
import { User as UserIcon, Lock, ArrowRight, Loader2, AlertCircle } from 'lucide-react';

interface LoginProps {
  onLogin: (user: User) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    // Simulate network delay for better UX
    await new Promise(r => setTimeout(r, 800));

    try {
      if (!username || !password) {
        throw new Error('Por favor completa todos los campos.');
      }

      let user: User;
      if (isRegistering) {
        user = StorageService.register(username, password);
      } else {
        user = StorageService.login(username, password);
      }
      onLogin(user);
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setIsGoogleLoading(true);

    // Simulate OAuth delay
    await new Promise(r => setTimeout(r, 1500));

    try {
      const user = StorageService.loginWithGoogle();
      onLogin(user);
    } catch (err: any) {
      setError('Error iniciando sesión con Google.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="relative h-screen w-full bg-black overflow-hidden flex items-center justify-center">
      {/* Background Image (Sprinter) */}
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1552674605-46d530310524?q=80&w=2067&auto=format&fit=crop" 
          alt="Sprinter starting block" 
          className="w-full h-full object-cover opacity-40 grayscale" 
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent"></div>
      </div>

      {/* SVG Analysis Overlay (The "Parameters") */}
      <svg className="absolute inset-0 w-full h-full z-10 pointer-events-none opacity-30">
        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(234, 88, 12, 0.2)" strokeWidth="0.5"/>
        </pattern>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      {/* Auth Card */}
      <div className="relative z-20 w-full max-w-md p-8 m-4 bg-neutral-900/90 backdrop-blur-xl border border-neutral-800 rounded-3xl shadow-2xl animate-in fade-in zoom-in duration-300">
        <div className="flex flex-col items-center text-center mb-8">
           <div className="w-14 h-14 bg-orange-600 rounded-2xl flex items-center justify-center mb-4 rotate-3 shadow-[0_0_20px_rgba(234,88,12,0.4)]">
             <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
           </div>
           
           <h1 className="text-3xl font-bold text-white tracking-tight">Velocity<span className="text-orange-500">View</span></h1>
           <p className="text-neutral-400 text-sm mt-2">
             {isRegistering ? 'Crea tu perfil de atleta para comenzar.' : 'Bienvenido de nuevo, atleta.'}
           </p>
        </div>

        <div className="space-y-4">
          
          {/* Manual Login Form (First) */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
               <label className="text-xs text-neutral-400 ml-1">Usuario</label>
               <div className="relative">
                  <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" size={18} />
                  <input 
                    type="text" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-black/50 border border-neutral-700 rounded-xl py-3 pl-11 pr-4 text-white placeholder-neutral-600 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
                    placeholder="Tu nombre de usuario"
                  />
               </div>
            </div>

            <div className="space-y-1">
               <label className="text-xs text-neutral-400 ml-1">Contraseña</label>
               <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" size={18} />
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-black/50 border border-neutral-700 rounded-xl py-3 pl-11 pr-4 text-white placeholder-neutral-600 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
                    placeholder="••••••••"
                  />
               </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-400 bg-red-900/20 p-3 rounded-lg text-sm border border-red-900/50 animate-in slide-in-from-top-2">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            <button 
               type="submit"
               disabled={isLoading || isGoogleLoading}
               className="w-full py-3.5 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-xl transition-all transform hover:scale-[1.02] shadow-lg flex items-center justify-center gap-2 mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
             >
               {isLoading ? (
                 <Loader2 className="animate-spin" size={20} />
               ) : (
                 <>
                   <span>{isRegistering ? 'Crear Cuenta' : 'Iniciar Sesión'}</span>
                   <ArrowRight size={18} />
                 </>
               )}
             </button>
          </form>

          {/* Divider */}
          <div className="relative flex items-center py-2">
            <div className="flex-grow border-t border-neutral-700"></div>
            <span className="flex-shrink-0 mx-4 text-neutral-500 text-xs">O continúa con</span>
            <div className="flex-grow border-t border-neutral-700"></div>
          </div>

          {/* Google Login Button (Second) */}
          <button 
            type="button"
            onClick={handleGoogleLogin}
            disabled={isGoogleLoading || isLoading}
            className="w-full py-3 bg-white text-black font-medium rounded-xl transition-all transform hover:bg-gray-100 flex items-center justify-center gap-3 mb-4 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isGoogleLoading ? (
              <Loader2 className="animate-spin text-gray-600" size={20} />
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                <span>Google</span>
              </>
            )}
          </button>

          <div className="mt-6 text-center">
            <button 
              onClick={() => {
                setIsRegistering(!isRegistering);
                setError(null);
              }}
              className="text-sm text-neutral-400 hover:text-white transition-colors underline decoration-neutral-700 underline-offset-4"
            >
              {isRegistering ? '¿Ya tienes cuenta? Inicia Sesión' : '¿No tienes cuenta? Regístrate'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
