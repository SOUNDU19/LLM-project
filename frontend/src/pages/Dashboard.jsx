import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ticketService } from '../services/api';
import {
  PlusCircle, Search, AlertCircle, Clock,
  ArrowRight, ShieldAlert, BadgeAlert, RefreshCw, Send, HelpCircle, Globe, Sparkles,
} from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import { StatusBadge, PriorityBadge, Badge } from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';
import { TicketListSkeleton, StatCardSkeleton } from '../components/ui/Skeleton';
import { Inbox } from 'lucide-react';

const Dashboard = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [description, setDescription] = useState('');
  const [language, setLanguage] = useState('English');
  const [submittingTicket, setSubmittingTicket] = useState(false);
  const [aiStep, setAiStep] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  const fetchTickets = async () => {
    try {
      setRefreshing(true);
      const data = await ticketService.getAll();
      setTickets(data);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleSubmitTicket = async (e) => {
    e.preventDefault();
    if (!description.trim() || description.length < 10) {
      alert('Please enter a detailed description (minimum 10 characters).');
      return;
    }

    setSubmittingTicket(true);

    const steps = [
      'Detecting language & translating to English...',
      'Running Llama 3 classification model...',
      'Assigning priorities & routing departments...',
      'Calculating cosine similarity vector duplicates...',
      'Pulling reference context from ChromaDB (RAG)...',
      'Synthesizing troubleshooting suggestions...',
      'Persisting records inside helpdesk logs...',
    ];

    let currentStep = 0;
    setAiStep(steps[0]);
    const stepInterval = setInterval(() => {
      currentStep++;
      if (currentStep < steps.length) {
        setAiStep(steps[currentStep]);
      }
    }, 700);

    try {
      await ticketService.create(description, language);
      clearInterval(stepInterval);
      setDescription('');
      fetchTickets();
    } catch (error) {
      console.error('Error creating ticket:', error);
      alert('Failed to submit ticket. Please check backend connection.');
    } finally {
      clearInterval(stepInterval);
      setSubmittingTicket(false);
      setAiStep('');
    }
  };

  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch =
      ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.user_fullname.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.id.includes(searchTerm);

    const matchesCategory = categoryFilter === 'All' || ticket.category === categoryFilter;
    const matchesPriority = priorityFilter === 'All' || ticket.priority === priorityFilter;
    const matchesStatus = statusFilter === 'All' || ticket.status === statusFilter;

    return matchesSearch && matchesCategory && matchesPriority && matchesStatus;
  });

  const openCount = tickets.filter((t) => t.status === 'open' || t.status === 'in_progress').length;
  const criticalCount = tickets.filter((t) => t.priority === 'Critical').length;
  const duplicateAlerts = tickets.filter((t) => t.duplicate_alert?.is_duplicate).length;
  const slaRisks = tickets.filter((t) => t.sla_risk_level === 'High' || t.priority === 'Critical').length;

  const statCards = isAdmin
    ? [
        { label: 'Open tickets', value: openCount, icon: Clock, color: 'text-brand-500', bg: 'bg-brand-500/10 border-brand-500/20' },
        { label: 'Critical incidents', value: criticalCount, icon: AlertCircle, color: 'text-rose-500', bg: 'bg-rose-500/10 border-rose-500/20', pulse: true },
        { label: 'Duplicate warnings', value: duplicateAlerts, icon: BadgeAlert, color: 'text-orange-500', bg: 'bg-orange-500/10 border-orange-500/20' },
        { label: 'SLA breach risk', value: slaRisks, icon: ShieldAlert, color: 'text-amber-500', bg: 'bg-amber-500/10 border-amber-500/20' },
      ]
    : [];

  return (
    <div className="page-container">
      <PageHeader
        title="Dashboard"
        description={
          <>
            Welcome back, <span className="text-brand-500 font-semibold">{user.fullname}</span>.
            {isAdmin ? ' Monitor and triage system support requests.' : ' Submit tickets and view AI-powered resolutions.'}
          </>
        }
        action={
          <button
            type="button"
            onClick={fetchTickets}
            disabled={refreshing}
            className="btn-secondary text-xs uppercase tracking-wider"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            Sync queue
          </button>
        }
      />

      {isAdmin && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
            : statCards.map((stat, i) => (
                <div
                  key={stat.label}
                  className={`stat-card flex items-center justify-between animate-slide-up stagger-${i + 1}`}
                  style={{ opacity: 0, animationFillMode: 'forwards' }}
                >
                  <div>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-content-muted block">
                      {stat.label}
                    </span>
                    <span className={`text-3xl font-bold mt-2 block font-mono ${stat.color}`}>
                      {stat.value}
                    </span>
                  </div>
                  <div className={`p-3 rounded-xl border ${stat.bg}`}>
                    <stat.icon size={22} className={stat.color} />
                  </div>
                </div>
              ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
        {!isAdmin && (
          <div className="lg:col-span-4 space-y-5">
            <div className="glass-panel p-6 rounded-2xl relative overflow-hidden animate-slide-up">
              <div className="absolute -top-8 -right-8 w-32 h-32 bg-brand-500/10 rounded-full blur-2xl pointer-events-none" />
              <h2 className="text-base font-semibold text-content flex items-center gap-2 mb-5">
                <PlusCircle size={20} className="text-brand-500" />
                Submit support ticket
              </h2>

              <form onSubmit={handleSubmitTicket} className="space-y-4 relative">
                <div className="space-y-2">
                  <label htmlFor="ticket-lang" className="text-xs font-semibold uppercase tracking-wider text-content-muted flex items-center gap-1.5">
                    <Globe size={12} />
                    Input language
                  </label>
                  <select
                    id="ticket-lang"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="glass-input w-full py-2.5 px-3.5 rounded-xl text-sm"
                  >
                    <option value="English">English</option>
                    <option value="Hindi">Hindi (हिंदी)</option>
                    <option value="Kannada">Kannada (ಕನ್ನಡ)</option>
                    <option value="Auto-Detect">Auto-Detect / Translate</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="ticket-desc" className="text-xs font-semibold uppercase tracking-wider text-content-muted flex items-center gap-1.5">
                    <HelpCircle size={12} />
                    Describe your issue
                  </label>
                  <textarea
                    id="ticket-desc"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide a detailed complaint (e.g. payroll software crashes when viewing payslips...)"
                    rows={6}
                    className="glass-input w-full p-4 rounded-xl text-sm leading-relaxed resize-y min-h-[140px]"
                    required
                  />
                  <span className="text-[10px] text-content-muted block text-right">
                    Min. 10 characters · English, Hindi, Kannada
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={submittingTicket || !description.trim()}
                  className="btn-primary w-full py-3"
                >
                  {submittingTicket ? (
                    <RefreshCw size={16} className="animate-spin" />
                  ) : (
                    <>
                      Submit ticket
                      <Send size={14} />
                    </>
                  )}
                </button>
              </form>
            </div>

            {submittingTicket && (
              <div className="ai-highlight p-5 glow-effect animate-fade-in" role="status" aria-live="polite">
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-500 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-brand-500" />
                    </span>
                    <span className="text-xs font-bold text-brand-500 uppercase tracking-widest flex items-center gap-1.5">
                      <Sparkles size={12} />
                      AI engine processing
                    </span>
                  </div>
                  <p className="text-xs text-content-secondary font-mono">{aiStep}</p>
                  <div className="w-full h-1.5 rounded-full mt-4 overflow-hidden bg-[var(--surface-muted)] border border-border-subtle">
                    <div className="h-full bg-gradient-to-r from-brand-500 to-violet-500 rounded-full w-2/3 relative overflow-hidden">
                      <div className="absolute inset-0 bg-white/20 animate-shimmer" />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <div className={isAdmin ? 'lg:col-span-12' : 'lg:col-span-8'}>
          {isAdmin && (
            <div className="glass-panel p-4 sm:p-5 rounded-2xl mb-6 flex flex-col lg:flex-row gap-4 animate-slide-up">
              <div className="relative flex-1 lg:max-w-md">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-content-muted" />
                <input
                  type="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search tickets, employees, IDs..."
                  className="glass-input w-full pl-11 pr-4 py-2.5 rounded-xl text-sm"
                  aria-label="Search tickets"
                />
              </div>

              <div className="flex flex-wrap gap-3">
                {[
                  { label: 'Category', value: categoryFilter, setter: setCategoryFilter, options: [
                    'All', 'Hardware Issue', 'Software Issue', 'Network Issue', 'Security Issue',
                    'Login/Authentication', 'HR/Payroll', 'Cloud/Server', 'Email Issue', 'Database Issue',
                  ]},
                  { label: 'Priority', value: priorityFilter, setter: setPriorityFilter, options: ['All', 'Low', 'Medium', 'High', 'Critical'] },
                  { label: 'Status', value: statusFilter, setter: setStatusFilter, options: ['All', 'open', 'in_progress', 'resolved', 'closed'] },
                ].map((filter) => (
                  <div key={filter.label} className="flex flex-col gap-1 min-w-[120px]">
                    <span className="text-[10px] font-bold text-content-muted uppercase tracking-wider">{filter.label}</span>
                    <select
                      value={filter.value}
                      onChange={(e) => filter.setter(e.target.value)}
                      className="glass-input py-2 px-3 rounded-lg text-xs"
                      aria-label={`Filter by ${filter.label}`}
                    >
                      {filter.options.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt === 'All' ? `All ${filter.label}es` : opt.replace('_', ' ')}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )}

          {loading ? (
            <TicketListSkeleton count={4} />
          ) : filteredTickets.length === 0 ? (
            <EmptyState
              icon={Inbox}
              title="No tickets found"
              description={
                isAdmin
                  ? "We couldn't find tickets matching your filters. Try adjusting search or filters."
                  : "No tickets yet. Submit a support request using the form to get AI-powered triage."
              }
            />
          ) : (
            <div className="space-y-4 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 px-1">
                <span className="text-xs font-semibold text-content-muted uppercase tracking-wider">
                  {filteredTickets.length} ticket{filteredTickets.length !== 1 ? 's' : ''}
                </span>
                {!isAdmin && (
                  <span className="text-xs text-content-secondary">
                    Click a ticket to view AI suggestions
                  </span>
                )}
              </div>

              <div className="space-y-3">
                {filteredTickets.map((ticket, index) => (
                  <article
                    key={ticket.id}
                    onClick={() => navigate(`/tickets/${ticket.id}`)}
                    onKeyDown={(e) => e.key === 'Enter' && navigate(`/tickets/${ticket.id}`)}
                    role="button"
                    tabIndex={0}
                    className="ticket-card group flex flex-col md:flex-row md:items-center justify-between gap-4 animate-slide-up"
                    style={{ animationDelay: `${Math.min(index * 0.05, 0.3)}s`, opacity: 0, animationFillMode: 'forwards' }}
                  >
                    <div className="space-y-2.5 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <PriorityBadge priority={ticket.priority} />
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[var(--surface-muted)] border border-border-subtle text-content-muted">
                          {ticket.category}
                        </span>
                        {ticket.duplicate_alert?.is_duplicate && (
                          <Badge variant="warning">
                            <BadgeAlert size={10} />
                            Duplicate {ticket.duplicate_alert.similarity_score}%
                          </Badge>
                        )}
                        {ticket.sla_risk_level === 'High' && ticket.status !== 'resolved' && ticket.status !== 'closed' && (
                          <Badge variant="warning">SLA risk</Badge>
                        )}
                      </div>

                      <h3 className="font-semibold text-content group-hover:text-brand-500 transition-colors text-base truncate">
                        {ticket.title}
                      </h3>

                      <p className="text-sm text-content-secondary line-clamp-2 leading-relaxed">
                        {ticket.description}
                      </p>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-content-muted">
                        <span>{ticket.user_fullname}</span>
                        <span aria-hidden>·</span>
                        <span>{ticket.department}</span>
                        <span aria-hidden>·</span>
                        <span>{new Date(ticket.created_at).toLocaleDateString()}</span>
                        {ticket.language !== 'English' && (
                          <>
                            <span aria-hidden>·</span>
                            <span className="text-brand-500">Translated from {ticket.language}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex md:flex-col items-center md:items-end justify-between md:justify-center gap-3 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-border-subtle">
                      <StatusBadge status={ticket.status} />
                      <span className="text-[10px] text-content-muted hidden md:flex items-center gap-1 group-hover:text-brand-500 transition-colors">
                        View details
                        <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
