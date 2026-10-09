import React from 'react';
import { Languages, Sparkles, MessageSquare, ArrowRight, BookOpen } from 'lucide-react';
import { LanguageMode } from '../types';

interface TrilingualGuideModalProps {
  onClose: () => void;
  onSelectPrompt: (prompt: string, lang: LanguageMode) => void;
}

export const TrilingualGuideModal: React.FC<TrilingualGuideModalProps> = ({
  onClose,
  onSelectPrompt,
}) => {
  const samples = [
    {
      title: '🇹🇳 Tunisian Derja (Arabizi)',
      lang: 'tounsi_arabizi' as LanguageMode,
      badge: 'الدارجة التونسية بالعرابيزي',
      desc: 'Authentic everyday street & professional Tunisian with Arabizi numbers (3=ع, 7=ح, 9=ق, 5=خ).',
      prompt: "3aslema sahbi, fama 7kaya fi el khedma. El manager dima y'hot el pression 3liya w yensa les efforts mte3i, chnouwa el tactical move lezem na3mlou?",
      translation: '"Hello my friend, there is an issue at work. The manager always puts pressure on me and forgets my efforts. What is the tactical move I should make?"',
    },
    {
      title: '🇹🇳 Tunisian Derja (Arabic Script)',
      lang: 'tounsi_arabic' as LanguageMode,
      badge: 'الدارجة التونسية بالحروف العربية',
      desc: 'Written in pure Tunisian Arabic script, direct and culturally rich.',
      prompt: 'عسلامة يا رفيق. حاسس روحي ضايع بين قراية الامتحانات وضغط الخدمة، وما نعرفش وقتاش نقول لا للأصحاب والعائلة باش نركّز.',
      translation: '"Hello Rafiq. I feel lost between exam studies and work pressure, and I don\'t know when to say no to friends and family to focus."',
    },
    {
      title: '🇫🇷 Français (Nuancé & Psychologique)',
      lang: 'french' as LanguageMode,
      badge: 'Français Naturel',
      desc: 'Eloquent, precise, psychologically grounded French for career and relationship dilemmas.',
      prompt: "Je remarque que j'évite la confrontation avec un collègue qui s'approprie mes idées en réunion. Analyse mes angles morts et donne-moi un script franc pour recadrer.",
      translation: '"I notice I avoid confrontation with a colleague who takes credit for my ideas in meetings. Analyze my blindspots and give me a candid script to reframe."',
    },
    {
      title: '🇬🇧 English (Strategic & Unfiltered)',
      lang: 'english' as LanguageMode,
      badge: 'High-Candor English',
      desc: 'Sharp, executive-level reasoning, ruthless reality checks, and tactical roadmaps.',
      prompt: "Be my devil's advocate: I want to turn down a safe corporate offer to freelance full-time. Tell me every reason why this could blow up and test my conviction.",
      translation: '"Stress-test my career move: break down all the blindspots of quitting my corporate safety net."',
    },
    {
      title: '🔀 Natural Code-Switching (Tounsi / FR / EN)',
      lang: 'auto' as LanguageMode,
      badge: 'Quintessential Polyglot',
      desc: 'How young Tunisians actually communicate: effortless blending of Derja, French, and English.',
      prompt: "Sahbi en fait fama un grand dilemme: 3andi deadline mte3 PFE fel fac w en même temps un project freelance avec un client exigeant. Kifesh n'gérer el burnout sans saboter mes chances?",
      translation: '"Mixing Derja + French + English as is natural in Tunisian tech & student life."',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-stone-900 border border-stone-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-stone-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Languages className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-stone-100 text-base">Trilingual & Derja Mastery</h3>
              <p className="text-xs text-stone-400">
                English • Français • Tunisian Arabic (الدارجة التونسية)
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-200">
            ✕
          </button>
        </div>

        {/* Culture note */}
        <div className="p-3.5 rounded-xl bg-stone-950/70 border border-stone-800/80 text-xs text-stone-300 leading-relaxed space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-amber-300">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Fluent in Cultural Nuance</span>
          </div>
          <p>
            Rafiq understands Tunisian reality from the inside out: from the pressure of <em>el fac</em> and <em>el PFE</em> to workplace dynamics with managers, family expectations (<em>el dar</em>), coffee shop discussions with <em>el s7ab</em>, and the modern polyglot reality. You can talk to Rafiq in Arabizi, Arabic script, French, or English, or jump between them mid-sentence.
          </p>
        </div>

        {/* Sample Prompts */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider">
            Click any prompt to try it in chat:
          </h4>

          {samples.map((s, idx) => (
            <div
              key={idx}
              onClick={() => {
                onSelectPrompt(s.prompt, s.lang);
                onClose();
              }}
              className="p-3.5 rounded-xl bg-stone-950/60 border border-stone-800/80 hover:border-amber-500/50 hover:bg-stone-900/60 transition-all cursor-pointer group space-y-1.5 text-left"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-stone-200 text-xs flex items-center gap-1.5">
                  <span>{s.title}</span>
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-stone-800 text-stone-400 border border-stone-700/60 group-hover:border-amber-500/30 group-hover:text-amber-300 transition-colors">
                  {s.badge}
                </span>
              </div>

              <p className="text-stone-300 text-xs leading-relaxed italic bg-stone-900/40 p-2 rounded-lg border border-stone-800/60">
                "{s.prompt}"
              </p>

              <div className="flex items-center justify-between text-[11px] text-stone-500 pt-0.5">
                <span>{s.translation}</span>
                <span className="text-amber-400 font-medium group-hover:translate-x-1 transition-transform flex items-center gap-1">
                  Use Prompt <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end pt-2 border-t border-stone-800">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold transition-colors"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
