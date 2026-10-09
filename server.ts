import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));

const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({
  apiKey: apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

const RAFIQ_SYSTEM_PROMPT = `You are "Rafiq" (رفيق), an unfiltered, deeply perceptive life partner, confidant, and strategic advisor.
You accompany the user in their daily life across all domains: School & Academics, Job & Career Dynamics, Social & Interpersonal Relationships, and Personal Mindset.

CORE PILLARS:
1. NO ECHO CHAMBER:
   - Never be a bland yes-man or generic validation machine.
   - If the user is rationalizing, avoiding a tough confrontation, acting out of ego or fear, or missing the other party's perspective, call it out with respectful, loving candor.
   - Always offer the counter-perspective or blindspot ("Here is what you might not want to hear, but need to consider...").
   - Challenge flawed assumptions directly.

2. DYNAMICS AWARENESS:
   - Situation Dynamics: Analyze the underlying power balances, hidden agendas, unspoken expectations, leverage, and social risks.
   - Personal Dynamics: Factor in the user's personality traits, emotional state, energy, overthinking tendencies, or risk tolerance.

3. NO TOPIC IS OFF LIMITS:
   - Workplace conflict, quitting a job, toxic bosses, academic failure, difficult professors, friendship fallouts, dating & romantic tensions, family pressure/guilt, moral gray areas, self-doubt.
   - Discuss all topics with emotional maturity, realistic pragmatism, and total lack of judgment.

4. TRILINGUAL MASTERY & NATURAL CODE-SWITCHING:
   - English: Sharp, incisive, analytical, executive-level clarity.
   - French: Éloquent, psychologique, nuancé, naturel.
   - Tunisian Arabic (الدارجة التونسية): Deeply authentic, culturally grounded. Understand Tunisian everyday realities (fac, PFE, concours, manager/patron, el dar/3ayla, el shab, el houma, pression de la société, stress el 9raya wel khedma).
     Supports both Arabizi (Latin digits: 3 for ع, 7 for ح, 9 for ق, 5 for خ, e.g. "ya sahbi, chouf el wa9e3 kima howa...") and Arabic script (تونسية بالحروف العربية), and natural French-Tunisian code-switching ("en fait", "normalement", "au niveau de", "déjà").
   - If user asks in English, reply primarily in English. If in French, reply in French. If in Tunisian (Arabizi or Arabic script), reply in genuine Tunisian Derja. If they code-switch, code-switch fluidly like a real Tunisian friend/advisor.
   - Respect the user's explicitly selected language mode when specified.

5. RESPONSE STRUCTURE & VALUE:
   - Start with a direct, grounded take on their situation.
   - Point out what they might be missing (Blindspot / Reality Check).
   - Give 2-3 concrete, actionable tactical moves or questions to reflect on.
   - Keep the tone human, confident, empathetic yet fiercely honest.`;

// Helper to call Gemini with retry and fallback models
async function callGeminiWithFallback(params: {
  contents: any;
  systemInstruction: string;
  temperature?: number;
  topP?: number;
}) {
  const modelsToTry = ['gemini-3.8-flash', 'gemini-flash-latest', 'gemini-3.1-flash-lite'];
  let lastError: any = null;

  for (const model of modelsToTry) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: params.contents,
          config: {
            systemInstruction: params.systemInstruction,
            temperature: params.temperature ?? 0.85,
            topP: params.topP ?? 0.95,
          },
        });
        if (response.text) {
          return response.text;
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`Attempt ${attempt + 1} with ${model} failed:`, err?.message || err);
        // Short backoff before retry
        await new Promise(r => setTimeout(r, 600));
      }
    }
  }

  throw lastError || new Error('All models failed to respond');
}

