import React from 'react';
import { Loader2 } from 'lucide-react';

const LoadingScreen = ({ message = 'Loading...' }) => (
  <div className="flex flex-col items-center justify-center py-24 sm:py-32 text-content-muted animate-fade-in" role="status" aria-live="polite">
    <div className="relative mb-5">
      <div className="w-12 h-12 rounded-full border-2 border-brand-500/20" />
      <Loader2 size={48} className="absolute inset-0 text-brand-500 animate-spin" aria-hidden />
    </div>
    <span className="text-sm font-medium text-content-secondary">{message}</span>
  </div>
);

export default LoadingScreen;
