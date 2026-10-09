export type LanguageMode = 'auto' | 'english' | 'french' | 'tounsi_arabizi' | 'tounsi_arabic';

export type AdvisorMode = 'strategic_partner' | 'devils_advocate' | 'deep_listener' | 'tactical_executor';

export type VoicePersona = 'Fenrir' | 'Zephyr' | 'Puck' | 'Kore' | 'Charon';

export type VoiceState = 'idle' | 'listening' | 'processing' | 'speaking';

export type VoiceSessionMode = 'continuous_call' | 'push_to_talk' | 'voice_note';

export type DomainType = 'school' | 'job' | 'social' | 'personal';

export interface UserDynamicsProfile {
  name: string;
  currentFocus: string;
  blindspots: string;
  candorLevel: 'candid_uncut' | 'strategic_balanced' | 'gentle_grounded';
  preferredLanguage: LanguageMode;
  notes: string;
}

export interface AnalysisPayload {
  realityCheck?: string;
  situationDynamics?: string;
  suggestedActions?: string[];
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  mode?: AdvisorMode;
  language?: LanguageMode;
  analysis?: AnalysisPayload | null;
  audioUrl?: string | null;
  audioDuration?: number;
}

export interface Situation {
  id: string;
  title: string;
  domain: DomainType;
  summary: string;
  dilemma: string;
  stakes: string;
  status: 'active' | 'in_progress' | 'resolved';
  deepDiveAnalysis?: string;
  updatedAt: number;
}

export interface ActionTask {
  id: string;
  title: string;
  domain: DomainType;
  priority: 'high' | 'medium' | 'low';
  completed: boolean;
  dueDate?: string;
  relatedSituationId?: string;
}

