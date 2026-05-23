import React from 'react';
import { Inbox } from 'lucide-react';

const EmptyState = ({ icon: Icon = Inbox, title, description, action }) => (
  <div className="glass-panel text-center py-16 px-6 rounded-2xl animate-fade-in">
    <div className="inline-flex p-4 rounded-2xl bg-brand-500/10 border border-brand-500/20 mb-4">
      <Icon size={32} className="text-brand-500" aria-hidden />
    </div>
    <h3 className="text-lg font-semibold text-content font-display">{title}</h3>
    {description && (
      <p className="text-content-secondary text-sm mt-2 max-w-md mx-auto leading-relaxed">
        {description}
      </p>
    )}
    {action && <div className="mt-6">{action}</div>}
  </div>
);

export default EmptyState;
