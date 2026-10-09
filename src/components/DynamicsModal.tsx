import React, { useState } from 'react';
import { UserDynamicsProfile, LanguageMode } from '../types';
import { UserCog, ShieldCheck, Flame, Scale, Heart, Save } from 'lucide-react';

interface DynamicsModalProps {
  userDynamics: UserDynamicsProfile;
  setUserDynamics: React.Dispatch<React.SetStateAction<UserDynamicsProfile>>;
  onClose: () => void;
}

export const DynamicsModal: React.FC<DynamicsModalProps> = ({
  userDynamics,
  setUserDynamics,
  onClose,
}) => {
  const [formData, setFormData] = useState<UserDynamicsProfile>({ ...userDynamics });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setUserDynamics(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-stone-900 border border-stone-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-stone-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <UserCog className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-stone-100 text-base">My Dynamics Profile</h3>
              <p className="text-xs text-stone-400">Configure how Rafiq understands you and your blindspots</p>
            </div>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-200">
            ✕
          </button>
        </div>

        {/* Philosophy Note */}
        <div className="p-3 rounded-xl bg-stone-950/70 border border-stone-800/80 text-xs text-stone-300 leading-relaxed">
          <strong className="text-amber-300">Why this matters:</strong> An advisor who doesn't know your specific tendencies will give generic platitudes. When Rafiq understands your patterns, it can catch you right when you start self-sabotaging or rationalizing.
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-stone-300 mb-1">
              Your Name / How to Address You
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-stone-950 border border-stone-800 rounded-lg p-2.5 text-xs text-stone-100 focus:outline-none focus:border-amber-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-300 mb-1">
              Current Core Life Focus
            </label>
            <textarea
              value={formData.currentFocus}
              onChange={e => setFormData({ ...formData, currentFocus: e.target.value })}
              rows={2}
              placeholder="e.g. Completing my engineering degree / PFE while job hunting and managing family expectations"
              className="w-full bg-stone-950 border border-stone-800 rounded-lg p-2.5 text-xs text-stone-100 focus:outline-none focus:border-amber-500 resize-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-300 mb-1">
              Known Personal Tendencies & Blindspots
            </label>
            <textarea
              value={formData.blindspots}
              onChange={e => setFormData({ ...formData, blindspots: e.target.value })}
              rows={2}
              placeholder="e.g. I overthink conversations, I avoid calling people out until resentment builds up, I struggle with saying no"
              className="w-full bg-stone-950 border border-stone-800 rounded-lg p-2.5 text-xs text-stone-100 focus:outline-none focus:border-amber-500 resize-none"
              required
            />
            <p className="text-[11px] text-stone-500 mt-1">
              Rafiq will use this to call out when you fall back into these specific traps.
            </p>
          </div>

          {/* Candor Level Selector */}
          <div>
            <label className="block text-xs font-semibold text-stone-300 mb-2">
              Candor Level (No Echo Chamber Guarantee)
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, candorLevel: 'candid_uncut' })}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  formData.candorLevel === 'candid_uncut'
                    ? 'bg-rose-500/15 border-rose-500/50 text-rose-200'
                    : 'bg-stone-950 border-stone-800 text-stone-400 hover:border-stone-700'
                }`}
              >
                <div className="flex items-center gap-1 font-semibold text-xs mb-1">
                  <Flame className="w-3.5 h-3.5 text-rose-400" />
                  <span>Candid & Uncut</span>
                </div>
                <div className="text-[10px] text-stone-400 leading-tight">
                  Zero filter. Straight truth. Call out every excuse.
                </div>
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, candorLevel: 'strategic_balanced' })}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  formData.candorLevel === 'strategic_balanced'
                    ? 'bg-amber-500/15 border-amber-500/50 text-amber-200'
                    : 'bg-stone-950 border-stone-800 text-stone-400 hover:border-stone-700'
                }`}
              >
                <div className="flex items-center gap-1 font-semibold text-xs mb-1">
                  <Scale className="w-3.5 h-3.5 text-amber-400" />
                  <span>Strategic</span>
                </div>
                <div className="text-[10px] text-stone-400 leading-tight">
                  Balanced honesty with diplomatic framing.
                </div>
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, candorLevel: 'gentle_grounded' })}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  formData.candorLevel === 'gentle_grounded'
                    ? 'bg-teal-500/15 border-teal-500/50 text-teal-200'
                    : 'bg-stone-950 border-stone-800 text-stone-400 hover:border-stone-700'
                }`}
              >
                <div className="flex items-center gap-1 font-semibold text-xs mb-1">
                  <Heart className="w-3.5 h-3.5 text-teal-400" />
                  <span>Gentle</span>
                </div>
                <div className="text-[10px] text-stone-400 leading-tight">
                  Grounded truth delivered with softer pacing.
                </div>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-300 mb-1">
              Personal Values & Rules of Engagement
            </label>
            <input
              type="text"
              value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
              placeholder="e.g. Treat me as an intellectual peer, challenge my ego, don't pity me"
              className="w-full bg-stone-950 border border-stone-800 rounded-lg p-2.5 text-xs text-stone-100 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-stone-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-lg text-xs font-medium text-stone-400 hover:text-stone-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-rose-600 text-white font-semibold text-xs shadow-md shadow-amber-500/20 hover:opacity-90 transition-all"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Update Dynamics Profile</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
