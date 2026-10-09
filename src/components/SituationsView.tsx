import React, { useState } from 'react';
import { 
  Plus, 
  Compass, 
  GraduationCap, 
  Briefcase, 
  Users, 
  Brain, 
  MessageSquare, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  Loader2,
  Trash2
} from 'lucide-react';
import { Situation, DomainType, UserDynamicsProfile } from '../types';
import { requestDeepDive } from '../services/api';

interface SituationsViewProps {
  situations: Situation[];
  setSituations: React.Dispatch<React.SetStateAction<Situation[]>>;
  activeSituationId: string | null;
  setActiveSituationId: (id: string | null) => void;
  onDiscussInChat: (situation: Situation) => void;
  userDynamics: UserDynamicsProfile;
}

export const SituationsView: React.FC<SituationsViewProps> = ({
  situations,
  setSituations,
  activeSituationId,
  setActiveSituationId,
  onDiscussInChat,
  userDynamics,
}) => {
  const [selectedDomain, setSelectedDomain] = useState<DomainType | 'all'>('all');
  const [selectedSituation, setSelectedSituation] = useState<Situation | null>(
    situations[0] || null
  );
  const [isCreating, setIsCreating] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // New situation form state
  const [newTitle, setNewTitle] = useState('');
  const [newDomain, setNewDomain] = useState<DomainType>('job');
  const [newSummary, setNewSummary] = useState('');
  const [newDilemma, setNewDilemma] = useState('');
  const [newStakes, setNewStakes] = useState('');

  const filteredSituations = situations.filter(s =>
    selectedDomain === 'all' ? true : s.domain === selectedDomain
  );

  const domainIcons: Record<DomainType, any> = {
    school: GraduationCap,
    job: Briefcase,
    social: Users,
    personal: Brain,
  };

  const domainColors: Record<DomainType, { bg: string; text: string; border: string }> = {
    school: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
    job: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
    social: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
    personal: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20' },
  };

  const handleCreateSituation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newSummary.trim()) return;

    const newSit: Situation = {
      id: `sit-${Date.now()}`,
      title: newTitle.trim(),
      domain: newDomain,
      summary: newSummary.trim(),
      dilemma: newDilemma.trim() || 'Balancing immediate trade-offs vs long-term interests',
      stakes: newStakes.trim() || 'Medium to high impact on personal/professional peace of mind',
      status: 'active',
      updatedAt: Date.now(),
    };

    setSituations(prev => [newSit, ...prev]);
    setSelectedSituation(newSit);
    setIsCreating(false);
    setNewTitle('');
    setNewSummary('');
    setNewDilemma('');
    setNewStakes('');
  };

  const handleDeepDive = async (situation: Situation) => {
    setIsAnalyzing(true);
    try {
      const analysis = await requestDeepDive({
        situation: {
          title: situation.title,
          domain: situation.domain,
          details: `${situation.summary}\nSpecific Dilemma: ${situation.dilemma}\nStakes: ${situation.stakes}`,
        },
        userDynamics,
      });

      const updated = {
        ...situation,
        deepDiveAnalysis: analysis,
        updatedAt: Date.now(),
      };

      setSituations(prev =>
        prev.map(s => (s.id === situation.id ? updated : s))
      );
      setSelectedSituation(updated);
    } catch (err: any) {
      alert(`Deep Dive failed: ${err.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const toggleStatus = (id: string) => {
    setSituations(prev =>
      prev.map(s => {
        if (s.id === id) {
          const nextStatus = s.status === 'resolved' ? 'active' : 'resolved';
          const updated = { ...s, status: nextStatus as any, updatedAt: Date.now() };
          if (selectedSituation?.id === id) {
            setSelectedSituation(updated);
          }
          return updated;
        }
        return s;
      })
    );
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this situation?')) {
      const remaining = situations.filter(s => s.id !== id);
      setSituations(remaining);
      if (selectedSituation?.id === id) {
        setSelectedSituation(remaining[0] || null);
      }
      if (activeSituationId === id) {
        setActiveSituationId(null);
      }
    }
  };

  return (
    <div className="flex-1 flex h-screen bg-stone-950 overflow-hidden">
      {/* Situations List Panel */}
      <div className="w-96 border-r border-stone-800 flex flex-col h-full bg-stone-900/40">
        {/* Panel Header */}
        <div className="p-4 border-b border-stone-800 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-stone-100 flex items-center gap-2 text-base">
              <Compass className="w-4 h-4 text-amber-400" />
              <span>Situation Room</span>
            </h2>
            <p className="text-xs text-stone-400">Track and dissect ongoing life dynamics</p>
          </div>

          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 text-xs font-semibold transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Dilemma</span>
          </button>
        </div>

        {/* Domain Filter Pills */}
        <div className="p-3 border-b border-stone-800/80 flex items-center gap-1.5 overflow-x-auto text-xs no-scrollbar">
          {(['all', 'school', 'job', 'social', 'personal'] as const).map(d => (
            <button
              key={d}
              onClick={() => setSelectedDomain(d)}
              className={`px-2.5 py-1 rounded-lg capitalize font-medium transition-colors whitespace-nowrap ${
                selectedDomain === d
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/60'
              }`}
            >
              {d === 'all' ? 'All Domains' : d}
            </button>
          ))}
        </div>

        {/* Situations Cards */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {filteredSituations.length === 0 ? (
            <div className="p-8 text-center text-stone-500 text-xs">
              No situations logged under this domain.
            </div>
          ) : (
            filteredSituations.map(sit => {
              const Icon = domainIcons[sit.domain];
              const colors = domainColors[sit.domain];
              const isSelected = selectedSituation?.id === sit.id;
              const isPinned = activeSituationId === sit.id;

              return (
                <div
                  key={sit.id}
                  onClick={() => setSelectedSituation(sit)}
                  className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-stone-900 border-amber-500/40 shadow-md ring-1 ring-amber-500/20'
                      : 'bg-stone-950/60 border-stone-800/80 hover:border-stone-700/80 hover:bg-stone-900/50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${colors.bg} ${colors.text} border ${colors.border}`}
                    >
                      <Icon className="w-3 h-3" />
                      <span>{sit.domain}</span>
                    </span>

                    <div className="flex items-center gap-1.5">
                      {isPinned && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-medium">
                          In Chat
                        </span>
                      )}
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                          sit.status === 'resolved'
                            ? 'bg-stone-800 text-emerald-400 border border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                        }`}
                      >
                        {sit.status === 'resolved' ? 'Resolved' : 'Active'}
                      </span>
                    </div>
                  </div>

                  <h3 className="font-semibold text-stone-100 text-xs line-clamp-1 mb-1">
                    {sit.title}
                  </h3>

                  <p className="text-stone-400 text-[11px] line-clamp-2 leading-relaxed">
                    {sit.summary}
                  </p>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Situation Detail & 360° Dissection Panel */}
      <div className="flex-1 flex flex-col h-full overflow-y-auto p-8 bg-stone-950">
        {selectedSituation ? (
          <div className="max-w-3xl mx-auto w-full space-y-6">
            {/* Top Bar for Selected Situation */}
            <div className="flex items-start justify-between gap-4 border-b border-stone-800 pb-5">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold uppercase tracking-wider ${domainColors[selectedSituation.domain].bg} ${domainColors[selectedSituation.domain].text} border ${domainColors[selectedSituation.domain].border}`}
                  >
                    <span>{selectedSituation.domain}</span>
                  </span>
                  <button
                    onClick={() => toggleStatus(selectedSituation.id)}
                    className="text-xs text-stone-400 hover:text-stone-200 flex items-center gap-1"
                  >
                    <CheckCircle2 className={`w-3.5 h-3.5 ${selectedSituation.status === 'resolved' ? 'text-emerald-400' : 'text-stone-600'}`} />
                    <span>{selectedSituation.status === 'resolved' ? 'Mark as Active' : 'Mark as Resolved'}</span>
                  </button>
                </div>

                <h1 className="text-xl font-bold text-stone-100 leading-snug">
                  {selectedSituation.title}
                </h1>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => onDiscussInChat(selectedSituation)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-rose-600 text-white font-medium text-xs hover:opacity-90 shadow-md shadow-amber-500/20 transition-all"
                  title="Anchor advisor chat to this specific dilemma"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Discuss in Chat</span>
                </button>

                <button
                  onClick={() => handleDelete(selectedSituation.id)}
                  className="p-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-500 hover:text-rose-400 hover:border-rose-900 transition-colors"
                  title="Delete situation"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Situation Context Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-stone-900/60 border border-stone-800/80">
                <h4 className="text-xs font-bold text-stone-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                  <span>The Core Dilemma</span>
                </h4>
                <p className="text-xs text-stone-300 leading-relaxed">
                  {selectedSituation.dilemma}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-stone-900/60 border border-stone-800/80">
                <h4 className="text-xs font-bold text-stone-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                  <span>The Real Stakes</span>
                </h4>
                <p className="text-xs text-stone-300 leading-relaxed">
                  {selectedSituation.stakes}
                </p>
              </div>
            </div>

            {/* Summary */}
            <div className="p-4 rounded-xl bg-stone-900/40 border border-stone-800/70">
              <h4 className="text-xs font-semibold text-stone-400 mb-1">Context Summary</h4>
              <p className="text-sm text-stone-200 leading-relaxed">
                {selectedSituation.summary}
              </p>
            </div>

            {/* 360° Dissection Engine */}
            <div className="p-5 rounded-2xl bg-stone-900/90 border border-stone-800 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-stone-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-stone-100 text-sm">360° Dynamics Dissection</h3>
                    <p className="text-[11px] text-stone-400">
                      Unfiltered realpolitik, hidden leverage & blindspot breakdown
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleDeepDive(selectedSituation)}
                  disabled={isAnalyzing}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 border border-amber-500/30 text-amber-300 hover:bg-amber-500/30 font-semibold text-xs disabled:opacity-50 transition-all"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Dissecting Dynamics...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{selectedSituation.deepDiveAnalysis ? 'Re-Dissect' : 'Run 360° Dissection'}</span>
                    </>
                  )}
                </button>
              </div>

              {selectedSituation.deepDiveAnalysis ? (
                <div className="prose prose-invert max-w-none text-xs text-stone-200 space-y-2 whitespace-pre-wrap leading-relaxed font-sans">
                  {selectedSituation.deepDiveAnalysis}
                </div>
              ) : (
                <div className="p-6 text-center text-stone-500 text-xs space-y-2">
                  <p>No dissection generated for this situation yet.</p>
                  <p className="text-[11px] text-stone-600">
                    Click "Run 360° Dissection" to analyze unspoken leverage points, check blindspots, and extract an immediate 48h playbook.
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-stone-500 text-sm">
            <Compass className="w-12 h-12 text-stone-700 mb-3" />
            <p>Select a situation from the left or log a new challenge.</p>
          </div>
        )}
      </div>

      {/* Modal: Create New Situation */}
      {isCreating && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <h3 className="font-bold text-stone-100 text-base flex items-center gap-2">
                <Plus className="w-4 h-4 text-amber-400" />
                <span>Log a New Situation / Dilemma</span>
              </h3>
              <button
                onClick={() => setIsCreating(false)}
                className="text-stone-400 hover:text-stone-200 text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSituation} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  Domain Category
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(['school', 'job', 'social', 'personal'] as const).map(d => (
                    <button
                      type="button"
                      key={d}
                      onClick={() => setNewDomain(d)}
                      className={`py-1.5 px-2 rounded-lg capitalize text-xs font-medium border text-center transition-all ${
                        newDomain === d
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : 'bg-stone-950 border-stone-800 text-stone-400 hover:border-stone-700'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  Situation Title
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="e.g. Negotiation with manager about promotion or salary"
                  className="w-full bg-stone-950 border border-stone-800 rounded-lg p-2.5 text-xs text-stone-100 focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  Context Summary
                </label>
                <textarea
                  value={newSummary}
                  onChange={e => setNewSummary(e.target.value)}
                  placeholder="Describe what is happening frankly. Who is involved? What was said?"
                  rows={3}
                  className="w-full bg-stone-950 border border-stone-800 rounded-lg p-2.5 text-xs text-stone-100 focus:outline-none focus:border-amber-500 resize-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1">
                    Your Specific Dilemma
                  </label>
                  <input
                    type="text"
                    value={newDilemma}
                    onChange={e => setNewDilemma(e.target.value)}
                    placeholder="e.g. Should I push back or stay quiet?"
                    className="w-full bg-stone-950 border border-stone-800 rounded-lg p-2.5 text-xs text-stone-100 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1">
                    What is At Stake?
                  </label>
                  <input
                    type="text"
                    value={newStakes}
                    onChange={e => setNewStakes(e.target.value)}
                    placeholder="e.g. Reputation, sanity, career growth"
                    className="w-full bg-stone-950 border border-stone-800 rounded-lg p-2.5 text-xs text-stone-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-800">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-stone-400 hover:text-stone-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-rose-600 text-white font-semibold text-xs shadow-md shadow-amber-500/20 hover:opacity-90 transition-all"
                >
                  Save Dilemma
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
