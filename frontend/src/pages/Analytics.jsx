import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { analyticsService } from '../services/api';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell 
} from 'recharts';
import { 
  BarChart3, RefreshCw, AlertTriangle, ShieldCheck, 
  TrendingUp, Activity, Inbox, Award 
} from 'lucide-react';

const Analytics = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Rechart cell colors
  const PRIORITY_COLORS = {
    Critical: '#f43f5e', // rose
    High: '#fb923c',     // orange
    Medium: '#60a5fa',   // blue
    Low: '#94a3b8',      // slate
  };

  const SENTIMENT_COLORS = {
    Positive: '#10b981', // emerald
    Neutral: '#64748b',  // slate
    Negative: '#ef4444',  // red
  };

  const BAR_COLOR = '#6366f1'; // indigo

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
      <div className="flex flex-col items-center justify-center py-40 text-slate-500">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
        <span>Synthesizing system aggregates...</span>
      </div>
    );
  }

  if (!stats) return null;

  // Prepare chart datasets
  const categoryData = stats.category_distribution.map(item => ({
    name: item.category.replace(' Issue', ''),
    Count: item.count
  })).sort((a, b) => b.Count - a.Count);

  const priorityData = stats.priority_distribution.map(item => ({
    name: item.priority,
    value: item.count
  })).filter(item => item.value > 0);

  const sentimentData = Object.entries(stats.sentiment_counts).map(([key, val]) => ({
    name: key,
    value: val
  })).filter(item => item.value > 0);

  // Compute stats calculations
  const resolvedPercent = stats.total_tickets > 0 
    ? Math.round((stats.resolved_tickets / stats.total_tickets) * 100) 
    : 0;

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <BarChart3 className="text-indigo-400" />
            Helpdesk Analytics
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Real-time aggregates, AI predictions, and support volume analytics.
          </p>
        </div>

        <button
          onClick={fetchStats}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-slate-400 hover:text-slate-100 bg-slate-900 border border-slate-800 rounded-xl hover:border-slate-700 transition-all duration-300 disabled:opacity-50"
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          Refresh Stats
        </button>
      </div>

      {/* KPI METRIC CARDS GRIDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        
        <div className="glass-panel p-6 rounded-2xl border border-slate-800/80 flex items-center gap-4">
          <div className="p-3.5 bg-indigo-500/10 rounded-xl text-indigo-400 border border-indigo-500/20">
            <Inbox size={22} />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Total Volume</span>
            <span className="text-2xl font-bold text-white mt-1 block font-mono">{stats.total_tickets}</span>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-slate-800/80 flex items-center gap-4">
          <div className="p-3.5 bg-emerald-500/10 rounded-xl text-emerald-400 border border-emerald-500/20">
            <Award size={22} />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Resolution Rate</span>
            <span className="text-2xl font-bold text-emerald-400 mt-1 block font-mono">
              {resolvedPercent}% ({stats.resolved_tickets} / {stats.total_tickets})
            </span>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-slate-800/80 flex items-center gap-4">
          <div className="p-3.5 bg-orange-500/10 rounded-xl text-orange-400 border border-orange-500/20">
            <AlertTriangle size={22} />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Duplicate Rate</span>
            <span className="text-2xl font-bold text-orange-400 mt-1 block font-mono">
              {stats.total_tickets > 0 ? Math.round((stats.duplicate_alerts_count / stats.total_tickets) * 100) : 0}% 
              <span className="text-xs text-slate-400 ml-1">({stats.duplicate_alerts_count} alerts)</span>
            </span>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-slate-800/80 flex items-center gap-4">
          <div className="p-3.5 bg-rose-500/10 rounded-xl text-rose-400 border border-rose-500/20">
            <Activity size={22} />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Predicted SLA Breaches</span>
            <span className="text-2xl font-bold text-rose-400 mt-1 block font-mono">
              {stats.sla_breaches_predicted} 
              <span className="text-xs text-slate-400 ml-1">incidents</span>
            </span>
          </div>
        </div>

      </div>

      {/* CHARTS CONTAINER GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* CATEGORIES BAR CHART (8 COLS) */}
        <div className="lg:col-span-8 glass-panel p-6 rounded-3xl border border-slate-800 shadow-lg">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-6 flex items-center gap-2">
            <TrendingUp size={16} className="text-indigo-400" />
            Support Volumes by Ticket Category
          </h3>
          
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={categoryData}
                margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis 
                  dataKey="name" 
                  stroke="#94a3b8" 
                  fontSize={10} 
                  tickLine={false} 
                />
                <YAxis 
                  stroke="#94a3b8" 
                  fontSize={10} 
                  tickLine={false} 
                  allowDecimals={false} 
                />
                <Tooltip
                  contentStyle={{
                    background: '#090d16',
                    border: '1px solid #1e293b',
                    borderRadius: '12px',
                    fontSize: '12px',
                    color: '#f8fafc'
                  }}
                  cursor={{ fill: 'rgba(99, 102, 241, 0.05)' }}
                />
                <Bar dataKey="Count" fill={BAR_COLOR} radius={[4, 4, 0, 0]}>
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={BAR_COLOR} fillOpacity={0.8} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* PRIORITIES DISTRIBUTION PIE CHART (4 COLS) */}
        <div className="lg:col-span-4 glass-panel p-6 rounded-3xl border border-slate-800 shadow-lg flex flex-col justify-between">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-4 flex items-center gap-2">
            <ShieldCheck size={16} className="text-indigo-400" />
            Priority Classifications
          </h3>

          {priorityData.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-xs text-slate-500 h-[220px]">
              No active tickets inside classifications.
            </div>
          ) : (
            <div className="h-[220px] w-full flex items-center justify-center relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={priorityData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {priorityData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={PRIORITY_COLORS[entry.name] || '#6366f1'} 
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: '#090d16',
                      border: '1px solid #1e293b',
                      borderRadius: '12px',
                      fontSize: '12px',
                      color: '#f8fafc'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute text-center">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">Total</span>
                <span className="text-2xl font-bold font-mono text-white block">
                  {priorityData.reduce((acc, curr) => acc + curr.value, 0)}
                </span>
              </div>
            </div>
          )}

          {/* Legends grid */}
          <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-slate-900">
            {priorityData.map((entry, index) => (
              <div key={index} className="flex items-center gap-2 text-xs">
                <div 
                  className="w-2.5 h-2.5 rounded" 
                  style={{ backgroundColor: PRIORITY_COLORS[entry.name] }}
                />
                <span className="text-slate-400 font-semibold">{entry.name}:</span>
                <span className="font-mono text-slate-200 font-bold">{entry.value}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ADDITIONAL BREAKDOWNS: SENTIMENT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-8">
        
        {/* SENTIMENT BREAKDOWN CARD */}
        <div className="lg:col-span-4 glass-panel p-6 rounded-3xl border border-slate-800 shadow-lg flex flex-col justify-between">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-4 flex items-center gap-2">
            Sentiment Analysis Dashboard
          </h3>

          {sentimentData.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-xs text-slate-500 h-[200px]">
              No sentiments processed.
            </div>
          ) : (
            <div className="h-[200px] w-full flex items-center justify-center relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sentimentData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {sentimentData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={SENTIMENT_COLORS[entry.name] || '#64748b'} 
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: '#090d16',
                      border: '1px solid #1e293b',
                      borderRadius: '12px',
                      fontSize: '12px',
                      color: '#f8fafc'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Sentiment Legends */}
          <div className="flex justify-around mt-4 pt-4 border-t border-slate-900">
            {sentimentData.map((entry, index) => (
              <div key={index} className="flex flex-col items-center text-xs">
                <div className="flex items-center gap-1.5 mb-1">
                  <div 
                    className="w-2 h-2 rounded-full" 
                    style={{ backgroundColor: SENTIMENT_COLORS[entry.name] }}
                  />
                  <span className="text-slate-400 font-semibold">{entry.name}</span>
                </div>
                <span className="font-mono text-slate-200 font-bold text-base">{entry.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* AI PROCESS SUMMARY (8 COLS) */}
        <div className="lg:col-span-8 glass-panel p-6 rounded-3xl border border-slate-800 shadow-lg flex flex-col justify-center">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-4">
            AI Operations & Processing Logs
          </h3>
          <div className="space-y-4">
            <div className="p-4 bg-slate-950/60 border border-slate-900 rounded-2xl flex items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-slate-300 block">Translating & Language Support</span>
                <span className="text-[11px] text-slate-500 mt-0.5 block leading-relaxed">
                  Automatic translation coverage is active for <strong>Hindi</strong> and <strong>Kannada</strong>, standardizing tickets internally to English.
                </span>
              </div>
              <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-[10px] font-bold uppercase tracking-widest font-mono">
                Active
              </span>
            </div>

            <div className="p-4 bg-slate-950/60 border border-slate-900 rounded-2xl flex items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-slate-300 block">LangChain RAG Pipeline & ChromaDB</span>
                <span className="text-[11px] text-slate-500 mt-0.5 block leading-relaxed">
                  Vector index query reads similar resolved ticket solutions dynamically, sending reference documents to Llama 3 for custom generation.
                </span>
              </div>
              <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-[10px] font-bold uppercase tracking-widest font-mono">
                Active
              </span>
            </div>

            <div className="p-4 bg-slate-950/60 border border-slate-900 rounded-2xl flex items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-slate-300 block">Duplication Threshold Limit</span>
                <span className="text-[11px] text-slate-500 mt-0.5 block leading-relaxed">
                  Cosine similarity threshold is set to <strong>75.0%</strong>. Any incoming ticket matching past documents higher than 75% triggers warning logs.
                </span>
              </div>
              <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-[10px] font-bold uppercase tracking-widest font-mono">
                75.0%
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Analytics;
