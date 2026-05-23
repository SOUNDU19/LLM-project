import React from 'react';

const PageHeader = ({ title, description, action, badge }) => (
  <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 animate-slide-up">
    <div>
      {badge && <div className="mb-2">{badge}</div>}
      <h1 className="text-2xl sm:text-3xl font-bold text-content tracking-tight font-display">
        {title}
      </h1>
      {description && (
        <p className="text-content-secondary text-sm mt-1.5 max-w-2xl leading-relaxed">
          {description}
        </p>
      )}
    </div>
    {action && <div className="shrink-0">{action}</div>}
  </header>
);

export default PageHeader;
