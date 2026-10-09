/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { VoiceSpace } from './components/VoiceSpace';
import { ChatView } from './components/ChatView';
import { SituationsView } from './components/SituationsView';
import { TasksView } from './components/TasksView';
import { DynamicsModal } from './components/DynamicsModal';
import { TrilingualGuideModal } from './components/TrilingualGuideModal';
import { 
  AdvisorMode, 
  LanguageMode, 
  UserDynamicsProfile, 
  Situation, 
  ActionTask, 
  Message 
} from './types';
import { 
  DEFAULT_USER_DYNAMICS, 
  DEFAULT_SITUATIONS, 
  DEFAULT_TASKS, 
  INITIAL_MESSAGES 
} from './data/defaultData';

export default function App() {
  const [activeTab, setActiveTab] = useState<'voice' | 'chat' | 'situations' | 'tasks'>('voice');
  const [mode, setMode] = useState<AdvisorMode>('strategic_partner');
  const [language, setLanguage] = useState<LanguageMode>('auto');

  // Load from localStorage or use defaults
  const [userDynamics, setUserDynamics] = useState<UserDynamicsProfile>(() => {
    try {
      const saved = localStorage.getItem('rafiq_user_dynamics');
      return saved ? JSON.parse(saved) : DEFAULT_USER_DYNAMICS;
    } catch {
      return DEFAULT_USER_DYNAMICS;
    }
  });

  const [situations, setSituations] = useState<Situation[]>(() => {
    try {
      const saved = localStorage.getItem('rafiq_situations');
      return saved ? JSON.parse(saved) : DEFAULT_SITUATIONS;
    } catch {
      return DEFAULT_SITUATIONS;
    }
  });

  const [tasks, setTasks] = useState<ActionTask[]>(() => {
    try {
      const saved = localStorage.getItem('rafiq_tasks');
      return saved ? JSON.parse(saved) : DEFAULT_TASKS;
    } catch {
      return DEFAULT_TASKS;
    }
  });

  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const saved = localStorage.getItem('rafiq_messages');
      return saved ? JSON.parse(saved) : INITIAL_MESSAGES;
    } catch {
      return INITIAL_MESSAGES;
    }
  });

  const [activeSituationId, setActiveSituationId] = useState<string | null>(null);
  const [isDynamicsModalOpen, setIsDynamicsModalOpen] = useState(false);
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);

  // Sync state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('rafiq_user_dynamics', JSON.stringify(userDynamics));
    } catch {}
  }, [userDynamics]);

  useEffect(() => {
    try {
      localStorage.setItem('rafiq_situations', JSON.stringify(situations));
    } catch {}
  }, [situations]);

  useEffect(() => {
    try {
      localStorage.setItem('rafiq_tasks', JSON.stringify(tasks));
    } catch {}
  }, [tasks]);

  useEffect(() => {
    try {
      localStorage.setItem('rafiq_messages', JSON.stringify(messages));
    } catch {}
  }, [messages]);

  const activeSituation = situations.find(s => s.id === activeSituationId) || null;

  const handleAddTask = (taskData: Omit<ActionTask, 'id'>) => {
    const newTask: ActionTask = {
      ...taskData,
      id: `task-${Date.now()}`,
    };
    setTasks(prev => [newTask, ...prev]);
  };

  const handleDiscussInChat = (situation: Situation) => {
    setActiveSituationId(situation.id);
    setActiveTab('chat');
  };

  const handleSelectPrompt = (prompt: string, selectedLang: LanguageMode) => {
    setLanguage(selectedLang);
    setActiveTab('chat');
    // We add user prompt into messages & trigger chat
    const userMsg: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: prompt,
      timestamp: Date.now(),
      mode,
      language: selectedLang,
    };
    setMessages(prev => [...prev, userMsg]);

    // Send to backend
    (async () => {
      try {
        const { sendChatMessage } = await import('./services/api');
        const response = await sendChatMessage({
          messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.content })),
          mode,
          language: selectedLang,
          userDynamics,
          activeSituation,
        });

        const assistantMsg: Message = {
          id: `msg-${Date.now() + 1}`,
          role: 'assistant',
          content: response.reply,
          timestamp: Date.now(),
          mode,
          language: selectedLang,
          analysis: response.analysis,
        };
        setMessages(prev => [...prev, assistantMsg]);
      } catch (err: any) {
        console.error('Failed to trigger prompt:', err);
      }
    })();
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-stone-950 text-stone-100 font-sans antialiased">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        mode={mode}
        setMode={setMode}
        language={language}
        setLanguage={setLanguage}
        userDynamics={userDynamics}
        openDynamicsModal={() => setIsDynamicsModalOpen(true)}
        openGuideModal={() => setIsGuideModalOpen(true)}
        situations={situations}
        activeSituationId={activeSituationId}
        setActiveSituationId={setActiveSituationId}
        taskCount={tasks.filter(t => !t.completed).length}
      />

      {/* Main View Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {activeTab === 'voice' && (
          <VoiceSpace
            messages={messages}
            setMessages={setMessages}
            mode={mode}
            setMode={setMode}
            language={language}
            setLanguage={setLanguage}
            userDynamics={userDynamics}
            activeSituation={activeSituation}
            setActiveSituationId={setActiveSituationId}
            onAddTask={handleAddTask}
            openGuideModal={() => setIsGuideModalOpen(true)}
          />
        )}

        {activeTab === 'chat' && (
          <ChatView
            messages={messages}
            setMessages={setMessages}
            mode={mode}
            setMode={setMode}
            language={language}
            setLanguage={setLanguage}
            userDynamics={userDynamics}
            activeSituation={activeSituation}
            setActiveSituationId={setActiveSituationId}
            onAddTask={handleAddTask}
            onOpenSituationRoom={() => setActiveTab('situations')}
          />
        )}

        {activeTab === 'situations' && (
          <SituationsView
            situations={situations}
            setSituations={setSituations}
            activeSituationId={activeSituationId}
            setActiveSituationId={setActiveSituationId}
            onDiscussInChat={handleDiscussInChat}
            userDynamics={userDynamics}
          />
        )}

        {activeTab === 'tasks' && (
          <TasksView
            tasks={tasks}
            setTasks={setTasks}
            situations={situations}
            onGoToChat={() => setActiveTab('chat')}
          />
        )}
      </main>

      {/* Dynamics Profile Modal */}
      {isDynamicsModalOpen && (
        <DynamicsModal
          userDynamics={userDynamics}
          setUserDynamics={setUserDynamics}
          onClose={() => setIsDynamicsModalOpen(false)}
        />
      )}

      {/* Trilingual Mastery & Derja Guide Modal */}
      {isGuideModalOpen && (
        <TrilingualGuideModal
          onClose={() => setIsGuideModalOpen(false)}
          onSelectPrompt={handleSelectPrompt}
        />
      )}
    </div>
  );
}
