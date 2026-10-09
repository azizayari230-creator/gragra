import { LanguageMode, AdvisorMode, UserDynamicsProfile, Situation, AnalysisPayload } from '../types';

export interface ChatResponse {
  reply: string;
  analysis?: AnalysisPayload | null;
}

export async function sendChatMessage(params: {
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  mode: AdvisorMode;
  language: LanguageMode;
  userDynamics: UserDynamicsProfile;
  activeSituation?: Situation | null;
}): Promise<ChatResponse> {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error ${response.status}`);
  }

  return response.json();
}

export async function generateSpeechAudio(text: string, voiceName: string = 'Fenrir'): Promise<string> {
  const response = await fetch('/api/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, voiceName }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `TTS HTTP error ${response.status}`);
  }

  const data = await response.json();
  return `data:audio/wav;base64,${data.audioData}`;
}

export async function requestDeepDive(params: {
  situation: { title: string; domain: string; details: string };
  userDynamics: UserDynamicsProfile;
  language?: LanguageMode;
}): Promise<string> {
  const response = await fetch('/api/deep-dive', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Deep Dive error ${response.status}`);
  }

  const data = await response.json();
  return data.analysis;
}