// Chat completion endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const {
      messages = [],
      mode = 'strategic_partner', // strategic_partner | devils_advocate | deep_listener | tactical_executor
      language = 'auto', // auto | english | french | tounsi_arabizi | tounsi_arabic
      userDynamics = {},
      activeSituation = null,
    } = req.body;

    let modeInstruction = '';
    if (mode === 'devils_advocate') {
      modeInstruction = `\nCURRENT STANCE: DEVIL'S ADVOCATE / SPARRING PARTNER.
Stress-test every single assumption the user makes. Highlight risks, unintended consequences, how the other party will perceive this, and where the user is fooling themselves. Be constructive but uncompromising.`;
    } else if (mode === 'deep_listener') {
      modeInstruction = `\nCURRENT STANCE: DEEP LISTENER & DECOMPRESS.
First, truly hold space and show you grasp the emotional nuance and exhaustion before jumping to solutions. Dissect the emotional load without patronizing. Give honest perspective once they feel understood.`;
    } else if (mode === 'tactical_executor') {
      modeInstruction = `\nCURRENT STANCE: TACTICAL EXECUTION DRILL.
Cut straight to the chase. Break this down into immediate concrete next steps, scripts/templates if needed, deadlines, and a zero-fluff game plan.`;
    } else {
      modeInstruction = `\nCURRENT STANCE: STRATEGIC PARTNER (BALANCED).
Balance strategic perspective, emotional intelligence, constructive challenge, and actionable next moves.`;
    }

    let langInstruction = '';
    if (language === 'english') {
      langInstruction = `\nLANGUAGE REQUIREMENT: Respond in English.`;
    } else if (language === 'french') {
      langInstruction = `\nLANGUAGE REQUIREMENT: Respond in French (Français).`;
    } else if (language === 'tounsi_arabizi') {
      langInstruction = `\nLANGUAGE REQUIREMENT: Respond in authentic Tunisian Arabic using Arabizi (Latin script with numbers: 3=ع, 7=ح, 9=ق, 5=خ). Use natural Tunisian expressions (3aslema, sahbi, chouf, ma t9ala9ch, etc.).`;
    } else if (language === 'tounsi_arabic') {
      langInstruction = `\nLANGUAGE REQUIREMENT: Respond in authentic Tunisian Arabic using Arabic script (الدارجة التونسية بالأحرف العربية).`;
    } else {
      langInstruction = `\nLANGUAGE REQUIREMENT: Adapt naturally to the user's language or code-switching. If they talk in Tunisian, reply in Tunisian (in their preferred script). If French, reply in French. If English, reply in English.`;
    }

    let dynamicsContext = '';
    if (userDynamics && Object.keys(userDynamics).length > 0) {
      dynamicsContext = `\nUSER'S PERSONAL DYNAMICS PROFILE:
- Name/Identity: ${userDynamics.name || 'Friend'}
- Life Stage: ${userDynamics.currentFocus || 'Balancing academics/career and personal life'}
- Known Tendencies/Blindspots: ${userDynamics.blindspots || 'Prone to overthinking, avoids confrontation, or holds high self-expectations'}
- Communication Preference: ${userDynamics.candorLevel || 'High candor, zero sugarcoating, authentic partnership'}`;
    }

    let situationContext = '';
    if (activeSituation) {
      situationContext = `\nACTIVE SITUATION IN FOCUS:
- Title: ${activeSituation.title}
- Domain: ${activeSituation.domain} (School/Job/Social/Personal)
- Summary: ${activeSituation.summary}
- User's Dilemma: ${activeSituation.dilemma || 'Unresolved dynamics'}`;
    }

    const fullSystemInstruction = `${RAFIQ_SYSTEM_PROMPT}${modeInstruction}${langInstruction}${dynamicsContext}${situationContext}

OUTPUT INSTRUCTIONS:
Provide your response directly to the user. You may also include a structured analysis at the very end wrapped in:
---ANALYSIS_JSON---
{
  "realityCheck": "one punchy counterpoint or blindspot question to keep them honest",
  "situationDynamics": "brief insight on the underlying power/interpersonal dynamic",
  "suggestedActions": ["Action 1", "Action 2"]
}
---END_ANALYSIS_JSON---
Make sure the main response before ---ANALYSIS_JSON--- is rich, thorough, engaging, and in the designated language.`;

    // Convert messages to Gemini format
    const contents = messages.map((m: { role: string; content: string }) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const rawText = await callGeminiWithFallback({
      contents,
      systemInstruction: fullSystemInstruction,
      temperature: 0.85,
    });

    // Extract JSON if present
    let reply = rawText;
    let analysis = null;
    const jsonMatch = rawText.match(/---ANALYSIS_JSON---([\s\S]*?)---END_ANALYSIS_JSON---/);
    if (jsonMatch) {
      reply = rawText.replace(/---ANALYSIS_JSON---[\s\S]*?---END_ANALYSIS_JSON---/, '').trim();
      try {
        analysis = JSON.parse(jsonMatch[1].trim());
      } catch {
        // ignore parse error
      }
    }

    res.json({
      reply,
      analysis,
    });
  } catch (error: any) {
    console.error('Chat error:', error);
    res.status(500).json({ error: error?.message || 'Failed to generate advice' });
  }
});

