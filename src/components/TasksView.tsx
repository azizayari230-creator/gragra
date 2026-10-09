import React, { useState } from 'react';
import { 
  CheckSquare, 
  Square, 
  Plus, 
  Trash2, 
  Calendar, 
  GraduationCap, 
  Briefcase, 
  Users, 
  Brain, 
  CheckCircle2,
  Clock,
  Flame,
  ArrowRight
} from 'lucide-react';
import { ActionTask, DomainType, Situation } from '../types';

interface TasksViewProps {
  tasks: ActionTask[];
  setTasks: React.Dispatch<React.SetStateAction<ActionTask[]>>;
  situations: Situation[];
  onGoToChat: () => void;
}

export const TasksView: React.FC<TasksViewProps> = ({
  tasks,
  setTasks,
  situations,
  onGoToChat,
}) => {
  const [filterDomain, setFilterDomain] = useState<DomainType | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'completed'>('all');
  const [isAdding, setIsAdding] = useState(false);

  // New task form state
  const [title, setTitle] = useState('');
  const [domain, setDomain] = useState<DomainType>('job');
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('high');
  const [dueDate, setDueDate] = useState('Today');
  const [relatedSituationId, setRelatedSituationId] = useState<string>('');

  const toggleTask = (id: string) => {
    setTasks(prev =>
      prev.map(t => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newTask: ActionTask = {
      id: `task-${Date.now()}`,
      title: title.trim(),
      domain,
      priority,
      completed: false,
      dueDate: dueDate.trim() || 'Today',
      relatedSituationId: relatedSituationId || undefined,
    };

    setTasks(prev => [newTask, ...prev]);
    setTitle('');
    setIsAdding(false);
  };

  const filteredTasks = tasks.filter(t => {
    const matchesDomain = filterDomain === 'all' || t.domain === filterDomain;
    const matchesStatus =
      filterStatus === 'all'
        ? true
        : filterStatus === 'completed'
        ? t.completed
        : !t.completed;
    return matchesDomain && matchesStatus;
  });

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

  const pendingCount = tasks.filter(t => !t.completed).length;
  const completedCount = tasks.filter(t => t.completed).length;

  return (
    <div className="flex-1 flex flex-col h-screen bg-stone-950 overflow-y-auto">
      {/* Header */}
      <div className="border-b border-stone-800 bg-stone-900/50 p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-stone-100 flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-amber-400" />
              <span>Daily Execution Plan</span>
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-stone-800 text-stone-300 border border-stone-700">
              {pendingCount} pending / {tasks.length} total
            </span>
          </div>
          <p className="text-xs text-stone-400 mt-1">
            Turn high-candor strategic advice into tangible moves across school, job, social, and personal life.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-rose-600 text-white font-semibold text-xs shadow-md shadow-amber-500/20 hover:opacity-90 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Action Item</span>
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto w-full p-6 space-y-6">
        {/* Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-stone-900/40 p-3 rounded-xl border border-stone-800/80">
          {/* Domain Filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs no-scrollbar">
            <span className="text-stone-500 font-medium px-1">Domain:</span>
            {(['all', 'school', 'job', 'social', 'personal'] as const).map(d => (
              <button
                key={d}
                onClick={() => setFilterDomain(d)}
                className={`px-2.5 py-1 rounded-lg capitalize font-medium transition-colors ${
                  filterDomain === d
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                {d === 'all' ? 'All' : d}
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-stone-950 p-1 rounded-lg border border-stone-800 text-xs">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-2 py-0.5 rounded-md ${
                filterStatus === 'all' ? 'bg-stone-800 text-stone-100' : 'text-stone-400'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterStatus('pending')}
              className={`px-2 py-0.5 rounded-md ${
                filterStatus === 'pending' ? 'bg-amber-500/20 text-amber-300' : 'text-stone-400'
              }`}
            >
              Pending ({pendingCount})
            </button>
            <button
              onClick={() => setFilterStatus('completed')}
              className={`px-2 py-0.5 rounded-md ${
                filterStatus === 'completed' ? 'bg-emerald-500/20 text-emerald-300' : 'text-stone-400'
              }`}
            >
              Done ({completedCount})
            </button>
          </div>
        </div>

        {/* Task List */}
        <div className="space-y-2.5">
          {filteredTasks.length === 0 ? (
            <div className="p-12 text-center border border-dashed border-stone-800 rounded-2xl bg-stone-900/20 space-y-3">
              <CheckCircle2 className="w-8 h-8 text-stone-600 mx-auto" />
              <p className="text-stone-400 text-sm font-medium">No tasks found under this filter.</p>
              <p className="text-stone-500 text-xs">
                Ask Rafiq in chat to extract next steps, or click "+ Add Action Item" to create one.
              </p>
            </div>
          ) : (
            filteredTasks.map(task => {
              const Icon = domainIcons[task.domain];
              const colors = domainColors[task.domain];
              const relatedSituation = situations.find(s => s.id === task.relatedSituationId);

              return (
                <div
                  key={task.id}
                  className={`flex items-start justify-between gap-3 p-4 rounded-xl border transition-all ${
                    task.completed
                      ? 'bg-stone-900/20 border-stone-800/40 text-stone-500'
                      : 'bg-stone-900/80 border-stone-800/90 text-stone-200 hover:border-stone-700'
                  }`}
                >
                  <div className="flex items-start gap-3.5 flex-1">
                    {/* Checkbox */}
                    <button
                      onClick={() => toggleTask(task.id)}
                      className="mt-0.5 text-stone-400 hover:text-amber-400 transition-colors"
                      title={task.completed ? 'Mark uncompleted' : 'Mark completed'}
                    >
                      {task.completed ? (
                        <CheckSquare className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <Square className="w-5 h-5" />
                      )}
                    </button>

                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Domain Tag */}
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${colors.bg} ${colors.text} border ${colors.border}`}
                        >
                          <Icon className="w-3 h-3" />
                          <span>{task.domain}</span>
                        </span>

                        {/* Priority */}
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                            task.priority === 'high'
                              ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                              : task.priority === 'medium'
                              ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                              : 'bg-stone-800 text-stone-400'
                          }`}
                        >
                          {task.priority === 'high' ? '🔥 High' : task.priority === 'medium' ? '⚡ Medium' : 'Low'}
                        </span>

                        {/* Due date */}
                        {task.dueDate && (
                          <span className="text-[11px] text-stone-400 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-stone-500" />
                            <span>{task.dueDate}</span>
                          </span>
                        )}

                        {/* Linked situation */}
                        {relatedSituation && (
                          <span className="text-[11px] text-amber-300/80 truncate max-w-xs">
                            ↳ Linked: {relatedSituation.title}
                          </span>
                        )}
                      </div>

                      {/* Title */}
                      <p
                        className={`text-sm leading-relaxed ${
                          task.completed ? 'line-through text-stone-500' : 'text-stone-100 font-medium'
                        }`}
                      >
                        {task.title}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <button
                    onClick={() => deleteTask(task.id)}
                    className="text-stone-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-stone-800 transition-colors shrink-0"
                    title="Delete task"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Motivational Partner Banner */}
        <div className="p-4 rounded-xl bg-stone-900/60 border border-stone-800/80 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
              <Flame className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-stone-200">
                Action cures anxiety, sahbi.
              </p>
              <p className="text-[11px] text-stone-400">
                Overanalyzing without execution is just sophisticated procrastination. Pick one high-priority item and execute it now.
              </p>
            </div>
          </div>

          <button
            onClick={onGoToChat}
            className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 font-semibold shrink-0"
          >
            <span>Ask Rafiq</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Modal: Add Task */}
      {isAdding && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <h3 className="font-bold text-stone-100 text-sm flex items-center gap-2">
                <Plus className="w-4 h-4 text-amber-400" />
                <span>New Action Commitment</span>
              </h3>
              <button onClick={() => setIsAdding(false)} className="text-stone-400 hover:text-stone-200">
                ✕
              </button>
            </div>

            <form onSubmit={handleAddTask} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  Task / Move Description
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Schedule 15m coffee with team lead to discuss roadmap"
                  className="w-full bg-stone-950 border border-stone-800 rounded-lg p-2.5 text-xs text-stone-100 focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  Domain Category
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(['school', 'job', 'social', 'personal'] as const).map(d => (
                    <button
                      type="button"
                      key={d}
                      onClick={() => setDomain(d)}
                      className={`py-1.5 px-2 rounded-lg capitalize text-xs font-medium border text-center transition-all ${
                        domain === d
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : 'bg-stone-950 border-stone-800 text-stone-400 hover:border-stone-700'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1">
                    Priority
                  </label>
                  <select
                    value={priority}
                    onChange={e => setPriority(e.target.value as any)}
                    className="w-full bg-stone-950 border border-stone-800 rounded-lg p-2.5 text-xs text-stone-100 focus:outline-none focus:border-amber-500"
                  >
                    <option value="high">High (Urgent)</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1">
                    Timeline / Due
                  </label>
                  <input
                    type="text"
                    value={dueDate}
                    onChange={e => setDueDate(e.target.value)}
                    placeholder="e.g. Today, Tomorrow, By 5 PM"
                    className="w-full bg-stone-950 border border-stone-800 rounded-lg p-2.5 text-xs text-stone-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {situations.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1">
                    Link to Ongoing Dilemma (Optional)
                  </label>
                  <select
                    value={relatedSituationId}
                    onChange={e => setRelatedSituationId(e.target.value)}
                    className="w-full bg-stone-950 border border-stone-800 rounded-lg p-2.5 text-xs text-stone-100 focus:outline-none focus:border-amber-500 truncate"
                  >
                    <option value="">None (Independent task)</option>
                    {situations.map(s => (
                      <option key={s.id} value={s.id}>
                        [{s.domain.toUpperCase()}] {s.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-800">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-stone-400 hover:text-stone-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-rose-600 text-white font-semibold text-xs shadow-md shadow-amber-500/20 hover:opacity-90 transition-all"
                >
                  Add Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
