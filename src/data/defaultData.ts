import { UserDynamicsProfile, Situation, ActionTask, Message } from '../types';

export const DEFAULT_USER_DYNAMICS: UserDynamicsProfile = {
  name: 'Aziz',
  currentFocus: 'Managing school deliverables & professional career growth, while maintaining honest interpersonal relationships',
  blindspots: 'Overthinking tough confrontations, waiting for the "perfect moment" to act, taking on too much alone',
  candorLevel: 'candid_uncut',
  preferredLanguage: 'auto',
  notes: 'Values honesty over flattery. Needs a real partner who reads between the lines and points out what others are too polite to say.',
};

export const DEFAULT_SITUATIONS: Situation[] = [
  {
    id: 'sit-1',
    title: 'Workplace Politics: Colleague Taking Project Credit',
    domain: 'job',
    summary: 'A peer in a cross-functional sprint took credit for architecture decisions I spent weekends building during the client demo.',
    dilemma: 'Should I call them out in the next retrospective, go straight to the team lead, or set up a 1-on-1 first?',
    stakes: 'Visibility for upcoming promotion review vs risk of being perceived as petty or defensive.',
    status: 'active',
    updatedAt: Date.now() - 1000 * 60 * 60 * 4,
  },
  {
    id: 'sit-2',
    title: 'Academic Deadline: High-Stakes Project Bottleneck',
    domain: 'school',
    summary: 'Group members are ghosting deliverables 10 days before final jury submission while the professor has rigid grading criteria.',
    dilemma: 'Do I finish their parts secretly to ensure a top grade, or confront the professor and risk group drama?',
    stakes: 'Final grade impact vs carrying dead weight and burning out.',
    status: 'active',
    updatedAt: Date.now() - 1000 * 60 * 60 * 24,
  },
  {
    id: 'sit-3',
    title: 'Social Circle: Setting Boundaries with Childhood Friends',
    domain: 'social',
    summary: 'Friends guilt-trip me whenever I prioritize work or studying over daily hangout sessions at the café.',
    dilemma: 'How to communicate personal ambition without sounding arrogant or creating emotional distance.',
    stakes: 'Preserving genuine loyalty while protecting focus and time.',
    status: 'in_progress',
    updatedAt: Date.now() - 1000 * 60 * 60 * 48,
  },
];

export const DEFAULT_TASKS: ActionTask[] = [
  {
    id: 'task-1',
    title: 'Draft a calm, factual 1-on-1 agenda for meeting with the colleague regarding project ownership',
    domain: 'job',
    priority: 'high',
    completed: false,
    dueDate: 'Today',
    relatedSituationId: 'sit-1',
  },
  {
    id: 'task-2',
    title: 'Set hard 48h deadline checkpoint for academic group teammates before taking executive control',
    domain: 'school',
    priority: 'high',
    completed: false,
    dueDate: 'Tomorrow',
    relatedSituationId: 'sit-2',
  },
  {
    id: 'task-3',
    title: 'Send proactive, warm message to friends scheduling a dedicated weekend hangout to balance presence',
    domain: 'social',
    priority: 'medium',
    completed: false,
    dueDate: 'Friday',
    relatedSituationId: 'sit-3',
  },
];

export const INITIAL_MESSAGES: Message[] = [
  {
    id: 'msg-welcome',
    role: 'assistant',
    content: `**Mar7ba bik ya sahbi. Welcome. Bienvenue.**

I am **Rafiq (رفيق)** — your life partner and strategic advisor.

Here is the pact between us:
1. **No Echo Chamber**: I will never feed you cheap validation. If you're rationalizing a bad decision, avoiding a hard truth, or being unfair to someone, I will call it out directly.
2. **Dynamics Over Surface**: Every situation has hidden incentives, power balances, and emotional undercurrents. We dissect both what's happening around you and your own personal blind spots.
3. **No Topic Off Limits**: School stress, workplace sabotage, career pivots, dating dilemmas, friendship loyalty tests, family weight, taboo anxieties — we handle everything with maturity and zero judgment.
4. **Trilingual & Code-Switching**: English, Français, or Tunisian Derja (عربية تونسية / Arabizi: 3, 7, 9) — speak to me however you think.

*Chnouwa el mawdhou3 el youm?* What's on your mind right now?`,
    timestamp: Date.now() - 1000 * 60 * 5,
    mode: 'strategic_partner',
    language: 'auto',
    analysis: {
      realityCheck: "The biggest risk is rarely the external difficulty; it's the story we tell ourselves to avoid taking action.",
      situationDynamics: "Ready to analyze any active dilemma across School, Job, Social, and Personal life.",
      suggestedActions: [
        "Select a stance: Strategic Partner, Devil's Advocate, Deep Listener, or Tactical Executor",
        "Test talking in English, Français, or Tounsi Derja",
        "Open 'The Situation Room' to track an ongoing challenge"
      ],
    },
  },
];
