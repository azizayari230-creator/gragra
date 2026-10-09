import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Copy, 
  Check, 
  Sparkles, 
  ShieldAlert, 
  RotateCcw, 
  Plus, 
  Flame, 
  HeartHandshake, 
  Crosshair, 
  Scale, 
  ExternalLink,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Lightbulb
} from 'lucide-react';
import { 
  Message, 
  AdvisorMode, 
  LanguageMode, 
  UserDynamicsProfile, 
  Situation, 
  ActionTask 
} from '../types';
import { sendChatMessage, generateSpeechAudio } from '../services/api';

interface ChatViewProps {
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  mode: AdvisorMode;
  setMode: (mode: AdvisorMode) => void;
  language: LanguageMode;
  setLanguage: (lang: LanguageMode) => void;
  userDynamics: UserDynamicsProfile;
  activeSituation: Situation | null;
  setActiveSituationId: (id: string | null) => void;
  onAddTask: (task: Omit<ActionTask, 'id'>) => void;
  onOpenSituationRoom: () => void;
}

export const ChatView: React.FC<ChatViewProps> = ({
  messages,
  setMessages,
  mode,
  setMode,
  language,
  setLanguage,
  userDynamics,
  activeSituation,
  setActiveSituationId,
  onAddTask,
  onOpenSituationRoom,
}) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [speechRecognizing, setSpeechRecognizing] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [audioLoadingId, setAudioLoadingId] = useState<string | null>(null);
  const [addedActionIndex, setAddedActionIndex] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current = null;
      }
    };
  }, []);

  const handleSend = async (customPrompt?: string) => {
    const textToSend = customPrompt || input.trim();
    if (!textToSend || isLoading) return;

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: textToSend,
      timestamp: Date.now(),
      mode,
      language,
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const response = await sendChatMessage({
        messages: newMessages.map(m => ({ role: m.role, content: m.content })),
        mode,
        language,
        userDynamics,
        activeSituation,
      });

      const assistantMessage: Message = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: response.reply,
        timestamp: Date.now(),
        mode,
        language,
        analysis: response.analysis,
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error('Failed to get advisor response:', error);
      const errorMessage: Message = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: `**Erreur de connexion / Connection error**: ${error.message || 'Unable to connect to the advisor engine.'} Please try again.`,
        timestamp: Date.now(),
        mode,
        language,
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Toggle speech-to-text mic
  const toggleSpeechRecognition = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
      return;
    }

    if (speechRecognizing) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setSpeechRecognizing(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;

      // Select recognition lang based on current preference
      if (language === 'french') {
        recognition.lang = 'fr-FR';
      } else if (language === 'tounsi_arabic' || language === 'tounsi_arabizi') {
        recognition.lang = 'ar-TN';
      } else {
        recognition.lang = 'en-US';
      }

      recognition.onstart = () => {
        setSpeechRecognizing(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(prev => (prev ? `${prev} ${transcript}` : transcript));
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setSpeechRecognizing(false);
      };

      recognition.onend = () => {
        setSpeechRecognizing(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Speech recognition failed to initialize:', err);
      setSpeechRecognizing(false);
    }
  };

  // Audio Playback
  const handlePlayAudio = async (msg: Message) => {
    if (playingAudioId === msg.id) {
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current = null;
      }
      setPlayingAudioId(null);
      return;
    }

    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }

    setAudioLoadingId(msg.id);

    try {
      let audioUrl = msg.audioUrl;
      if (!audioUrl) {
        audioUrl = await generateSpeechAudio(msg.content);
        // Cache audio on message
        setMessages(prev =>
          prev.map(m => (m.id === msg.id ? { ...m, audioUrl } : m))
        );
      }

      const audio = new Audio(audioUrl);
      currentAudioRef.current = audio;

      audio.onended = () => {
        setPlayingAudioId(null);
        currentAudioRef.current = null;
      };

      audio.onerror = () => {
        console.warn('Audio playback error, falling back to Web Speech Synthesis');
        playSpeechSynthesisFallback(msg.content, msg.language);
        setPlayingAudioId(null);
        setAudioLoadingId(null);
      };

      await audio.play();
      setPlayingAudioId(msg.id);
    } catch (err) {
      console.warn('TTS API error, using browser speech synthesis:', err);
      playSpeechSynthesisFallback(msg.content, msg.language);
    } finally {
      setAudioLoadingId(null);
    }
  };

  const playSpeechSynthesisFallback = (text: string, lang?: LanguageMode) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const clean = text.replace(/[#*`_~[\]()]/g, '').slice(0, 400);
    const utterance = new SpeechSynthesisUtterance(clean);
    if (lang === 'french') utterance.lang = 'fr-FR';
    else if (lang === 'tounsi_arabic') utterance.lang = 'ar-XA';
    else utterance.lang = 'en-US';
    window.speechSynthesis.speak(utterance);
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleAddSuggestedAction = (actionText: string, actionKey: string) => {
    onAddTask({
      title: actionText,
      domain: activeSituation ? activeSituation.domain : 'personal',
      priority: 'high',
      completed: false,
      dueDate: 'Today',
      relatedSituationId: activeSituation?.id,
    });
    setAddedActionIndex(actionKey);
    setTimeout(() => setAddedActionIndex(null), 2000);
  };

  // Helper to format text with Markdown bold and bullet lists
  const renderFormattedContent = (content: string) => {
    const lines = content.split('\n');
    return lines.map((line, idx) => {
      // Heading lines
      if (line.startsWith('### ')) {
        return (
          <h4 key={idx} className="font-bold text-stone-100 text-sm mt-3 mb-1">
            {line.replace('### ', '')}
          </h4>
        );
      }
      if (line.startsWith('## ') || line.startsWith('# ')) {
        return (
          <h3 key={idx} className="font-bold text-amber-200 text-base mt-4 mb-1.5 border-b border-stone-800 pb-1">
            {line.replace(/^#+ /, '')}
          </h3>
        );
      }
      // Bullet list
      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        const bulletText = line.trim().replace(/^[-*]\s+/, '');
        return (
          <li key={idx} className="ml-4 list-disc text-stone-300 my-0.5 leading-relaxed">
            {parseInlineFormatting(bulletText)}
          </li>
        );
      }
      // Numbered list
      const numMatch = line.trim().match(/^(\d+)\.\s+(.*)/);
      if (numMatch) {
        return (
          <div key={idx} className="flex items-start gap-2 text-stone-300 my-1 leading-relaxed">
            <span className="font-mono text-amber-400 font-semibold text-xs mt-0.5 shrink-0">
              {numMatch[1]}.
            </span>
            <span>{parseInlineFormatting(numMatch[2])}</span>
          </div>
        );
      }
      // Empty line
      if (!line.trim()) {
        return <div key={idx} className="h-2" />;
      }
      // Regular paragraph
      return (
        <p key={idx} className="text-stone-200 leading-relaxed my-1">
          {parseInlineFormatting(line)}
        </p>
      );
    });
  };

  const parseInlineFormatting = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={i} className="text-amber-100 font-semibold">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        return (
          <em key={i} className="text-stone-300 italic">
            {part.slice(1, -1)}
          </em>
        );
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code key={i} className="px-1.5 py-0.5 rounded bg-stone-800 text-amber-300 font-mono text-xs">
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });
  };

  const modeDescriptions: Record<AdvisorMode, { label: string; icon: any; color: string; desc: string }> = {
    strategic_partner: {
      label: 'Strategic Partner',
      icon: Scale,
      color: 'amber',
      desc: 'Balanced high-candor guidance, reading unspoken dynamics & pragmatic solutions.',
    },
    devils_advocate: {
      label: "Devil's Advocate",
      icon: Flame,
      color: 'rose',
      desc: 'Sparring stance: ruthlessly challenges your premise, ego, and blind spots.',
    },
    deep_listener: {
      label: 'Deep Listener',
      icon: HeartHandshake,
      color: 'teal',
      desc: 'Empathetic sounding board: unpacks emotional weight before jumping to action.',
    },
    tactical_executor: {
      label: 'Tactical Executor',
      icon: Crosshair,
      color: 'emerald',
      desc: 'Zero-fluff battle drill: concrete next 3 steps, timelines, and execution scripts.',
    },
  };

  return (
    <div className="flex-1 flex flex-col h-screen bg-stone-950 overflow-hidden">
      {/* Top Header & Controls */}
      <div className="border-b border-stone-800/80 bg-stone-900/60 backdrop-blur-md px-6 py-3.5 flex flex-wrap items-center justify-between gap-3">
        {/* Advisor Stance Switcher */}
        <div className="flex items-center gap-1.5 bg-stone-950/70 p-1 rounded-xl border border-stone-800">
          {(Object.keys(modeDescriptions) as AdvisorMode[]).map(mKey => {
            const m = modeDescriptions[mKey];
            const Icon = m.icon;
            const isSelected = mode === mKey;
            return (
              <button
                key={mKey}
                onClick={() => setMode(mKey)}
                title={m.desc}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  isSelected
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                    : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/50'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-amber-400' : 'text-stone-400'}`} />
                <span>{m.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right side: Language Selector & Clear */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-stone-950/70 p-1 rounded-xl border border-stone-800 text-xs">
            <span className="text-stone-500 px-2 font-medium">Lang:</span>
            <button
              onClick={() => setLanguage('auto')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                language === 'auto' ? 'bg-amber-500/20 text-amber-300' : 'text-stone-400 hover:text-stone-200'
              }`}
              title="Automatically detect & code-switch naturally"
            >
              🌐 Auto
            </button>
            <button
              onClick={() => setLanguage('english')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                language === 'english' ? 'bg-amber-500/20 text-amber-300' : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              EN
            </button>
            <button
              onClick={() => setLanguage('french')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                language === 'french' ? 'bg-amber-500/20 text-amber-300' : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              FR
            </button>
            <button
              onClick={() => setLanguage('tounsi_arabizi')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                language === 'tounsi_arabizi' ? 'bg-amber-500/20 text-amber-300' : 'text-stone-400 hover:text-stone-200'
              }`}
              title="Tunisian Arabic (Arabizi: 3, 7, 9)"
            >
              🇹🇳 Arabizi
            </button>
            <button
              onClick={() => setLanguage('tounsi_arabic')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                language === 'tounsi_arabic' ? 'bg-amber-500/20 text-amber-300' : 'text-stone-400 hover:text-stone-200'
              }`}
              title="Tunisian Arabic in Arabic script"
            >
              تونسية
            </button>
          </div>

          <button
            onClick={() => {
              if (confirm('Clear the conversation? Your saved situations and tasks will be preserved.')) {
                setMessages([
                  {
                    id: `msg-${Date.now()}`,
                    role: 'assistant',
                    content: 'Conversation reset. What dilemma or dynamic shall we dissect next, sahbi?',
                    timestamp: Date.now(),
                    mode,
                    language,
                  },
                ]);
              }
            }}
            title="Reset conversation"
            className="p-1.5 text-stone-400 hover:text-stone-200 hover:bg-stone-800 rounded-lg transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Linked Situation Indicator Bar */}
      {activeSituation && (
        <div className="bg-amber-950/40 border-b border-amber-500/30 px-6 py-2.5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="px-2 py-0.5 rounded font-semibold uppercase text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Focus: {activeSituation.domain}
            </span>
            <span className="font-medium text-amber-100 truncate">
              {activeSituation.title}
            </span>
            <span className="text-amber-300/70 hidden md:inline truncate">
              — {activeSituation.summary}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-4">
            <button
              onClick={onOpenSituationRoom}
              className="text-amber-300 hover:underline flex items-center gap-1 font-medium"
            >
              <span>360° Dissection</span>
              <ExternalLink className="w-3 h-3" />
            </button>
            <button
              onClick={() => setActiveSituationId(null)}
              className="text-stone-400 hover:text-stone-200 ml-2"
            >
              ✕ Unpin
            </button>
          </div>
        </div>
      )}

      {/* Message Stream */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        {messages.map((msg) => {
          const isAssistant = msg.role === 'assistant';
          const isAudioPlaying = playingAudioId === msg.id;
          const isAudioLoading = audioLoadingId === msg.id;

          return (
            <div
              key={msg.id}
              className={`flex gap-4 max-w-4xl mx-auto ${isAssistant ? '' : 'flex-row-reverse'}`}
            >
              {/* Avatar */}
              <div className="shrink-0 pt-1">
                {isAssistant ? (
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-rose-600 flex items-center justify-center text-white font-bold text-xs shadow-md shadow-amber-500/10 ring-1 ring-amber-400/30">
                    <span>رفيق</span>
                  </div>
                ) : (
                  <div className="w-9 h-9 rounded-xl bg-stone-800 border border-stone-700 flex items-center justify-center text-stone-200 font-bold text-xs">
                    {userDynamics.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              {/* Message Content Bubble */}
              <div
                className={`flex-1 rounded-2xl p-5 border text-sm transition-all ${
                  isAssistant
                    ? 'bg-stone-900/90 border-stone-800/90 text-stone-200 shadow-lg shadow-black/20'
                    : 'bg-amber-600/15 border-amber-500/30 text-stone-100 max-w-2xl'
                }`}
              >
                {/* Meta header for assistant */}
                {isAssistant && (
                  <div className="flex items-center justify-between border-b border-stone-800/60 pb-2.5 mb-3 text-xs text-stone-400">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-stone-300">Rafiq</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-stone-800 text-stone-400 border border-stone-700/60">
                        {msg.mode ? modeDescriptions[msg.mode]?.label || msg.mode : 'Strategic Partner'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* Audio Speak button */}
                      <button
                        onClick={() => handlePlayAudio(msg)}
                        disabled={isAudioLoading}
                        title={isAudioPlaying ? 'Stop speaking' : 'Listen with natural voice'}
                        className={`p-1.5 rounded-lg border transition-all flex items-center gap-1 text-xs ${
                          isAudioPlaying
                            ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 animate-pulse'
                            : 'bg-stone-800/60 border-stone-700/60 text-stone-400 hover:text-stone-200'
                        }`}
                      >
                        {isAudioLoading ? (
                          <span className="inline-block w-3.5 h-3.5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                        ) : isAudioPlaying ? (
                          <VolumeX className="w-3.5 h-3.5" />
                        ) : (
                          <Volume2 className="w-3.5 h-3.5" />
                        )}
                        <span className="text-[10px] hidden sm:inline">
                          {isAudioPlaying ? 'Playing' : 'Listen'}
                        </span>
                      </button>

                      {/* Copy button */}
                      <button
                        onClick={() => handleCopy(msg.id, msg.content)}
                        className="p-1.5 rounded-lg bg-stone-800/60 border border-stone-700/60 text-stone-400 hover:text-stone-200 transition-colors"
                        title="Copy message"
                      >
                        {copiedId === msg.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Rendered Body */}
                <div className="space-y-1">
                  {renderFormattedContent(msg.content)}
                </div>

                {/* Attached Structured Reality Check / Dynamics Analysis Card */}
                {isAssistant && msg.analysis && (
                  <div className="mt-4 pt-3.5 border-t border-stone-800/80 space-y-3">
                    {/* Reality Check / Blindspot */}
                    {msg.analysis.realityCheck && (
                      <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-500/30 text-xs">
                        <div className="flex items-center gap-1.5 font-bold text-amber-300 mb-1">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span>Reality Check / Unspoken Blindspot</span>
                        </div>
                        <p className="text-stone-300 leading-relaxed font-medium">
                          {msg.analysis.realityCheck}
                        </p>
                      </div>
                    )}

                    {/* Situation Dynamics Diagnosis */}
                    {msg.analysis.situationDynamics && (
                      <div className="p-3 rounded-xl bg-stone-950/60 border border-stone-800 text-xs">
                        <div className="flex items-center gap-1.5 font-bold text-teal-300 mb-1">
                          <Lightbulb className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                          <span>Subtext & Power Dynamics</span>
                        </div>
                        <p className="text-stone-400 leading-relaxed">
                          {msg.analysis.situationDynamics}
                        </p>
                      </div>
                    )}

                    {/* Suggested Concrete Next Steps */}
                    {msg.analysis.suggestedActions && msg.analysis.suggestedActions.length > 0 && (
                      <div className="pt-1">
                        <div className="flex items-center justify-between text-[11px] font-semibold text-stone-400 uppercase tracking-wider mb-1.5">
                          <span>Actionable Tactics</span>
                          <span className="text-[10px] text-stone-500 lowercase">Click + to add to daily plan</span>
                        </div>
                        <div className="space-y-1.5">
                          {msg.analysis.suggestedActions.map((action, aIdx) => {
                            const actionKey = `${msg.id}-${aIdx}`;
                            const isAdded = addedActionIndex === actionKey;
                            return (
                              <div
                                key={aIdx}
                                className="flex items-center justify-between gap-2 p-2 rounded-lg bg-stone-950/40 border border-stone-800/80 hover:border-stone-700/80 transition-all text-xs text-stone-300"
                              >
                                <span className="flex-1">{action}</span>
                                <button
                                  onClick={() => handleAddSuggestedAction(action, actionKey)}
                                  className={`p-1 rounded-md transition-all shrink-0 ${
                                    isAdded
                                      ? 'bg-emerald-500/20 text-emerald-300'
                                      : 'hover:bg-amber-500/20 text-stone-400 hover:text-amber-300'
                                  }`}
                                  title="Add to Daily Action Plan"
                                >
                                  {isAdded ? (
                                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                                  ) : (
                                    <Plus className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Loading Spinner Indicator */}
        {isLoading && (
          <div className="flex gap-4 max-w-4xl mx-auto">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-rose-600 flex items-center justify-center text-white font-bold text-xs shadow-md ring-1 ring-amber-400/30 shrink-0">
              <span>رفيق</span>
            </div>
            <div className="rounded-2xl p-4 bg-stone-900 border border-stone-800 text-stone-400 text-xs flex items-center gap-3">
              <span className="flex gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: '300ms' }} />
              </span>
              <span className="font-medium text-stone-300">
                {mode === 'devils_advocate'
                  ? 'Stress-testing your assumptions & finding the blindspot...'
                  : mode === 'tactical_executor'
                  ? 'Formulating zero-fluff tactical micro-steps...'
                  : mode === 'deep_listener'
                  ? 'Tuning into the emotional weight and nuance...'
                  : 'Analyzing the dynamics and drafting unfiltered advice...'}
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Sparring Prompt Chips */}
      <div className="px-6 py-2 border-t border-stone-800/60 bg-stone-900/30 flex items-center gap-2 overflow-x-auto text-xs no-scrollbar">
        <span className="text-stone-500 shrink-0 font-medium">Quick Spar:</span>
        <button
          onClick={() => handleSend("Challenge my perspective on this. Tell me where I might be fooling myself or acting out of ego/fear.")}
          className="px-2.5 py-1 rounded-full bg-stone-800/80 hover:bg-stone-700/80 border border-stone-700/60 text-stone-300 hover:text-stone-100 whitespace-nowrap transition-all"
        >
          🔥 Challenge my perspective
        </button>
        <button
          onClick={() => handleSend("What are the hidden interpersonal & power dynamics in this situation? Read between the lines.")}
          className="px-2.5 py-1 rounded-full bg-stone-800/80 hover:bg-stone-700/80 border border-stone-700/60 text-stone-300 hover:text-stone-100 whitespace-nowrap transition-all"
        >
          🔍 Unspoken dynamics & leverage
        </button>
        <button
          onClick={() => handleSend("A3tini rayek b'tounsi ya sahbi, 7otli el s7i7 fi wejhi ma ghalkechi.")}
          className="px-2.5 py-1 rounded-full bg-stone-800/80 hover:bg-stone-700/80 border border-stone-700/60 text-stone-300 hover:text-stone-100 whitespace-nowrap transition-all"
        >
          🇹🇳 Real talk b'Tounsi
        </button>
        <button
          onClick={() => handleSend("Give me 3 concrete micro-steps to execute in the next 24 hours without burning bridges.")}
          className="px-2.5 py-1 rounded-full bg-stone-800/80 hover:bg-stone-700/80 border border-stone-700/60 text-stone-300 hover:text-stone-100 whitespace-nowrap transition-all"
        >
          🎯 3 micro-steps for next 24h
        </button>
      </div>

      {/* Input Box Footer */}
      <div className="p-4 border-t border-stone-800 bg-stone-900/80">
        <div className="max-w-4xl mx-auto relative rounded-2xl bg-stone-950 border border-stone-800 focus-within:border-amber-500/50 focus-within:ring-1 focus-within:ring-amber-500/30 transition-all shadow-inner">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              language === 'tounsi_arabizi'
                        ? "I7kili chnouwa el mawdhou3... (No topic off limits, fac, khedma, shab, relations)"
                : language === 'french'
                ? "Dis-moi ce qui se passe... (École, job, relations, dilemmes personnels)"
                : language === 'tounsi_arabic'
                ? "احكيلي شنية الحكاية... (قراية، خدمة، أصحاب، عائلة)"
                : "Talk to me freely... (School, job dynamics, social dilemmas, taboo topics, anything)"
            }
            rows={2}
            className="w-full bg-transparent p-4 pr-24 text-sm text-stone-100 placeholder:text-stone-500 focus:outline-none resize-none"
          />

          <div className="absolute right-3 bottom-3 flex items-center gap-2">
            {/* Mic Speech-to-Text Button */}
            <button
              onClick={toggleSpeechRecognition}
              className={`p-2 rounded-xl transition-all ${
                speechRecognizing
                  ? 'bg-rose-500 text-white animate-pulse shadow-md shadow-rose-500/30'
                  : 'bg-stone-800 text-stone-400 hover:text-stone-200 hover:bg-stone-700'
              }`}
              title={speechRecognizing ? 'Listening... click to stop' : 'Speak via microphone (Speech-to-text)'}
            >
              {speechRecognizing ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            {/* Send Button */}
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || isLoading}
              className="p-2 rounded-xl bg-gradient-to-r from-amber-500 to-rose-600 text-white disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 shadow-md shadow-amber-500/20 transition-all"
              title="Send message (Enter)"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="max-w-4xl mx-auto flex items-center justify-between text-[11px] text-stone-500 px-2 mt-2">
          <span>Stance: <strong className="text-stone-400 font-medium">{modeDescriptions[mode].label}</strong></span>
          <span>Press <kbd className="px-1 py-0.5 rounded bg-stone-800 text-stone-300 border border-stone-700 font-mono text-[10px]">Enter</kbd> to send, <kbd className="px-1 py-0.5 rounded bg-stone-800 text-stone-300 border border-stone-700 font-mono text-[10px]">Shift+Enter</kbd> for newline</span>
        </div>
      </div>
    </div>
  );
};
