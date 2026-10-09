import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  PhoneCall, 
  PhoneOff, 
  RotateCcw, 
  Sparkles, 
  ShieldAlert, 
  Flame, 
  HeartHandshake, 
  Crosshair, 
  Scale, 
  Check, 
  Plus, 
  ChevronDown, 
  ChevronUp, 
  Languages, 
  Settings2,
  Radio,
  Sliders,
  AudioWaveform
} from 'lucide-react';
import { 
  Message, 
  AdvisorMode, 
  LanguageMode, 
  VoicePersona, 
  VoiceState, 
  VoiceSessionMode, 
  UserDynamicsProfile, 
  Situation, 
  ActionTask 
} from '../types';
import { sendChatMessage, generateSpeechAudio } from '../services/api';

interface VoiceSpaceProps {
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
  openGuideModal: () => void;
}

export const VoiceSpace: React.FC<VoiceSpaceProps> = ({
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
  openGuideModal,
}) => {
  // Voice state
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [isHandsFree, setIsHandsFree] = useState<boolean>(true); // Continuous phone call style
  const [selectedPersona, setSelectedPersona] = useState<VoicePersona>('Fenrir');
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [transcriptDraft, setTranscriptDraft] = useState<string>('');
  const [lastSpokenResponse, setLastSpokenResponse] = useState<string>('');
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [showTranscriptDrawer, setShowTranscriptDrawer] = useState<boolean>(false);
  const [showVoiceSettings, setShowVoiceSettings] = useState<boolean>(false);
  const [addedActionKey, setAddedActionKey] = useState<string | null>(null);

  // Audio & Speech references
  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const isListeningRef = useRef<boolean>(false);
  const isHandsFreeRef = useRef<boolean>(isHandsFree);

  isHandsFreeRef.current = isHandsFree;

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopAudioAndRecognition();
    };
  }, []);

  const stopAudioAndRecognition = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {}
      recognitionRef.current = null;
    }
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(track => track.stop());
      micStreamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    isListeningRef.current = false;
    setVoiceState('idle');
  };

  // Start Mic Audio Level Analyser for visualizer
  const initAudioAnalyser = async () => {
    try {
      if (!micStreamRef.current) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        micStreamRef.current = stream;
      }
      
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioCtx;
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      analyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(micStreamRef.current);
      source.connect(analyser);

      const updateLevel = () => {
        if (!analyserRef.current || !isListeningRef.current) {
          setAudioLevel(0);
          return;
        }
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const average = sum / dataArray.length;
        setAudioLevel(average / 128); // 0 to 1+
        animationFrameRef.current = requestAnimationFrame(updateLevel);
      };

      updateLevel();
    } catch (err) {
      console.warn('Microphone stream access not granted for visualizer:', err);
    }
  };

  // Start listening to user voice
  const startListening = async () => {
    // If currently speaking, interrupt it
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please use Google Chrome or Microsoft Edge.');
      return;
    }

    try {
      await initAudioAnalyser();

      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;

      // Match language preference
      if (language === 'french') {
        recognition.lang = 'fr-FR';
      } else if (language === 'tounsi_arabic' || language === 'tounsi_arabizi') {
        recognition.lang = 'ar-TN';
      } else {
        recognition.lang = 'en-US';
      }

      recognition.onstart = () => {
        isListeningRef.current = true;
        setVoiceState('listening');
        setTranscriptDraft('');
      };

      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        const currentText = finalTranscript || interimTranscript;
        setTranscriptDraft(currentText);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error event:', event.error);
        if (event.error === 'no-speech' && isHandsFreeRef.current) {
          // If no speech detected in hands-free mode, re-listen
          setTimeout(() => {
            if (isHandsFreeRef.current && voiceState !== 'speaking' && voiceState !== 'processing') {
              startListening();
            }
          }, 600);
        } else {
          isListeningRef.current = false;
          setVoiceState('idle');
        }
      };

      recognition.onend = () => {
        isListeningRef.current = false;
        // If we captured spoken words, process with Rafiq
        if (transcriptDraft.trim()) {
          handleVoiceInputSubmitted(transcriptDraft.trim());
        } else {
          setVoiceState('idle');
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Failed to start speech recognition:', err);
      isListeningRef.current = false;
      setVoiceState('idle');
    }
  };

  // Stop listening manually
  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
    isListeningRef.current = false;
    if (transcriptDraft.trim()) {
      handleVoiceInputSubmitted(transcriptDraft.trim());
    } else {
      setVoiceState('idle');
    }
  };

  // Toggle Listening
  const toggleListening = () => {
    if (voiceState === 'listening') {
      stopListening();
    } else if (voiceState === 'speaking') {
      // Interrupt speaking
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current = null;
      }
      setVoiceState('idle');
    } else {
      startListening();
    }
  };

  // Process user input -> Gemini Advisor -> TTS Audio
  const handleVoiceInputSubmitted = async (userVoiceText: string) => {
    setVoiceState('processing');
    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: userVoiceText,
      timestamp: Date.now(),
      mode,
      language,
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setTranscriptDraft('');

    try {
      // 1. Get reasoning & advice response
      const response = await sendChatMessage({
        messages: updatedMessages.map(m => ({ role: m.role, content: m.content })),
        mode,
        language,
        userDynamics,
        activeSituation,
      });

      const replyText = response.reply;
      setLastSpokenResponse(replyText);

      // 2. Synthesize audio with Gemini Flash Lite TTS
      setVoiceState('speaking');
      let audioUrl = '';
      try {
        audioUrl = await generateSpeechAudio(replyText, selectedPersona);
      } catch (ttsErr) {
        console.warn('TTS API error, falling back to Web Speech Synthesis:', ttsErr);
      }

      const assistantMessage: Message = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: replyText,
        timestamp: Date.now(),
        mode,
        language,
        analysis: response.analysis,
        audioUrl: audioUrl || null,
      };

      setMessages(prev => [...prev, assistantMessage]);

      // 3. Play audio
      if (audioUrl) {
        const audio = new Audio(audioUrl);
        audio.playbackRate = playbackSpeed;
        currentAudioRef.current = audio;

        audio.onended = () => {
          setVoiceState('idle');
          currentAudioRef.current = null;
          // Continuous Hands-Free Call Mode: Automatically start listening back!
          if (isHandsFreeRef.current) {
            setTimeout(() => {
              if (isHandsFreeRef.current) {
                startListening();
              }
            }, 800);
          }
        };

        audio.onerror = () => {
          playSpeechSynthesisFallback(replyText);
        };

        await audio.play();
      } else {
        // Fallback to speech synthesis
        playSpeechSynthesisFallback(replyText);
      }
    } catch (err: any) {
      console.error('Advisor processing error:', err);
      setVoiceState('idle');
      const errorMsg: Message = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: `Error: ${err.message || 'Unable to connect to the advisor voice stream.'}`,
        timestamp: Date.now(),
        mode,
        language,
      };
      setMessages(prev => [...prev, errorMsg]);
    }
  };

  const playSpeechSynthesisFallback = (text: string) => {
    if (!('speechSynthesis' in window)) {
      setVoiceState('idle');
      return;
    }
    window.speechSynthesis.cancel();
    const clean = text.replace(/[#*`_~[\]()]/g, '').slice(0, 500);
    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.rate = playbackSpeed;
    if (language === 'french') utterance.lang = 'fr-FR';
    else if (language === 'tounsi_arabic') utterance.lang = 'ar-XA';
    else utterance.lang = 'en-US';

    utterance.onend = () => {
      setVoiceState('idle');
      if (isHandsFreeRef.current) {
        setTimeout(() => {
          if (isHandsFreeRef.current) startListening();
        }, 800);
      }
    };
    utterance.onerror = () => {
      setVoiceState('idle');
    };

    setVoiceState('speaking');
    window.speechSynthesis.speak(utterance);
  };

  const handleInterrupt = () => {
    stopAudioAndRecognition();
  };

  const handleAddAction = (actionText: string, key: string) => {
    onAddTask({
      title: actionText,
      domain: activeSituation ? activeSituation.domain : 'personal',
      priority: 'high',
      completed: false,
      dueDate: 'Today',
      relatedSituationId: activeSituation?.id,
    });
    setAddedActionKey(key);
    setTimeout(() => setAddedActionKey(null), 2000);
  };

  const latestAssistantMessage = [...messages].reverse().find(m => m.role === 'assistant');

  const modeData: Record<AdvisorMode, { label: string; icon: any; color: string; desc: string }> = {
    strategic_partner: {
      label: 'Strategic Partner',
      icon: Scale,
      color: 'amber',
      desc: 'Balanced, high-candor guidance & subtext analysis.',
    },
    devils_advocate: {
      label: "Devil's Advocate",
      icon: Flame,
      color: 'rose',
      desc: 'Ruthlessly tests assumptions, finds blindspots, breaks ego.',
    },
    deep_listener: {
      label: 'Deep Listener',
      icon: HeartHandshake,
      color: 'teal',
      desc: 'Empathetic sounding board, unpacks emotional exhaustion.',
    },
    tactical_executor: {
      label: 'Tactical Executor',
      icon: Crosshair,
      color: 'emerald',
      desc: 'Straight to the point: concrete next 3 steps & timelines.',
    },
  };

  return (
    <div className="flex-1 flex flex-col h-screen bg-stone-950 overflow-hidden relative select-none">
      {/* Background ambient lighting */}
      <div 
        className={`absolute inset-0 pointer-events-none transition-all duration-1000 opacity-20 ${
          voiceState === 'listening'
            ? 'bg-gradient-to-t from-emerald-950/40 via-transparent to-stone-950'
            : voiceState === 'speaking'
            ? 'bg-gradient-to-t from-amber-950/40 via-rose-950/20 to-stone-950'
            : voiceState === 'processing'
            ? 'bg-gradient-to-t from-amber-950/50 via-transparent to-stone-950'
            : 'bg-stone-950'
        }`}
      />

      {/* Top Header / Mode & Language bar */}
      <header className="z-10 px-6 py-4 border-b border-stone-800/80 bg-stone-900/60 backdrop-blur-md flex flex-wrap items-center justify-between gap-3">
        {/* Advisor Stance Switcher */}
        <div className="flex items-center gap-1.5 bg-stone-950/80 p-1 rounded-xl border border-stone-800">
          {(Object.keys(modeData) as AdvisorMode[]).map(mKey => {
            const m = modeData[mKey];
            const Icon = m.icon;
            const isSelected = mode === mKey;
            return (
              <button
                key={mKey}
                onClick={() => setMode(mKey)}
                title={m.desc}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  isSelected
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                    : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/40'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-amber-400' : 'text-stone-400'}`} />
                <span className="hidden sm:inline">{m.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right side: Language, Hands-free switch, Voice Settings */}
        <div className="flex items-center gap-2">
          {/* Language Selector */}
          <div className="flex items-center gap-1 bg-stone-950/80 p-1 rounded-xl border border-stone-800 text-xs">
            <button
              onClick={() => setLanguage('auto')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                language === 'auto' ? 'bg-amber-500/20 text-amber-300' : 'text-stone-400 hover:text-stone-200'
              }`}
              title="Automatically detect language & code-switch naturally"
            >
              🌐 Auto
            </button>
            <button
              onClick={() => setLanguage('english')}
              className={`px-2 py-1 rounded-lg font-medium transition-colors ${
                language === 'english' ? 'bg-amber-500/20 text-amber-300' : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              EN
            </button>
            <button
              onClick={() => setLanguage('french')}
              className={`px-2 py-1 rounded-lg font-medium transition-colors ${
                language === 'french' ? 'bg-amber-500/20 text-amber-300' : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              FR
            </button>
            <button
              onClick={() => setLanguage('tounsi_arabizi')}
              className={`px-2 py-1 rounded-lg font-medium transition-colors ${
                language === 'tounsi_arabizi' ? 'bg-amber-500/20 text-amber-300' : 'text-stone-400 hover:text-stone-200'
              }`}
              title="Tunisian Arabic (Arabizi: 3, 7, 9)"
            >
              🇹🇳 Derja
            </button>
            <button
              onClick={() => setLanguage('tounsi_arabic')}
              className={`px-2 py-1 rounded-lg font-medium transition-colors ${
                language === 'tounsi_arabic' ? 'bg-amber-500/20 text-amber-300' : 'text-stone-400 hover:text-stone-200'
              }`}
              title="Tunisian Arabic in Arabic script"
            >
              تونسية
            </button>
          </div>

          {/* Hands-Free Auto-Call Mode Toggle */}
          <button
            onClick={() => setIsHandsFree(!isHandsFree)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
              isHandsFree
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300 shadow-sm'
                : 'bg-stone-900 border-stone-800 text-stone-400 hover:text-stone-200'
            }`}
            title={isHandsFree ? 'Continuous Phone Call: mic re-arms automatically after Rafiq finishes speaking' : 'Push-to-Talk Mode'}
          >
            <Radio className={`w-3.5 h-3.5 ${isHandsFree ? 'animate-pulse text-emerald-400' : ''}`} />
            <span className="hidden md:inline">{isHandsFree ? 'Hands-Free Call: ON' : 'Push-to-Talk'}</span>
          </button>

          {/* Voice Settings Gear */}
          <button
            onClick={() => setShowVoiceSettings(!showVoiceSettings)}
            className={`p-2 rounded-xl border transition-colors ${
              showVoiceSettings
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                : 'bg-stone-900 border-stone-800 text-stone-400 hover:text-stone-200'
            }`}
            title="Voice Persona & Audio Speed"
          >
            <Sliders className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Voice Settings Popover */}
      {showVoiceSettings && (
        <div className="z-20 bg-stone-900/95 border-b border-stone-800 px-6 py-4 backdrop-blur-md flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-4">
            <div>
              <span className="text-stone-400 font-semibold uppercase text-[10px] block mb-1">
                Voice Persona
              </span>
              <div className="flex items-center gap-1.5">
                {(['Fenrir', 'Zephyr', 'Puck', 'Kore'] as VoicePersona[]).map(persona => (
                  <button
                    key={persona}
                    onClick={() => setSelectedPersona(persona)}
                    className={`px-3 py-1 rounded-lg border font-medium transition-all ${
                      selectedPersona === persona
                        ? 'bg-amber-500/20 border-amber-500/40 text-amber-200'
                        : 'bg-stone-950 border-stone-800 text-stone-400 hover:border-stone-700'
                    }`}
                  >
                    {persona}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="text-stone-400 font-semibold uppercase text-[10px] block mb-1">
                Playback Speed
              </span>
              <div className="flex items-center gap-1.5">
                {[0.9, 1.0, 1.15].map(spd => (
                  <button
                    key={spd}
                    onClick={() => setPlaybackSpeed(spd)}
                    className={`px-2.5 py-1 rounded-lg border font-mono transition-all ${
                      playbackSpeed === spd
                        ? 'bg-amber-500/20 border-amber-500/40 text-amber-200'
                        : 'bg-stone-950 border-stone-800 text-stone-400 hover:border-stone-700'
                    }`}
                  >
                    {spd}x
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={openGuideModal}
            className="flex items-center gap-1.5 text-xs text-amber-400 hover:underline font-medium"
          >
            <Languages className="w-3.5 h-3.5" />
            <span>View Trilingual & Derja Phrasebook</span>
          </button>
        </div>
      )}

      {/* Linked Active Situation Banner */}
      {activeSituation && (
        <div className="z-10 bg-amber-950/40 border-b border-amber-500/30 px-6 py-2 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="px-2 py-0.5 rounded font-bold uppercase text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Focus: {activeSituation.domain}
            </span>
            <span className="font-semibold text-amber-100 truncate">
              {activeSituation.title}
            </span>
          </div>
          <button
            onClick={() => setActiveSituationId(null)}
            className="text-stone-400 hover:text-stone-200 text-xs"
          >
            ✕ Unpin
          </button>
        </div>
      )}

      {/* Center Stage: The Interactive Voice Orb & Live Waveform */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 relative z-10">
        {/* Animated Soundwave & Status Label */}
        <div className="flex flex-col items-center mb-8 space-y-2">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-stone-900/90 border border-stone-800 text-xs font-semibold shadow-inner">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                voiceState === 'listening'
                  ? 'bg-emerald-400 animate-ping'
                  : voiceState === 'speaking'
                  ? 'bg-amber-400 animate-pulse'
                  : voiceState === 'processing'
                  ? 'bg-purple-400 animate-bounce'
                  : 'bg-stone-600'
              }`}
            />
            <span className="text-stone-300 uppercase tracking-wider text-[11px]">
              {voiceState === 'listening'
                ? 'Rafiq is Listening to you...'
                : voiceState === 'speaking'
                ? `Rafiq is Speaking (${selectedPersona})...`
                : voiceState === 'processing'
                ? 'Dissecting dynamics & blindspots...'
                : 'Rafiq is Ready • Tap Orb or Spacebar to Talk'}
            </span>
          </div>

          <p className="text-xs text-stone-500 text-center max-w-sm">
            {voiceState === 'listening'
              ? 'Speak naturally in English, French, or Tunisian Derja.'
              : voiceState === 'speaking'
              ? 'Tap orb anytime to interrupt or ask a follow-up.'
              : isHandsFree
              ? 'Continuous hands-free conversation mode active. Talk anytime.'
              : 'Tap to speak your mind. No topic is off-limits.'}
          </p>
        </div>

        {/* The Voice Orb Button */}
        <div className="relative flex items-center justify-center my-4">
          {/* Outer Ripple Rings for Listening */}
          {voiceState === 'listening' && (
            <>
              <div 
                className="absolute rounded-full border border-emerald-500/30 animate-ping pointer-events-none"
                style={{
                  width: `${190 + audioLevel * 100}px`,
                  height: `${190 + audioLevel * 100}px`,
                  animationDuration: '1.8s',
                }}
              />
              <div 
                className="absolute rounded-full border border-emerald-400/20 pointer-events-none"
                style={{
                  width: `${240 + audioLevel * 120}px`,
                  height: `${240 + audioLevel * 120}px`,
                }}
              />
            </>
          )}

          {/* Outer Waves for Speaking */}
          {voiceState === 'speaking' && (
            <>
              <div className="absolute w-64 h-64 rounded-full border border-amber-500/20 animate-pulse pointer-events-none" />
              <div className="absolute w-80 h-80 rounded-full border border-rose-500/10 pointer-events-none" />
            </>
          )}

          {/* Central Glowing Orb */}
          <button
            onClick={toggleListening}
            className={`w-44 h-44 rounded-full flex flex-col items-center justify-center relative cursor-pointer transition-all duration-300 shadow-2xl focus:outline-none group select-none ${
              voiceState === 'listening'
                ? 'bg-gradient-to-tr from-emerald-600 via-teal-500 to-emerald-400 shadow-emerald-500/40 ring-4 ring-emerald-400/30 scale-105'
                : voiceState === 'speaking'
                ? 'bg-gradient-to-tr from-rose-600 via-amber-500 to-amber-300 shadow-amber-500/40 ring-4 ring-amber-400/30 scale-105 animate-pulse'
                : voiceState === 'processing'
                ? 'bg-gradient-to-tr from-purple-700 via-amber-600 to-rose-500 shadow-purple-500/40 ring-4 ring-purple-400/20 animate-spin-slow'
                : 'bg-gradient-to-tr from-stone-900 via-stone-800 to-stone-700 border-2 border-stone-700 shadow-black/80 hover:scale-102 hover:border-amber-500/50'
            }`}
          >
            <div className="flex flex-col items-center justify-center text-center p-4">
              {voiceState === 'listening' ? (
                <>
                  <Mic className="w-12 h-12 text-white animate-pulse mb-1" />
                  <span className="text-[11px] font-bold text-white tracking-wider uppercase">Listening</span>
                </>
              ) : voiceState === 'speaking' ? (
                <>
                  <Volume2 className="w-12 h-12 text-white animate-bounce mb-1" />
                  <span className="text-[11px] font-bold text-white tracking-wider uppercase">Speaking</span>
                </>
              ) : voiceState === 'processing' ? (
                <>
                  <Sparkles className="w-12 h-12 text-amber-200 animate-spin mb-1" />
                  <span className="text-[11px] font-bold text-amber-100 tracking-wider uppercase">Reasoning</span>
                </>
              ) : (
                <>
                  <Mic className="w-12 h-12 text-amber-400 group-hover:scale-110 transition-transform mb-1" />
                  <span className="text-[11px] font-bold text-stone-200 tracking-wider uppercase">Tap to Speak</span>
                  <span className="text-[10px] text-stone-400 font-mono mt-0.5">رفيق</span>
                </>
              )}
            </div>
          </button>
        </div>

        {/* Live Subtitle Ticker / Caption Stream */}
        <div className="w-full max-w-2xl mt-6 px-4">
          {voiceState === 'listening' && transcriptDraft && (
            <div className="p-4 rounded-2xl bg-stone-900/90 border border-emerald-500/40 shadow-xl text-center animate-fade-in">
              <span className="text-[10px] text-emerald-400 uppercase font-mono font-semibold block mb-1">
                You are saying:
              </span>
              <p className="text-sm font-medium text-stone-100 leading-relaxed italic">
                "{transcriptDraft}"
              </p>
            </div>
          )}

          {voiceState === 'speaking' && lastSpokenResponse && (
            <div className="p-4 rounded-2xl bg-stone-900/90 border border-amber-500/40 shadow-xl text-center animate-fade-in max-h-36 overflow-y-auto">
              <span className="text-[10px] text-amber-400 uppercase font-mono font-semibold block mb-1">
                Rafiq is advising:
              </span>
              <p className="text-sm text-stone-100 leading-relaxed font-medium">
                {lastSpokenResponse.slice(0, 320)}...
              </p>
            </div>
          )}

          {voiceState === 'idle' && latestAssistantMessage && (
            <div className="p-3.5 rounded-2xl bg-stone-900/60 border border-stone-800/80 text-center">
              <span className="text-[10px] text-stone-500 uppercase font-mono font-semibold block mb-0.5">
                Last Exchange
              </span>
              <p className="text-xs text-stone-300 leading-relaxed line-clamp-2">
                {latestAssistantMessage.content.replace(/[#*`_~[\]()]/g, '')}
              </p>
            </div>
          )}
        </div>

        {/* Audio Action Buttons Below Orb */}
        <div className="flex items-center gap-3 mt-6">
          {/* Interrupt Button (When speaking) */}
          {voiceState === 'speaking' && (
            <button
              onClick={handleInterrupt}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 text-white font-semibold text-xs shadow-lg shadow-rose-600/30 hover:bg-rose-500 transition-all"
            >
              <VolumeX className="w-4 h-4" />
              <span>Interrupt / Stop</span>
            </button>
          )}

          {/* Quick Sparring Prompts (Voice Starters) */}
          {voiceState === 'idle' && (
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                onClick={() => handleVoiceInputSubmitted("Challenge my perspective on this. Tell me where I might be fooling myself.")}
                className="px-3 py-1.5 rounded-full bg-stone-900 border border-stone-800 text-stone-300 hover:border-amber-500/40 hover:text-stone-100 text-xs transition-all"
              >
                🔥 Challenge my perspective
              </button>
              <button
                onClick={() => handleVoiceInputSubmitted("What are the hidden power & social dynamics here? Read between the lines.")}
                className="px-3 py-1.5 rounded-full bg-stone-900 border border-stone-800 text-stone-300 hover:border-amber-500/40 hover:text-stone-100 text-xs transition-all"
              >
                🔍 Unspoken dynamics & leverage
              </button>
              <button
                onClick={() => handleVoiceInputSubmitted("A3tini rayek b'tounsi ya sahbi, 7otli el s7i7 fi wejhi.")}
                className="px-3 py-1.5 rounded-full bg-stone-900 border border-stone-800 text-stone-300 hover:border-amber-500/40 hover:text-stone-100 text-xs transition-all"
              >
                🇹🇳 Real talk b'Tounsi
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Floating Live Dynamics & Tasks Drawer Toggle */}
      <div className="border-t border-stone-800 bg-stone-900/80 backdrop-blur-md px-6 py-3 flex items-center justify-between text-xs z-10">
        <div className="flex items-center gap-2">
          <AudioWaveform className="w-4 h-4 text-amber-400" />
          <span className="text-stone-300 font-semibold">Voice Advisor Session</span>
          <span className="text-stone-500 hidden sm:inline">• {messages.length} exchanges recorded</span>
        </div>

        <button
          onClick={() => setShowTranscriptDrawer(!showTranscriptDrawer)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-800/80 hover:bg-stone-700/80 text-stone-200 font-medium transition-all"
        >
          <span>{showTranscriptDrawer ? 'Hide Transcript & Reality Checks' : 'View Spoken Insights & Actions'}</span>
          {showTranscriptDrawer ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Spoken Insights & Dynamics Drawer */}
      {showTranscriptDrawer && (
        <div className="h-80 border-t border-stone-800 bg-stone-950/95 overflow-y-auto p-6 z-20 space-y-4">
          <div className="max-w-4xl mx-auto space-y-4">
            <h3 className="font-bold text-stone-100 text-sm flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <span>Extracted Dynamics & Spoken Log</span>
            </h3>

            {/* Latest Reality Check HUD */}
            {latestAssistantMessage?.analysis?.realityCheck && (
              <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-500/30 text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-amber-300">
                  <span>🚨 Reality Check / Unspoken Truth</span>
                </div>
                <p className="text-stone-200 leading-relaxed font-medium">
                  {latestAssistantMessage.analysis.realityCheck}
                </p>
              </div>
            )}

            {/* Suggested Actions with quick add */}
            {latestAssistantMessage?.analysis?.suggestedActions && (
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider block">
                  Actionable Steps from Voice Session (Click + to save to daily plan):
                </span>
                {latestAssistantMessage.analysis.suggestedActions.map((action, idx) => {
                  const key = `action-${idx}`;
                  const isAdded = addedActionKey === key;
                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-stone-900 border border-stone-800 text-xs text-stone-200"
                    >
                      <span>{action}</span>
                      <button
                        onClick={() => handleAddAction(action, key)}
                        className={`p-1.5 rounded-md transition-all shrink-0 ${
                          isAdded ? 'bg-emerald-500/20 text-emerald-300' : 'bg-stone-800 text-stone-400 hover:text-amber-300'
                        }`}
                        title="Add to Daily Execution Tasks"
                      >
                        {isAdded ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Plus className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Full Conversation Transcript History */}
            <div className="space-y-3 pt-3 border-t border-stone-800">
              <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider block">
                Session Transcript
              </span>
              {messages.slice(-6).map(m => (
                <div
                  key={m.id}
                  className={`p-3 rounded-xl text-xs ${
                    m.role === 'assistant'
                      ? 'bg-stone-900/80 border border-stone-800 text-stone-200'
                      : 'bg-amber-950/20 border border-amber-500/30 text-amber-100'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1 text-[10px] text-stone-400">
                    <span className="font-semibold">{m.role === 'assistant' ? 'Rafiq' : 'You'}</span>
                    <span>{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <p className="leading-relaxed whitespace-pre-wrap">{m.content}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
