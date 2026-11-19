import React from 'react';
import { Briefcase, Coffee, Zap } from 'lucide-react';

const TONES = [
  {
    id: 'Professional',
    label: 'Professional',
    icon: Briefcase,
    description: 'Executive & articulate',
    activeColor: 'bg-indigo-600 text-white shadow-indigo-500/25',
  },
  {
    id: 'Casual',
    label: 'Casual',
    icon: Coffee,
    description: 'Warm & conversational',
    activeColor: 'bg-emerald-600 text-white shadow-emerald-500/25',
  },
  {
    id: 'Concise',
    label: 'Concise',
    icon: Zap,
    description: 'Direct & bulleted',
    activeColor: 'bg-amber-600 text-white shadow-amber-500/25',
  },
];

export default function ToneSelector({ selectedTone, onSelectTone, disabled = false }) {
  return (
    <div className="flex items-center bg-slate-100/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl p-1 shadow-inner backdrop-blur-sm transition-colors">
      {TONES.map((tone) => {
        const Icon = tone.icon;
        const isSelected = selectedTone === tone.id;

        return (
          <button
            key={tone.id}
            type="button"
            disabled={disabled}
            onClick={() => onSelectTone(tone.id)}
            title={`${tone.label}: ${tone.description}`}
            className={`group relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 outline-none ${
              isSelected
                ? `${tone.activeColor} shadow-md`
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800/60'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <Icon className={`w-3.5 h-3.5 transition-transform group-hover:scale-110 ${
              isSelected ? 'text-white' : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-200'
            }`} />
            <span>{tone.label}</span>
          </button>
        );
      })}
    </div>
  );
}
