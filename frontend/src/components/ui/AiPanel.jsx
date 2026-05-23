import React from 'react';
import { Sparkles } from 'lucide-react';

const AiPanel = ({ title, icon: Icon = Sparkles, children, className = '', ...rest }) => (
  <section
    className={`ai-highlight p-6 animate-slide-up ${className}`}
    aria-label={title || 'AI generated content'}
    {...rest}
  >
    <div className="relative z-10">
      {title && (
        <div className="flex items-center gap-2 mb-4">
          <div className="p-1.5 rounded-lg bg-brand-500/15 border border-brand-500/25">
            <Icon size={16} className="text-brand-500" aria-hidden />
          </div>
          <h3 className="text-xs font-bold uppercase tracking-widest text-brand-600 dark:text-brand-400">
            {title}
          </h3>
        </div>
      )}
      {children}
    </div>
  </section>
);

export default AiPanel;
