import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { analyticsService } from '../services/api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import {
  BarChart3, RefreshCw, AlertTriangle, ShieldCheck,
  TrendingUp, Activity, Inbox, Award, Sparkles, CheckCircle2,
} from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import LoadingScreen from '../components/ui/LoadingScreen';
import EmptyState from '../components/ui/EmptyState';

const PRIORITY_COLORS = {
  Critical: '#f43f5e',
  High: '#fb923c',
  Medium: '#60a5fa',
  Low: '#94a3b8',
};

const SENTIMENT_COLORS = {
  Positive: '#10b981',
  Neutral: '#64748b',
  Negative: '#ef4444',
};

const BAR_COLOR = '#6366f1';

const chartTooltipStyle = {
  background: 'var(--surface-elevated)',
  border: '1px solid var(--border)',
  borderRadius: '12px',
  fontSize: '12px',
  color: 'var(--text-primary)',
  boxShadow: 'var(--shadow-card)',
};

const Analytics = () => {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async () => {
    try {
      setRefreshing(true);
      const data = await analyticsService.getSummary();
      setStats(data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      alert('Failed to retrieve analytics dashboard.');
      navigate('/');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!isAdmin) {
      alert('Access restricted to Admins only.');
      navigate('/');
      return;
    }
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="page-container">
        <LoadingScreen message="Synthesizing system aggregates..." />
      </div>
    );
  }

  if (!stats) return null;

  const categoryData = stats.category_distribution
    .map((item) => ({
      name: item.category.replace(' Issue', ''),
      Count: item.count,
    }))
    .sort((a, b) => b.Count - a.Count);

  const priorityData = stats.priority_distribution
    .map((item) => ({ name: item.priority, value: item.count }))
    .filter((item) => item.value > 0);

  const sentimentData = Object.entries(stats.sentiment_counts)
    .map(([key, val]) => ({ name: key, value: val }))
    .filter((item) => item.value > 0);

  const resolvedPercent =
    stats.total_tickets > 0 ? Math.round((stats.resolved_tickets / stats.total_tickets) * 100) : 0;

  const kpiCards = [
    { label: 'Total volume', value: stats.total_tickets, icon: Inbox, color: 'text-brand-500', bg: 'bg-brand-500/10 border-brand-500/20' },
    { label: 'Resolution rate', value: `${resolvedPercent}%`, sub: `${stats.resolved_tickets} / ${stats.total_tickets}`, icon: Award, color: 'text-emerald-500', bg: 'bg-emerald-500/10 border-emerald-500/20' },
    {
      label: 'Duplicate rate',
      value: `${stats.total_tickets > 0 ? Math.round((stats.duplicate_alerts_count / stats.total_tickets) * 100) : 0}%`,
      sub: `${stats.duplicate_alerts_count} alerts`,
      icon: AlertTriangle,
      color: 'text-orange-500',
      bg: 'bg-orange-500/10 border-orange-500/20',
    },
    { label: 'SLA breaches predicted', value: stats.sla_breaches_predicted, sub: 'incidents', icon: Activity, color: 'text-rose-500', bg: 'bg-rose-500/10 border-rose-500/20' },
  ];

  const aiOps = [
    { title: 'Translating & language support', desc: 'Hindi and Kannada auto-translated to English internally.', badge: 'Active' },
    { title: 'LangChain RAG & ChromaDB', desc: 'Vector search retrieves similar resolved tickets for Llama 3 synthesis.', badge: 'Active' },
    { title: 'Duplication threshold', desc: 'Cosine similarity above 75% triggers duplicate warning logs.', badge: '75.0%' },
  ];

  return (
    <div className="page-container">
      <PageHeader
        title="Helpdesk analytics"
        description="Real-time aggregates, AI predictions, and support volume insights."
        badge={
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-brand-500/10 text-brand-500 border border-brand-500/20">
            <BarChart3 size={12} />
            Admin only
          </span>
        }
        action={
          <button type="button" onClick={fetchStats} disabled={refreshing} className="btn-secondary text-xs uppercase tracking-wider">
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {kpiCards.map((kpi, i) => (
          <div key={kpi.label} className={`stat-card flex items-center gap-4 animate-slide-up stagger-${i + 1}`} style={{ opacity: 0, animationFillMode: 'forwards' }}>
            <div className={`p-3 rounded-xl border shrink-0 ${kpi.bg}`}>
              <kpi.icon size={22} className={kpi.color} />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-content-muted block truncate">{kpi.label}</span>
              <span className={`text-xl sm:text-2xl font-bold font-mono mt-1 block ${kpi.color}`}>{kpi.value}</span>
              {kpi.sub && <span className="text-[10px] text-content-muted">{kpi.sub}</span>}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
        <div className="lg:col-span-8 glass-panel p-6 rounded-2xl animate-slide-up">
          <h3 className="text-sm font-semibold text-content mb-6 flex items-center gap-2">
            <TrendingUp size={16} className="text-brand-500" />
            Volume by category
          </h3>
          <div className="h-[320px] sm:h-[350px] w-full">
            {categoryData.length === 0 ? (
              <EmptyState title="No category data" description="Submit tickets to populate charts." />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={10} tickLine={false} />
                  <YAxis stroke="var(--text-muted)" fontSize={10} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={chartTooltipStyle} cursor={{ fill: 'rgba(99, 102, 241, 0.06)' }} />
                  <Bar dataKey="Count" fill={BAR_COLOR} radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="lg:col-span-4 glass-panel p-6 rounded-2xl flex flex-col animate-slide-up stagger-2" style={{ opacity: 0, animationFillMode: 'forwards' }}>
          <h3 className="text-sm font-semibold text-content mb-4 flex items-center gap-2">
            <ShieldCheck size={16} className="text-brand-500" />
            Priority distribution
          </h3>
          {priorityData.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-xs text-content-muted min-h-[200px]">No priority data yet.</div>
          ) : (
            <>
              <div className="h-[200px] w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={priorityData} cx="50%" cy="50%" innerRadius={55} outerRadius={75} paddingAngle={3} dataKey="value">
                      {priorityData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PRIORITY_COLORS[entry.name] || BAR_COLOR} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={chartTooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center">
                    <span className="text-[10px] text-content-muted uppercase font-bold block">Total</span>
                    <span className="text-2xl font-bold font-mono text-content">
                      {priorityData.reduce((acc, curr) => acc + curr.value, 0)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-border-subtle">
                {priorityData.map((entry) => (
                  <div key={entry.name} className="flex items-center gap-2 text-xs">
                    <div className="w-2.5 h-2.5 rounded shrink-0" style={{ backgroundColor: PRIORITY_COLORS[entry.name] }} />
                    <span className="text-content-muted">{entry.name}</span>
                    <span className="font-mono font-bold text-content ml-auto">{entry.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 mt-6 lg:mt-8">
        <div className="lg:col-span-4 glass-panel p-6 rounded-2xl animate-slide-up">
          <h3 className="text-sm font-semibold text-content mb-4">Sentiment analysis</h3>
          {sentimentData.length === 0 ? (
            <div className="flex items-center justify-center text-xs text-content-muted min-h-[180px]">No sentiment data.</div>
          ) : (
            <>
              <div className="h-[180px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={sentimentData} cx="50%" cy="50%" innerRadius={45} outerRadius={65} paddingAngle={2} dataKey="value">
                      {sentimentData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={SENTIMENT_COLORS[entry.name] || '#64748b'} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={chartTooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-around mt-4 pt-4 border-t border-border-subtle">
                {sentimentData.map((entry) => (
                  <div key={entry.name} className="flex flex-col items-center text-xs">
                    <div className="flex items-center gap-1.5 mb-1">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: SENTIMENT_COLORS[entry.name] }} />
                      <span className="text-content-muted">{entry.name}</span>
                    </div>
                    <span className="font-mono font-bold text-content text-base">{entry.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="lg:col-span-8 glass-panel p-6 rounded-2xl animate-slide-up">
          <h3 className="text-sm font-semibold text-content mb-5 flex items-center gap-2">
            <Sparkles size={16} className="text-brand-500" />
            AI operations status
          </h3>
          <div className="space-y-3">
            {aiOps.map((op) => (
              <div
                key={op.title}
                className="p-4 rounded-xl border border-border-subtle bg-[var(--surface-muted)] flex items-center justify-between gap-4 transition-colors hover:border-brand-500/20"
              >
                <div>
                  <span className="text-xs font-semibold text-content block">{op.title}</span>
                  <span className="text-[11px] text-content-muted mt-0.5 block leading-relaxed">{op.desc}</span>
                </div>
                <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 rounded-lg text-[10px] font-bold uppercase tracking-widest shrink-0 flex items-center gap-1">
                  <CheckCircle2 size={10} />
                  {op.badge}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
