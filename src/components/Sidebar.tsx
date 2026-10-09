import React from 'react';
import { 
  Mic,
  MessageSquare, 
  Compass, 
  CheckSquare, 
  UserCog, 
  Languages, 
  Sparkles,
  ShieldAlert,
  Flame,
  Volume2,
  Radio
} from 'lucide-react';
import { AdvisorMode, LanguageMode, UserDynamicsProfile, Situation } from '../types';

interface SidebarProps {
  activeTab: 'voice' | 'chat' | 'situations' | 'tasks';
  setActiveTab: (tab: 'voice' | 'chat' | 'situations' | 'tasks') => void;
  mode: AdvisorMode;
  setMode: (mode: AdvisorMode) => void;
  language: LanguageMode;
  setLanguage: (lang: LanguageMode) => void;
  userDynamics: UserDynamicsProfile;
  openDynamicsModal: () => void;
  openGuideModal: () => void;
  situations: Situation[];
  activeSituationId: string | null;
  setActiveSituationId: (id: string | null) => void;
  taskCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  mode,
  setMode,
  language,
  setLanguage,
  userDynamics,
  openDynamicsModal,
  openGuideModal,
  situations,
  activeSituationId,
  setActiveSituationId,
  taskCount,
}) => {
  const activeSituationsCount = situations.filter(s => s.status !== 'resolved').length;

  return (
    <aside className="w-72 bg-stone-900 border-r border-stone-800 flex flex-col h-screen select-none shrink-0">
      {/* Brand Header */}
      <div className="p-5 border-b border-stone-800/80 bg-gradient-to-b from-stone-900 to-stone-900/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-rose-600 flex items-center justify-center text-white font-bold shadow-lg shadow-amber-500/10 ring-1 ring-amber-400/20">
              <span className="text-lg">رفيق</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="font-bold text-stone-100 tracking-tight text-base">Rafiq</h1>
                <span className="text-xs px-1.5 py-0.5 rounded font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Voice
                </span>
              </div>
              <p className="text-xs text-stone-400 font-medium">Life & Dynamics Voice Partner</p>
            </div>
          </div>
        </div>

        {/* Pact Banner */}
        <div className="mt-4 p-2.5 rounded-lg bg-stone-950/70 border border-stone-800/80 text-[11px] text-stone-400 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
          <span><strong className="text-stone-300">Pact:</strong> Zero echo chamber. Deep dynamics. No topic off-limits.</span>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        <div>
          <p className="px-3 text-[11px] font-semibold tracking-wider text-stone-500 uppercase mb-2">
            Advisor Interface
          </p>
          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab('voice')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'voice'
                  ? 'bg-gradient-to-r from-amber-500/20 to-rose-500/15 text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'text-stone-300 hover:bg-stone-800/60 hover:text-stone-100'
              }`}
            >
              <div className="flex items-center gap-3">
                <Mic className={`w-4 h-4 ${activeTab === 'voice' ? 'text-amber-400 animate-pulse' : 'text-stone-400'}`} />
                <span>Live Voice Advisor</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Primary
              </span>
            </button>

            <button
              onClick={() => setActiveTab('chat')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'chat'
                  ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-sm'
                  : 'text-stone-300 hover:bg-stone-800/60 hover:text-stone-100'
              }`}
            >
              <div className="flex items-center gap-3">
                <MessageSquare className="w-4 h-4" />
                <span>Dialogue & Text</span>
              </div>
              {activeSituationId && (
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" title="Linked to an active situation" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('situations')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'situations'
                  ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-sm'
                  : 'text-stone-300 hover:bg-stone-800/60 hover:text-stone-100'
              }`}
            >
              <div className="flex items-center gap-3">
                <Compass className="w-4 h-4" />
                <span>The Situation Room</span>
              </div>
              {activeSituationsCount > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-stone-800 text-stone-300 border border-stone-700">
                  {activeSituationsCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('tasks')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'tasks'
                  ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-sm'
                  : 'text-stone-300 hover:bg-stone-800/60 hover:text-stone-100'
              }`}
            >
              <div className="flex items-center gap-3">
                <CheckSquare className="w-4 h-4" />
                <span>Daily Execution Plan</span>
              </div>
              {taskCount > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-stone-800 text-stone-300 border border-stone-700">
                  {taskCount}
                </span>
              )}
            </button>
          </nav>
        </div>

        {/* Active Situations Quick Access */}
        <div>
          <div className="flex items-center justify-between px-3 mb-2">
            <p className="text-[11px] font-semibold tracking-wider text-stone-500 uppercase">
              Current Dilemmas
            </p>
            <button
              onClick={() => setActiveTab('situations')}
              className="text-[11px] text-amber-400 hover:underline"
            >
              Manage
            </button>
          </div>
          <div className="space-y-1.5">
            {situations.slice(0, 3).map((sit) => (
              <button
                key={sit.id}
                onClick={() => {
                  setActiveSituationId(sit.id === activeSituationId ? null : sit.id);
                  setActiveTab('chat');
                }}
                className={`w-full text-left p-2.5 rounded-lg text-xs border transition-all ${
                  activeSituationId === sit.id
                    ? 'bg-amber-950/30 border-amber-500/40 text-amber-200'
                    : 'bg-stone-950/40 border-stone-800/70 text-stone-300 hover:border-stone-700 hover:bg-stone-800/40'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="capitalize font-semibold text-[10px] text-stone-400">
                    {sit.domain}
                  </span>
                  {activeSituationId === sit.id ? (
                    <span className="text-[10px] text-amber-400 font-medium">In Focus</span>
                  ) : null}
                </div>
                <div className="truncate font-medium text-stone-200">{sit.title}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Trilingual Mastery & Derja Guide */}
        <div>
          <p className="px-3 text-[11px] font-semibold tracking-wider text-stone-500 uppercase mb-2">
            Language & Dialect
          </p>
          <button
            onClick={openGuideModal}
            className="w-full flex items-center justify-between p-3 rounded-lg bg-stone-950/60 border border-stone-800 text-stone-300 hover:border-stone-700 hover:text-stone-100 transition-all text-left"
          >
            <div className="flex items-center gap-2.5">
              <Languages className="w-4 h-4 text-emerald-400" />
              <div>
                <div className="text-xs font-semibold text-stone-200">English • FR • Tounsi</div>
                <div className="text-[11px] text-stone-400">Derja & Arabizi Guide</div>
              </div>
            </div>
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          </button>
        </div>
      </div>

      {/* User Dynamics Profile Footer */}
      <div className="p-3 border-t border-stone-800 bg-stone-900/80">
        <button
          onClick={openDynamicsModal}
          className="w-full flex items-center justify-between p-2.5 rounded-lg bg-stone-950/80 border border-stone-800 hover:border-stone-700 transition-all text-left group"
        >
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-stone-800 border border-stone-700 flex items-center justify-center text-xs font-bold text-stone-200 shrink-0">
              {userDynamics.name.charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <div className="text-xs font-semibold text-stone-200 truncate group-hover:text-amber-300 transition-colors">
                {userDynamics.name}
              </div>
              <div className="text-[10px] text-stone-400 truncate">
                {userDynamics.candorLevel === 'candid_uncut' ? '🔥 High Candor' : '⚖️ Balanced'}
              </div>
            </div>
          </div>
          <UserCog className="w-4 h-4 text-stone-400 group-hover:text-stone-200" />
        </button>
      </div>
    </aside>
  );
};