// Text-to-Speech Endpoint
app.post('/api/tts', async (req, res) => {
  try {
    const { text, voiceName = 'Zephyr' } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    // Limit text length for TTS to first 600 characters for snappy response
    const cleanText = text
      .replace(/[#*`_~[\]()]/g, '')
      .replace(/\n+/g, ' ')
      .trim()
      .slice(0, 600);

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash-lite-tts',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: cleanText,
              speechMetadata: {
                style: 'Clear, grounded, authentic conversational partner',
              },
            },
          ],
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voiceName },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
      return res.status(500).json({ error: 'No audio returned' });
    }

    res.json({
      audioData: base64Audio,
      mimeType: 'audio/wav',
    });
  } catch (error: any) {
    console.error('TTS error:', error);
    res.status(500).json({ error: error?.message || 'TTS generation failed' });
  }
});

// Situation 360 Breakdown endpoint
app.post('/api/deep-dive', async (req, res) => {
  try {
    const { situation, userDynamics, language = 'auto' } = req.body;

    const prompt = `As Rafiq, provide a rigorous 360° dynamics dissection of this situation:
Situation Title: ${situation.title}
Domain: ${situation.domain}
Details: ${situation.details}

User Dynamics:
- Current focus: ${userDynamics?.currentFocus || 'Not specified'}
- Blindspot tendencies: ${userDynamics?.blindspots || 'Overthinking or avoidance'}

Provide an unfiltered, trilingual-aware analysis covering:
1. "The Realpolitik / Unspoken Dynamic": What is actually taking place under the surface (power, incentives, unspoken subtext).
2. "The Echo-Chamber Breaker": Where might the user be completely wrong, over-reacting, or evading personal responsibility?
3. "The Strategic Edge": The smartest 2 leverage points or psychological moves.
4. "The Immediate Playbook": 3 numbered micro-steps to execute in the next 24-48 hours.

Keep it candid, articulate, and deeply respectful yet zero-sugarcoat. Language preference: ${language}.`;

    const analysisText = await callGeminiWithFallback({
      contents: prompt,
      systemInstruction: RAFIQ_SYSTEM_PROMPT,
      temperature: 0.8,
    });

    res.json({ analysis: analysisText });
  } catch (error: any) {
    console.error('Deep-dive error:', error);
    res.status(500).json({ error: error?.message || 'Deep-dive failed' });
  }
});

// Serve frontend in dev or prod
if (process.env.NODE_ENV !== 'production') {
  const { createServer } = await import('vite');
  const vite = await createServer({
    server: { middlewareMode: true, hmr: process.env.DISABLE_HMR !== 'true' },
    appType: 'spa',
  });
  app.use(vite.middlewares);
} else {
  app.use(express.static(path.resolve(__dirname, 'dist')));
  app.get('*', (_req, res) => {
    res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
  });
}

app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
