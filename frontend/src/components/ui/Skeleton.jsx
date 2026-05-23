import React from 'react';

export const SkeletonLine = ({ className = 'h-4 w-full' }) => (
  <div className={`skeleton ${className}`} aria-hidden />
);

export const TicketCardSkeleton = () => (
  <div className="glass-panel rounded-2xl p-5 space-y-4" aria-hidden>
    <div className="flex gap-2">
      <div className="skeleton h-5 w-16 rounded-md" />
      <div className="skeleton h-5 w-24 rounded-md" />
    </div>
    <div className="skeleton h-5 w-3/4 rounded-md" />
    <div className="skeleton h-4 w-full rounded-md" />
    <div className="skeleton h-4 w-2/3 rounded-md" />
    <div className="flex gap-4 pt-2">
      <div className="skeleton h-3 w-20 rounded" />
      <div className="skeleton h-3 w-24 rounded" />
    </div>
  </div>
);

export const StatCardSkeleton = () => (
  <div className="stat-card animate-pulse" aria-hidden>
    <div className="skeleton h-3 w-24 rounded mb-3" />
    <div className="skeleton h-8 w-16 rounded" />
  </div>
);

export const TicketListSkeleton = ({ count = 4 }) => (
  <div className="space-y-4">
    {Array.from({ length: count }).map((_, i) => (
      <TicketCardSkeleton key={i} />
    ))}
  </div>
);

export default SkeletonLine;
