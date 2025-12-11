
import React, { useState, useEffect } from 'react';
import { StorageService } from '../services/storageService';
import { User } from '../types';
import { Shield, Users, Database, LogOut, Search, Trash2, Video, Dumbbell, FileText } from 'lucide-react';

interface AdminPanelProps {
  onLogout: () => void;
}

interface UserReport {
  user: User;
  stats: {
    videos: number;
    plans: number;
    strengthRecords: number;
    competitionRecords: number;
    trainingRecords: number;
  };
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onLogout }) => {
  const [users, setUsers] = useState<UserReport[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const report = StorageService.getSystemReport();
    setUsers(report);
  };

  const handleDeleteUser = (id: string, username: string) => {
    if (confirm(`¿Estás SEGURO de que quieres eliminar al usuario "${username}" y TODOS sus datos? Esta acción es irreversible.`)) {
      StorageService.deleteUser(id);
      loadData();
    }
  };

  const filteredUsers = users.filter(u => 
    u.user.username.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (u.user.profile?.firstName + ' ' + u.user.profile?.lastName).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalVideos = users.reduce((acc, curr) => acc + curr.stats.videos, 0);
  const totalRecords = users.reduce((acc, curr) => acc + curr.stats.strengthRecords + curr.stats.competitionRecords + curr.stats.trainingRecords, 0);

  return (
    <div className="min-h-screen bg-black text-white font-sans">
      {/* Navbar */}
      <div className="border-b border-neutral-800 bg-neutral-900/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(220,38,38,0.5)]">
                <Shield size={20} className="text-white" />
             </div>
             <div>
               <h1 className="text-xl font-bold tracking-tight">Panel Maestro</h1>
               <p className="text-xs text-red-500 font-mono">ACCESO RESTRINGIDO: NIVEL 1</p>
             </div>
          </div>
          <button 
            onClick={onLogout}
            className="flex items-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-sm text-neutral-300 transition-colors"
          >
            <LogOut size={16} />
            Salir
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-10">
        
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
           <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                 <Users size={64} />
              </div>
              <p className="text-neutral-500 text-sm font-medium">Usuarios Totales</p>
              <p className="text-4xl font-bold text-white mt-1">{users.length}</p>
           </div>
           
           <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                 <Database size={64} />
              </div>
              <p className="text-neutral-500 text-sm font-medium">Videos Almacenados</p>
              <p className="text-4xl font-bold text-white mt-1">{totalVideos}</p>
           </div>

           <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                 <Dumbbell size={64} />
              </div>
              <p className="text-neutral-500 text-sm font-medium">Registros de Datos</p>
              <p className="text-4xl font-bold text-white mt-1">{totalRecords}</p>
           </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6 relative">
           <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" size={20} />
           <input 
              type="text" 
              placeholder="Buscar por usuario o nombre..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-xl py-4 pl-12 pr-4 text-white focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 transition-all"
           />
        </div>

        {/* Database Table */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl">
           <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                 <thead>
                    <tr className="bg-neutral-950 border-b border-neutral-800 text-xs uppercase text-neutral-500">
                       <th className="p-4 font-semibold">ID / Credenciales</th>
                       <th className="p-4 font-semibold">Perfil</th>
                       <th className="p-4 font-semibold">Deporte</th>
                       <th className="p-4 font-semibold text-center">Datos</th>
                       <th className="p-4 font-semibold text-right">Acciones</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-neutral-800">
                    {filteredUsers.length === 0 ? (
                       <tr>
                          <td colSpan={5} className="p-8 text-center text-neutral-500">No se encontraron usuarios.</td>
                       </tr>
                    ) : filteredUsers.map((item) => (
                       <tr key={item.user.id} className="hover:bg-neutral-800/50 transition-colors">
                          <td className="p-4">
                             <div className="flex flex-col">
                                <span className="font-mono text-xs text-neutral-600 mb-1">{item.user.id.substring(0,8)}...</span>
                                <span className="font-bold text-white text-sm">{item.user.username}</span>
                                <span className="text-xs text-neutral-500">{item.user.password ? `Pass: ${item.user.password}` : 'OAuth User'}</span>
                             </div>
                          </td>
                          <td className="p-4">
                             {item.user.profile ? (
                                <div className="flex flex-col">
                                   <span className="text-neutral-200 text-sm font-medium">{item.user.profile.firstName} {item.user.profile.lastName}</span>
                                   <span className="text-xs text-neutral-500">{item.user.profile.age} años • {item.user.profile.role}</span>
                                </div>
                             ) : (
                                <span className="px-2 py-1 bg-yellow-500/10 text-yellow-500 text-xs rounded border border-yellow-500/20">Incompleto</span>
                             )}
                          </td>
                          <td className="p-4">
                             {item.user.profile ? (
                                <div className="flex flex-col">
                                   <span className="text-orange-400 text-xs uppercase font-bold">{item.user.profile.sport}</span>
                                   <span className="text-neutral-400 text-xs">{item.user.profile.discipline}</span>
                                </div>
                             ) : (
                                <span className="text-neutral-600">-</span>
                             )}
                          </td>
                          <td className="p-4">
                             <div className="flex items-center justify-center gap-4 text-xs">
                                <div className="flex items-center gap-1 text-blue-400" title="Videos">
                                   <Video size={14} /> {item.stats.videos}
                                </div>
                                <div className="flex items-center gap-1 text-purple-400" title="Registros">
                                   <Dumbbell size={14} /> {item.stats.strengthRecords + item.stats.competitionRecords + item.stats.trainingRecords}
                                </div>
                                <div className="flex items-center gap-1 text-green-400" title="Planes">
                                   <FileText size={14} /> {item.stats.plans}
                                </div>
                             </div>
                          </td>
                          <td className="p-4 text-right">
                             {item.user.username !== 'admin@coachai.com' && (
                                <button 
                                   onClick={() => handleDeleteUser(item.user.id, item.user.username)}
                                   className="p-2 text-neutral-600 hover:text-red-500 hover:bg-red-900/20 rounded-lg transition-all"
                                   title="Borrar Usuario"
                                >
                                   <Trash2 size={18} />
                                </button>
                             )}
                          </td>
                       </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        </div>
      </div>
    </div>
  );
};
