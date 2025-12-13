import React from 'react';
import { AGENTS } from '../constants';
import { AgentId } from '../types';
import { 
  UserCircle, 
  CalendarClock, 
  FileHeart, 
  Receipt, 
  Compass, 
  Activity,
  LogOut
} from 'lucide-react';

interface AgentSidebarProps {
  activeAgentId: AgentId;
  onResetSession: () => void;
}

const IconMap: Record<string, React.FC<any>> = {
  UserCircle,
  CalendarClock,
  FileHeart,
  Receipt,
  Compass
};

const AgentSidebar: React.FC<AgentSidebarProps> = ({ activeAgentId, onResetSession }) => {
  return (
    <div className="w-20 md:w-80 bg-white border-r border-slate-200 flex-shrink-0 flex flex-col h-full shadow-sm z-10 transition-all duration-300">
      <div className="p-6 border-b border-slate-100 flex items-center gap-3">
        <div className="bg-teal-600 p-2 rounded-lg text-white">
          <Activity size={24} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-800 hidden md:block tracking-tight">MediNav AI</h1>
          <p className="text-[10px] text-slate-400 hidden md:block">Sistem Rumah Sakit Pintar</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 px-2 hidden md:block">
          Unit Layanan Aktif
        </p>

        {(Object.values(AGENTS) as any[]).filter(a => a.id !== AgentId.NAVIGATOR).map((agent) => {
          const isActive = activeAgentId === agent.id;
          const Icon = IconMap[agent.icon] || UserCircle;

          return (
            <div
              key={agent.id}
              className={`flex items-center gap-4 p-3 rounded-xl transition-all duration-200 border ${
                isActive 
                  ? 'bg-teal-50 border-teal-200 shadow-sm' 
                  : 'bg-white border-transparent hover:bg-slate-50 text-slate-500'
              }`}
            >
              <div className={`p-2 rounded-lg ${isActive ? agent.color + ' text-white' : 'bg-slate-100 text-slate-400'}`}>
                <Icon size={20} />
              </div>
              <div className="hidden md:block">
                <h3 className={`font-semibold text-sm ${isActive ? 'text-slate-800' : 'text-slate-600'}`}>
                  {agent.name}
                </h3>
                <p className="text-xs text-slate-400 truncate w-40">
                  {agent.role}
                </p>
              </div>
              {isActive && (
                <div className="ml-auto w-2 h-2 rounded-full bg-teal-500 animate-pulse hidden md:block"></div>
              )}
            </div>
          );
        })}
      </div>

      {/* Control Area */}
      <div className="p-4 border-t border-slate-100 bg-slate-50 space-y-3">
        
        {activeAgentId !== AgentId.NAVIGATOR && (
          <button 
            onClick={onResetSession}
            className="w-full flex items-center gap-3 px-3 py-2 bg-white border border-slate-300 text-slate-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 rounded-lg transition-colors text-sm font-medium shadow-sm"
          >
            <LogOut size={16} />
            <span className="hidden md:inline">Akhiri Sesi Unit</span>
          </button>
        )}

        <div className="flex items-center gap-3 text-slate-500">
          <div className="p-2 bg-white border border-slate-200 rounded-full">
            <Compass size={18} className={activeAgentId === AgentId.NAVIGATOR ? "text-teal-600 animate-spin-slow" : "text-slate-400"} />
          </div>
          <div className="hidden md:block">
            <p className="text-xs font-medium text-slate-600">Status Sistem</p>
            <p className="text-xs text-slate-400">
              {activeAgentId === AgentId.NAVIGATOR ? 'Menunggu Arahan...' : 'Terhubung ke Agen'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentSidebar;